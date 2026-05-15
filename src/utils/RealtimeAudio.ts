import { supabase } from "@/integrations/supabase/client";

// ============= 配置缓存管理 =============
// 注意：OpenAI ephemeral token 有效期只有 60 秒，无法长期缓存
// 但 realtime_url 配置可以按天缓存，减少重复请求

interface CachedConfig {
  realtimeUrl: string;
  expiresAt: number;
}

const CONFIG_CACHE_KEY = 'realtime_config_cache';
const CONFIG_TTL_MS = 24 * 60 * 60 * 1000; // 配置缓存 24 小时

// ============= Token 预取机制 =============
interface CachedToken {
  clientSecret: string;
  realtimeUrl: string;
  expiresAt: number;
  mode: string;
}

const TOKEN_CACHE_KEY = 'realtime_token_cache';
const TOKEN_TTL_MS = 55 * 1000; // Token 有效期 55 秒（留 5 秒安全余量）

// 获取预取的 Token
function getCachedToken(endpoint: string, mode: string): CachedToken | null {
  try {
    const cacheKey = `${TOKEN_CACHE_KEY}_${endpoint}_${mode}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data: CachedToken = JSON.parse(cached);
    
    if (Date.now() >= data.expiresAt) {
      sessionStorage.removeItem(cacheKey);
      console.log('[TokenCache] Token expired, removed');
      return null;
    }
    
    console.log('[TokenCache] Using prefetched token, expires in', Math.round((data.expiresAt - Date.now()) / 1000), 's');
    return data;
  } catch {
    return null;
  }
}

// 缓存预取的 Token
function setCachedToken(endpoint: string, mode: string, clientSecret: string, realtimeUrl: string): void {
  try {
    const cacheKey = `${TOKEN_CACHE_KEY}_${endpoint}_${mode}`;
    const data: CachedToken = {
      clientSecret,
      realtimeUrl,
      mode,
      expiresAt: Date.now() + TOKEN_TTL_MS
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.log('[TokenCache] Token cached for 55s');
  } catch (e) {
    console.warn('[TokenCache] Failed to cache token:', e);
  }
}

// ============= 预热机制 =============
const PREHEAT_CACHE_KEY = 'voice_preheat_timestamp';
const PREHEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 分钟内不重复预热

// 预热 Edge Function（防止冷启动延迟）
export async function preheatTokenEndpoint(endpoint: string = 'vibrant-life-realtime-token'): Promise<boolean> {
  try {
    const lastPreheat = localStorage.getItem(`${PREHEAT_CACHE_KEY}_${endpoint}`);
    if (lastPreheat && Date.now() - parseInt(lastPreheat) < PREHEAT_INTERVAL_MS) {
      console.log('[Preheat] Already warmed up recently');
      return true;
    }
    
    const startTime = performance.now();
    await supabase.functions.invoke(endpoint, { 
      body: { preheat: true } 
    });
    
    localStorage.setItem(`${PREHEAT_CACHE_KEY}_${endpoint}`, Date.now().toString());
    console.log('[Preheat] Endpoint warmed up in', Math.round(performance.now() - startTime), 'ms');
    return true;
  } catch (e) {
    console.warn('[Preheat] Failed:', e);
    return false;
  }
}

// 预取 Token（用于提前获取 Token 减少连接延迟）
export async function prefetchToken(
  endpoint: string = 'vibrant-life-realtime-token',
  mode: string = 'general',
  scenario?: string
): Promise<boolean> {
  try {
    // 检查是否已有有效缓存
    const cached = getCachedToken(endpoint, mode);
    if (cached) {
      console.log('[Prefetch] Token already cached');
      return true;
    }
    
    const startTime = performance.now();
    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: { mode, scenario, prefetch: true }
    });
    
    if (error || !data?.client_secret?.value) {
      console.warn('[Prefetch] Failed to get token');
      return false;
    }
    
    setCachedToken(endpoint, mode, data.client_secret.value, data.realtime_url);
    console.log('[Prefetch] Token prefetched in', Math.round(performance.now() - startTime), 'ms');
    return true;
  } catch (e) {
    console.warn('[Prefetch] Error:', e);
    return false;
  }
}

// ============= 记住最佳通道 =============
const PREFERRED_CHANNEL_KEY = 'voice_preferred_channel';

export function getPreferredChannel(): 'webrtc' | 'websocket' | null {
  return localStorage.getItem(PREFERRED_CHANNEL_KEY) as 'webrtc' | 'websocket' | null;
}

export function setPreferredChannel(channel: 'webrtc' | 'websocket'): void {
  localStorage.setItem(PREFERRED_CHANNEL_KEY, channel);
  console.log('[Channel] Preferred channel set to:', channel);
}

// 获取缓存的配置
function getCachedConfig(endpoint: string): CachedConfig | null {
  try {
    const cacheKey = `${CONFIG_CACHE_KEY}_${endpoint}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data: CachedConfig = JSON.parse(cached);
    
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(cacheKey);
      console.log('[ConfigCache] Config expired, removed from cache');
      return null;
    }
    
    console.log('[ConfigCache] Using cached config');
    return data;
  } catch {
    return null;
  }
}

