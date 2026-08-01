// pages/home/home.js
const app = getApp();
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const ai = require('../../utils/ai.js');

Page({
  data: {
    remaining: 3,
    limit: 3,
    aiMode: 'mock',
    todayRecord: null,
    recentRecords: [],
    weekData: [],
    showDailyModal: false
  },

  onLoad() {
    // 首次进入时检查情绪授权
    if (!storage.isEmotionAuthorized()) {
      // 不强制授权，只是记录状态
    }
  },

  onShow() {
    this.refreshData();
    this.checkDailyPrompt();
  },

  refreshData() {
    // 今日额度
    const q = storage.getTodayQuota();
    const remaining = Math.max(0, q.max - q.count);

    // 今日情绪记录
    const today = util.formatDate();
    const todayRecord = storage.getEmotionRecords().find(r => r.record_date === today);
    let todayRecordFmt = null;
    if (todayRecord) {
      todayRecordFmt = {
        score: todayRecord.score,
        scoreColor: util.scoreColor(todayRecord.score),
        scoreLabel: util.scoreLabel(todayRecord.score)
      };
    }

    // 7天数据
    const recentRecords = storage.getRecentEmotionRecords(7);
    const weekData = this.buildWeekData(recentRecords);

    this.setData({
      remaining,
      limit: q.max,
      aiMode: ai.isMockMode() ? 'mock' : 'custom',
      todayRecord: todayRecordFmt,
      recentRecords,
      weekData
    });
  },

  buildWeekData(records) {
    const days = util.lastNDays(7);
    return days.map(date => {
      const r = records.find(x => x.record_date === date);
      const d = new Date(date);
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      return {
        date,
        short: weekDay,
        score: r ? r.score : 0,
        color: r ? util.scoreColor(r.score) : '#e8e4f0',
        barHeight: r ? Math.max(20, r.score * 18) : 8
      };
    });
  },

  checkDailyPrompt() {
    const today = util.formatDate();
    const lastPrompt = storage.getLastEmotionPromptDate();
    const todayRecord = storage.getEmotionRecords().find(r => r.record_date === today);
    if (lastPrompt !== today && !todayRecord) {
      this.setData({ showDailyModal: true });
      storage.setLastEmotionPromptDate(today);
    }
  },

  closeDailyModal() {
    this.setData({ showDailyModal: false });
  },

  noop() {},

  goEmotionFromModal() {
    this.setData({ showDailyModal: false });
    this.goEmotion();
  },

  // ===== 跳转 =====
  goChat() {
    if (this.data.remaining <= 0) {
      wx.showModal({
        title: '今日额度已用完',
        content: '免费用户每日3次AI对话额度。明天再来，或者前往"我的-设置"配置自己的AI API以解除限制。',
        showCancel: true,
        cancelText: '稍后',
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/settings/settings' });
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/chat/chat' });
  },

  goMeditation() {
    wx.switchTab({ url: '/pages/meditation/meditation' });
  },

  goEmotion() {
    wx.navigateTo({ url: '/pages/emotion/emotion' });
  },

  goShield() {
    wx.navigateTo({ url: '/pages/shield/shield' });
  },

  goCommunity() {
    wx.switchTab({ url: '/pages/community/community' });
  },

  goComingSoon(e) {
    const feature = e.currentTarget.dataset.feature || '该功能';
    wx.navigateTo({ url: '/pages/coming-soon/coming-soon?feature=' + encodeURIComponent(feature) });
  }
});
