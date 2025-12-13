import { supabase } from "@/integrations/supabase/client";

// ============= Token 缓存管理 =============
interface CachedToken {
  token: string;
  realtimeUrl: string;
  expiresAt: number; // 时间戳
}

const TOKEN_CACHE_KEY = 'realtime_token_cache';
const TOKEN_TTL_MS = 50 * 1000; // Token 有效期 50秒（OpenAI ephemeral token 有效期 60秒，留10秒缓冲）

// 获取缓存的 token
function getCachedToken(endpoint: string): CachedToken | null {
  try {
    const cacheKey = `${TOKEN_CACHE_KEY}_${endpoint}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data: CachedToken = JSON.parse(cached);
    
    // 检查是否过期
    if (Date.now() >= data.expiresAt) {
      sessionStorage.removeItem(cacheKey);
      console.log('[TokenCache] Token expired, removed from cache');
      return null;
    }
    
    console.log('[TokenCache] Using cached token, expires in', Math.round((data.expiresAt - Date.now()) / 1000), 's');
    return data;
  } catch {
    return null;
  }
}

// 缓存 token
function setCachedToken(endpoint: string, token: string, realtimeUrl: string): void {
  try {
    const cacheKey = `${TOKEN_CACHE_KEY}_${endpoint}`;
    const data: CachedToken = {
      token,
      realtimeUrl,
      expiresAt: Date.now() + TOKEN_TTL_MS
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.log('[TokenCache] Token cached for', TOKEN_TTL_MS / 1000, 's');
  } catch (e) {
    console.warn('[TokenCache] Failed to cache token:', e);
  }
}

// 清除 token 缓存
export function clearTokenCache(endpoint?: string): void {
  try {
    if (endpoint) {
      sessionStorage.removeItem(`${TOKEN_CACHE_KEY}_${endpoint}`);
    } else {
      // 清除所有 token 缓存
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(TOKEN_CACHE_KEY)) {
          sessionStorage.removeItem(key);
        }
      });
    }
    console.log('[TokenCache] Cache cleared');
  } catch (e) {
    console.warn('[TokenCache] Failed to clear cache:', e);
  }
}

// ============= 麦克风权限预检查 =============
let micPermissionGranted: boolean | null = null;

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
      this.processor.connect(this.audioContext.destination);
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
  private localStream: MediaStream | null = null;
  private isDisconnected: boolean = false;
  
  // 保存事件处理函数引用以便移除
  private dcMessageHandler: ((e: MessageEvent) => void) | null = null;
  private dcOpenHandler: (() => void) | null = null;
  private dcCloseHandler: (() => void) | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void,
    tokenEndpoint: string = 'realtime-token'
  ) {
    this.tokenEndpoint = tokenEndpoint;
  }

  async init() {
    try {
      this.isDisconnected = false;
      this.onStatusChange('connecting');
      
      const startTime = performance.now();
      console.log('[WebRTC] Starting connection...');
      
      // 创建音频元素
      this.audioEl = document.createElement("audio");
      this.audioEl.autoplay = true;

      // 🚀 优化1：检查 token 缓存
      const cachedToken = getCachedToken(this.tokenEndpoint);
      
      let EPHEMERAL_KEY: string;
      let realtimeApiUrl: string;

      if (cachedToken) {
        console.log('[WebRTC] Using cached token:', performance.now() - startTime, 'ms');
        EPHEMERAL_KEY = cachedToken.token;
        realtimeApiUrl = cachedToken.realtimeUrl;
        
        // 只需要获取麦克风权限
        this.localStream = await this.requestMicrophoneAccess();
        console.log('[WebRTC] Microphone ready:', performance.now() - startTime, 'ms');
      } else {
        // 🚀 优化2：并行执行 token 获取和麦克风权限请求
        const [tokenResult, micResult] = await Promise.all([
          // 获取临时令牌
          supabase.functions.invoke(this.tokenEndpoint).then(result => {
            console.log('[WebRTC] Token fetched:', performance.now() - startTime, 'ms');
            return result;
          }),
          // 同时请求麦克风权限
          this.requestMicrophoneAccess().then(stream => {
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
        
        // 缓存 token
        setCachedToken(this.tokenEndpoint, EPHEMERAL_KEY, realtimeApiUrl);

        // 保存麦克风流
        this.localStream = micResult;
      }

      // 创建 WebRTC 连接 - 使用优化的 ICE 配置
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10, // 预分配 ICE 候选池
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });

      // 设置远程音频
      this.pc.ontrack = e => {
        if (this.audioEl && !this.isDisconnected) {
          this.audioEl.srcObject = e.streams[0];
        }
      };

      // 添加本地音频轨道
      this.pc.addTrack(this.localStream.getTracks()[0]);

      // 设置数据通道
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dcOpenHandler = () => {
        if (!this.isDisconnected) {
          console.log('[WebRTC] Data channel opened:', performance.now() - startTime, 'ms');
          this.onStatusChange('connected');
        }
      };

      this.dcCloseHandler = () => {
        if (!this.isDisconnected) {
          this.onStatusChange('disconnected');
        }
      };

      this.dcMessageHandler = (e: MessageEvent) => {
        if (this.isDisconnected) return;
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
      const model = "gpt-4o-realtime-preview-2024-12-17";
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
        console.error('[WebRTC] SDP error:', errorText);
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
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
          this.onTranscript(event.transcript, true, 'user');
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        break;

      case 'input_audio_buffer.speech_stopped':
        // User stopped speaking
        break;

      case 'response.done':
        // Response completed
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
    
    // 停止录音器
    this.recorder?.stop();
    this.recorder = null;
    
    // 停止本地麦克风流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped local stream track:', track.kind);
      });
      this.localStream = null;
    }
    
    // 停止音频元素播放
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      if (this.audioEl.srcObject) {
        const stream = this.audioEl.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped audio element track:', track.kind);
        });
        this.audioEl.srcObject = null;
      }
      this.audioEl = null;
    }
    
    // 关闭数据通道并移除事件监听器
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
    }
    
    // 关闭 WebRTC 连接并停止所有轨道
    if (this.pc) {
      // 停止所有发送的轨道（麦克风）
      this.pc.getSenders().forEach(sender => {
        if (sender.track) {
          sender.track.stop();
          console.log('Stopped sender track:', sender.track.kind);
        }
      });
      
      // 停止所有接收的轨道（远程音频）
      this.pc.getReceivers().forEach(receiver => {
        if (receiver.track) {
          receiver.track.stop();
          console.log('Stopped receiver track:', receiver.track.kind);
        }
      });
      
      this.pc.close();
      this.pc = null;
    }
    
    
    this.onStatusChange('disconnected');
    console.log('RealtimeChat: disconnected successfully');
  }
}
