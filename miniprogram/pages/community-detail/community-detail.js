// pages/community-detail/community-detail.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const mock = require('../../utils/mock.js');

Page({
  data: {
    statusBarHeight: 20,
    safeBottom: 20,
    postId: '',
    post: {},
    comments: [],
    commentText: '',
    showActionSheet: false
  },

  onLoad(opts) {
    const sys = wx.getWindowInfo();
    this.setData({
      statusBarHeight: sys.statusBarHeight || 20,
      safeBottom: sys.safeArea ? sys.screenHeight - sys.safeArea.bottom : 20,
      postId: opts.id
    });
  },

  onShow() {
    this.load();
  },

  load() {
    const posts = storage.getCommunityPosts();
    const p = posts.find(x => x.id === this.data.postId);
    if (!p) {
      util.toast('帖子不存在');
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }
    const likedIds = storage.getLikedPostIds();
    const mood = mock.EMOTION_TAGS.find(t => t.id === p.mood);
    const post = {
      id: p.id,
      alias: p.alias,
      aliasChar: (p.alias || '匿').charAt(0),
      avatarColor: p.avatarColor,
      mood: p.mood,
      moodLabel: p.moodLabel || (mood ? mood.label : ''),
      moodEmoji: mood ? mood.emoji : '',
      moodColor: mood ? mood.color : '#7a7485',
      content: p.content,
      likes: p.likes || 0,
      liked: likedIds.indexOf(p.id) >= 0,
      timeText: util.relativeTime(p.created_at),
      isMine: !!p.isMine
    };
    const comments = (p.comments || []).map(c => {
      // 用alias首字符哈希一个颜色
      let hash = 0;
      for (let i = 0; i < (c.alias || '').length; i++) hash = (hash * 31 + c.alias.charCodeAt(i)) >>> 0;
      const color = mock.ALIAS_COLORS[hash % mock.ALIAS_COLORS.length];
      return {
        id: c.id,
        alias: c.alias || '匿名',
        aliasChar: (c.alias || '匿').charAt(0),
        avatarColor: c.avatarColor || color,
        content: c.content,
        timeText: util.relativeTime(c.created_at)
      };
    });
    this.setData({ post, comments });
  },

  // 点赞
  toggleLike() {
    storage.toggleLike(this.data.postId);
    this.load();
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 发送评论
  submitComment() {
    const text = (this.data.commentText || '').trim();
    if (!text) return;
    if (text.length < 2) {
      util.toast('再多说一点');
      return;
    }
    // 危机检测
    const crisis = require('../../utils/crisis.js');
    if (crisis.detect(text).hit) {
      wx.showModal({
        title: '请先照顾好自己',
        content: '如果你正在经历痛苦，请拨打400-161-9995。',
        showCancel: false
      });
      return;
    }
    const alias = storage.getUserAlias() || mock.genRandomAlias();
    let hash = 0;
    for (let i = 0; i < alias.length; i++) hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
    const color = mock.ALIAS_COLORS[hash % mock.ALIAS_COLORS.length];

    storage.addComment(this.data.postId, {
      alias,
      avatarColor: color,
      content: text
    });
    this.setData({ commentText: '' });
    this.load();
    util.toast('已评论', 'success');
  },

  // 操作菜单
  showActions() {
    this.setData({ showActionSheet: true });
  },
  hideActions() {
    this.setData({ showActionSheet: false });
  },

  copyContent() {
    wx.setClipboardData({
      data: this.data.post.content,
      success: () => util.toast('已复制', 'success')
    });
    this.hideActions();
  },

  deletePost() {
    wx.showModal({
      title: '删除帖子？',
      content: '删除后无法恢复',
      confirmColor: '#e85a5a',
      success: (res) => {
        if (res.confirm) {
          storage.deleteCommunityPost(this.data.postId);
          util.toast('已删除', 'success');
          setTimeout(() => wx.navigateBack(), 800);
        }
      }
    });
    this.hideActions();
  },

  reportPost() {
    wx.showModal({
      title: '举报这条帖子？',
      content: '我们的志愿者会尽快审核。如果帖子涉及自伤、暴力或违规内容，将被处理。',
      success: (res) => {
        if (res.confirm) {
          storage.reportPost(this.data.postId);
          util.toast('已举报，感谢你让树洞更安全', 'success');
          setTimeout(() => wx.navigateBack(), 1000);
        }
      }
    });
    this.hideActions();
  },

  onBack() {
    wx.navigateBack();
  },

  noop() {}
});
