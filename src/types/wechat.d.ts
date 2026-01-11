/**
 * 微信小程序 API 类型声明
 * 统一定义所有微信相关的 Window 扩展
 */

interface WxMiniProgram {
  getEnv: (callback: (res: { miniprogram: boolean }) => void) => void;
  postMessage: (data: { data: any }) => void;
  navigateTo: (options: { url: string }) => void;
  navigateBack: (options?: { delta?: number }) => void;
  switchTab?: (options: { url: string }) => void;
}

interface WxFileSystemManager {
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
}

interface WxInnerAudioContext {
  src: string;
  obeyMuteSwitch: boolean;
  play: () => void;
  stop: () => void;
  onEnded: (callback: () => void) => void;
  offEnded: () => void;
  onError: (callback: (error: any) => void) => void;
}

interface WxAPI {
  miniProgram?: WxMiniProgram;
  getRecorderManager?: () => any;
  createInnerAudioContext?: () => WxInnerAudioContext;
  authorize?: (options: any) => void;
  canIUse?: (api: string) => boolean;
  arrayBufferToBase64?: (buffer: ArrayBuffer) => string;
  base64ToArrayBuffer?: (base64: string) => ArrayBuffer;
  getFileSystemManager?: () => WxFileSystemManager;
  env?: {
    USER_DATA_PATH: string;
  };
}

declare global {
  interface Window {
    __wxjs_environment?: string;
    wx?: WxAPI;
  }
}

export {};
