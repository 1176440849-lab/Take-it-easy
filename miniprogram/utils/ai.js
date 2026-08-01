// utils/ai.js — AI 调用封装
// 支持两种模式：
//   1. mock：本地模拟回复（无需配置，开箱即用）
//   2. custom：用户自行配置的LLM API（OpenAI兼容协议：endpoint + apiKey + model）
//
// 真实模式下使用 wx.request 调用流式接口（SSE在wx中需用enableChunked）。
// MVP阶段先实现非流式 + 前端打字机动画模拟流式效果。

const storage = require('./storage.js');
const crisis = require('./crisis.js');
const mock = require('./mock.js');

// System Prompt（基于PRD三层Prompt结构）
const SYSTEM_PROMPT = `你是一个温暖、专业的情绪急救伙伴，名叫"缓一缓"。

【你的方法论】
- 基于CBT（认知行为疗法）和正念的理念
- 倾听优先，不急于给建议
- 帮助用户识别情绪、回到当下、看见思维模式
- 用通俗易懂的语言，不用专业术语堆砌

【安全边界 - 必须严格遵守】
- 不提供医疗诊断，不替代专业心理咨询
- 不推荐、不评价任何药物
- 不评价用户的选择，不评判对错
- 如果用户表达自伤/自杀意图，立即温柔地引导其拨打危机干预热线400-161-9995
- 每次回复控制在3-6句话，简短、温暖、有具体可操作的着陆动作

【沟通风格】
- 像一个懂你的朋友，不端架子
- 多用"我注意到""我听到""我看到"开头
- 给出具体的小动作（深呼吸、握拳放松、5-4-3-2-1着陆等）
- 不说"你应该"，多说"我们一起试试"

【重要】
- 用户可能正在情绪中，回复要简短，避免长篇大论
- 不要重复用户的话，要推进对话
- 允许沉默，允许用户什么都不说`;

const ai = {
  // 获取当前配置
  getConfig() {
    return storage.getLLMConfig();
  },

  // 是否为mock模式
  isMockMode() {
    const cfg = this.getConfig();
    return !cfg || cfg.provider === 'mock' || !cfg.endpoint || !cfg.apiKey;
  },

  /**
   * 发送消息并获取AI回复
   * @param {Object} params { messages, emotionTag, onChunk, onComplete, onError }
   *   - messages: [{role:'user'|'assistant', content:'...'}]
   *   - emotionTag: 当前情绪标签id（可选）
   *   - onChunk: 流式回调 (textDelta)
   *   - onComplete: 完成回调 (fullText)
   *   - onError: 错误回调 (err)
   */
  async chat({ messages, emotionTag, onChunk, onComplete, onError }) {
    try {
      // 1. 先做危机关键词检测（PRD要求硬过滤）
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const detected = crisis.detect(lastUserMsg.content);
        if (detected.hit) {
          const resp = crisis.getCrisisResponse();
          await this._streamOut(resp, onChunk);
          onComplete && onComplete({ text: resp, isCrisis: true, keywords: detected.keywords });
          return;
        }
      }

      // 2. 判断模式
      if (this.isMockMode()) {
        const reply = this._mockReply(messages, emotionTag);
        await this._streamOut(reply, onChunk);
        onComplete && onComplete({ text: reply, isMock: true });
        return;
      }

      // 3. 真实API调用
      const reply = await this._callRealAPI(messages, emotionTag);
      await this._streamOut(reply, onChunk);
      onComplete && onComplete({ text: reply });
    } catch (err) {
      // 真实API失败时降级到mock
      console.warn('[AI] 真实API调用失败，降级到mock:', err);
      const reply = this._mockReply(messages, emotionTag);
      await this._streamOut(reply, onChunk);
      onComplete && onComplete({ text: reply, fallback: true, error: err.message });
    }
  },

  // 内部：打字机效果输出
  _streamOut(text, onChunk) {
    return new Promise(resolve => {
      if (!onChunk) { resolve(); return; }
      // 按字符输出，模拟SSE流式
      // 中文按字，英文按词
      const chunks = [];
      let i = 0;
      while (i < text.length) {
        const ch = text[i];
        if (/[a-zA-Z0-9]/.test(ch)) {
          // 英文/数字：凑成一个词
          let word = '';
          while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) {
            word += text[i]; i++;
          }
          chunks.push(word);
        } else {
          chunks.push(ch);
          i++;
        }
      }
      let idx = 0;
      const timer = setInterval(() => {
        if (idx >= chunks.length) {
          clearInterval(timer);
          resolve();
          return;
        }
        onChunk(chunks[idx]);
        idx++;
      }, 50);  // 50ms/字，模拟流式
    });
  },

  // Mock回复生成
  _mockReply(messages, emotionTag) {
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length <= 1) {
      // 第一轮：按情绪标签选开场
      return mock.pickMockResponse(emotionTag);
    }
    // 后续：用追问模板
    return mock.pickFollowupResponse();
  },

  // 真实API调用（OpenAI兼容协议）
  _callRealAPI(messages, emotionTag) {
    return new Promise((resolve, reject) => {
      const cfg = this.getConfig();
      if (!cfg.endpoint || !cfg.apiKey) {
        reject(new Error('LLM API未配置'));
        return;
      }

      // 组装请求体
      const sysMsg = { role: 'system', content: SYSTEM_PROMPT + (emotionTag ? `\n\n【用户当前情绪标签】${emotionTag}` : '') };
      const userContext = messages.slice(-10);  // PRD：最近10轮上下文
      const reqBody = {
        model: cfg.model || 'gpt-3.5-turbo',
        messages: [sysMsg, ...userContext],
        temperature: 0.8,
        max_tokens: 400,
        stream: false   // MVP先用非流式，前端打字机模拟
      };

      wx.request({
        url: cfg.endpoint,
        method: 'POST',
        timeout: 15000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.apiKey
        },
        data: reqBody,
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = res.data;
            // 兼容OpenAI格式
            if (data && data.choices && data.choices[0] && data.choices[0].message) {
              resolve(data.choices[0].message.content || '');
            } else if (data && data.content) {
              resolve(data.content);
            } else {
              reject(new Error('AI返回格式异常'));
            }
          } else {
            reject(new Error('HTTP ' + res.statusCode + ': ' + JSON.stringify(data || {}).slice(0, 200)));
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || '网络请求失败'));
        }
      });
    });
  },

  // 测试API连接（设置页使用）
  testConnection() {
    return new Promise((resolve, reject) => {
      const cfg = this.getConfig();
      if (!cfg.endpoint || !cfg.apiKey) {
        reject(new Error('未配置endpoint或apiKey'));
        return;
      }
      wx.request({
        url: cfg.endpoint,
        method: 'POST',
        timeout: 10000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.apiKey
        },
        data: {
          model: cfg.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || '请求失败'));
        }
      });
    });
  },

  // 获取会话结束语
  getClosure() {
    return mock.getClosureResponse();
  }
};

module.exports = ai;
module.exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
