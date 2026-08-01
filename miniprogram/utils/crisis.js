// utils/crisis.js — 危机关键词过滤（PRD要求：自伤/自杀关键词后端硬过滤）

// 高危关键词库（基于PRD要求扩展）
// 命中即触发危机干预流程，展示热线 400-161-9995
const CRISIS_KEYWORDS = [
  // 自杀类
  '自杀', '想死', '不想活', '寻死', '了结自己', '结束生命', '结束这一切',
  '活不下去', '想离开这个世界', '消失算了', '永远睡过去',
  // 自伤类
  '自残', '自伤', '割腕', '割自己', '伤害自己', '划伤自己',
  // 具体计划
  '跳楼', '跳河', '烧炭', '安眠药', '吃多少药', '上吊', '吞药',
  // 绝望表达
  '没有意义', '都是我的错', '世界没有我会更好', '无人理解', '彻底绝望',
  '解脱', '一了百了'
];

const crisis = {
  // 检测文本是否命中危机关键词
  detect(text) {
    if (!text || typeof text !== 'string') return { hit: false, keywords: [] };
    const hit = [];
    const lower = text.toLowerCase();
    for (const kw of CRISIS_KEYWORDS) {
      if (lower.indexOf(kw.toLowerCase()) >= 0) hit.push(kw);
    }
    return { hit: hit.length > 0, keywords: hit };
  },

  // 获取危机干预热线
  getHotline() {
    return '400-161-9995';
  },

  // 危机干预标准回复
  getCrisisResponse() {
    return '我注意到你刚才提到了一些让我担心的话。你现在的感受一定非常沉重，但请相信，你不是一个人，也请不要伤害自己。\n\n' +
      '【全国心理援助热线】400-161-9995（24小时）\n' +
      '【北京心理危机研究与干预中心】010-82951332\n' +
      '【生命热线】400-821-1215\n\n' +
      '请立即拨打以上任意一个电话，会有专业的人陪你一起面对。如果你正处于紧急危险中，请直接拨打 110 或 120。\n\n' +
      '我在这里陪着你。请先深呼吸三次，好吗？';
  }
};

module.exports = crisis;
module.exports.CRISIS_KEYWORDS = CRISIS_KEYWORDS;
