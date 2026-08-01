// pages/community/community.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const mock = require('../../utils/mock.js');

Page({
  data: {
    userAlias: '',
    userAliasChar: '匿',
    userColor: '#8b6fd4',
    previewAliasChar: '匿',
    posts: [],
    filteredPosts: [],
    currentFilter: '',
    moodFilters: mock.EMOTION_TAGS.slice(0, 8),
    // 发帖弹窗
    showPostModal: false,
    postContent: '',
    selectedMood: '',
    // 昵称弹窗
    showAliasModal: false,
    tempAlias: '',
    aliasColors: mock.ALIAS_COLORS,
    // 安全区域
    safeBottom: 20
  },

  onLoad() {
    const sys = wx.getWindowInfo();
    this.setData({
      safeBottom: sys.safeArea ? sys.screenHeight - sys.safeArea.bottom : 20
    });
    this.initUser();
    this.seedPostsIfEmpty();
  },

  onShow() {
    this.loadPosts();
  },

  // 用户初始化
  initUser() {
    let alias = storage.getUserAlias();
    if (!alias) {
      alias = mock.genRandomAlias();
      storage.setUserAlias(alias);
    }
    // 颜色用昵称哈希选一个稳定的
    const colors = mock.ALIAS_COLORS;
    let hash = 0;
    for (let i = 0; i < alias.length; i++) hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
    const color = colors[hash % colors.length];
    this.setData({
      userAlias: alias,
      userAliasChar: alias.charAt(0) || '匿',
      userColor: color,
      previewAliasChar: alias.charAt(0) || '匿'
    });
  },

  // 首次使用填充种子帖子
  seedPostsIfEmpty() {
    const list = storage.getCommunityPosts();
    if (list.length === 0) {
      storage.set(storage.KEYS.COMMUNITY_POSTS, mock.SEED_POSTS);
    }
  },

  // 加载帖子
  loadPosts() {
    const posts = storage.getCommunityPosts();
    const likedIds = storage.getLikedPostIds();
    const fmt = posts.map(p => {
      const mood = mock.EMOTION_TAGS.find(t => t.id === p.mood);
      return {
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
        commentCount: (p.comments || []).length,
        timeText: util.relativeTime(p.created_at),
        isMine: !!p.isMine
      };
    });
    this.setData({ posts: fmt });
    this.applyFilter();
  },

  // 筛选
  setFilter(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({ currentFilter: mood });
    this.applyFilter();
  },
  applyFilter() {
    const filter = this.data.currentFilter;
    const filtered = filter
      ? this.data.posts.filter(p => p.mood === filter)
      : this.data.posts;
    this.setData({ filteredPosts: filtered });
  },

  // 点赞
  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const liked = storage.toggleLike(id);
    util.toast(liked ? '已点赞' : '已取消');
    this.loadPosts();
  },

  // 跳详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/community-detail/community-detail?id=' + id });
  },

  // ===== 发帖 =====
  openPost() {
    this.setData({
      showPostModal: true,
      postContent: '',
      selectedMood: ''
    });
  },
  closePost() {
    this.setData({ showPostModal: false });
  },
  onPostInput(e) {
    this.setData({ postContent: e.detail.value });
  },
  selectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({
      selectedMood: this.data.selectedMood === mood ? '' : mood
    });
  },
  submitPost() {
    const content = (this.data.postContent || '').trim();
    if (!content) {
      util.toast('请写点什么');
      return;
    }
    if (content.length < 5) {
      util.toast('再多写一点吧，至少5个字');
      return;
    }
    // 危机关键词检测
    const crisis = require('../../utils/crisis.js');
    const detected = crisis.detect(content);
    if (detected.hit) {
      wx.showModal({
        title: '我们注意到了你',
        content: '你刚才写的话让我担心。树洞愿意接住你的所有情绪，但如果你正在考虑伤害自己，请先拨打400-161-9995，会有专业的人陪你。',
        confirmText: '我知道了',
        cancelText: '拨打热线',
        success: (res) => {
          if (!res.confirm) wx.makePhoneCall({ phoneNumber: '4001619995' });
        }
      });
      return;
    }

    const mood = this.data.selectedMood;
    const moodInfo = mock.EMOTION_TAGS.find(t => t.id === mood);
    storage.addCommunityPost({
      alias: this.data.userAlias,
      avatarColor: this.data.userColor,
      mood: mood,
      moodLabel: moodInfo ? moodInfo.label : '',
      content: content,
      isMine: true
    });
    this.setData({ showPostModal: false });
    util.toast('已发布到树洞', 'success');
    this.loadPosts();
  },

  // ===== 昵称 =====
  changeAlias() {
    const tempAlias = this.data.userAlias;
    this.setData({
      showAliasModal: true,
      tempAlias,
      previewAliasChar: (tempAlias || '匿').charAt(0)
    });
  },
  closeAlias() {
    this.setData({ showAliasModal: false });
  },
  onAliasInput(e) {
    const v = e.detail.value;
    this.setData({
      tempAlias: v,
      previewAliasChar: (v || '匿').charAt(0)
    });
  },
  randomAlias() {
    const v = mock.genRandomAlias();
    this.setData({
      tempAlias: v,
      previewAliasChar: v.charAt(0)
    });
  },
  selectColor(e) {
    this.setData({ userColor: e.currentTarget.dataset.color });
  },
  saveAlias() {
    const alias = (this.data.tempAlias || '').trim();
    if (!alias) {
      util.toast('请输入昵称');
      return;
    }
    storage.setUserAlias(alias);
    storage.set(storage.KEYS.USER_ALIAS, alias);
    this.setData({
      userAlias: alias,
      userAliasChar: alias.charAt(0) || '匿',
      showAliasModal: false
    });
    util.toast('已保存', 'success');
    this.loadPosts();
  },

  noop() {},

  onShareAppMessage() {
    return {
      title: '缓一缓 · 树洞广场 — 匿名说说话',
      path: '/pages/community/community'
    };
  }
});
