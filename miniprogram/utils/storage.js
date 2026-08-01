// utils/storage.js — 本地存储封装（模拟后端数据库）

const KEYS = {
  USER: 'user_info',                    // 用户信息
  EMOTION_AUTH: 'emotion_authorized',   // 情绪数据授权
  EMOTION_RECORDS: 'emotion_records',   // 情绪记录列表
  CHAT_SESSIONS: 'chat_sessions',       // AI对话会话
  CHAT_QUOTA_PREFIX: 'chat_quota_',     // 每日对话额度前缀+日期
  MEDITATION_LOGS: 'meditation_logs',   // 冥想记录
  LLM_CONFIG: 'llm_config',             // LLM API配置
  LAST_EMOTION_PROMPT: 'last_emotion_prompt_date',
  SETTINGS: 'user_settings',            // 用户偏好设置
  // V1.0 新增
  SHIELD_CONFIG: 'shield_config',       // 社交压力屏蔽配置
  SHIELD_LOGS: 'shield_logs',           // 屏蔽触发日志
  COMMUNITY_POSTS: 'community_posts',   // 树洞社区帖子
  COMMUNITY_LIKES: 'community_likes',   // 用户已点赞的帖子ID
  COMMUNITY_REPORTS: 'community_reports', // 用户已举报的帖子ID
  USER_ALIAS: 'user_alias'              // 社区匿名昵称
};

