// pages/meditation/meditation.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const mock = require('../../utils/mock.js');
const audio = require('../../utils/audio.js');

Page({
  data: {
    mode: 'list',          // list | play
    scenes: [],
    todayRecommend: null,
    logs: [],
    // 播放态
    currentScene: null,
    isPlaying: false,
    breathing: false,
    breathText: '准备',
    breathDesc: '找一个舒服的姿势，轻轻闭上眼',
    elapsed: 0,            // 秒
    total: 0,              // 秒
    elapsedText: '00:00',
    totalText: '00:00',
    progressPercent: 0,
    showCompleteModal: false,
    // 背景音乐
    bgmTypes: mock.BGM_TYPES,
    currentBgm: 'none',    // 当前选中BGM id
    bgmVolume: 0.5,        // 音量 0-1
    showBgmPanel: false,   // 是否展开BGM选择面板
    // 内部
    _timer: null,
    _breathTimer: null,
    _breathPhase: 0
  },

  onLoad() {
    // 准备场景数据
    const scenes = mock.MEDITATION_SCENES.map(s => Object.assign({}, s, {
      durationText: util.formatDuration(s.duration)
    }));
    // 过滤掉 src 仍是占位 URL 的 BGM（"无"始终保留）
    // 占位判断：包含 "your-cdn.example.com" 表示还没替换成真实地址
    const isPlaceholder = (url) => !url || url.indexOf('your-cdn.example.com') !== -1;
    const bgmTypes = mock.BGM_TYPES.map(b => {
      if (b.id === 'none') return b;
      if (Array.isArray(b.src)) {
        const real = b.src.filter(u => !isPlaceholder(u));
        if (real.length === 0) return null;
        return Object.assign({}, b, { src: real });
      }
      if (isPlaceholder(b.src)) return null;
      return b;
    }).filter(Boolean);
    this.setData({
      scenes,
      todayRecommend: scenes[0],   // 失眠时（MVP可用）
      bgmTypes
    });
  },

  onShow() {
    if (this.data.mode === 'list') {
      this.loadLogs();
    }
  },

  onHide() {
    // 离开页面时暂停
    if (this.data.mode === 'play' && this.data.isPlaying) {
      this.togglePlay();
    }
  },

  onUnload() {
    this.clearTimers();
    audio.destroy();
    wx.setKeepScreenOn(false);
  },

  loadLogs() {
    const logs = storage.getMeditationLogs().slice(-5).reverse().map(l => {
      const scene = mock.MEDITATION_SCENES.find(s => s.id === l.scene_type) || {};
      return {
        id: l.id,
        icon: scene.icon || '🌙',
        sceneTitle: scene.title || '冥想',
        timeText: util.relativeTime(l.created_at),
        durationText: util.formatDuration(l.duration),
        completionRate: l.completion_rate
      };
    });
    this.setData({ logs });
  },

  // 进入场景
  enterScene(e) {
    const id = e.currentTarget.dataset.id;
    const scene = this.data.scenes.find(s => s.id === id);
    if (!scene) return;
    if (!scene.available) {
      util.toast('"' + scene.title + '"场景即将上线，敬请期待');
      return;
    }
    // 根据场景推荐BGM
    const recommendBgm = mock.SCENE_BGM_RECOMMEND[scene.id] || 'none';
    this.setData({
      mode: 'play',
      currentScene: scene,
      total: scene.duration,
      totalText: this.formatTime(scene.duration),
      elapsed: 0,
      elapsedText: '00:00',
      progressPercent: 0,
      isPlaying: false,
      breathing: false,
      breathText: '准备',
      breathDesc: '找一个舒服的姿势，轻轻闭上眼',
      currentBgm: recommendBgm,
      showBgmPanel: false
    });
    wx.setKeepScreenOn(true);
    // 自动开始
    setTimeout(() => this.togglePlay(), 800);
  },

  // 播放/暂停
  togglePlay() {
    if (this.data.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },

  play() {
    if (this.data.elapsed >= this.data.total) {
      // 已播放完，重新开始
      this.setData({ elapsed: 0, elapsedText: '00:00', progressPercent: 0 });
    }
    this.setData({ isPlaying: true });
    this.startBreathCycle();
    // 启动背景音乐
    this.startBgm();
    // 计时器
    const timer = setInterval(() => {
      let elapsed = this.data.elapsed + 1;
      let isComplete = false;
      if (elapsed >= this.data.total) {
        elapsed = this.data.total;
        isComplete = true;
      }
      this.setData({
        elapsed,
        elapsedText: this.formatTime(elapsed),
        progressPercent: (elapsed / this.data.total) * 100
      });
      if (isComplete) {
        this.pause();
        this.onPlayComplete();
      }
    }, 1000);
    this.setData({ _timer: timer });
  },

  pause() {
    this.setData({ isPlaying: false, breathing: false });
    if (this.data._timer) {
      clearInterval(this.data._timer);
      this.setData({ _timer: null });
    }
    if (this.data._breathTimer) {
      clearTimeout(this.data._breathTimer);
      this.setData({ _breathTimer: null });
    }
    // 暂停背景音乐
    audio.stop();
  },

  // 呼吸引导循环（按场景自定义节奏：吸气-屏住-呼气）
  startBreathCycle() {
    const scene = this.data.currentScene;
    const pattern = (scene && scene.breathPattern) || [4, 4, 6];
    const phaseTexts = (scene && scene.breathPhases) || [
      { text: '吸气', desc: '慢慢吸进空气' },
      { text: '屏住', desc: '保持' },
      { text: '呼气', desc: '缓缓吐出' }
    ];
    const phases = [
      { text: phaseTexts[0].text, desc: phaseTexts[0].desc, duration: pattern[0] * 1000, breathing: true },
      { text: phaseTexts[1].text, desc: phaseTexts[1].desc, duration: pattern[1] * 1000, breathing: true },
      { text: phaseTexts[2].text, desc: phaseTexts[2].desc, duration: pattern[2] * 1000, breathing: false }
    ];
    let phase = 0;
    const run = () => {
      if (!this.data.isPlaying) return;
      const p = phases[phase];
      this.setData({
        breathText: p.text,
        breathDesc: p.desc,
        breathing: p.breathing
      });
      const t = setTimeout(() => {
        phase = (phase + 1) % phases.length;
        run();
      }, p.duration);
      this.setData({ _breathTimer: t });
    };
    run();
  },

  // 快进/快退15秒
  seekBack() {
    let elapsed = Math.max(0, this.data.elapsed - 15);
    this.setData({
      elapsed,
      elapsedText: this.formatTime(elapsed),
      progressPercent: (elapsed / this.data.total) * 100
    });
  },

  seekForward() {
    let elapsed = Math.min(this.data.total, this.data.elapsed + 15);
    this.setData({
      elapsed,
      elapsedText: this.formatTime(elapsed),
      progressPercent: (elapsed / this.data.total) * 100
    });
    if (elapsed >= this.data.total && this.data.isPlaying) {
      this.pause();
      this.onPlayComplete();
    }
  },

  // ============ 背景音乐控制 ============

  // 音频加载/播放失败的统一提示
  onBgmError() {
    util.toast('音频加载失败，请检查网络');
  },

  // 启动BGM（如果选了非none）
  startBgm() {
    const type = this.data.currentBgm;
    if (type && type !== 'none') {
      const bgm = this.data.bgmTypes.find(b => b.id === type);
      if (!bgm || !bgm.src) return;
      audio.play(type, this.data.bgmVolume, bgm.src, this.onBgmError);
    }
  },

  // 切换BGM选择面板
  toggleBgmPanel() {
    this.setData({ showBgmPanel: !this.data.showBgmPanel });
  },

  // 选择BGM
  selectBgm(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentBgm: id });
    // 如果正在播放，立即切换
    if (this.data.isPlaying) {
      if (id === 'none') {
        audio.stop();
      } else {
        const bgm = this.data.bgmTypes.find(b => b.id === id);
        if (bgm && bgm.src) {
          audio.play(id, this.data.bgmVolume, bgm.src, this.onBgmError);
        } else {
          util.toast('该音频未就绪');
        }
      }
    }
  },

  // 音量变化
  onVolumeChange(e) {
    const v = e.detail.value;
    this.setData({ bgmVolume: v });
    audio.setVolume(v);
  },

  // 播放完成
  onPlayComplete() {
    // 记录冥想日志
    storage.addMeditationLog({
      scene_type: this.data.currentScene.id,
      duration: this.data.total,
      completion_rate: 1,
      started_at: Date.now() - this.data.total * 1000
    });
    this.setData({
      showCompleteModal: true,
      breathText: '完成',
      breathDesc: '慢慢睁开眼，感受一下周围',
      breathing: false
    });
  },

  // 退出播放
  exitPlay() {
    wx.showModal({
      title: '结束本次冥想？',
      content: '当前进度不会保留，下次需重新开始。',
      confirmText: '结束',
      cancelText: '继续',
      success: (res) => {
        if (res.confirm) {
          this.pause();
          // 如果有进度，部分记录
          if (this.data.elapsed >= 30) {
            storage.addMeditationLog({
              scene_type: this.data.currentScene.id,
              duration: this.data.elapsed,
              completion_rate: this.data.elapsed / this.data.total,
              started_at: Date.now() - this.data.elapsed * 1000
            });
          }
          wx.setKeepScreenOn(false);
          this.setData({ mode: 'list', currentScene: null });
          this.loadLogs();
        }
      }
    });
  },

  // 完成弹窗操作
  skipRecord() {
    this.setData({ showCompleteModal: false });
    wx.setKeepScreenOn(false);
    this.setData({ mode: 'list' });
    this.loadLogs();
  },

  goEmotionRecord() {
    this.setData({ showCompleteModal: false });
    wx.setKeepScreenOn(false);
    this.setData({ mode: 'list' });
    this.loadLogs();
    wx.navigateTo({ url: '/pages/emotion/emotion' });
  },

  noop() {},

  // 工具
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  clearTimers() {
    if (this.data._timer) clearInterval(this.data._timer);
    if (this.data._breathTimer) clearTimeout(this.data._breathTimer);
  },

  onShareAppMessage() {
    return {
      title: '缓一缓 · 微冥想 — 给自己几分钟',
      path: '/pages/meditation/meditation'
    };
  }
});
