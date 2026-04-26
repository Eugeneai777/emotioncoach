/**
 * 平台环境检测工具
 * 用于区分网页浏览器和微信小程序环境，实现语音方案双轨切换
 */

declare global {
  interface Window {
    __wxjs_environment?: string;
    wx?: {
      miniProgram?: {
        getEnv: (callback: (res: { miniprogram: boolean }) => void) => void;
        postMessage: (options: { data: any }) => void;
        navigateTo?: (options: { url: string }) => void;
        navigateBack?: (options?: { delta?: number }) => void;
      };
      getRecorderManager?: () => any;
      createInnerAudioContext?: () => {
        src: string;
        obeyMuteSwitch: boolean;
        play: () => void;
        stop: () => void;
        onEnded: (callback: () => void) => void;
        offEnded: () => void;
        onError: (callback: (error: any) => void) => void;
      };
      authorize?: (options: any) => void;
      openSetting?: (options: { success?: (res: any) => void; fail?: (err: any) => void }) => void;
      canIUse?: (api: string) => boolean;
      arrayBufferToBase64?: (buffer: ArrayBuffer) => string;
      base64ToArrayBuffer?: (base64: string) => ArrayBuffer;
      // 小程序文件系统 API
      getFileSystemManager?: () => {
        writeFile: (options: {
          filePath: string;
          data: ArrayBuffer | string;
          encoding?: string;
          success?: () => void;
          fail?: (err: { errMsg?: string }) => void;
        }) => void;
        readFile: (options: any) => void;
        unlink: (options: {
          filePath: string;
          success?: () => void;
          fail?: (err: { errMsg?: string }) => void;
        }) => void;
      };
      // 小程序环境变量
      env?: {
        USER_DATA_PATH: string;
      };
    };
  }
}

/**
 * 检测是否在微信小程序 WebView 环境中
 * 小程序 WebView 不支持 WebRTC，需要使用 WebSocket 中继方案
 * 
 * 🔧 修复：移除对 window.wx.miniProgram.getEnv 存在性的同步检测
 * 原因：微信 JS-SDK 会在所有微信环境（包括 H5）注入 wx 对象，
 * 导致 getEnv 函数在 H5 中也存在，造成 H5 被误判为小程序。
 * 
 * 正确的检测逻辑：
 * 1. 优先检测 __wxjs_environment 环境变量（小程序 WebView 专有）
 * 2. 检测 UA 中同时包含 micromessenger 和 miniprogram 标识
 * 3. 不再同步检测 getEnv 函数存在性（改为异步版本使用）
 */
export function isWeChatMiniProgram(): boolean {
  // 1. 最可靠：检测微信小程序专有环境变量
  if (window.__wxjs_environment === 'miniprogram') {
    return true;
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // 2. 检测 UA 中的小程序标识
  // 小程序 WebView 的 UA 会同时包含 "micromessenger" 和 "miniprogram"
  const hasMiniProgramUA = /miniprogram/i.test(ua);
  const isWechat = /micromessenger/i.test(ua);
  
  if (isWechat && hasMiniProgramUA) {
    return true;
  }

  // 3. 🔧 部分 Android 设备（如 Redmi K30 5G）的小程序 WebView UA 
  // 不包含 "MicroMessenger" 和 "miniProgram"，但包含 "MMWEBSDK" + "MMW"。
  // 注意：安卓微信 H5 浏览器也可能包含 MMWEBSDK/MMW；若已明确包含 MicroMessenger，
  // 必须按普通微信浏览器处理，否则第二次点击支付会误走小程序原生支付分支。
  // 例如: ...Chrome/146.0.7680.177 Mobile Safari/537.36 XWEB/1460055 MMWEBSDK/20260202 MMW
  const hasMMWebSDK = /mmwebsdk/i.test(ua);
  const hasMMW = /\bmmw\b/i.test(ua);
  if (!isWechat && hasMMWebSDK && hasMMW) {
    return true;
  }

  return false;
}

/**
 * 异步检测是否在小程序环境（更准确）
 * 通过调用 getEnv API 获取真实环境信息
 */
export function detectMiniProgramAsync(): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. 快速同步检测（基于环境变量和 UA）
    const syncResult = isWeChatMiniProgram();
    if (syncResult) {
      resolve(true);
      return;
    }

    // 2. 异步调用 getEnv 获取精确结果
    // 只有在小程序 WebView 中，getEnv 回调才会返回 { miniprogram: true }
    if (typeof window.wx?.miniProgram?.getEnv === 'function') {
      try {
        window.wx.miniProgram.getEnv((res) => {
          const isMiniProgram = res?.miniprogram === true;
          if (isMiniProgram) {
            console.log('[Platform] Async detection confirmed: MiniProgram WebView');
          }
          resolve(isMiniProgram);
        });
      } catch (e) {
        console.warn('[Platform] getEnv call failed:', e);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

/**
 * 检测浏览器是否支持 WebRTC
 * 用于判断是否可以使用直连方案
 */
export function supportsWebRTC(): boolean {
  try {
    // 检测 RTCPeerConnection
    const hasRTCPeerConnection = !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );

    // 检测 getUserMedia
    const hasGetUserMedia = !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    );

    return hasRTCPeerConnection && hasGetUserMedia;
  } catch {
    return false;
  }
}

/**
 * 检测是否在微信浏览器（非小程序）中
 * 微信浏览器支持 WebRTC，可使用直连方案
 */
export function isWeChatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = /micromessenger/i.test(ua);
  const isMiniProgram = isWeChatMiniProgram();
  
  return isWechat && !isMiniProgram;
}

