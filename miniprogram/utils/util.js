// utils/util.js — 通用工具函数

const util = {
  // 格式化日期 YYYY-MM-DD
  formatDate(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  // 格式化时间 HH:MM
  formatTime(ts) {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  },

  // 相对时间描述
  relativeTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + '天前';
    return this.formatDate(new Date(ts));
  },

  // 格式化时长（秒 → M分S秒）
  formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return s + '秒';
    return m + '分' + (s > 0 ? s + '秒' : '');
  },

  // 生成唯一ID
  genId(prefix) {
    return (prefix || 'id_') + Date.now() + '_' + Math.floor(Math.random() * 10000);
  },

  // 深拷贝
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // 显示Toast
  toast(title, icon) {
    wx.showToast({ title, icon: icon || 'none', duration: 2000 });
  },

  // 显示Loading
  showLoading(title) {
    wx.showLoading({ title: title || '加载中', mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  },

  // 显示确认对话框
  confirm(content, title) {
    return new Promise(resolve => {
      wx.showModal({
        title: title || '提示',
        content,
        success(res) { resolve(res.confirm); }
      });
    });
  },

  // 根据情绪分数获取颜色
  scoreColor(score) {
    if (score <= 3) return '#e85a5a';
    if (score <= 5) return '#e8a838';
    if (score <= 7) return '#8b6fd4';
    return '#4caf7d';
  },

  // 根据情绪分数获取描述
  scoreLabel(score) {
    if (score <= 2) return '非常糟糕';
    if (score <= 4) return '不太好';
    if (score <= 6) return '一般';
    if (score <= 8) return '还不错';
    return '很好';
  },

  // 防抖
  debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait || 300);
    };
  },

  // 获取最近N天的日期数组
  lastNDays(n) {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      arr.push(this.formatDate(d));
    }
    return arr;
  }
};

module.exports = util;