// 缓存配置
function setCachedConfig(endpoint: string, realtimeUrl: string): void {
  try {
    const cacheKey = `${CONFIG_CACHE_KEY}_${endpoint}`;
    const data: CachedConfig = {
      realtimeUrl,
      expiresAt: Date.now() + CONFIG_TTL_MS
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
    console.log('[ConfigCache] Config cached for 24 hours');
  } catch (e) {
    console.warn('[ConfigCache] Failed to cache config:', e);
  }
}

// 清除配置缓存
export function clearConfigCache(endpoint?: string): void {
  try {
    if (endpoint) {
      localStorage.removeItem(`${CONFIG_CACHE_KEY}_${endpoint}`);
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CONFIG_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log('[ConfigCache] Cache cleared');
  } catch (e) {
    console.warn('[ConfigCache] Failed to clear cache:', e);
  }
}

// ============= 麦克风权限预检查 =============
let micPermissionGranted: boolean | null = null;
let cachedMicStream: MediaStream | null = null;

// 检查麦克风权限状态（不触发权限请求）
async function checkMicPermission(): Promise<boolean> {
  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      micPermissionGranted = result.state === 'granted';
      return micPermissionGranted;
    }
  } catch {
    // 部分浏览器不支持 permissions API
  }
  return false;
}

// 预热麦克风权限（可在页面加载时调用）
export async function prewarmMicrophone(): Promise<boolean> {
  const hasPermission = await checkMicPermission();
  if (hasPermission) {
    console.log('[Microphone] Permission already granted');
    return true;
  }
  return false;
}

// 预获取麦克风流（用户已授权时可复用）
export async function prewarmMicrophoneStream(): Promise<MediaStream | null> {
  const hasPermission = await checkMicPermission();
  if (hasPermission && !cachedMicStream) {
    try {
      cachedMicStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('[Microphone] Stream pre-warmed');
    } catch (e) {
      console.warn('[Microphone] Failed to pre-warm stream:', e);
    }
  }
  return cachedMicStream;
}

// 获取预热的麦克风流或请求新的
function getOrRequestMicStream(): MediaStream | null {
  if (cachedMicStream && cachedMicStream.active) {
    console.log('[Microphone] Using pre-warmed stream');
    const stream = cachedMicStream;
    cachedMicStream = null; // 使用后清空，避免重复使用
    return stream;
  }
  return null;
}

