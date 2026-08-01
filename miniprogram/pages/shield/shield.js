// pages/shield/shield.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const mock = require('../../utils/mock.js');

Page({
  data: {
    config: {},
    apps: [],
    logs: [],
    newKeyword: '',
    testMessage: '',
    keywordSuggestions: mock.SHIELD_KEYWORD_SUGGESTIONS.slice(0, 8)
  },

  onShow() {
    this.load();
  },

  load() {
    let config = storage.getShieldConfig();
    // 合并apps与配置
    const blockedApps = config.blockedApps || [];
    const apps = mock.SHIELD_APPS.map(a => Object.assign({}, a, {
      blocked: blockedApps.indexOf(a.id) >= 0 ? true : a.defaultBlocked
    }));
    // 同步回config（首次使用时把默认值写入）
    config.blockedApps = apps.filter(a => a.blocked).map(a => a.id);
    storage.setShieldConfig(config);

    const logs = storage.getShieldLogs().slice().reverse().slice(0, 20).map(l => ({
      id: l.id,
      icon: this.appIcon(l.app_id),
      appName: l.app_name,
      reason: l.reason,
      timeText: util.relativeTime(l.created_at)
    }));

    this.setData({ config, apps, logs });
  },

  appIcon(appId) {
    const a = mock.SHIELD_APPS.find(x => x.id === appId);
    return a ? a.icon : '📱';
  },

  // 总开关
  toggleMaster(e) {
    const config = Object.assign({}, this.data.config, { enabled: e.detail.value });
    storage.setShieldConfig(config);
    this.setData({ config });
    if (config.enabled) {
      // 记录开启日志
      storage.addShieldLog({
        app_id: 'system',
        app_name: '系统',
        reason: '开启勿扰模式'
      });
      util.toast('已开启屏蔽', 'success');
      this.load();
    } else {
      util.toast('已关闭屏蔽');
    }
  },

  // 时间
  onStartTimeChange(e) {
    const config = Object.assign({}, this.data.config, { quietStart: e.detail.value });
    storage.setShieldConfig(config);
    this.setData({ config });
  },
  onEndTimeChange(e) {
    const config = Object.assign({}, this.data.config, { quietEnd: e.detail.value });
    storage.setShieldConfig(config);
    this.setData({ config });
  },

  // 应用切换
  toggleApp(e) {
    const id = e.currentTarget.dataset.id;
    const apps = this.data.apps.map(a => {
      if (a.id === id) a.blocked = e.detail.value;
      return a;
    });
    const blockedApps = apps.filter(a => a.blocked).map(a => a.id);
    const config = Object.assign({}, this.data.config, { blockedApps });
    storage.setShieldConfig(config);
    this.setData({ apps, config });
  },

  // 关键词
  onKwInput(e) {
    this.setData({ newKeyword: e.detail.value });
  },
  addKeyword() {
    const kw = (this.data.newKeyword || '').trim();
    if (!kw) return;
    const config = Object.assign({}, this.data.config);
    if (!config.keywords) config.keywords = [];
    if (config.keywords.indexOf(kw) >= 0) {
      util.toast('已存在');
      return;
    }
    config.keywords.push(kw);
    storage.setShieldConfig(config);
    this.setData({ config, newKeyword: '' });
  },
  addSuggestKeyword(e) {
    const kw = e.currentTarget.dataset.kw;
    const config = Object.assign({}, this.data.config);
    if (config.keywords.indexOf(kw) >= 0) {
      util.toast('已存在');
      return;
    }
    config.keywords.push(kw);
    storage.setShieldConfig(config);
    this.setData({ config });
  },
  removeKeyword(e) {
    const kw = e.currentTarget.dataset.kw;
    const config = Object.assign({}, this.data.config);
    config.keywords = config.keywords.filter(k => k !== kw);
    storage.setShieldConfig(config);
    this.setData({ config });
  },

  // 自动回复
  onReplyInput(e) {
    const config = Object.assign({}, this.data.config, { autoReply: e.detail.value });
    storage.setShieldConfig(config);
    this.setData({ config });
  },

  // 日志清空
  clearLogs() {
    wx.showModal({
      title: '清空屏蔽记录？',
      content: '将删除全部' + this.data.logs.length + '条记录',
      success: (res) => {
        if (res.confirm) {
          storage.clearShieldLogs();
          this.setData({ logs: [] });
          util.toast('已清空', 'success');
        }
      }
    });
  },

  // 模拟测试
  onTestInput(e) {
    this.setData({ testMessage: e.detail.value });
  },
  runTest() {
    const msg = (this.data.testMessage || '').trim();
    if (!msg) {
      util.toast('请输入测试消息');
      return;
    }
    const config = this.data.config;
    // 检测关键词
    const hitKws = (config.keywords || []).filter(kw => msg.toLowerCase().indexOf(kw.toLowerCase()) >= 0);
    // 当前是否在勿扰时段
    const inQuiet = this.isInQuietTime(config.quietStart, config.quietEnd);

    let result = '【检测结果】\n\n';
    result += '屏蔽模式：' + (config.enabled ? '已开启' : '已关闭') + '\n';
    result += '当前时段：' + (inQuiet ? '勿扰时段内' : '勿扰时段外') + '\n';
    if (hitKws.length > 0) {
      result += '命中关键词：' + hitKws.join('、') + '\n';
      result += '\n👉 这条消息会被静音，并自动回复：\n"' + config.autoReply + '"';
    } else {
      result += '命中关键词：无\n';
      result += '\n👉 这条消息会正常通知';
    }

    // 记录测试日志
    storage.addShieldLog({
      app_id: 'test',
      app_name: '测试',
      reason: hitKws.length > 0 ? '命中关键词' + hitKws.join(',') : '未命中'
    });

    wx.showModal({
      title: '模拟结果',
      content: result,
      showCancel: false
    });
    this.load();
  },

  // 判断当前是否在勿扰时段
  isInQuietTime(start, end) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const cur = h * 60 + m;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (s <= e) {
      return cur >= s && cur <= e;
    } else {
      // 跨夜：22:00 - 07:00
      return cur >= s || cur <= e;
    }
  }
});
