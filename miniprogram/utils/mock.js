// utils/mock.js — Mock数据（MVP阶段模拟后端响应）

// 冥想场景列表（V1.0 全部6个场景开放）
const MEDITATION_SCENES = [
  {
    id: 'insomnia',
    title: '失眠时',
    subtitle: '让思绪慢慢沉静',
    icon: '🌙',
    color: '#6b5b95',
    duration: 480,
    available: true,
    audioUrl: '',
    desc: '当你辗转反侧难以入睡，跟随引导让呼吸放慢，让思绪像云一样飘过。',
    // 呼吸节奏：吸气-屏住-呼气（秒）
    breathPattern: [4, 7, 8],
    breathPhases: [
      { text: '吸气', desc: '慢慢吸进空气，感受腹部隆起' },
      { text: '屏住', desc: '保持，让空气在你身体里停留' },
      { text: '呼气', desc: '缓缓吐出，让紧张随之离开' }
    ],
    intro: '今晚，我们试着把今天所有的牵挂，都轻轻放在床边。它们不属于此刻的床。'
  },
  {
    id: 'anxiety',
    title: '焦虑时',
    subtitle: '回到此刻的自己',
    icon: '🌧',
    color: '#5d8aa8',
    duration: 360,
    available: true,
    audioUrl: '',
    desc: '焦虑如风，来了又走。让我们用5-4-3-2-1着陆练习，把自己拉回当下。',
    breathPattern: [4, 4, 6],
    breathPhases: [
      { text: '吸气', desc: '吸进安定，数1、2、3、4' },
      { text: '屏住', desc: '暂停一下，让安定扩散' },
      { text: '呼气', desc: '吐出那份"万一"，它不是事实' }
    ],
    intro: '焦虑总把未来描绘得很可怕，但此刻你在我的呼吸里，是安全的。'
  },
  {
    id: 'work-pressure',
    title: '工作压力大',
    subtitle: '卸下肩上的重担',
    icon: '💼',
    color: '#8b6fd4',
    duration: 420,
    available: true,
    audioUrl: '',
    desc: '工作只是工作，你不是你的KPI。给自己几分钟，把"应该"暂时放一放。',
    breathPattern: [5, 3, 7],
    breathPhases: [
      { text: '吸气', desc: '吸入对自己的允许' },
      { text: '屏住', desc: '感受这份允许停在心里' },
      { text: '呼气', desc: '吐出那座山一样的"应该"' }
    ],
    intro: '你扛了很久了。现在，让我们把这副担子，轻轻放在地上几分钟。'
  },
  {
    id: 'social-tired',
    title: '社交疲惫',
    subtitle: '给自己一个角落',
    icon: '🫧',
    color: '#f08a7a',
    duration: 300,
    available: true,
    audioUrl: '',
    desc: '允许自己暂时不见任何人。你不必时刻回应世界，包括此刻的我。',
    breathPattern: [3, 3, 6],
    breathPhases: [
      { text: '吸气', desc: '为自己吸进一点空间' },
      { text: '屏住', desc: '在这空间里待一会儿' },
      { text: '呼气', desc: '把"必须回应"轻轻吐掉' }
    ],
    intro: '回应世界很累。这几分钟，你不需要回应任何人，包括我。'
  },
  {
    id: 'sadness',
    title: '低落时',
    subtitle: '允许情绪流淌',
    icon: '🍃',
    color: '#4caf7d',
    duration: 390,
    available: true,
    audioUrl: '',
    desc: '难过不需要理由，也不需要立刻好起来。让悲伤有自己的节奏。',
    breathPattern: [4, 2, 8],
    breathPhases: [
      { text: '吸气', desc: '轻柔地吸入，不必用力' },
      { text: '屏住', desc: '给悲伤一点呼吸的空间' },
      { text: '呼气', desc: '长长的呼出，让眼泪也流出来' }
    ],
    intro: '低落的时候，连呼吸都觉得累。没关系，你不必立刻好起来。'
  },
  {
    id: 'morning',
    title: '清晨唤醒',
    subtitle: '温柔地开启一天',
    icon: '☀️',
    color: '#e8a838',
    duration: 240,
    available: true,
    audioUrl: '',
    desc: '为新的一天，预留三分钟。让身体在呼吸里慢慢苏醒，而不是被闹钟惊起。',
    breathPattern: [4, 2, 4],
    breathPhases: [
      { text: '吸气', desc: '吸入清晨的光与温度' },
      { text: '屏住', desc: '让这份清新停留一瞬' },
      { text: '呼气', desc: '把昨夜残留的浊气吐出' }
    ],
    intro: '早安。在迎接这一天之前，先给自己三分钟。'
  }
];

