App({
  globalData: {
    // 主题色（与PRD一致）
    theme: {
      bg: '#f8f6fc',
      bg2: '#ffffff',
      ink: '#2d2a35',
      muted: '#7a7485',
      rule: '#e8e4f0',
      accent: '#8b6fd4',
      accent2: '#f08a7a',
      success: '#4caf7d',
      warning: '#e8a838',
      danger: '#e85a5a'
    },
    // 危机干预热线
    crisisHotline: '400-161-9995',
    // 免费额度
    dailyChatLimit: 3,
    // 用户信息
    userInfo: null,
    // 是否已完成情绪数据授权
    emotionAuthorized: false
  },

  onLaunch() {
    // 启动时清理过期数据
    this.cleanupExpiredData();
    // 检查今日是否需要弹情绪记录引导
    this.checkDailyEmotionPrompt();
  },

  // 清理过期临时数据
  cleanupExpiredData() {
    try {
      const keys = wx.getStorageInfoSync().keys || [];
      keys.forEach(k => {
        if (k.startsWith('temp_')) {
          wx.removeStorageSync(k);
        }
      });
    } catch (e) {}
  },

  // 每日情绪引导
  checkDailyEmotionPrompt() {
    const today = new Date().toISOString().slice(0, 10);
    const lastPrompt = wx.getStorageSync('last_emotion_prompt_date');
    if (lastPrompt !== today) {
      this.globalData.needEmotionPrompt = true;
    }
  }
});
