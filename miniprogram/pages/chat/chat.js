// pages/chat/chat.js
const app = getApp();
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const ai = require('../../utils/ai.js');
const crisis = require('../../utils/crisis.js');
const mock = require('../../utils/mock.js');

Page({
  data: {
    statusBarHeight: 20,
    safeBottom: 20,
    // 情绪选择
    emotionTags: mock.EMOTION_TAGS.filter(t => ['anxious','sad','angry','tired','lonely','overwhelmed','numb','scared','hopeless'].indexOf(t.id) >= 0),
    emotionTag: null,
    // 消息
    messages: [],
    welcomeText: '',
    inputText: '',
    aiThinking: false,
    showCrisisBanner: false,
    // 额度
    remaining: 3,
    limit: 3,
    // 快捷开场
    showQuickTags: true,
    quickStarts: [
      '我今天特别累',
      '心里堵得慌',
      '睡不着，脑子里全是事',
      '我感觉快撑不住了'
    ],
    // 滚动
    scrollToId: 'msg-welcome',
    // 结束会话
    showEndModal: false,
    satisfactionScore: 0,
    scoreOptions: [
      { value: 1, emoji: '😖', label: '没用' },
      { value: 3, emoji: '😐', label: '一般' },
      { value: 4, emoji: '🙂', label: '有助' },
      { value: 5, emoji: '🌸', label: '很好' }
    ],
    // 会话
    sessionId: '',
    sessionStartedAt: 0
  },

  onLoad() {
    const sys = wx.getWindowInfo();
    const safe = wx.getWindowInfo();
    this.setData({
      statusBarHeight: sys.statusBarHeight || 20,
      safeBottom: (safe.safeArea ? safe.screenHeight - safe.safeArea.bottom : 0) + 12
    });
    this.setData({
      sessionId: util.genId('sess_'),
      sessionStartedAt: Date.now(),
      remaining: storage.remainingQuota(),
      limit: app.globalData.dailyChatLimit
    });
  },

  // 选择情绪标签
  selectEmotion(e) {
    const id = e.currentTarget.dataset.id;
    const tag = mock.EMOTION_TAGS.find(t => t.id === id);
    this.setData({ emotionTag: tag });
    this.startSession();
  },

  // 跳过情绪选择
  skipEmotion() {
    this.setData({ emotionTag: null });
    // 直接开始，不带情绪标签
    this.setData({ emotionTag: { id: '', label: '通用', emoji: '🌿' } });
    this.startSession();
  },

  // 启动会话
  startSession() {
    const welcomeText = this.data.emotionTag && this.data.emotionTag.id
      ? `我在这里。看到你选了"${this.data.emotionTag.label}"——愿意告诉我，是什么让你有这种感觉的吗？想到什么说什么，不必组织语言。`
      : '我在这里。慢慢来，告诉我现在最让你难受的是什么？不必组织语言，想到什么说什么就好。';
    this.setData({
      welcomeText,
      scrollToId: 'msg-welcome'
    });
    // 保存会话
    storage.saveChatSession({
      id: this.data.sessionId,
      emotion_tag: this.data.emotionTag ? this.data.emotionTag.id : '',
      started_at: this.data.sessionStartedAt,
      messages: [{ role: 'ai', content: welcomeText }],
      ended_at: null,
      satisfaction_score: null
    });
  },

  // 输入
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 发送
  onSend() {
    const text = (this.data.inputText || '').trim();
    if (!text || this.data.aiThinking) return;

    // 隐藏快捷标签
    if (this.data.showQuickTags) this.setData({ showQuickTags: false });

    // 1. 客户端侧也做危机检测（提示用户），真实过滤在AI调用层
    // （这里不阻断，由 ai.chat 内部统一处理）

    // 2. 添加用户消息 + AI占位消息（一次性加入，避免流式时序问题）
    const userMsg = {
      id: util.genId('m_'),
      role: 'user',
      content: text,
      created_at: Date.now()
    };
    const aiMsg = {
      id: util.genId('m_'),
      role: 'ai',
      content: '',
      streaming: true,
      created_at: Date.now()
    };
    const messages = [...this.data.messages, userMsg, aiMsg];
    this.setData({
      messages,
      inputText: '',
      aiThinking: true
    });
    this.scrollToBottom();

    // 3. 调用AI
    // 组装给AI的历史消息（不含占位aiMsg，含welcomeText）
    const aiMessages = [];
    if (this.data.welcomeText) {
      aiMessages.push({ role: 'assistant', content: this.data.welcomeText });
    }
    messages.filter(m => m.id !== aiMsg.id).forEach(m => {
      aiMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content });
    });

    ai.chat({
      messages: aiMessages,
      emotionTag: this.data.emotionTag ? this.data.emotionTag.id : '',
      onChunk: (delta) => {
        // 流式追加到当前AI消息
        const msgs = this.data.messages;
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'ai' && last.streaming) {
          last.content = (last.content || '') + delta;
          this.setData({ messages: msgs });
          this.scrollToBottom();
        }
      },
      onComplete: (res) => {
        // 完成最后一条AI消息
        const msgs = this.data.messages;
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'ai') {
          last.streaming = false;
        }
        this.setData({
          messages: msgs,
          aiThinking: false
        });

        // 危机干预
        if (res.isCrisis) {
          this.setData({ showCrisisBanner: true });
          this.scrollToBottom();
        }

        // 扣减额度（每次用户发送扣1次）
        const q = storage.incChatQuota();
        this.setData({ remaining: Math.max(0, q.max - q.count) });

        // 保存会话
        this.persistSession();
      },
      onError: (err) => {
        this.setData({ aiThinking: false });
        util.toast('AI回复失败，请稍后重试');
      }
    });
  },

  // 快捷发送
  quickSend(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ inputText: text });
    this.onSend();
  },

  // 滚动到底部
  scrollToBottom() {
    // 用setData的callback保证时序
    setTimeout(() => {
      this.setData({ scrollToId: 'msg-bottom' });
    }, 50);
  },

  // 拨打热线
  callHotline() {
    wx.makePhoneCall({ phoneNumber: crisis.getHotline() });
  },

  // 结束会话
  onEndSession() {
    if (this.data.messages.length === 0) {
      this.onBack();
      return;
    }
    this.setData({ showEndModal: true });
  },

  cancelEnd() {
    this.setData({ showEndModal: false });
  },

  selectScore(e) {
    this.setData({ satisfactionScore: e.currentTarget.dataset.score });
  },

  confirmEnd() {
    const score = this.data.satisfactionScore;
    // 保存满意度评分
    const sessions = storage.getChatSessions();
    const idx = sessions.findIndex(s => s.id === this.data.sessionId);
    if (idx >= 0) {
      sessions[idx].ended_at = Date.now();
      sessions[idx].satisfaction_score = score;
      storage.set(storage.KEYS.CHAT_SESSIONS, sessions);
    }

    // 显示结束语
    const closure = ai.getClosure();
    const msgs = [...this.data.messages, {
      id: util.genId('m_'),
      role: 'ai',
      content: closure,
      created_at: Date.now()
    }];
    this.setData({
      messages: msgs,
      showEndModal: false
    });
    this.scrollToBottom();

    // 2秒后返回
    setTimeout(() => {
      wx.navigateBack();
    }, 3500);
  },

  // 保存会话到本地
  persistSession() {
    const messages = this.data.messages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
      created_at: m.created_at
    }));
    storage.saveChatSession({
      id: this.data.sessionId,
      emotion_tag: this.data.emotionTag ? this.data.emotionTag.id : '',
      started_at: this.data.sessionStartedAt,
      messages,
      ended_at: null,
      satisfaction_score: null
    });
  },

  // 返回
  onBack() {
    // 如果有未完成对话，提示
    if (this.data.messages.length > 0 && !this.data.showEndModal) {
      wx.showModal({
        title: '结束本次对话？',
        content: '对话记录会保留在本地，下次进入将开启新对话。',
        confirmText: '结束',
        cancelText: '继续聊',
        success: (res) => {
          if (res.confirm) wx.navigateBack();
        }
      });
      return;
    }
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '缓一缓 — 3分钟情绪急救',
      path: '/pages/home/home'
    };
  }
});
