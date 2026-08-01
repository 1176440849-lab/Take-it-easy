// pages/settings/settings.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const ai = require('../../utils/ai.js');

const PRESETS = {
  glm: {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4'
  },
  qwen: {
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus'
  },
  wenxin: {
    endpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
    model: 'ernnie-bot-4'
  },
  doubao: {
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-pro-32k'
  }
};

Page({
  data: {
    config: {
      provider: 'mock',
      endpoint: '',
      apiKey: '',
      model: '',
      systemPrompt: ''
    },
    isMockMode: true,
    showKey: false
  },

  onLoad() {
    const cfg = storage.getLLMConfig();
    this.setData({
      config: Object.assign({}, this.data.config, cfg),
      isMockMode: ai.isMockMode()
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const config = Object.assign({}, this.data.config);
    config[field] = e.detail.value;
    this.setData({ config });
  },

  toggleShowKey() {
    this.setData({ showKey: !this.data.showKey });
  },

  usePreset(e) {
    const key = e.currentTarget.dataset.preset;
    const preset = PRESETS[key];
    if (!preset) return;
    const config = Object.assign({}, this.data.config, preset, { provider: 'custom' });
    this.setData({ config });
    util.toast('已填入预设，请补充API Key', 'none');
  },

  saveConfig() {
    const cfg = this.data.config;
    // 校验
    if (cfg.endpoint && cfg.apiKey) {
      cfg.provider = 'custom';
    } else {
      cfg.provider = 'mock';
    }
    storage.setLLMConfig(cfg);
    this.setData({ isMockMode: cfg.provider === 'mock' });
    util.toast('已保存', 'success');
    setTimeout(() => wx.navigateBack(), 1000);
  },

  resetToMock() {
    const cfg = Object.assign({}, this.data.config, {
      provider: 'mock',
      endpoint: '',
      apiKey: '',
      model: ''
    });
    storage.setLLMConfig(cfg);
    this.setData({
      config: cfg,
      isMockMode: true
    });
    util.toast('已恢复演示模式', 'success');
  },

  testConnection() {
    const cfg = this.data.config;
    if (!cfg.endpoint || !cfg.apiKey) {
      util.toast('请先填写endpoint和apiKey');
      return;
    }
    // 临时保存再测试
    cfg.provider = 'custom';
    storage.setLLMConfig(cfg);
    util.showLoading('测试中...');
    ai.testConnection().then(res => {
      util.hideLoading();
      wx.showModal({
        title: '连接成功',
        content: 'AI接口可用。返回内容：\n' + JSON.stringify(res).slice(0, 200),
        showCancel: false
      });
    }).catch(err => {
      util.hideLoading();
      wx.showModal({
        title: '连接失败',
        content: '错误：' + err.message + '\n\n请检查endpoint、apiKey、model是否正确，以及该域名是否已加入小程序合法域名白名单（开发者工具可在详情→本地设置→不校验合法域名中临时关闭）。',
        showCancel: false
      });
    });
  }
});
