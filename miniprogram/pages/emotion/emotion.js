// pages/emotion/emotion.js
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');
const mock = require('../../utils/mock.js');

const PAGE_SIZE = 10;

Page({
  data: {
    // 列表
    records: [],
    todayRecord: null,
    weekData: [],
    trendSummary: { avg: '-', max: '-', min: '-', count: 0 },
    insightText: '',
    historyList: [],
    hasMoreHistory: false,
    page: 1,
    // 月度热力图
    heatmapYear: 0,
    heatmapMonth: 0,
    heatmapTitle: '',
    heatmapDays: [],
    monthRecordCount: 0,
    // 30天趋势
    trend30: { avg: '-', count: 0, deltaText: '-', deltaColor: '#7a7485', points: [], bars: [], xStart: '', xMid: '', xEnd: '' },
    // 表单
    showForm: false,
    formTitle: '记录此刻的心情',
    editingId: null,
    score: 5,
    scoreColor: '#e8a838',
    scoreLabel: '一般',
    emotionTags: [],
    selectedTags: {},
    triggerSources: [],
    selectedTrigger: '',
    note: '',
    // 授权
    showAuthModal: false
  },

  onLoad() {
    this.setData({
      emotionTags: mock.EMOTION_TAGS,
      triggerSources: mock.TRIGGER_SOURCES
    });
  },

  // 返回上一页
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
    }
  },

  onShow() {
    // 默认显示当前月
    const now = new Date();
    if (!this.data.heatmapYear) {
      this.setData({
        heatmapYear: now.getFullYear(),
        heatmapMonth: now.getMonth() + 1
      });
    }
    this.loadAll();
  },

  loadAll() {
    const records = storage.getEmotionRecords();
    const today = util.formatDate();
    const todayRecord = records.find(r => r.record_date === today);

    const heatmapData = this.buildHeatmap(records, this.data.heatmapYear, this.data.heatmapMonth);
    const trend30 = this.buildTrend30(records);

    this.setData({
      records,
      todayRecord: todayRecord ? this.formatTodayRecord(todayRecord) : null,
      weekData: this.buildWeekData(records),
      trendSummary: this.calcTrend(records),
      insightText: records.length >= 7 ? this.buildInsight(records) : '',
      historyList: this.buildHistoryList(records.slice().reverse().slice(0, PAGE_SIZE)),
      hasMoreHistory: records.length > PAGE_SIZE,
      page: 1,
      heatmapDays: heatmapData.days,
      heatmapTitle: heatmapData.title,
      monthRecordCount: heatmapData.recordCount,
      trend30
    });
  },

  formatTodayRecord(r) {
    const tags = (r.tags || []).map(id => mock.EMOTION_TAGS.find(t => t.id === id)).filter(Boolean);
    return {
      score: r.score,
      emoji: util.scoreLabel(r.score) === '很好' ? '🌸' : util.scoreLabel(r.score) === '还不错' ? '🌿' : util.scoreLabel(r.score) === '一般' ? '🍃' : '🌧',
      scoreLabel: util.scoreLabel(r.score),
      tagsText: tags.map(t => t.label).join(' · ')
    };
  },

  buildWeekData(records) {
    const days = util.lastNDays(7);
    return days.map(date => {
      const r = records.find(x => x.record_date === date);
      const d = new Date(date);
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      const dateShort = (d.getMonth() + 1) + '/' + d.getDate();
      return {
        date,
        short: weekDay,
        dateShort,
        score: r ? r.score : 0,
        color: r ? util.scoreColor(r.score) : '#e8e4f0',
        barHeight: r ? Math.max(5, r.score * 9) : 0
      };
    });
  },

  calcTrend(records) {
    const recent7 = util.lastNDays(7);
    const weekRecords = records.filter(r => recent7.indexOf(r.record_date) >= 0);
    if (weekRecords.length === 0) {
      return { avg: '-', max: '-', min: '-', count: 0 };
    }
    const scores = weekRecords.map(r => r.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      avg: (sum / scores.length).toFixed(1),
      max: Math.max(...scores),
      min: Math.min(...scores),
      count: weekRecords.length
    };
  },

  buildInsight(records) {
    const recent = records.slice(-7);
    const avg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
    // 找最常出现的情绪标签
    const tagCount = {};
    recent.forEach(r => {
      (r.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
    });
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
    const tagInfo = topTag ? mock.EMOTION_TAGS.find(t => t.id === topTag[0]) : null;

    // 按时段统计
    const morning = recent.filter(r => r.created_at && new Date(r.created_at).getHours() < 12).length;
    const evening = recent.length - morning;

    let text = `最近${recent.length}天，你的平均情绪分数是${avg.toFixed(1)}分。`;
    if (tagInfo) {
      text += `"${tagInfo.label}"是你最常记录的感受，出现了${topTag[1]}次。`;
    }
    if (avg < 4) {
      text += '这段时间你承受得不少，可以考虑寻求专业支持，或与信任的人聊一聊。';
    } else if (avg < 6) {
      text += '情绪有些起伏，记得给自己多一些耐心。';
    } else if (avg < 8) {
      text += '整体状态比较平稳，继续保持对自己的照顾。';
    } else {
      text += '你照顾自己得很好，这种状态值得被珍惜。';
    }
    if (morning > evening * 2) {
      text += ' 早晨是你情绪相对低落的时段，可以尝试在早晨做一次3分钟呼吸练习。';
    } else if (evening > morning * 2) {
      text += ' 晚间情绪记录较多，注意睡前给自己一段放松时间。';
    }
    return text;
  },

  buildHistoryList(records) {
    return records.map(r => {
      const tags = (r.tags || []).map(id => mock.EMOTION_TAGS.find(t => t.id === id)).filter(Boolean);
      const d = new Date(r.record_date + 'T00:00:00');
      return {
        id: r.id,
        dateText: util.formatDate(d).replace(/-/g, '/') + ' ' + ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()],
        score: r.score,
        scoreColor: util.scoreColor(r.score),
        tags,
        trigger_source: r.trigger_source || '',
        note: r.note || ''
      };
    });
  },

  loadMore() {
    const page = this.data.page + 1;
    const allRecords = storage.getEmotionRecords().slice().reverse();
    const list = this.buildHistoryList(allRecords.slice(0, page * PAGE_SIZE));
    this.setData({
      historyList: list,
      page,
      hasMoreHistory: allRecords.length > page * PAGE_SIZE
    });
  },

  // 开始记录
  startRecord() {
    // 检查授权
    if (!storage.isEmotionAuthorized()) {
      this.setData({ showAuthModal: true });
      return;
    }
    this.openForm();
  },

  // 修改今日
  editToday() {
    const today = util.formatDate();
    const r = storage.getEmotionRecords().find(x => x.record_date === today);
    if (!r) return;
    const selectedTags = {};
    (r.tags || []).forEach(id => { selectedTags[id] = true; });
    this.setData({
      showForm: true,
      formTitle: '修改今日心情',
      editingId: r.id,
      score: r.score,
      scoreColor: util.scoreColor(r.score),
      scoreLabel: util.scoreLabel(r.score),
      selectedTags,
      selectedTrigger: r.trigger_source || '',
      note: r.note || ''
    });
  },

  openForm() {
    this.setData({
      showForm: true,
      formTitle: '记录此刻的心情',
      editingId: null,
      score: 5,
      scoreColor: util.scoreColor(5),
      scoreLabel: util.scoreLabel(5),
      selectedTags: {},
      selectedTrigger: '',
      note: ''
    });
  },

  // 授权
  agreeAuth() {
    storage.setEmotionAuthorized(true);
    this.setData({ showAuthModal: false });
    this.openForm();
  },
  rejectAuth() {
    this.setData({ showAuthModal: false });
    util.toast('已取消授权，情绪记录功能暂不可用');
  },

  // 分数滑块
  onScoreChanging(e) {
    const score = e.detail.value;
    this.setData({
      score,
      scoreColor: util.scoreColor(score),
      scoreLabel: util.scoreLabel(score)
    });
  },
  onScoreChange(e) {
    const score = e.detail.value;
    this.setData({
      score,
      scoreColor: util.scoreColor(score),
      scoreLabel: util.scoreLabel(score)
    });
  },

  // 情绪标签
  toggleTag(e) {
    const id = e.currentTarget.dataset.id;
    const selectedTags = Object.assign({}, this.data.selectedTags);
    selectedTags[id] = !selectedTags[id];
    this.setData({ selectedTags });
  },

  // 触发来源
  selectTrigger(e) {
    const trigger = e.currentTarget.dataset.trigger;
    this.setData({
      selectedTrigger: this.data.selectedTrigger === trigger ? '' : trigger
    });
  },

  // 备注
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 取消
  cancelForm() {
    this.setData({ showForm: false });
  },

  // 保存
  saveRecord() {
    const score = this.data.score;
    const tags = Object.keys(this.data.selectedTags).filter(k => this.data.selectedTags[k]);
    const note = (this.data.note || '').trim();
    const trigger = this.data.selectedTrigger;
    const today = util.formatDate();

    if (this.data.editingId) {
      // 修改
      const records = storage.getEmotionRecords();
      const idx = records.findIndex(r => r.id === this.data.editingId);
      if (idx >= 0) {
        records[idx] = Object.assign({}, records[idx], {
          score, tags, note, trigger_source: trigger, updated_at: Date.now()
        });
        storage.set(storage.KEYS.EMOTION_RECORDS, records);
      }
      util.toast('已更新', 'success');
    } else {
      // 新增（同一天只允许一条，覆盖旧的）
      const records = storage.getEmotionRecords();
      const existIdx = records.findIndex(r => r.record_date === today);
      const newRecord = {
        id: util.genId('er_'),
        score,
        tags,
        note,
        trigger_source: trigger,
        record_date: today,
        created_at: Date.now()
      };
      if (existIdx >= 0) {
        records[existIdx] = newRecord;
      } else {
        records.push(newRecord);
      }
      storage.set(storage.KEYS.EMOTION_RECORDS, records);
      util.toast('已记录', 'success');
    }

    this.setData({ showForm: false });
    this.loadAll();
  },

  noop() {},

  // ===== 月度热力图 =====
  buildHeatmap(records, year, month) {
    const days = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();  // 0=周日

    // 把记录按日期建索引
    const recordMap = {};
    records.forEach(r => {
      if (r.record_date) recordMap[r.record_date] = r;
    });

    const today = util.formatDate();

    // 前置空格
    for (let i = 0; i < startWeekday; i++) {
      days.push({ key: 'e' + i, empty: true });
    }

    let recordCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const r = recordMap[dateStr];
      const isToday = dateStr === today;
      if (r) recordCount++;
      days.push({
        key: 'd' + d,
        empty: false,
        day: d,
        date: dateStr,
        score: r ? r.score : 0,
        color: r ? util.scoreColor(r.score) : '',
        today: isToday
      });
    }

    return {
      days,
      title: year + '年' + month + '月',
      recordCount
    };
  },

  prevMonth() {
    let y = this.data.heatmapYear;
    let m = this.data.heatmapMonth - 1;
    if (m < 1) { m = 12; y--; }
    this.setData({ heatmapYear: y, heatmapMonth: m });
    this.loadAll();
  },

  nextMonth() {
    let y = this.data.heatmapYear;
    let m = this.data.heatmapMonth + 1;
    if (m > 12) { m = 1; y++; }
    this.setData({ heatmapYear: y, heatmapMonth: m });
    this.loadAll();
  },

  tapHeatCell(e) {
    const score = e.currentTarget.dataset.score;
    const date = e.currentTarget.dataset.date;
    if (!score) {
      util.toast('该日无记录');
      return;
    }
    const r = storage.getEmotionRecords().find(x => x.record_date === date);
    if (!r) return;
    const tags = (r.tags || []).map(id => {
      const t = mock.EMOTION_TAGS.find(x => x.id === id);
      return t ? t.label : '';
    }).filter(Boolean).join('、');
    wx.showModal({
      title: date,
      content: '分数：' + r.score + '/10' + (tags ? '\n感受：' + tags : '') + (r.trigger_source ? '\n触发：' + r.trigger_source : '') + (r.note ? '\n备注：' + r.note : ''),
      showCancel: false,
      confirmText: '关闭'
    });
  },

  // ===== 30天趋势 =====
  buildTrend30(records) {
    const days30 = util.lastNDays(30);
    const recordMap = {};
    records.forEach(r => { if (r.record_date) recordMap[r.record_date] = r; });

    const points = [];
    const bars = [];
    const validScores = [];
    const dateObjs = days30.map(s => new Date(s + 'T00:00:00'));

    days30.forEach((date, idx) => {
      const r = recordMap[date];
      if (r) {
        validScores.push(r.score);
        const left = (idx / 29) * 100;
        const bottom = (r.score / 10) * 100;
        const height = Math.max(8, r.score * 28);
        points.push({
          idx: 'p' + idx,
          left,
          bottom,
          color: util.scoreColor(r.score)
        });
        bars.push({
          idx: 'b' + idx,
          left,
          height,
          color: util.scoreColor(r.score)
        });
      }
    });

    const avg = validScores.length
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : '-';
    const count = validScores.length;

    // 变化趋势：前15天 vs 后15天
    let deltaText = '-';
    let deltaColor = '#7a7485';
    if (validScores.length >= 4) {
      const half1 = days30.slice(0, 15).map(d => recordMap[d]).filter(Boolean).map(r => r.score);
      const half2 = days30.slice(15).map(d => recordMap[d]).filter(Boolean).map(r => r.score);
      if (half1.length && half2.length) {
        const avg1 = half1.reduce((a, b) => a + b, 0) / half1.length;
        const avg2 = half2.reduce((a, b) => a + b, 0) / half2.length;
        const delta = avg2 - avg1;
        if (Math.abs(delta) < 0.3) {
          deltaText = '平稳';
          deltaColor = '#7a7485';
        } else if (delta > 0) {
          deltaText = '↑' + delta.toFixed(1);
          deltaColor = '#4caf7d';
        } else {
          deltaText = '↓' + Math.abs(delta).toFixed(1);
          deltaColor = '#e85a5a';
        }
      }
    }

    const fmt = (d) => (d.getMonth() + 1) + '/' + d.getDate();
    return {
      avg,
      count,
      deltaText,
      deltaColor,
      points,
      bars,
      xStart: fmt(dateObjs[0]),
      xMid: fmt(dateObjs[14]),
      xEnd: fmt(dateObjs[29])
    };
  }
});