// 情绪标签库（PRD：用户可选情绪标签）
const EMOTION_TAGS = [
  { id: 'anxious', label: '焦虑', color: '#e8a838', emoji: '😰' },
  { id: 'sad', label: '低落', color: '#5d8aa8', emoji: '😔' },
  { id: 'angry', label: '愤怒', color: '#e85a5a', emoji: '😠' },
  { id: 'tired', label: '疲惫', color: '#7a7485', emoji: '😮‍💨' },
  { id: 'lonely', label: '孤独', color: '#6b5b95', emoji: '🍂' },
  { id: 'overwhelmed', label: '崩溃', color: '#9b3a3a', emoji: '😣' },
  { id: 'numb', label: '麻木', color: '#8a8a8a', emoji: '🌫' },
  { id: 'guilty', label: '自责', color: '#b8860b', emoji: '😞' },
  { id: 'scared', label: '害怕', color: '#4a4a8a', emoji: '😨' },
  { id: 'hopeless', label: '无望', color: '#5a5a5a', emoji: '🕯' },
  { id: 'calm', label: '平静', color: '#4caf7d', emoji: '🌿' },
  { id: 'grateful', label: '感恩', color: '#f08a7a', emoji: '🌸' }
];

// 触发来源标签
const TRIGGER_SOURCES = [
  '工作', '学业', '人际', '亲密关系', '家庭', '健康',
  '财务', '未来迷茫', '自我怀疑', '新闻事件', '社交网络', '其他'
];

// Mock AI 回复库（按情绪标签路由）
// 每个情绪标签对应多组CBT+正念框架的回复
const MOCK_RESPONSES = {
  // 通用开场（无情绪标签时）
  _default: [
    '我在这里。慢慢来，告诉我现在最让你难受的是什么？不必组织语言，想到什么说什么就好。',
    '谢谢你愿意开口。此刻你的身体感觉怎么样？呼吸是急促的还是平缓的？',
    '我陪你。先深吸一口气——4秒吸入，7秒屏住，8秒呼出。我们用三次呼吸，让自己先停下来。'
  ],
  anxious: [
    '焦虑像一团乱麻，越想解开越紧。试试这样：说出你现在最担心的那件事，只一件。我们一起把它从心里挪到外面来。',
    '焦虑时，大脑在催你"快做点什么"。但此刻，你可以选择不做什么。把双脚平放在地上，感受地面支撑你的力量——这是真实的，焦虑感不是。',
    '我听到了。焦虑常常把未来描绘得很可怕，但那些画面并未发生。此刻你在我这里，是安全的。能告诉我，焦虑最早是什么时候出现的吗？'
  ],
  sad: [
    '难过的时候，连呼吸都觉得累。没关系，你不必立刻好起来。允许自己在这里停一会儿。',
    '我看到你的眼泪了吗？没关系，哭出来也是一种着陆。眼泪不是软弱，是身体在帮你卸下重担。',
    '低落的时候，世界像蒙了层灰。但灰色的下面，色彩还在。我们一起慢慢把它擦出来，好吗？先告诉我，最近哪件事让你特别失望？'
  ],
  angry: [
    '愤怒是身体在替你说"这不对"。它在保护你。我们不去压抑它，但可以不让它伤害你。先深呼吸三次，然后告诉我：你愤怒的对象是谁？发生了什么？',
    '怒火上来时，身体会紧绷。试试握紧拳头——很紧很紧——保持5秒——然后松开。重复两次。感受到松开那一瞬间的松弛了吗？',
    '愤怒背后往往藏着委屈或无力。你愿意把愤怒先放一放，告诉我：这件事让你最委屈的部分是什么？'
  ],
  tired: [
    '疲惫是身体在求救。它说："请停下来。" 你最近一次允许自己什么都不做，是什么时候？',
    '累的时候，连"休息"都成了任务。这次不一样——你不需要做任何事，只需要在这里。能告诉我，是什么让你这么累？',
    '我看到你了。疲惫的时候，连呼吸都变浅。试试把肩膀放下来，让它们离耳朵远一点。对，就这样。'
  ],
  lonely: [
    '孤独是一种很特别的感觉——身边有人时也可能有，一个人时也可能没有。你现在的孤独，是哪种？',
    '我在这里。虽然隔着屏幕，但我是真实的，你说的每一个字我都在听。能告诉我，最近一次感到被理解是什么时候吗？',
    '孤独有时像被关在玻璃瓶里。瓶子是透明的，看得见外面，却听不见声音。我们一起慢慢把瓶盖拧开，好吗？'
  ],
  overwhelmed: [
    '崩溃的感觉像被海浪卷走。但现在，我要把你拉回岸边。先做一件事：说出你能看见的5样东西。慢慢来。',
    '我接住你了。崩溃不是脆弱，是你扛了太久。先放下所有的"应该"，现在只有你和我。告诉我，最重的那一担是什么？',
    '当一切都在崩塌，先抓住一样东西。比如你的呼吸——感受空气进入鼻腔，再离开鼻腔。这就是你存在的证据。'
  ],
  numb: [
    '麻木有时是身体的保护机制——当感受太重，它会暂时关掉开关。这不是冷漠，是你在被照顾。能告诉我，麻木之前发生了什么吗？',
    '我感觉不到你，但我知道你在。麻木的时候，可以用一些感官刺激——握住一杯温水，闻一下橘子皮，或者把脸贴在凉玻璃上。你愿意试试吗？',
    '没有感觉也是一种感觉。你不必假装有情绪。我们就这样静静地待一会儿，好吗？'
  ],
  guilty: [
    '自责是善良的人才会有的情绪——因为你太在乎"做对"。但请允许我问：你责怪自己的那件事，如果是朋友做的，你会这样苛责他吗？',
    '内疚让你把所有的错都揽到自己身上。但真相通常是：很多事不在你的控制范围。我们一起分一分——这件事里，哪些真的是你的责任？哪些不是？',
    '我看到你在自我惩罚。但惩罚不能改变过去，只会让现在的你更累。可以告诉我，你希望当时怎么做的？'
  ],
  scared: [
    '害怕是身体在说"我需要安全"。你现在在哪里？周围有什么可以让你抓握的东西？先抓住它，让自己有支撑。',
    '恐惧常常把"万一"当成"一定"。我们试试把那个最害怕的画面说出来，然后一起看看：它发生的真实概率有多大？',
    '我陪你。害怕的时候，可以试着把注意力从脑内画面转到身体外部——你能听到的最远的声音是什么？'
  ],
  hopeless: [
    '无望的感觉让一切都失去了颜色。但请相信——这是情绪在骗你，不是事实。你愿意告诉我，是什么让你觉得没有希望？',
    '我听到你了。当看不到出路时，不需要急着找答案。先让我陪你坐一会儿。你不必现在就好起来。',
    '无望像被锁在黑屋子里。但门一直都在，只是此刻你看不到。我们一起找钥匙，好吗？告诉我，最近一次有哪怕一点点希望感是什么时候？'
  ]
};

