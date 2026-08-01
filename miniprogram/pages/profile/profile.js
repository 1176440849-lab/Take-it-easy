// pages/profile/profile.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const ai = require('../../utils/ai.js');

Page({
  data: {
    version: '1.1.0',
    aiModeText: '演示模式',
    shieldStatusText: '已关闭',
    quota: { used: 0, max: 3, remaining: 3, percent: 0 },
    stats: {
      emotionDays: 0,
      chatSessions: 0,
      meditationCount: 0,
      streakDays: 0,
      postCount: 0
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const q = storage.getTodayQuota();
    const used = q.count;
    const remaining = Math.max(0, q.max - used);
    const percent = q.max > 0 ? (used / q.max) * 100 : 0;

    const emotionRecords = storage.getEmotionRecords();
    const chatSessions = storage.getChatSessions();
    const meditationLogs = storage.getMeditationLogs();
    const streakDays = this.calcStreak(emotionRecords);
    const posts = storage.getCommunityPosts();
    const myPosts = posts.filter(p => p.isMine).length;
    const shieldConfig = storage.getShieldConfig();

    this.setData({
      aiModeText: ai.isMockMode() ? '演示模式' : '已接入自定义AI',
      shieldStatusText: shieldConfig.enabled
        ? '已开启 · ' + shieldConfig.quietStart + '-' + shieldConfig.quietEnd
        : '已关闭',
      quota: { used, max: q.max, remaining, percent },
      stats: {
        emotionDays: emotionRecords.length,
        chatSessions: chatSessions.length,
        meditationCount: meditationLogs.length,
        streakDays,
        postCount: myPosts
      }
    });
  },

  // 计算连续记录天数
  calcStreak(records) {
    if (!records.length) return 0;
    const dates = records.map(r => r.record_date).sort().reverse();
    let streak = 0;
    let prev = util.formatDate();
    for (const d of dates) {
      if (d === prev) {
        streak++;
        const pd = new Date(prev + 'T00:00:00');
        pd.setDate(pd.getDate() - 1);
        prev = util.formatDate(pd);
      } else if (d < prev) {
        break;
      }
    }
    return streak;
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goShield() {
    wx.navigateTo({ url: '/pages/shield/shield' });
  },

  goCrisis() {
    wx.navigateTo({ url: '/pages/crisis/crisis' });
  },

  showDisclaimer() {
    wx.showModal({
      title: '免责声明',
      content: '1. 「缓一缓」是一款情绪健康管理工具，不能替代专业医疗诊断和心理治疗。\n\n2. 如有持续情绪困扰、严重心理疾病或自伤念头，请立即寻求专业医生或心理治疗师帮助。\n\n3. AI对话内容由大模型生成，可能存在不准确或不当建议，请理性参考。\n\n4. 危机干预热线：400-161-9995（24小时）\n\n5. 所有数据仅存储在你的设备本地，不会上传服务器。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  clearData() {
    wx.showModal({
      title: '清除所有数据',
      content: '此操作将永久删除你的全部情绪记录、对话历史、冥想记录和设置，且无法恢复。确定继续吗？',
      confirmText: '确认清除',
      confirmColor: '#e85a5a',
      success: (res) => {
        if (res.confirm) {
          storage.clearAll();
          util.toast('已清除全部数据', 'success');
          setTimeout(() => this.refresh(), 1000);
        }
      }
    });
  }
});