const storage = {
  // ====== 通用 ======
  get(key, defaultValue = null) {
    try {
      const v = wx.getStorageSync(key);
      return v === '' ? defaultValue : v;
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try { wx.setStorageSync(key, value); return true; } catch (e) { return false; }
  },
  remove(key) {
    try { wx.removeStorageSync(key); return true; } catch (e) { return false; }
  },
  clearAll() {
    try {
      Object.values(KEYS).forEach(k => wx.removeStorageSync(k));
      // 清理临时数据
      const info = wx.getStorageInfoSync();
      (info.keys || []).forEach(k => {
        if (k.startsWith('temp_') || k.startsWith('chat_quota_')) {
          wx.removeStorageSync(k);
        }
      });
      return true;
    } catch (e) { return false; }
  },

  // ====== 用户 ======
  getUser() {
    return this.get(KEYS.USER, null);
  },
  setUser(user) {
    return this.set(KEYS.USER, user);
  },

  // ====== 情绪数据授权 ======
  isEmotionAuthorized() {
    return this.get(KEYS.EMOTION_AUTH, false) === true;
  },
  setEmotionAuthorized(v) {
    return this.set(KEYS.EMOTION_AUTH, v === true);
  },

  // ====== 情绪记录 ======
  getEmotionRecords() {
    return this.get(KEYS.EMOTION_RECORDS, []);
  },
  addEmotionRecord(record) {
    const list = this.getEmotionRecords();
    const item = Object.assign({ id: 'er_' + Date.now(), created_at: Date.now() }, record);
    list.push(item);
    this.set(KEYS.EMOTION_RECORDS, list);
    return item;
  },
  // 获取近N天记录
  getRecentEmotionRecords(days) {
    const list = this.getEmotionRecords();
    if (!days) return list;
    const cutoff = Date.now() - days * 86400000;
    return list.filter(r => r.created_at >= cutoff);
  },
  // 获取今日记录
  getTodayEmotionRecord() {
    const today = new Date().toISOString().slice(0, 10);
    return this.getEmotionRecords().find(r => (r.record_date || '') === today);
  },

  // ====== 对话会话 ======
  getChatSessions() {
    return this.get(KEYS.CHAT_SESSIONS, []);
  },
  getChatSession(id) {
    return this.getChatSessions().find(s => s.id === id);
  },
  saveChatSession(session) {
    const list = this.getChatSessions();
    const idx = list.findIndex(s => s.id === session.id);
    if (idx >= 0) list[idx] = session;
    else list.push(session);
    this.set(KEYS.CHAT_SESSIONS, list);
  },
  deleteChatSession(id) {
    const list = this.getChatSessions().filter(s => s.id !== id);
    this.set(KEYS.CHAT_SESSIONS, list);
  },
  clearChatSessions() {
    this.set(KEYS.CHAT_SESSIONS, []);
  },

  // ====== 每日对话额度 ======
  getTodayQuota() {
    const today = new Date().toISOString().slice(0, 10);
    const key = KEYS.CHAT_QUOTA_PREFIX + today;
    return this.get(key, { date: today, count: 0, max: 3 });
  },
  incChatQuota() {
    const q = this.getTodayQuota();
    q.count += 1;
    const today = new Date().toISOString().slice(0, 10);
    this.set(KEYS.CHAT_QUOTA_PREFIX + today, q);
    return q;
  },
  remainingQuota() {
    const q = this.getTodayQuota();
    return Math.max(0, q.max - q.count);
  },

  // ====== 冥想记录 ======
  getMeditationLogs() {
    return this.get(KEYS.MEDITATION_LOGS, []);
  },
  addMeditationLog(log) {
    const list = this.getMeditationLogs();
    list.push(Object.assign({ id: 'ml_' + Date.now(), created_at: Date.now() }, log));
    this.set(KEYS.MEDITATION_LOGS, list);
  },

  // ====== LLM 配置 ======
  getLLMConfig() {
    return this.get(KEYS.LLM_CONFIG, {
      provider: 'mock',          // mock | custom
      endpoint: '',
      apiKey: '',
      model: '',
      systemPrompt: ''
    });
  },
  setLLMConfig(cfg) {
    return this.set(KEYS.LLM_CONFIG, cfg);
  },

  // ====== 情绪引导日期 ======
  getLastEmotionPromptDate() {
    return this.get(KEYS.LAST_EMOTION_PROMPT, '');
  },
  setLastEmotionPromptDate(date) {
    return this.set(KEYS.LAST_EMOTION_PROMPT, date);
  },

  // ====== 社交压力屏蔽配置 ======
  getShieldConfig() {
    return this.get(KEYS.SHIELD_CONFIG, {
      enabled: false,
      // 勿扰时段（24h制）
      quietStart: '22:00',
      quietEnd: '07:00',
      // 屏蔽的应用白名单（已开启屏蔽的）
      blockedApps: [],
      // 屏蔽关键词（命中则拦截通知）
      keywords: ['KPI', '加班', '截止', 'ddl', 'deadline', '开会', '绩效', '汇报'],
      // 自动回复模板
      autoReply: '我现在不方便回复，稍后联系你。'
    });
  },
  setShieldConfig(cfg) {
    return this.set(KEYS.SHIELD_CONFIG, cfg);
  },

  // ====== 屏蔽日志 ======
  getShieldLogs() {
    return this.get(KEYS.SHIELD_LOGS, []);
  },
  addShieldLog(log) {
    const list = this.getShieldLogs();
    list.push(Object.assign({ id: 'sl_' + Date.now(), created_at: Date.now() }, log));
    // 只保留最近100条
    if (list.length > 100) list.splice(0, list.length - 100);
    this.set(KEYS.SHIELD_LOGS, list);
  },
  clearShieldLogs() {
    this.set(KEYS.SHIELD_LOGS, []);
  },

  // ====== 树洞社区帖子 ======
  getCommunityPosts() {
    return this.get(KEYS.COMMUNITY_POSTS, []);
  },
  addCommunityPost(post) {
    const list = this.getCommunityPosts();
    const item = Object.assign({
      id: 'p_' + Date.now(),
      created_at: Date.now(),
      likes: 0,
      comments: [],
      reports: 0
    }, post);
    list.unshift(item);  // 新帖在前
    this.set(KEYS.COMMUNITY_POSTS, list);
    return item;
  },
  deleteCommunityPost(id) {
    const list = this.getCommunityPosts().filter(p => p.id !== id);
    this.set(KEYS.COMMUNITY_POSTS, list);
  },
  addComment(postId, comment) {
    const list = this.getCommunityPosts();
    const idx = list.findIndex(p => p.id === postId);
    if (idx >= 0) {
      if (!list[idx].comments) list[idx].comments = [];
      list[idx].comments.push(Object.assign({
        id: 'c_' + Date.now(),
        created_at: Date.now()
      }, comment));
      this.set(KEYS.COMMUNITY_POSTS, list);
    }
  },
  toggleLike(postId) {
    const list = this.getCommunityPosts();
    const idx = list.findIndex(p => p.id === postId);
    if (idx < 0) return false;
    const liked = this.isLiked(postId);
    if (liked) {
      list[idx].likes = Math.max(0, (list[idx].likes || 0) - 1);
      this.removeLike(postId);
    } else {
      list[idx].likes = (list[idx].likes || 0) + 1;
      this.addLike(postId);
    }
    this.set(KEYS.COMMUNITY_POSTS, list);
    return !liked;
  },
  reportPost(postId) {
    const list = this.getCommunityPosts();
    const idx = list.findIndex(p => p.id === postId);
    if (idx >= 0) {
      list[idx].reports = (list[idx].reports || 0) + 1;
      this.set(KEYS.COMMUNITY_POSTS, list);
    }
    this.addReport(postId);
  },

  // ====== 点赞/举报记录 ======
  getLikedPostIds() {
    return this.get(KEYS.COMMUNITY_LIKES, []);
  },
  isLiked(postId) {
    return this.getLikedPostIds().indexOf(postId) >= 0;
  },
  addLike(postId) {
    const list = this.getLikedPostIds();
    if (list.indexOf(postId) < 0) { list.push(postId); this.set(KEYS.COMMUNITY_LIKES, list); }
  },
  removeLike(postId) {
    const list = this.getLikedPostIds().filter(id => id !== postId);
    this.set(KEYS.COMMUNITY_LIKES, list);
  },
  addReport(postId) {
    const list = this.get(KEYS.COMMUNITY_REPORTS, []);
    if (list.indexOf(postId) < 0) { list.push(postId); this.set(KEYS.COMMUNITY_REPORTS, list); }
  },
  isReported(postId) {
    return this.get(KEYS.COMMUNITY_REPORTS, []).indexOf(postId) >= 0;
  },

  // ====== 匿名昵称 ======
  getUserAlias() {
    return this.get(KEYS.USER_ALIAS, '');
  },
  setUserAlias(alias) {
    return this.set(KEYS.USER_ALIAS, alias);
  }
};

module.exports = storage;
module.exports.KEYS = KEYS;