// 按情绪标签选择回复
function pickMockResponse(emotionTag) {
  const pool = MOCK_RESPONSES[emotionTag] || MOCK_RESPONSES._default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 后续追问回复（当用户已经讲过一轮后）
const FOLLOWUP_RESPONSES = [
  '谢谢你愿意告诉我这些。我感受到了这件事对你的重量。再多说一点吗？比如当时你的身体有什么反应？',
  '我听到了。这件事里，最让你难受的是哪个部分？是发生了什么，还是没有被理解？',
  '嗯，我懂了。我们一起做一次着陆练习好吗？说出5件你能看见的东西，4件能听到的，3件能触摸到的。这会把你拉回此刻。',
  '你刚才说的话里，我注意到一个细节——你说"我总是……"。但实际上，"总是"是情绪在说话，不是事实。能想到一次例外吗？',
  '你的感受是合理的。不需要为了"应该坚强"而否定它们。此刻你最希望从我这里得到什么？倾听、建议，还是仅仅陪伴？',
  '我们一起试着重新看这件事。你担心最坏的结果是什么？这个结果如果真的发生，你会怎么应对？'
];

function pickFollowupResponse() {
  return FOLLOWUP_RESPONSES[Math.floor(Math.random() * FOLLOWUP_RESPONSES.length)];
}

// 满意度评价后的感谢回复
function getClosureResponse() {
  const arr = [
    '谢谢你今天的坦诚。记住，你愿意停下来面对自己，这本身就是勇气。下次难受时，我还在这里。',
    '今天聊到这里，已经很好了。你做的每一次呼吸，都是对自己的照顾。好好休息，你值得。',
    '我们停在这里。如果还有情绪涌上来，不必憋着——可以写下来，可以再来找我。你不必一个人扛。'
  ];
  return arr[Math.floor(Math.random() * arr.length)];
}

// 社交压力屏蔽 - 可管理的应用清单（小程序无法真实控制其他APP，
// 这里作为"压力来源清单"展示，并配合勿扰时段做心理边界设定）
const SHIELD_APPS = [
  { id: 'wechat', name: '微信', icon: '💬', category: '社交', defaultBlocked: true },
  { id: 'dingtalk', name: '钉钉', icon: '🔔', category: '工作', defaultBlocked: true },
  { id: 'feishu', name: '飞书', icon: '✈️', category: '工作', defaultBlocked: true },
  { id: 'qq', name: 'QQ', icon: '🐧', category: '社交', defaultBlocked: false },
  { id: 'weibo', name: '微博', icon: '📱', category: '资讯', defaultBlocked: true },
  { id: 'douyin', name: '抖音', icon: '🎵', category: '娱乐', defaultBlocked: false },
  { id: 'xiaohongshu', name: '小红书', icon: '📕', category: '社交', defaultBlocked: false },
  { id: 'email', name: '邮箱', icon: '✉️', category: '工作', defaultBlocked: false }
];

// 屏蔽关键词建议库
const SHIELD_KEYWORD_SUGGESTIONS = [
  'KPI', 'OKR', '加班', '截止', 'ddl', 'deadline', '开会', '绩效',
  '汇报', 'review', '迭代', '需求', '紧急', '尽快', '电话会议',
  '全员', '通知', '必须', '今天内', '马上'
];

// 树洞社区 - 初始种子帖子（首次使用时填充）
const SEED_POSTS = [
  {
    id: 'seed_1',
    alias: '深海里的鱼',
    avatarColor: '#5d8aa8',
    mood: 'tired',
    moodLabel: '疲惫',
    content: '今天又被领导PUA了，说我"态度有问题"。其实我只是没在群里秒回他。回到家坐在沙发上哭了二十分钟，现在好一点了。原来哭一场真的能让胸口松一些。',
    likes: 47,
    comments: [
      { id: 'sc1', alias: '路过的小猫', content: '抱抱你。你的态度没有问题，是那个领导有问题。', created_at: Date.now() - 3600000 * 5 }
    ],
    reports: 0,
    created_at: Date.now() - 3600000 * 8,
    isMine: false
  },
  {
    id: 'seed_2',
    alias: '夜行的猫',
    avatarColor: '#8b6fd4',
    mood: 'anxious',
    moodLabel: '焦虑',
    content: '27岁了，存款五位数，没对象，租着城中村。每次刷朋友圈都觉得自己是个废物。但今天去公园坐了一下午，看着树叶发呆，突然觉得——我也只是在用自己的节奏走而已。不必和别人比。',
    likes: 128,
    comments: [
      { id: 'sc2', alias: '同样27的星星', content: '我也是。抱抱。', created_at: Date.now() - 3600000 * 3 },
      { id: 'sc3', alias: '路过的小猫', content: '公园发呆是个好办法，我也要试试', created_at: Date.now() - 3600000 * 2 }
    ],
    reports: 0,
    created_at: Date.now() - 3600000 * 18,
    isMine: false
  },
  {
    id: 'seed_3',
    alias: '小雨',
    avatarColor: '#f08a7a',
    mood: 'sad',
    moodLabel: '低落',
    content: '分手第14天。今天路过我们常去的那家面馆，没忍住进去吃了一碗。老板还问"你那个朋友怎么没来"。我说他出差了。吃完眼泪就掉碗里了。但今天的太阳很好。',
    likes: 89,
    comments: [
      { id: 'sc4', alias: '深夜的灯', content: '慢慢来，给自己时间。', created_at: Date.now() - 3600000 * 6 }
    ],
    reports: 0,
    created_at: Date.now() - 3600000 * 26,
    isMine: false
  },
  {
    id: 'seed_4',
    alias: '山顶的云',
    avatarColor: '#4caf7d',
    mood: 'overwhelmed',
    moodLabel: '崩溃',
    content: '加班到凌晨两点，回去的路上一个人坐在地铁末班车的座位上，看着窗外黑漆漆的隧道，第一次想——我活着是为了什么。但走出地铁站的时候，风是凉的，有只流浪猫蹲在出口看我。突然觉得，先把今晚过完吧。',
    likes: 213,
    comments: [
      { id: 'sc5', alias: '深夜的灯', content: '那只猫在等你。', created_at: Date.now() - 3600000 * 12 },
      { id: 'sc6', alias: '深海里的鱼', content: '今晚过完了，明天会有一点点不同。', created_at: Date.now() - 3600000 * 10 }
    ],
    reports: 0,
    created_at: Date.now() - 3600000 * 36,
    isMine: false
  },
  {
    id: 'seed_5',
    alias: '一杯温水',
    avatarColor: '#e8a838',
    mood: 'numb',
    moodLabel: '麻木',
    content: '今天什么都没做，躺了一整天。不是不想动，是真的动不了。我知道该起来吃饭，该回消息，但就是动不了。发这条也是用尽了最后的力气。如果你也这样，我们至少在这条树洞里不孤单。',
    likes: 156,
    comments: [
      { id: 'sc7', alias: '夜行的猫', content: '我也是。今天也躺了一天。', created_at: Date.now() - 3600000 * 20 }
    ],
    reports: 0,
    created_at: Date.now() - 3600000 * 48,
    isMine: false
  }
];

// 匿名昵称候选词库（首次进入社区时随机生成）
const ALIAS_PREFIXES = ['深海里的', '夜行的', '路过的', '山顶的', '深夜的', '雨后的', '远方的', '安静的', '一杯', '森林里的'];
const ALIAS_SUFFIXES = ['鱼', '猫', '云', '星星', '小鹿', '灯', '温水', '叶子', '风', '月亮'];

function genRandomAlias() {
  const p = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const s = ALIAS_SUFFIXES[Math.floor(Math.random() * ALIAS_SUFFIXES.length)];
  return p + s;
}

// 头像颜色池
const ALIAS_COLORS = ['#5d8aa8', '#8b6fd4', '#f08a7a', '#4caf7d', '#e8a838', '#6b5b95', '#9b59b6', '#1abc9c'];

// 冥想背景音类型（播放网络音频文件，URL 填在 src 字段）
// src 可以是字符串（单文件）或数组（多文件随机选一首）
// 把音频上传到 HTTPS 服务器/对象存储后，替换下面的 URL 即可
const BGM_TYPES = [
  {
    id: 'none',
    name: '无',
    icon: '🔇',
    desc: '仅呼吸引导',
    src: ''
  },
  {
    id: 'rain',
    name: '雨声',
    icon: '🌧',
    desc: '窗外细雨，治愈失眠',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/rain.mp3'
  },
  {
    id: 'ocean',
    name: '海浪',
    icon: '🌊',
    desc: '潮起潮落，深邃宁静',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/ocean.mp3'
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    desc: '风穿树叶，偶有鸟鸣',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/forest.mp3'
  },
  {
    id: 'bowl',
    name: '冥想钵',
    icon: '🎵',
    desc: '低频泛音，深度冥想',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/bowl.mp3'
  },
  {
    id: 'piano',
    name: '轻音乐',
    icon: '🎹',
    desc: '舒缓钢琴，温柔陪伴',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/piano.mp3'
  },
  {
    id: 'music',
    name: '冥想音乐',
    icon: '🎼',
    desc: '随机一首冥想轻音乐',
    src: [
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m1.mp3',
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m2.mp3',
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m3.mp3',
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m4.mp3',
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m5.mp3',
      'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/music/m6.mp3'
    ]
  },
  {
    id: 'white',
    name: '白噪音',
    icon: '⚪',
    desc: '均匀的沙沙声，有助专注',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/white.mp3'
  },
  {
    id: 'brown',
    name: '棕噪音',
    icon: '🟤',
    desc: '低沉的轰鸣，助眠',
    src: 'https://1176440849-lab.github.io/Take-it-easy/miniprogram/assets/audio/brown.mp3'
  }
];

// 每个场景推荐默认BGM
const SCENE_BGM_RECOMMEND = {
  'insomnia': 'rain',        // 失眠→雨声
  'anxiety': 'pink',         // 焦虑→粉噪音
  'work-pressure': 'brown',  // 工作压力→棕噪音
  'social-tired': 'forest',  // 社交疲惫→森林
  'sadness': 'bowl',         // 低落→冥想钵
  'morning': 'forest'        // 清晨→森林
};

module.exports = {
  MEDITATION_SCENES,
  EMOTION_TAGS,
  TRIGGER_SOURCES,
  pickMockResponse,
  pickFollowupResponse,
  getClosureResponse,
  SHIELD_APPS,
  SHIELD_KEYWORD_SUGGESTIONS,
  SEED_POSTS,
  ALIAS_PREFIXES,
  ALIAS_SUFFIXES,
  ALIAS_COLORS,
  genRandomAlias,
  BGM_TYPES,
  SCENE_BGM_RECOMMEND
};
