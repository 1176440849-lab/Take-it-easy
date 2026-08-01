// pages/crisis/crisis.js
Page({
  call(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {}
    });
  }
});
