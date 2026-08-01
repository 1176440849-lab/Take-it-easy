# 背景音乐音频文件目录

冥想用的背景音文件放在这个目录下。

## 一、固定 BGM（放在本目录）

| 文件名 | 对应 BGM | 推荐内容 |
|--------|----------|----------|
| rain.mp3 | 🌧 雨声 | 窗外细雨、小雨打窗 |
| ocean.mp3 | 🌊 海浪 | 潮起潮落、海边的浪 |
| forest.mp3 | 🌲 森林 | 风穿树叶、鸟鸣 |
| bowl.mp3 | 🎵 冥想钵 | 颂钵泛音 |
| piano.mp3 | 🎹 轻音乐 | 舒缓钢琴 |
| white.mp3 | ⚪ 白噪音 | 均匀沙沙声 |
| brown.mp3 | 🟤 棕噪音 | 低沉轰鸣 |

## 二、随机冥想音乐（放在 music/ 子目录）

`music/` 子目录下放多首冥想轻音乐，每次播放会**随机选一首**。

| 文件名 | 说明 |
|--------|------|
| music/m1.mp3 | 冥想音乐 1 |
| music/m2.mp3 | 冥想音乐 2 |
| music/m3.mp3 | 冥想音乐 3 |
| music/m4.mp3 | 冥想音乐 4 |
| music/m5.mp3 | 冥想音乐 5 |
| music/m6.mp3 | 冥想音乐 6 |

**想加更多首？** 在 `utils/mock.js` 的 `BGM_TYPES` 里找到 `id: 'music'` 那一项，往 `src` 数组里继续加路径即可，例如：

```js
src: [
  '/assets/audio/music/m1.mp3',
  '/assets/audio/music/m2.mp3',
  '/assets/audio/music/m3.mp3',
  '/assets/audio/music/m4.mp3',
  '/assets/audio/music/m5.mp3',
  '/assets/audio/music/m6.mp3',
  '/assets/audio/music/m7.mp3',   // 新增
  '/assets/audio/music/m8.mp3'    // 新增
]
```

文件名不限于 m1/m2，也可以用有意义的名字，比如 `celt.mp3`、`flute.mp3`，只要路径对得上即可。

## 三、文件要求

- **格式**：mp3（兼容性最好，不要用 wav/ogg）
- **时长**：建议 1-3 分钟，循环播放无缝衔接
- **体积**：单个文件 ≤ 200KB（小程序主包限制 2MB，所有音频加起来不能超）
  - 压缩命令（需要 ffmpeg）：
    ```
    ffmpeg -i input.mp3 -b:a 64k -ac 1 output.mp3
    ```
    （转单声道 64kbps，3 分钟约 1.4MB，需更短或更低码率）

## 四、放完后

重新编译小程序即可。meditation.js 会在加载时自动检测文件是否存在：
- 没放音频的固定 BGM 会从面板里隐藏
- 随机冥想音乐只加载实际存在的文件，没放全也不报错
