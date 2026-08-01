// pages/coming-soon/coming-soon.js
Page({
  data: { feature: '该功能' },
  onLoad(opts) {
    if (opts.feature) {
      this.setData({ feature: decodeURIComponent(opts.feature) });
      wx.setNavigationBarTitle({ title: decodeURIComponent(opts.feature) });
    }
  },
  goBack() { wx.navigateBack(); }
});