/**
 * 检测是否为 iOS 设备
 */
export function isIOSDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * 检测是否为 iOS 微信浏览器
 * iOS 微信的 WKWebView 对 WebRTC 支持不稳定，需要使用 WebSocket 中继
 */
export function isIOSWeChatBrowser(): boolean {
  return isWeChatBrowser() && isIOSDevice();
}

/**
 * 检测小程序是否支持所需的音频 API
 */
export function supportsMiniProgramAudio(): boolean {
  if (!isWeChatMiniProgram()) {
    return false;
  }

  const wx = window.wx;
  if (!wx) {
    return false;
  }

  // 检测录音 API
  const hasRecorder = typeof wx.getRecorderManager === 'function' ||
                      (wx.canIUse && wx.canIUse('getRecorderManager'));

  // 检测播放 API
  const hasAudioContext = typeof wx.createInnerAudioContext === 'function' ||
                          (wx.canIUse && wx.canIUse('createInnerAudioContext'));

  return hasRecorder && hasAudioContext;
}

/**
 * 获取当前平台信息
 * 
 * 🔧 小程序 WebView 策略变更：
 * 小程序 WebView 内嵌的 H5 页面无法使用 wx.getRecorderManager 等原生 API，
 * 但可以使用标准 Web API（navigator.mediaDevices.getUserMedia）获取麦克风权限，
 * 然后通过 WebSocket 中继到 OpenAI Realtime API。
 * 
 * 因此，对于小程序 WebView：
 * - 即使 supportsMiniProgramAudio() 返回 false，也应该尝试使用 websocket 模式
 * - WebSocket 客户端会自动降级为使用 Web Audio API 录音
 */
export function getPlatformInfo(): {
  platform: 'miniprogram' | 'wechat-browser' | 'web-browser';
  supportsWebRTC: boolean;
  supportsMiniProgramAudio: boolean;
  recommendedVoiceMethod: 'webrtc' | 'websocket' | 'none';
} {
  const isMiniProgram = isWeChatMiniProgram();
  const isWechat = isWeChatBrowser();
  const hasWebRTC = supportsWebRTC();
  const hasMiniProgramAudio = supportsMiniProgramAudio();

  let platform: 'miniprogram' | 'wechat-browser' | 'web-browser';
  let recommendedVoiceMethod: 'webrtc' | 'websocket' | 'none';

  if (isMiniProgram) {
    platform = 'miniprogram';
    // 🔧 小程序 WebView 改用 websocket 模式（不再依赖 wx 原生 API）
    // WebSocket 客户端内部会自动降级为 Web Audio API 录音
    recommendedVoiceMethod = 'websocket';
  } else if (isWechat) {
    platform = 'wechat-browser';
    // 🔧 iOS 微信浏览器的 WKWebView 对 WebRTC 支持不稳定，强制使用 WebSocket 中继
    if (isIOSDevice()) {
      console.log('[Platform] iOS WeChat Browser detected, forcing WebSocket relay');
      recommendedVoiceMethod = 'websocket';
    } else {
      // Android 微信浏览器支持 WebRTC
      recommendedVoiceMethod = hasWebRTC ? 'webrtc' : 'websocket';
    }
  } else {
    platform = 'web-browser';
    // 普通浏览器：优先 WebRTC，不支持则降级 WebSocket
    recommendedVoiceMethod = hasWebRTC ? 'webrtc' : 'websocket';
  }

  return {
    platform,
    supportsWebRTC: hasWebRTC,
    supportsMiniProgramAudio: hasMiniProgramAudio,
    recommendedVoiceMethod,
  };
}