// 音频录制器 - 录制麦克风音频并转换为 PCM16 格式
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      
      // 🔧 修复回声问题：创建静音增益节点，防止麦克风音频被播放到扬声器
      // 之前直接连接到 destination 会导致用户听到自己的声音（回声）
      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;  // 完全静音
      this.processor.connect(silentGain);
      silentGain.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 将 Float32 音频数据编码为 base64 PCM16 格式
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// 音频队列 - 处理顺序播放
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const wavArrayBuffer = wavData.buffer.slice(wavData.byteOffset, wavData.byteOffset + wavData.byteLength) as ArrayBuffer;
      const audioBuffer = await this.audioContext.decodeAudioData(wavArrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext(); // 继续播放下一个
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // 转换字节为 16 位样本
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // 创建 WAV 头
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    const int16Buffer = new ArrayBuffer(int16Data.byteLength);
    new Uint8Array(int16Buffer).set(new Uint8Array(int16Data.buffer));

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

// WebRTC 实时对话类
export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private recorder: AudioRecorder | null = null;
  private tokenEndpoint: string;
  private mode: string;
  private scenario?: string;
  private extraBody?: Record<string, any>;
  private localStream: MediaStream | null = null;
  private isDisconnected: boolean = false;
  
  // 保存事件处理函数引用以便移除
  private dcMessageHandler: ((e: MessageEvent) => void) | null = null;
  private dcOpenHandler: (() => void) | null = null;
  private dcCloseHandler: (() => void) | null = null;
  
  // 🔧 ICE连接状态监控
  private iceRecoveryTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // 🔧 数据通道活动检测
  private lastDataChannelActivity: number = 0;
  private activityCheckInterval: ReturnType<typeof setInterval> | null = null;

  // 🔧 Safari 兼容：支持接收预获取的 MediaStream，跳过内部 getUserMedia
  private preAcquiredStream: MediaStream | null = null;

  // 🚀 快路径：服务端 token 函数返回的延迟 session 配置（在 datachannel open 后推送）
  private pendingSessionConfig: any = null;

  // 🎬 场景开场白：PTT 模式下，进入 PTT 后由 AI 主动播报第一句
  private scenarioOpening: string | null = null;

  // 🔊 远端音频后处理（压缩+归一化）：解决 OpenAI Realtime 输出忽大忽小
  private playbackCtx: AudioContext | null = null;
  private playbackSource: MediaStreamAudioSourceNode | null = null;
  private playbackCompressor: DynamicsCompressorNode | null = null;
  private playbackGain: GainNode | null = null;

  // 🎙️ PTT 预设：在 init 之前由外部声明，确保 dc 一打开就立刻关闭 VAD 并静音麦克风
  // 修复"小程序里 PTT 不生效、直接说话也能被识别"的根因（VAD 默认仍开启）
  private pttPreset: boolean = false;
  public presetPushToTalk(enabled: boolean): void {
    this.pttPreset = enabled;
    this.pttMode = enabled;
    // 若流已就绪，立刻静音；否则会在 addTrack 后立即静音
    if (enabled && this.localStream) {
      try { this.setMicMuted(true); } catch {}
    }
  }

  constructor(
    private onMessage: (message: any) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void,
    tokenEndpoint: string = 'realtime-token',
    mode: string = 'general',
    scenario?: string,
    extraBody?: Record<string, any>,
    preAcquiredStream?: MediaStream | null
  ) {
    this.tokenEndpoint = tokenEndpoint;
    this.mode = mode;
    this.scenario = scenario;
    this.extraBody = extraBody;
    this.preAcquiredStream = preAcquiredStream || null;
  }

  // 🔧 iOS Safari / 微信小程序 音频解锁
  // 解决移动端有文字但无语音的问题
  private async unlockAudio(audioEl: HTMLAudioElement): Promise<void> {
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log(`[WebRTC] Audio unlock - isWechat: ${isWechat}, isIOS: ${isIOS}`);

    try {
      // 方法1: 微信 JSSDK 音频解锁（如果可用）
      if (isWechat && typeof (window as any).WeixinJSBridge !== 'undefined') {
        await new Promise<void>((resolve) => {
          (window as any).WeixinJSBridge.invoke('getNetworkType', {}, () => {
            // 通过调用微信 API 来激活 webview 的音频权限
            console.log('[WebRTC] WeChat JSBridge audio unlock triggered');
            resolve();
          });
        });
      }

      // 方法2: 创建并播放静音音频来解锁 AudioContext
      const silentWav = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
        0x66, 0x6D, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
        0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
      ]);
      const silentBlob = new Blob([silentWav], { type: 'audio/wav' });
      const silentUrl = URL.createObjectURL(silentBlob);
      
      audioEl.src = silentUrl;
      audioEl.volume = 0.01;  // 微信需要非零音量才能真正激活
      
      // 尝试播放，忽略错误（某些环境可能仍会失败，但后续 WebRTC 流可能仍能工作）
      await audioEl.play().catch((e) => {
        console.log('[WebRTC] Silent audio play failed:', e.message);
      });
      
      // 恢复设置
      audioEl.pause();
      audioEl.src = '';
      audioEl.volume = 1;
      URL.revokeObjectURL(silentUrl);
      
      // 方法3: 额外创建 AudioContext 来确保音频系统激活
      if (isIOS || isWechat) {
        try {
          const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = tempContext.createOscillator();
          const gainNode = tempContext.createGain();
          gainNode.gain.value = 0;  // 静音
          oscillator.connect(gainNode);
          gainNode.connect(tempContext.destination);
          oscillator.start(0);
          oscillator.stop(0.001);
          // 不要立即关闭，让它保持一小段时间
          setTimeout(() => tempContext.close(), 100);
          console.log('[WebRTC] AudioContext unlock successful');
        } catch (e) {
          console.log('[WebRTC] AudioContext unlock skipped:', e);
        }
      }
      
      console.log('[WebRTC] Audio unlock completed');
    } catch (e) {
      console.log('[WebRTC] Audio unlock error (continuing anyway):', e);
    }
  }

  async init() {
    // 🔧 连接超时保护 - 移动端网络可能导致连接卡住
    const CONNECTION_TIMEOUT_MS = 30000; // 30秒超时
    let connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      connectionTimeoutId = setTimeout(() => {
        isTimedOut = true;
        reject(new Error('连接超时，请检查网络后重试'));
      }, CONNECTION_TIMEOUT_MS);
    });

    const connectPromise = this.initConnection();
    
    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } finally {
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
    }
  }

  private async initConnection() {
    try {
      // 🔧 防止重复初始化：如果已有连接，先断开
      if (this.pc || this.dc || this.audioEl) {
        console.log('[WebRTC] Cleaning up previous connection before init...');
        this.disconnect();
        // 等待一小段时间确保资源释放
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.isDisconnected = false;
      this.onStatusChange('connecting');
      
      const startTime = performance.now();
      console.log('[WebRTC] Starting connection...');
      
      // 创建音频元素 - iOS Safari 需要特殊处理
      this.audioEl = document.createElement("audio");
      this.audioEl.autoplay = true;
      (this.audioEl as any).playsInline = true;  // iOS 必须设置
      this.audioEl.setAttribute('playsinline', '');  // 兼容性写法
      this.audioEl.setAttribute('webkit-playsinline', '');  // 旧版 iOS 兼容
      
      // 🔧 iOS Safari / 微信小程序 音频解锁
      // 这解决了 iOS/微信 上有文字但无语音的问题
      await this.unlockAudio(this.audioEl);

      // 🚀 优化1：检查配置缓存（realtime_url 可按天缓存）
      const cachedConfig = getCachedConfig(this.tokenEndpoint);
      
      let EPHEMERAL_KEY: string;
      let realtimeApiUrl: string;

      // 🚀 优化2：优先使用预获取的麦克风流（Safari 兼容），其次尝试预热流
      const prewarmedStream = this.preAcquiredStream || getOrRequestMicStream();

      if (cachedConfig && prewarmedStream) {
        // 最快路径：配置已缓存 + 麦克风已预热，只需获取新 token
        console.log('[WebRTC] Using cached config + pre-warmed mic');
        realtimeApiUrl = cachedConfig.realtimeUrl;
        this.localStream = prewarmedStream;
        
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(this.tokenEndpoint, {
          body: { mode: this.mode, scenario: this.scenario, ...this.extraBody }
        });
        console.log('[WebRTC] Token fetched:', performance.now() - startTime, 'ms', 'mode:', this.mode, 'scenario:', this.scenario);
        
        if (tokenError || !tokenData?.client_secret?.value) {
          throw new Error("Failed to get ephemeral token");
        }
        EPHEMERAL_KEY = tokenData.client_secret.value;
        // 🚀 捕获快路径延迟 session 配置
        this.pendingSessionConfig = tokenData.pending_session_config || null;
        this.scenarioOpening = tokenData.scenario_opening || null;
      } else {
        // 并行执行 token 获取和麦克风权限请求
        const [tokenResult, micResult] = await Promise.all([
          supabase.functions.invoke(this.tokenEndpoint, { body: { mode: this.mode, scenario: this.scenario, ...this.extraBody } }).then(result => {
            console.log('[WebRTC] Token fetched:', performance.now() - startTime, 'ms', 'mode:', this.mode, 'scenario:', this.scenario);
            return result;
          }),
          prewarmedStream 
            ? Promise.resolve(prewarmedStream)
            : this.requestMicrophoneAccess().then(stream => {
                console.log('[WebRTC] Microphone ready:', performance.now() - startTime, 'ms');
                return stream;
              })
        ]);

        const { data: tokenData, error: tokenError } = tokenResult;
        
        if (tokenError || !tokenData?.client_secret?.value) {
          throw new Error("Failed to get ephemeral token");
        }

        EPHEMERAL_KEY = tokenData.client_secret.value;
        realtimeApiUrl = tokenData.realtime_url || 'https://api.openai.com/v1/realtime';
        // 🚀 捕获快路径延迟 session 配置
        this.pendingSessionConfig = tokenData.pending_session_config || null;
        this.scenarioOpening = tokenData.scenario_opening || null;
        
        // 缓存配置（按天）
        setCachedConfig(this.tokenEndpoint, realtimeApiUrl);

        this.localStream = micResult;
      }

      // 创建 WebRTC 连接 - 使用优化的 ICE 配置
      this.pc = new RTCPeerConnection({
        iceServers: [
          // 🚀 P2: 使用多个 STUN 服务器并行收集
          { urls: 'stun:stun.cloudflare.com:3478' }, // Cloudflare 通常更快
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10, // 预分配 ICE 候选池
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all' // 允许所有传输类型
      });

      // 🔧 ICE 连接状态监控 - 检测断线
      this.pc.oniceconnectionstatechange = () => {
        const state = this.pc?.iceConnectionState;
        console.log('[WebRTC] ICE connection state changed:', state);
        
        if (state === 'disconnected') {
          console.warn('[WebRTC] ICE disconnected, waiting for recovery...');
          // 给 15 秒恢复时间（移动网络切换 WiFi↔4G 需要更长时间）
          this.iceRecoveryTimeout = setTimeout(() => {
            if (this.pc?.iceConnectionState === 'disconnected' || 
                this.pc?.iceConnectionState === 'failed') {
              console.error('[WebRTC] ICE failed to recover after 15s, disconnecting');
              this.disconnect();
            }
          }, 15000);
        } else if (state === 'failed') {
          // ICE failed 也给一次恢复机会（10 秒），而非立即断开
          console.warn('[WebRTC] ICE connection failed, waiting 10s for recovery...');
          this.iceRecoveryTimeout = setTimeout(() => {
            if (this.pc?.iceConnectionState === 'failed') {
              console.error('[WebRTC] ICE still failed after 10s, disconnecting');
              this.disconnect();
            }
          }, 10000);
        } else if (state === 'connected' || state === 'completed') {
          // 连接恢复，清除恢复超时
          if (this.iceRecoveryTimeout) {
            clearTimeout(this.iceRecoveryTimeout);
            this.iceRecoveryTimeout = null;
          }
        }
      };

      // 🔧 连接状态变化监控（补充 ICE 状态）
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState;
        console.log('[WebRTC] Connection state changed:', state);
        
        if (state === 'failed') {
          // 给 10 秒恢复时间而非立即断开
          console.warn('[WebRTC] Connection state failed, waiting 10s...');
          setTimeout(() => {
            if (this.pc?.connectionState === 'failed') {
              console.error('[WebRTC] Connection still failed after 10s');
              this.disconnect();
            }
          }, 10000);
        } else if (state === 'closed') {
          console.error('[WebRTC] Connection state closed');
          this.disconnect();
        }
      };

      // 设置远程音频 + Web Audio 后处理（压缩器+增益），解决远端语音忽大忽小
      this.pc.ontrack = e => {
        if (!this.audioEl || this.isDisconnected) return;
        const remoteStream = e.streams[0];
        // 必须先把流挂到 <audio>，iOS Safari 才会真正拉取 WebRTC 远端 RTP；
        // 然后静音 <audio>，由 Web Audio 链路出声，避免双声道叠加。
        this.audioEl.srcObject = remoteStream;
        try {
          this.setupPlaybackProcessing(remoteStream);
        } catch (err) {
          console.warn('[WebRTC] playback processing setup failed, fallback to raw audio element:', err);
          if (this.audioEl) this.audioEl.muted = false;
        }
      };

      // 添加本地音频轨道
      this.pc.addTrack(this.localStream.getTracks()[0]);

      // 🎙️ PTT 预设：addTrack 后立即静音，避免远端 VAD 收到任何声音
      if (this.pttPreset) {
        try { this.setMicMuted(true); } catch {}
      } else {
        // 🔧 连续通话兜底：显式 enable，防止部分浏览器（Windows Chrome/Edge 触屏笔电）
        // 在 addTrack 后保持 track.enabled=false 或缓存流被上一次 PTT 静音后未恢复
        try { this.ensureMicEnabled(); } catch {}
      }

      // 设置数据通道
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dcOpenHandler = () => {
        if (!this.isDisconnected) {
          console.log('[WebRTC] Data channel opened:', performance.now() - startTime, 'ms');
          this.lastDataChannelActivity = Date.now();

          // 🎙️ PTT 预设：强制关闭服务端 VAD（必须在 pendingSessionConfig 前/后都覆盖一次）
          if (this.pttPreset) {
            try { this.setMicMuted(true); } catch {}
            try {
              this.dc.send(JSON.stringify({
                type: 'session.update',
                session: { type: 'realtime', turn_detection: null },
              }));
              console.log('[WebRTC][PTT] turn_detection forced to null at dc open');
            } catch (e) {
              console.warn('[WebRTC][PTT] preset session.update failed:', e);
            }
          }

          // 🚀 快路径：推送完整 session 配置（instructions/tools），覆盖最简占位配置
          if (this.pendingSessionConfig && this.dc?.readyState === 'open') {
            try {
              const sessionPayload = this.pttPreset
                ? { type: 'realtime', ...this.pendingSessionConfig, turn_detection: null }
                : { type: 'realtime', ...this.pendingSessionConfig };
              this.dc.send(JSON.stringify({
                type: 'session.update',
                session: sessionPayload,
              }));
              console.log('[WebRTC] Pending session config pushed:', performance.now() - startTime, 'ms', this.pttPreset ? '(PTT: VAD off)' : '');
              this.pendingSessionConfig = null;
            } catch (e) {
              console.warn('[WebRTC] Failed to push pending session config:', e);
            }
          }

          // 🎬 PTT + 场景开场白：dc 打开后立即触发 AI 念开场白（独立于 setPushToTalkMode 调用时机）
          if (this.pttPreset && this.scenarioOpening && this.dc?.readyState === 'open') {
            const opening = this.scenarioOpening;
            this.scenarioOpening = null;
            try {
              this.dc.send(JSON.stringify({
                type: 'response.create',
                response: {
                  modalities: ['audio', 'text'],
                  instructions: `请用温暖自然的语气作为开场说出（不要任何前缀或解释，直接说这句话）：${opening}`,
                },
              }));
              console.log('[WebRTC][PTT] scenario opening triggered at dc open:', opening);
            } catch (e) {
              console.warn('[WebRTC][PTT] failed to trigger scenario opening:', e);
            }
          }

          // 🔧 启动活动检测：每 30 秒检测一次数据通道活动
          this.activityCheckInterval = setInterval(() => {
            const inactiveTime = Date.now() - this.lastDataChannelActivity;
            // 4 分钟无活动视为异常（用户可能在思考，AI 也可能长时间无响应）
            if (inactiveTime > 240000) {
              console.warn('[WebRTC] Data channel inactive for 4 minutes, disconnecting');
              this.disconnect();
            }
          }, 30000);
          
          this.onStatusChange('connected');
        }
      };

      this.dcCloseHandler = () => {
        if (!this.isDisconnected) {
          console.log('[WebRTC] Data channel closed unexpectedly');
          this.onStatusChange('disconnected');
        }
      };

      this.dcMessageHandler = (e: MessageEvent) => {
        if (this.isDisconnected) return;
        this.lastDataChannelActivity = Date.now(); // 🔧 更新活动时间
        try {
          const event = JSON.parse(e.data);
          this.handleEvent(event);
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      };

      this.dc.addEventListener("open", this.dcOpenHandler);
      this.dc.addEventListener("close", this.dcCloseHandler);
      this.dc.addEventListener("message", this.dcMessageHandler);

      // 创建 offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log('[WebRTC] Offer created:', performance.now() - startTime, 'ms');

      // 连接到 OpenAI Realtime API
      const model = "gpt-4o-mini-realtime-preview";
      console.log('[WebRTC] Connecting to:', realtimeApiUrl);
      
      const sdpResponse = await fetch(`${realtimeApiUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      console.log('[WebRTC] SDP response received:', performance.now() - startTime, 'ms');

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('[WebRTC] SDP error:', sdpResponse.status, errorText);
        
        // 🔧 解析具体错误类型
        let errorType = 'unknown';
        let errorMessage = 'Failed to connect to OpenAI Realtime API';
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.code === 'unsupported_country_region_territory') {
            errorType = 'region_blocked';
            errorMessage = '当前网络环境不支持直连语音服务，正在尝试备用通道...';
          } else if (errorJson.error?.code === 'invalid_api_key') {
            errorType = 'auth_error';
            errorMessage = '语音服务认证失败，请稍后重试';
          } else if (sdpResponse.status === 403) {
            errorType = 'forbidden';
            errorMessage = '语音服务访问被拒绝，正在尝试备用通道...';
          } else if (sdpResponse.status === 429) {
            errorType = 'rate_limited';
            errorMessage = '服务繁忙，请稍后重试';
          }
        } catch {
          // JSON 解析失败，使用默认错误
          if (sdpResponse.status === 403) {
            errorType = 'forbidden';
            errorMessage = '语音服务访问受限，正在尝试备用通道...';
          }
        }
        
        // 抛出带类型的错误
        const error = new Error(errorMessage) as Error & { errorType?: string; statusCode?: number };
        error.errorType = errorType;
        error.statusCode = sdpResponse.status;
        throw error;
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      // 🔧 防御：SDP 等待期间可能被外部 disconnect() 清空 pc，避免 setRemoteDescription on null
      if (!this.pc || this.isDisconnected) {
        console.warn('[WebRTC] pc was nulled during SDP wait, aborting silently');
        throw new Error('连接已被取消');
      }
      
      await this.pc.setRemoteDescription(answer);
      console.log('[WebRTC] Connection established:', performance.now() - startTime, 'ms');

    } catch (error) {
      console.error("Error initializing chat:", error);
      this.onStatusChange('error');
      throw error;
    }
  }

  // 提取麦克风请求为独立方法，便于并行调用
  private async requestMicrophoneAccess(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
    } catch (micError: any) {
      console.error('Microphone access error:', micError);
      
      if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const tip = isIOS 
          ? '请前往"设置 > Safari > 麦克风"允许访问，然后刷新页面重试。'
          : '请在浏览器地址栏左侧点击锁定图标，允许麦克风权限，然后刷新页面。';
        throw new Error(`麦克风权限被拒绝。${tip}`);
      } else if (micError.name === 'NotFoundError' || micError.name === 'DevicesNotFoundError') {
        throw new Error('未检测到麦克风设备。请确保设备已连接并正常工作。');
      } else if (micError.name === 'NotReadableError' || micError.name === 'TrackStartError') {
        throw new Error('麦克风被其他应用占用，请关闭其他正在使用麦克风的应用后重试。');
      } else if (micError.name === 'OverconstrainedError') {
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          throw new Error('麦克风不支持所需的音频格式，请尝试使用其他设备。');
        }
      } else if (micError.name === 'SecurityError') {
        throw new Error('安全限制：请确保使用 HTTPS 访问，或在本地开发环境中使用。');
      } else {
        throw new Error(`麦克风访问失败: ${micError.message || micError.name || '未知错误'}`);
      }
    }
  }

  private handleEvent(event: any) {
    // 如果已断开，忽略所有事件
    if (this.isDisconnected) return;
    
    this.onMessage(event);

    switch (event.type) {
      case 'response.created':
        // 🔇 新一轮 response 开始，恢复音频播放（PTT 打断后的下一句应该能听见）
        if (this.audioMutedUntilNextResponse) {
          this.audioMutedUntilNextResponse = false;
          if (this.audioEl) {
            try { this.audioEl.muted = false; } catch {}
          }
          console.log('[PTT] audio unmuted on response.created');
        }
        break;

      case 'response.audio.delta':
        // 处理音频数据（通过 WebRTC track 自动播放）
        break;
      
      case 'response.audio_transcript.delta':
        // AI 回复的文字
        if (event.delta) {
          this.onTranscript(event.delta, false, 'assistant');
        }
        break;

      case 'response.audio_transcript.done':
        // AI 回复完成
        if (event.transcript) {
          this.onTranscript(event.transcript, true, 'assistant');
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // 用户语音转文字完成
        if (event.transcript) {
          const raw = String(event.transcript).trim();
          // 🔧 中文过滤：避免噪音被识别为韩/日/英文乱码送入对话
          // 规则：去掉空白和标点后，若全无中文且总长度<10或非中文占比>60%，丢弃
          const stripped = raw.replace(/[\s\p{P}\p{S}]/gu, '');
          const chineseChars = (stripped.match(/[\u4e00-\u9fff]/g) || []).length;
          const totalChars = stripped.length;
          const hasChinese = chineseChars > 0;
          const nonChineseRatio = totalChars > 0 ? (totalChars - chineseChars) / totalChars : 0;
          const looksLikeNoise =
            totalChars === 0 ||
            (!hasChinese) ||
            (nonChineseRatio > 0.6 && totalChars < 20);
          if (looksLikeNoise) {
            console.log('[Transcript] dropped non-Chinese / noise transcript:', raw);
            break;
          }
          this.onTranscript(raw, true, 'user');
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        break;

      case 'response.done':
        // Response completed - extract usage data
        if (event.response?.usage) {
          const usage = event.response.usage;
          console.log('[RealtimeChat] Usage:', usage);
          this.onMessage({
            type: 'usage_update',
            usage: {
              input_tokens: usage.input_tokens || 0,
              output_tokens: usage.output_tokens || 0,
              total_tokens: usage.total_tokens || 0
            }
          });
        }
        break;

      case 'response.function_call_arguments.done':
        // 工具调用完成，执行工具
        console.log('Tool call:', event.name, event.arguments);
        this.executeToolCall(event.name, event.arguments, event.call_id);
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        break;
    }
  }

  // 执行工具调用
  private async executeToolCall(toolName: string, argsString: string, callId: string) {
    try {
      const args = JSON.parse(argsString);
      console.log(`Executing tool: ${toolName}`, args);

      // 调用后端 life-coach-tools
      const { data, error } = await supabase.functions.invoke('life-coach-tools', {
        body: { tool: toolName, params: args }
      });

      if (error) {
        console.error('Tool execution error:', error);
        
        // 检查是否是认证错误
        const isAuthError = error.message?.includes('401') || 
                           error.message?.includes('未授权') || 
                           error.message?.includes('身份验证');
        
        if (isAuthError) {
          // 通知前端认证错误
          this.onMessage({ 
            type: 'tool_error', 
            tool: toolName, 
            error: '登录已过期，请重新登录',
            requiresAuth: true
          });
        }
        
        throw error;
      }

      console.log('Tool result:', data);

      // 发送工具执行结果回 OpenAI
      if (this.dc && this.dc.readyState === 'open') {
        this.dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify(data)
          }
        }));

        // 触发 AI 继续响应
        this.dc.send(JSON.stringify({ type: 'response.create' }));
      }

      // 通知前端显示状态
      this.onMessage({ 
        type: 'tool_executed', 
        tool: toolName, 
        result: data,
        args: args
      });

      // 检查是否是教练推荐（显示卡片，不自动导航）
      if (data?.action === 'show_coach_recommendation') {
        this.onMessage({
          type: 'coach_recommendation',
          coach_type: data.coach_type,
          coach_name: data.coach_name,
          coach_route: data.coach_route,
          description: data.description,
          reason: data.reason,
          message: data.message,
          navigation: data.navigation
        });
      }

      // 检查是否是导航动作
      if (data?.action === 'navigate' && data?.path) {
        this.onMessage({
          type: 'navigation_request',
          path: data.path,
          name: data.name || data.coach_name,
          message: data.message
        });
      }

      // 检查是否是搜索结果
      if (data?.action === 'show_search_results' && data?.posts) {
        this.onMessage({
          type: 'search_results',
          keyword: data.keyword,
          posts: data.posts,
          message: data.message,
          navigation: data.navigation
        });
      }

      // 检查是否是课程推荐
      if (data?.action === 'show_course_recommendations' && data?.courses) {
        this.onMessage({
          type: 'course_recommendations',
          topic: data.topic,
          courses: data.courses,
          message: data.message,
          navigation: data.navigation
        });
      }

      // 检查是否是训练营推荐
      if (data?.action === 'show_camp_recommendations' && data?.camps) {
        this.onMessage({
          type: 'camp_recommendations',
          goal: data.goal,
          camps: data.camps,
          message: data.message,
          navigation: data.navigation
        });
      }

      // 检查是否是简报保存成功
      if (data?.action === 'briefing_saved' && data?.briefing_id) {
        this.onMessage({
          type: 'briefing_saved',
          briefing_id: data.briefing_id,
          conversation_id: data.conversation_id,
          briefing_data: data.briefing_data,
          message: data.message
        });
      }

    } catch (error: any) {
      console.error('Tool execution error:', error);
      
      // 检查是否是认证错误
      const isAuthError = error?.message?.includes('401') || 
                         error?.message?.includes('未授权') || 
                         error?.message?.includes('身份验证');
      
      if (isAuthError) {
        // 通知前端认证错误
        this.onMessage({ 
          type: 'tool_error', 
          tool: toolName, 
          error: '登录已过期，请重新登录',
          requiresAuth: true
        });
      }
      
      // 发送错误结果回 OpenAI
      if (this.dc && this.dc.readyState === 'open') {
        this.dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify({ error: '工具执行失败' })
          }
        }));
        this.dc.send(JSON.stringify({ type: 'response.create' }));
      }
    }
  }

  // ============= Push-to-Talk 支持 =============
  private pttMode: boolean = false;
  private pttRecordingStart: number = 0;
  private static readonly PTT_MIN_RECORDING_MS = 300;
  // 🔇 PTT 抢话打断：按下时静音音频元素（保留文字气泡），下一次 response.created 时复位
  private audioMutedUntilNextResponse: boolean = false;

  /** 设置麦克风轨道启用/禁用（不停止流） */
  private setMicMuted(muted: boolean): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  /**
   * 公开的"确保麦克风开启"方法
   * 用于连续通话模式下，外部组件强制启用麦克风轨道，
   * 防止某些浏览器在 addTrack 后保持静音或缓存流被上次 PTT 残留状态污染。
   */
  public ensureMicEnabled(): void {
    if (this.pttMode || this.pttPreset) return; // PTT 模式下不要强制开麦
    try { this.setMicMuted(false); } catch {}
  }

  /**
   * 切换 Push-to-Talk 模式
   * - enabled=true: 关闭服务端 VAD，麦克风默认静音
   * - enabled=false: 恢复服务端 VAD，麦克风启用
   */
  public setPushToTalkMode(enabled: boolean): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('[PTT] data channel not open, deferring mode set');
      return;
    }
    this.pttMode = enabled;
    try {
      this.dc.send(JSON.stringify({
        type: 'session.update',
        session: {
          type: 'realtime',
          turn_detection: enabled
            ? null
            : { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 }
        }
      }));
      this.setMicMuted(enabled); // PTT 默认静音；VAD 默认开启
      console.log('[PTT] mode set to', enabled ? 'push_to_talk' : 'vad');

      // 🎬 PTT 模式下，若有场景开场白，主动让 AI 念出第一句（仅触发一次）
      if (enabled && this.scenarioOpening && this.dc?.readyState === 'open') {
        const opening = this.scenarioOpening;
        this.scenarioOpening = null;
        try {
          this.dc.send(JSON.stringify({
            type: 'response.create',
            response: {
              modalities: ['audio', 'text'],
              instructions: `请用温暖自然的语气作为开场说出（不要任何前缀或解释，直接说这句话）：${opening}`,
            },
          }));
          console.log('[PTT] scenario opening triggered:', opening);
        } catch (e) {
          console.warn('[PTT] failed to trigger scenario opening:', e);
        }
      }
    } catch (e) {
      console.error('[PTT] setPushToTalkMode error:', e);
    }
  }

  /** 按下说话：清空缓冲并开启麦克风；同时打断 AI 当前语音播放（保留文本继续显示） */
  public startRecording(): { ok: boolean; reason?: string } {
    if (!this.pttMode) return { ok: false, reason: 'not_in_ptt_mode' };
    if (!this.dc || this.dc.readyState !== 'open') {
      return { ok: false, reason: 'channel_not_open' };
    }
    try {
      // 🔇 立刻打断 AI 语音播放（仅音频，不取消 response，文本继续生成补全到气泡）
      try {
        this.audioMutedUntilNextResponse = true;
        if (this.audioEl) {
          this.audioEl.muted = true;
        }
        // 远端：清空已发出但未播放的服务端音频缓冲
        this.dc.send(JSON.stringify({ type: 'output_audio_buffer.clear' }));
      } catch (e) {
        console.warn('[PTT] interrupt audio failed:', e);
      }

      this.dc.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
      this.pttRecordingStart = Date.now();
      this.setMicMuted(false);
      console.log('[PTT] startRecording (audio interrupted, text preserved)');
      return { ok: true };
    } catch (e) {
      console.error('[PTT] startRecording error:', e);
      return { ok: false, reason: 'send_failed' };
    }
  }

  /** 松开发送：commit 缓冲并触发响应；过短录音丢弃 */
  public stopRecording(): { ok: boolean; reason?: string } {
    if (!this.pttMode) return { ok: false, reason: 'not_in_ptt_mode' };
    if (!this.dc || this.dc.readyState !== 'open') {
      this.setMicMuted(true);
      return { ok: false, reason: 'channel_not_open' };
    }
    const duration = Date.now() - this.pttRecordingStart;
    // 始终先重新静音，避免后续环境音被采集
    this.setMicMuted(true);
    if (duration < RealtimeChat.PTT_MIN_RECORDING_MS) {
      try {
        this.dc.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
      } catch {}
      console.warn('[PTT] recording too short, discarded');
      return { ok: false, reason: 'too_short' };
    }
    try {
      this.dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      this.dc.send(JSON.stringify({ type: 'response.create' }));
      console.log('[PTT] stopRecording committed,', duration, 'ms');
      return { ok: true };
    } catch (e) {
      console.error('[PTT] stopRecording error:', e);
      return { ok: false, reason: 'send_failed' };
    }
  }

  sendTextMessage(text: string) {
    if (this.isDisconnected || !this.dc || this.dc.readyState !== 'open') {
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect() {
    // 防止重复断开
    if (this.isDisconnected) {
      console.log('RealtimeChat: already disconnected');
      return;
    }
    this.isDisconnected = true;
    console.log('RealtimeChat: disconnecting...');
    
    // 🔧 清理 ICE 恢复超时
    if (this.iceRecoveryTimeout) {
      clearTimeout(this.iceRecoveryTimeout);
      this.iceRecoveryTimeout = null;
    }
    
    // 🔧 清理活动检测定时器
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    
    // 🔧 增强断开可靠性：每个步骤都包裹 try-catch
    
    // 1. 停止录音器
    try {
      this.recorder?.stop();
      this.recorder = null;
      console.log('RealtimeChat: recorder stopped');
    } catch (e) {
      console.error('RealtimeChat: error stopping recorder:', e);
    }
    
    // 2. 停止本地麦克风流
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          try {
            track.stop();
            console.log('Stopped local stream track:', track.kind);
          } catch (trackErr) {
            console.error('Error stopping track:', trackErr);
          }
        });
        this.localStream = null;
      }
    } catch (e) {
      console.error('RealtimeChat: error stopping local stream:', e);
    }
    
    // 3. 停止音频元素播放
    try {
      if (this.audioEl) {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
        if (this.audioEl.srcObject) {
          const stream = this.audioEl.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            try {
              track.stop();
              console.log('Stopped audio element track:', track.kind);
            } catch (trackErr) {
              console.error('Error stopping audio track:', trackErr);
            }
          });
          this.audioEl.srcObject = null;
        }
        this.audioEl = null;
      }
    } catch (e) {
      console.error('RealtimeChat: error stopping audio element:', e);
    }
    
    // 4. 关闭数据通道并移除事件监听器
    try {
      if (this.dc) {
        // 移除所有事件监听器
        if (this.dcMessageHandler) {
          this.dc.removeEventListener("message", this.dcMessageHandler);
          this.dcMessageHandler = null;
        }
        if (this.dcOpenHandler) {
          this.dc.removeEventListener("open", this.dcOpenHandler);
          this.dcOpenHandler = null;
        }
        if (this.dcCloseHandler) {
          this.dc.removeEventListener("close", this.dcCloseHandler);
          this.dcCloseHandler = null;
        }
        this.dc.close();
        this.dc = null;
        console.log('RealtimeChat: data channel closed');
      }
    } catch (e) {
      console.error('RealtimeChat: error closing data channel:', e);
    }
    
    // 5. 关闭 WebRTC 连接并停止所有轨道
    try {
      if (this.pc) {
        // 停止所有发送的轨道（麦克风）
        this.pc.getSenders().forEach(sender => {
          if (sender.track) {
            try {
              sender.track.stop();
              console.log('Stopped sender track:', sender.track.kind);
            } catch (trackErr) {
              console.error('Error stopping sender track:', trackErr);
            }
          }
        });
        
        // 停止所有接收的轨道（远程音频）
        this.pc.getReceivers().forEach(receiver => {
          if (receiver.track) {
            try {
              receiver.track.stop();
              console.log('Stopped receiver track:', receiver.track.kind);
            } catch (trackErr) {
              console.error('Error stopping receiver track:', trackErr);
            }
          }
        });
        
        this.pc.close();
        this.pc = null;
        console.log('RealtimeChat: peer connection closed');
      }
    } catch (e) {
      console.error('RealtimeChat: error closing peer connection:', e);
    }
    
    this.onStatusChange('disconnected');
    console.log('RealtimeChat: disconnected successfully');
  }
}
