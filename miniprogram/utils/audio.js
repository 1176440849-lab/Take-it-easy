// utils/audio.js — 背景音播放（基于 InnerAudioContext 播放网络音频）
// 使用方式：
//   audio.play('rain', 0.5, 'https://cdn.example.com/rain.mp3')              // 单文件
//   audio.play('music', 0.5, ['https://cdn.example.com/m1.mp3', ...])        // 多文件随机选一首
// 音频文件需上传到 HTTPS 服务器/对象存储，URL 填到 mock.js 的 BGM_TYPES.src

let innerAudio = null;
let currentType = '';
let currentVolume = 0.5;
let onErrorCallback = null;

/**
 * 播放指定类型的背景音
 * @param {string} type bgm类型id
 * @param {number} volume 0-1
 * @param {string|string[]} src 音频URL。字符串=单文件；数组=多文件随机选一首
 * @param {function} [onError] 加载/播放失败回调，可选
 * @returns {boolean} 是否成功创建播放器（不代表一定播放成功，网络错误走 onError）
 */
function play(type, volume, src, onError) {
  stop();
  if (!type || type === 'none') return false;

  // 处理 src：数组则随机选一个
  let finalSrc = '';
  if (Array.isArray(src)) {
    if (src.length === 0) return false;
    finalSrc = src[Math.floor(Math.random() * src.length)];
  } else {
    finalSrc = src;
  }
  if (!finalSrc) return false;

  currentType = type;
  currentVolume = volume == null ? 0.5 : volume;
  onErrorCallback = onError || null;

  try {
    innerAudio = wx.createInnerAudioContext();
    innerAudio.src = finalSrc;
    innerAudio.loop = true;
    innerAudio.volume = currentVolume;
    innerAudio.autoplay = true;

    // 网络加载/播放失败
    innerAudio.onError((err) => {
      console.error('音频播放失败', err, finalSrc);
      if (onErrorCallback) onErrorCallback(err);
    });

    innerAudio.play();
    return true;
  } catch (e) {
    console.error('创建播放器失败', e);
    if (onErrorCallback) onErrorCallback(e);
    return false;
  }
}

/**
 * 停止播放
 */
function stop() {
  if (innerAudio) {
    try {
      innerAudio.stop();
      innerAudio.destroy();
    } catch (e) {}
    innerAudio = null;
  }
  currentType = '';
  onErrorCallback = null;
}

/**
 * 设置音量
 * @param {number} v 0-1
 */
function setVolume(v) {
  currentVolume = v;
  if (innerAudio) {
    innerAudio.volume = v;
  }
}

/**
 * 获取当前播放类型
 */
function getCurrentType() {
  return currentType;
}

/**
 * 是否正在播放
 */
function isPlaying() {
  return !!innerAudio;
}

/**
 * 销毁（页面退出时调用）
 */
function destroy() {
  stop();
}

module.exports = {
  play,
  stop,
  setVolume,
  getCurrentType,
  isPlaying,
  destroy
};