/**
 * 检测是否为桌面端（鼠标 + 键盘环境）
 *
 * 🔧 v2 重写：彻底放弃 `ontouchstart` / `maxTouchPoints` 作为"非桌面"硬条件，
 * 因为 Windows Chrome/Edge 在很多触屏笔电（Surface、ThinkPad、戴尔）上
 * 默认 `maxTouchPoints > 0`，会被误判为移动端，导致语音强制走 PTT 模式
 * 并把麦克风 track.enabled 设为 false → AI 听不到用户。
 *
 * 新判定顺序：
 * 1. 微信小程序 → 非桌面
 * 2. 移动端 UA（iPhone/Android phone/Mobile）→ 非桌面
 * 3. iPad → 非桌面（保持触屏 PTT）
 * 4. (hover: hover) 且 (pointer: fine) → 桌面（鼠标设备）
 * 5. 仅 (pointer: coarse) 无 fine → 非桌面（纯触屏）
 * 6. 兜底：window.innerWidth >= 1024 视为桌面
 */
export function isDesktop(): boolean {
  try {
    if (isWeChatMiniProgram()) return false;

    const ua = navigator.userAgent || '';
    // 明确移动端 UA（不依赖 touch 信号）
    if (/iPhone|iPod|Android.*Mobile|Mobile.*Android|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
      return false;
    }
    // iPad（含桌面伪装的 iPadOS）
    if (/iPad/i.test(ua)) return false;
    if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1) return false;

    const mm = window.matchMedia;
    if (typeof mm === 'function') {
      // 鼠标 + 悬停设备 → 桌面（即使有触屏也算，如二合一笔电外接键鼠）
      if (mm('(hover: hover) and (pointer: fine)').matches) return true;
      // 仅有粗指针、无精细指针 → 纯触屏设备
      const coarseOnly = mm('(pointer: coarse)').matches && !mm('(pointer: fine)').matches;
      if (coarseOnly) return false;
    }

    // 兜底：按窗口宽度判断
    return (window.innerWidth || 0) >= 1024;
  } catch {
    // 出错时倾向桌面，避免静音 bug 在异常环境下复现
    return true;
  }
}

/**
 * 获取当前环境推荐的语音交互方式
 * - 'continuous'：连续通话（VAD 自动检测）
 * - 'ptt'：长按说话
 *
 * 全站统一调用此函数决定是否启用 PTT，避免各页面用不同的判定条件。
 */
export function getPreferredVoiceInteraction(): 'continuous' | 'ptt' {
  return isDesktop() ? 'continuous' : 'ptt';
}

/**
 * 等待微信小程序 JS-SDK (wx.miniProgram) 加载完成
 * 用于确保在调用 navigateTo 等 API 前 SDK 已就绪
 */
export function waitForWxMiniProgramReady(timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    // 如果已经存在且有 navigateTo 方法
    if (window.wx?.miniProgram && typeof window.wx.miniProgram.navigateTo === 'function') {
      console.log('[Platform] wx.miniProgram already available');
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window.wx?.miniProgram && typeof window.wx.miniProgram.navigateTo === 'function') {
        clearInterval(checkInterval);
        console.log('[Platform] wx.miniProgram became available after', Date.now() - startTime, 'ms');
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.warn('[Platform] wx.miniProgram not available after timeout');
        resolve(false);
      }
    }, 50);
  });
}
