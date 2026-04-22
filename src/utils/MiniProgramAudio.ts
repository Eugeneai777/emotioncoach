/**
 * 小程序专用音频客户端
 * 使用 WebSocket 连接 Edge Function 中继服务器，实现与 OpenAI Realtime API 的通信
 * 
 * 架构：
 * 小程序 wx.录音API <-> WebSocket <-> Edge Function <-> OpenAI Realtime API
 */

import { supabase } from '@/integrations/supabase/client';
// wx 类型已在 platform.ts 中统一声明
import '@/utils/platform';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MiniProgramAudioConfig {
  onMessage: (message: any) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  onUsageUpdate?: (usage: { input_tokens: number; output_tokens: number }) => void;
  tokenEndpoint: string;
  mode: string;
  scenario?: string; // 场景名称，如 "睡不着觉"
  extraBody?: Record<string, any>; // 额外传递给 token 端点的数据
  preAcquiredStream?: MediaStream | null;
}

interface AudioChunk {
  type: 'audio_input';
  audio: string; // Base64 encoded PCM16 audio
}

interface ServerMessage {
  type: string;
  text?: string;
  audio?: string;
  isFinal?: boolean;
  role?: 'user' | 'assistant';
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

export class MiniProgramAudioClient {
  private ws: WebSocket | null = null;
  private recorder: any = null;
  private audioPlayer: any = null;
  private audioQueue: string[] = [];
  private isPlaying = false;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private config: MiniProgramAudioConfig;
  
  // 🔧 Web Audio API 降级录音相关
  private webAudioContext: AudioContext | null = null;
  private webMediaStream: MediaStream | null = null;
  private webProcessor: ScriptProcessorNode | null = null;
  private webSource: MediaStreamAudioSourceNode | null = null;
  private useWebAudioFallback = false;
  private preAcquiredStream: MediaStream | null = null;
  
  // 🔧 复用播放 AudioContext 提升音质
  private playbackContext: AudioContext | null = null;
  
  // 🔧 心跳延迟追踪
  private lastPingTime: number = 0;
  private lastPongTime: number = 0; // 🔧 修复：新增 pong 时间戳
  private latency: number = 0; // 保留 latency 用于 getLatency()
  
  // 🔧 心跳超时检测
  private missedPongs: number = 0;
  
  // 🔧 音频健康监控
  private audioHealthInterval: ReturnType<typeof setInterval> | null = null;
  private lastAudioEnergyTime: number = 0; // 上次检测到音频能量的时间
  private silentFrameCount: number = 0; // 连续静音帧计数
  
  // 🔧 iOS 可见性监听
  private visibilityHandler: (() => void) | null = null;

  // 🎙️ PTT 模式：音频送出闸门 + 服务端 VAD 关闭
  private pttPreset: boolean = false;
  private pttMuted: boolean = true;     // PTT 模式下默认静音，按住时打开
  private pttRecordingStart: number = 0;
  private static readonly PTT_MIN_RECORDING_MS = 300;

  /** 在 connect() 之前调用：声明 PTT 模式，使 ws open 时立刻通知 relay 关闭 VAD，并启用音频闸门 */
  public presetPushToTalk(enabled: boolean): void {
    this.pttPreset = enabled;
    this.pttMuted = enabled;  // 默认静音
  }

  /** 按住说话：打开闸门，让本地音频开始流向 relay */
  public pttStart(): { ok: boolean; reason?: string } {
    if (!this.pttPreset) return { ok: false, reason: 'not_in_ptt_mode' };
    this.pttMuted = false;
    this.pttRecordingStart = Date.now();
    // 通知 relay 清空缓冲
    try {
      this.ws?.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
    } catch {}
    return { ok: true };
  }

  /** 松开发送：关闭闸门，commit 缓冲并请求响应 */
  public pttStop(): { ok: boolean; reason?: string } {
    if (!this.pttPreset) return { ok: false, reason: 'not_in_ptt_mode' };
    const duration = Date.now() - this.pttRecordingStart;
    this.pttMuted = true;
    if (duration < MiniProgramAudioClient.PTT_MIN_RECORDING_MS) {
      try {
        this.ws?.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
      } catch {}
      return { ok: false, reason: 'too_short' };
    }
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        this.ws.send(JSON.stringify({ type: 'response.create' }));
      }
    } catch (e) {
      console.warn('[MiniProgramAudio][PTT] commit failed:', e);
      return { ok: false, reason: 'send_failed' };
    }
    return { ok: true };
  }

  constructor(config: MiniProgramAudioConfig) {
    this.config = config;
    this.preAcquiredStream = config.preAcquiredStream ?? null;
  }

  /**
   * 连接到 WebSocket 中继服务器
   */
  async connect(): Promise<void> {
    try {
      this.updateStatus('connecting');

      // 1. 获取 ephemeral token
      const token = await this.getEphemeralToken();
      if (!token) {
        throw new Error('Failed to get ephemeral token');
      }

      // 2. 构建 WebSocket URL
      const wsUrl = this.buildWebSocketUrl(token);

      // 3. 建立 WebSocket 连接
      await this.establishWebSocket(wsUrl);

      // 4. 初始化录音器
      await this.initRecorder();

      // 5. 初始化播放器
      this.initAudioPlayer();

      // 6. 启动心跳
      this.startHeartbeat();
      
      // 7. 🔧 监听页面可见性变化（iOS 小程序后台恢复时 resume AudioContext）
      this.setupVisibilityListener();
      
      // 8. 🔧 启动音频健康监控（检测麦克风流/AudioContext 静默失效）
      this.startAudioHealthMonitor();

      this.updateStatus('connected');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('[MiniProgramAudio] Connection failed:', error);
      this.updateStatus('error');
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopAudioHealthMonitor();
    this.stopRecording();
    this.stopAudioPlayback();
    this.removeVisibilityListener();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }

  /**
   * 开始录音
   */
  startRecording(): void {
    if (this.useWebAudioFallback) {
      // Web Audio API 模式：录音已在初始化时自动开始
      console.log('[MiniProgramAudio] Web Audio recording already started');
      return;
    }
    
    if (!this.recorder) {
      console.error('[MiniProgramAudio] Recorder not initialized');
      return;
    }

    const wx = window.wx;
    if (!wx) return;

    // ✅ 修复：duration 从 60000ms 增加到 600000ms（10分钟）
    // 小程序 recorderManager 最长支持 10 分钟录音
    this.recorder.start({
      duration: 600000, // 最长 10 分钟（从 60 秒增加）
      sampleRate: 24000, // 24kHz 采样率（OpenAI 要求）
      numberOfChannels: 1, // 单声道
      encodeBitRate: 96000, // 提高码率，改善音质
      format: 'PCM', // PCM 格式
      frameSize: 6, // 每帧 6KB，减少分片和网络开销
    });
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    // 停止 Web Audio API 录音
    if (this.useWebAudioFallback) {
      this.stopWebAudioRecording();
      return;
    }
    
    if (this.recorder) {
      try {
        this.recorder.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  }

  /**
   * 发送文本消息
   */
  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[MiniProgramAudio] WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'text_input',
      text,
    }));
  }

  /**
   * 获取当前状态
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // ==================== Private Methods ====================

  // 存储 token 端点返回的个性化 instructions
  private cachedInstructions: string | null = null;

  private async getEphemeralToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke(this.config.tokenEndpoint, {
        body: { 
          mode: this.config.mode,
          scenario: this.config.scenario,
          ...this.config.extraBody
        },
      });

      if (error) {
        console.error('[MiniProgramAudio] Token error:', error);
        return null;
      }

      // 保存个性化 instructions（如果 token 端点返回了）
      if (data?.instructions) {
        this.cachedInstructions = data.instructions;
        console.log('[MiniProgramAudio] Saved personalized instructions from token endpoint');
      }

      return data?.client_secret?.value || null;
    } catch (error) {
      console.error('[MiniProgramAudio] Token fetch failed:', error);
      return null;
    }
  }

  private buildWebSocketUrl(token: string): string {
    // 使用 Supabase Edge Function 的 WebSocket 端点
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const baseUrl = `wss://${projectId}.supabase.co/functions/v1/miniprogram-voice-relay`;
    
    // 将 token 和 mode 作为查询参数
    const params = new URLSearchParams({
      token,
      mode: this.config.mode,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private establishWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[MiniProgramAudio] WebSocket connected');

        // 把 voice_type / instructions 一起发给 relay，确保 relay 能正确选择音色
        const voiceType = (this.config.extraBody as any)?.voice_type;
        if ((this.cachedInstructions || voiceType || this.pttPreset) && this.ws) {
          console.log('[MiniProgramAudio] Sending session_config (instructions + voice_type + ptt)', { hasInstructions: !!this.cachedInstructions, voiceType, ptt: this.pttPreset });
          this.ws.send(JSON.stringify({
            type: 'session_config',
            instructions: this.cachedInstructions ?? undefined,
            voice_type: voiceType,
            // 🎙️ PTT 模式：通知 relay 关闭服务端 VAD（turn_detection: null）
            turn_detection: this.pttPreset ? null : undefined,
          }));
        }

        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[MiniProgramAudio] WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('[MiniProgramAudio] WebSocket closed:', event.code, event.reason);
        this.handleDisconnect();
      };
    });
  }

  private async initRecorder(): Promise<void> {
    const wx = window.wx;
    
    // 🔧 优先使用小程序原生 API
    if (wx?.getRecorderManager) {
      console.log('[MiniProgramAudio] Using wx.getRecorderManager');
      
      // 请求录音权限
      const hasPermission = await this.requestRecordPermission();
      if (!hasPermission) {
        throw new Error('Recording permission denied');
      }

      this.recorder = wx.getRecorderManager();

      if (this.preAcquiredStream) {
        try {
          this.preAcquiredStream.getTracks().forEach(track => track.stop());
        } catch {}
        this.preAcquiredStream = null;
      }

      // 监听录音帧数据
      this.recorder.onFrameRecorded((res: { frameBuffer: ArrayBuffer; isLastFrame: boolean }) => {
        if (this.ws?.readyState === WebSocket.OPEN && res.frameBuffer) {
          // 🎙️ PTT 闸门：未按住时不发送本地音频，避免 relay/远端 VAD 收到声音
          if (this.pttPreset && this.pttMuted) return;
          const base64Audio = wx.arrayBufferToBase64?.(res.frameBuffer) || '';
          if (base64Audio) {
            const chunk: AudioChunk = {
              type: 'audio_input',
              audio: base64Audio,
            };
            this.ws.send(JSON.stringify(chunk));
          }
        }
      });

      // 监听录音错误
      this.recorder.onError((error: any) => {
        console.error('[MiniProgramAudio] Recorder error:', error);
      });

      // 监听录音结束
      this.recorder.onStop(() => {
        console.log('[MiniProgramAudio] Recording stopped');
      });
      
      return;
    }

    // 🔧 降级为 Web Audio API（小程序 WebView 中使用）
    console.log('[MiniProgramAudio] wx.getRecorderManager not available, using Web Audio API fallback');
    this.useWebAudioFallback = true;
    
    try {
      // 优先复用用户手势中预获取的麦克风流，避免小程序 WebView 吞掉首个 PTT 手势
      if (this.preAcquiredStream?.active) {
        this.webMediaStream = this.preAcquiredStream;
        this.preAcquiredStream = null;
      } else {
        this.webMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: { ideal: 24000 },
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
      }
      
      // 创建 AudioContext
      this.webAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      // 创建音频源
      this.webSource = this.webAudioContext.createMediaStreamSource(this.webMediaStream);
      
      // 创建处理节点（bufferSize=4096 约 170ms 延迟，平衡延迟和音质）
      this.webProcessor = this.webAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.webProcessor.onaudioprocess = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // 🔧 音频能量检测：判断麦克风是否仍有信号
        let maxAmplitude = 0;
        for (let i = 0; i < inputData.length; i += 64) {
          const abs = Math.abs(inputData[i]);
          if (abs > maxAmplitude) maxAmplitude = abs;
        }
        if (maxAmplitude > 0.001) {
          this.lastAudioEnergyTime = Date.now();
          this.silentFrameCount = 0;
        } else {
          this.silentFrameCount++;
        }
        
        // 转换为 PCM16 格式
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // 转换为 Base64
        const uint8Array = new Uint8Array(int16Array.buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64Audio = btoa(binary);
        
        // 🎙️ PTT 闸门：未按住时不送出音频
        if (this.pttPreset && this.pttMuted) return;
        // 发送到服务器
        const audioChunk: AudioChunk = {
          type: 'audio_input',
          audio: base64Audio,
        };
        this.ws?.send(JSON.stringify(audioChunk));
      };
      
      // 连接节点（静音输出，避免回声）
      this.webSource.connect(this.webProcessor);
      const silentGain = this.webAudioContext.createGain();
      silentGain.gain.value = 0;
      this.webProcessor.connect(silentGain);
      silentGain.connect(this.webAudioContext.destination);
      
      console.log('[MiniProgramAudio] Web Audio API recorder initialized');
    } catch (error) {
      console.error('[MiniProgramAudio] Web Audio API init failed:', error);
      throw new Error('麦克风权限不足，请允许访问麦克风');
    }
  }

  /**
   * 停止 Web Audio API 录音
   */
  private stopWebAudioRecording(): void {
    if (this.webSource) {
      this.webSource.disconnect();
      this.webSource = null;
    }
    if (this.webProcessor) {
      this.webProcessor.disconnect();
      this.webProcessor = null;
    }
    if (this.webMediaStream) {
      this.webMediaStream.getTracks().forEach(track => track.stop());
      this.webMediaStream = null;
    }
    if (this.webAudioContext) {
      this.webAudioContext.close();
      this.webAudioContext = null;
    }
    console.log('[MiniProgramAudio] Web Audio recording stopped');
  }

  private requestRecordPermission(): Promise<boolean> {
    const wx = window.wx;
    if (!wx?.authorize) {
      return Promise.resolve(true); // 非小程序环境，假设有权限
    }

    return new Promise((resolve) => {
      wx.authorize({
        scope: 'scope.record',
        success: () => resolve(true),
        fail: () => {
          // 🔧 权限被拒：尝试引导用户前往设置页开启
          const wxAny = wx as any;
          if (wxAny?.openSetting) {
            console.log('[MiniProgramAudio] Permission denied, opening settings');
            wxAny.openSetting({
              success: (res: any) => {
                if (res?.authSetting?.['scope.record']) {
                  resolve(true);
                } else {
                  resolve(false);
                }
              },
              fail: () => resolve(false),
            });
          } else {
            resolve(false);
          }
        },
      });
    });
  }

  private initAudioPlayer(): void {
    const wx = window.wx;
    if (!wx?.createInnerAudioContext) {
      console.warn('[MiniProgramAudio] wx.createInnerAudioContext not available');
      // Web 环境不需要 audioPlayer，使用 Web Audio API
      return;
    }

    this.audioPlayer = wx.createInnerAudioContext();
    this.audioPlayer.obeyMuteSwitch = false; // 不受静音开关影响

    // 注意：onEnded 在 playNextInQueue 中动态绑定，这里只绑定错误处理
    this.audioPlayer.onError((error: any) => {
      console.error('[MiniProgramAudio] Audio player error:', error);
      this.isPlaying = false;
      this.playNextInQueue();
    });
  }

  private handleServerMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);

      switch (message.type) {
        case 'transcript':
          // 处理转录文本
          if (message.text) {
            this.config.onTranscript(
              message.text,
              message.isFinal ?? true,
              message.role ?? 'assistant'
            );
          }
          break;

        case 'audio_output':
          // 处理音频输出
          if (message.audio) {
            this.queueAudio(message.audio);
          }
          break;

        case 'usage':
          // 处理 token 使用量
          if (message.usage && this.config.onUsageUpdate) {
            this.config.onUsageUpdate(message.usage);
          }
          break;

        case 'error':
          console.error('[MiniProgramAudio] Server error:', message.error);
          this.updateStatus('error');
          break;

        case 'speech_started':
          // 用户开始说话 → 立即停止 AI 音频播放（实现打断）
          console.log('[MiniProgramAudio] Speech started - interrupting playback');
          this.stopAudioPlayback();
          this.config.onMessage(message);
          break;

        case 'response_interrupted':
          // AI 响应被打断 → 清空剩余音频
          console.log('[MiniProgramAudio] Response interrupted - clearing audio');
          this.stopAudioPlayback();
          this.config.onMessage(message);
          break;

        case 'pong':
          // 🔧 心跳响应 - 计算延迟并重置 missedPongs
          this.lastPongTime = Date.now();
          if (this.lastPingTime > 0) {
            this.latency = this.lastPongTime - this.lastPingTime;
            console.log(`[MiniProgramAudio] Latency: ${this.latency}ms`);
          }
          this.missedPongs = 0; // 收到 pong，重置计数
          break;

        default:
          // 其他消息传递给回调
          this.config.onMessage(message);
      }
    } catch (error) {
      console.error('[MiniProgramAudio] Failed to parse message:', error);
    }
  }

  private queueAudio(base64Audio: string): void {
    this.audioQueue.push(base64Audio);
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  private playNextInQueue(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const base64Audio = this.audioQueue.shift();
    if (!base64Audio) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    try {
      const wx = window.wx;
      
      if (wx?.getFileSystemManager && wx?.env?.USER_DATA_PATH && this.audioPlayer) {
        // 小程序环境：将 PCM 转换为 WAV 格式后播放
        const fs = wx.getFileSystemManager();
        const pcmBuffer = wx.base64ToArrayBuffer?.(base64Audio);
        
        if (!pcmBuffer) {
          console.error('[MiniProgramAudio] Failed to convert base64 to ArrayBuffer');
          this.isPlaying = false;
          this.playNextInQueue();
          return;
        }
        
        // PCM 转 WAV：添加 44 字节的 WAV 头
        const wavBuffer = this.pcmToWav(pcmBuffer, 24000, 1, 16);
        const tempPath = `${wx.env.USER_DATA_PATH}/audio_${Date.now()}.wav`;
        
        // 先清理之前的事件监听器，避免重复绑定
        this.audioPlayer.offEnded();
        
        fs.writeFile({
          filePath: tempPath,
          data: wavBuffer,
          encoding: 'binary',
          success: () => {
            if (this.audioPlayer) {
              // 绑定播放结束事件
              this.audioPlayer.onEnded(() => {
                // 删除临时文件
                fs.unlink({
                  filePath: tempPath,
                  success: () => {},
                  fail: () => {}
                });
                // 继续播放队列
                this.isPlaying = false;
                this.playNextInQueue();
              });
              
              this.audioPlayer.src = tempPath;
              this.audioPlayer.play();
            }
          },
          fail: (err: { errMsg?: string }) => {
            console.error('[MiniProgramAudio] Failed to write audio file:', err);
            this.isPlaying = false;
            this.playNextInQueue();
          }
        });
      } else {
        // Web 环境降级：使用 Web Audio API 播放 PCM
        this.playPCMWithWebAudio(base64Audio);
      }
    } catch (error) {
      console.error('[MiniProgramAudio] Error playing audio:', error);
      this.isPlaying = false;
      this.playNextInQueue();
    }
  }

  /**
   * 将 PCM 数据转换为 WAV 格式
   * 添加 44 字节的 WAV 文件头
   */
  private pcmToWav(pcmData: ArrayBuffer, sampleRate: number, numChannels: number, bitsPerSample: number): ArrayBuffer {
    const dataLength = pcmData.byteLength;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // ByteRate
    view.setUint16(32, numChannels * bitsPerSample / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM data
    const pcmView = new Uint8Array(pcmData);
    const wavView = new Uint8Array(buffer);
    wavView.set(pcmView, 44);

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Web 环境下使用 Web Audio API 播放 PCM
   */
  /**
   * Base64 转 ArrayBuffer（兼容 Web 和小程序）
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer | null {
    try {
      // 优先使用小程序 API
      if (window.wx?.base64ToArrayBuffer) {
        return window.wx.base64ToArrayBuffer(base64);
      }
      // Web 环境降级
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('[MiniProgramAudio] base64ToArrayBuffer error:', error);
      return null;
    }
  }

  /**
   * 🔧 获取或创建播放用 AudioContext（复用以提升音质）
   * iOS 静音开关兼容：首次创建时播放静音缓冲区解锁音频
   */
  private getPlaybackContext(): AudioContext {
    if (!this.playbackContext || this.playbackContext.state === 'closed') {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      // 🔧 iOS 静音开关兼容：播放静音缓冲区解锁音频输出
      try {
        const silentBuffer = this.playbackContext.createBuffer(1, 1, 24000);
        const silentSource = this.playbackContext.createBufferSource();
        silentSource.buffer = silentBuffer;
        silentSource.connect(this.playbackContext.destination);
        silentSource.start(0);
        console.log('[MiniProgramAudio] AudioContext unlocked with silent buffer');
      } catch (e) {
        console.warn('[MiniProgramAudio] Silent buffer unlock failed:', e);
      }
    }
    // 确保 AudioContext 是运行状态
    if (this.playbackContext.state === 'suspended') {
      this.playbackContext.resume();
    }
    return this.playbackContext;
  }

  private playPCMWithWebAudio(base64Audio: string): void {
    try {
      const arrayBuffer = this.base64ToArrayBuffer(base64Audio);
      
      if (!arrayBuffer) {
        this.isPlaying = false;
        this.playNextInQueue();
        return;
      }

      // 🔧 复用 AudioContext 提升音质
      const audioContext = this.getPlaybackContext();
      const sampleRate = 24000;
      const numChannels = 1;
      
      // 将 PCM16 转换为 Float32
      const pcmData = new Int16Array(arrayBuffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(numChannels, floatData.length, sampleRate);
      audioBuffer.getChannelData(0).set(floatData);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // 🔧 音量增益：与 WebRTC 模式一致，放大到 4.0
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 4.0;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.onended = () => {
        this.isPlaying = false;
        this.playNextInQueue();
        // 🔧 不再关闭 AudioContext，复用以减少创建开销
      };
      source.start();
    } catch (error) {
      console.error('[MiniProgramAudio] Web Audio playback error:', error);
      this.isPlaying = false;
      this.playNextInQueue();
    }
  }

  private stopAudioPlayback(): void {
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.audioPlayer) {
      try {
        this.audioPlayer.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  }

  private startHeartbeat(): void {
    // 🔧 缩短心跳间隔到 20 秒（iOS 小程序后台限制较严）
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 🔧 修复：正确检测未收到 pong（上次发送 ping 后没有收到新的 pong）
        if (this.lastPingTime > 0 && this.lastPongTime < this.lastPingTime) {
          this.missedPongs++;
          console.warn(`[MiniProgramAudio] Missed pong #${this.missedPongs} (lastPing=${this.lastPingTime}, lastPong=${this.lastPongTime})`);
          
          // 🔧 放宽到 5 次未收到 pong 才断开（iOS 后台切换容忍度更高）
          if (this.missedPongs >= 5) {
            console.error('[MiniProgramAudio] Too many missed pongs, reconnecting...');
            this.ws?.close();
            return;
          }
        }
        
        this.lastPingTime = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
        console.log('[MiniProgramAudio] Sent ping');
      }
    }, 20000);
  }
  
  /**
   * 🔧 获取当前网络延迟（毫秒）
   */
  getLatency(): number {
    return this.latency;
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * 🔧 音频健康监控：每 10 秒检测麦克风流和 AudioContext 状态
   * 解决长时间通话中 AudioContext 被系统静默挂起、MediaStream track 死亡的问题
   */
  private startAudioHealthMonitor(): void {
    this.lastAudioEnergyTime = Date.now();
    this.silentFrameCount = 0;
    
    this.audioHealthInterval = setInterval(() => {
      if (this.status !== 'connected') return;
      
      // 1. 检查 MediaStream track 是否还活着
      if (this.webMediaStream) {
        const tracks = this.webMediaStream.getAudioTracks();
        const deadTracks = tracks.filter(t => t.readyState === 'ended');
        if (deadTracks.length > 0 || tracks.length === 0) {
          console.error('[MiniProgramAudio] ⚠️ Microphone track died! Attempting recovery...');
          this.recoverMicrophone();
          return;
        }
        
        // 检查 track 是否被 mute（某些浏览器在权限被撤销时会 mute）
        const mutedTracks = tracks.filter(t => t.muted);
        if (mutedTracks.length === tracks.length) {
          console.warn('[MiniProgramAudio] ⚠️ All microphone tracks muted');
        }
      }
      
      // 2. 检查录音 AudioContext 是否被挂起
      if (this.webAudioContext) {
        if (this.webAudioContext.state === 'suspended') {
          console.warn('[MiniProgramAudio] ⚠️ Recording AudioContext suspended, resuming...');
          this.webAudioContext.resume().then(() => {
            console.log('[MiniProgramAudio] ✅ Recording AudioContext resumed via health check');
          }).catch(e => {
            console.error('[MiniProgramAudio] ❌ Failed to resume AudioContext:', e);
          });
        } else if (this.webAudioContext.state === 'closed') {
          console.error('[MiniProgramAudio] ❌ Recording AudioContext closed! Attempting recovery...');
          this.recoverMicrophone();
          return;
        }
      }
      
      // 3. 检查长时间无音频能量（超过 30 秒没有任何能量 → 可能是麦克风失效）
      const silentDuration = Date.now() - this.lastAudioEnergyTime;
      if (silentDuration > 30000 && this.lastAudioEnergyTime > 0) {
        console.warn(`[MiniProgramAudio] ⚠️ No audio energy for ${Math.round(silentDuration / 1000)}s, checking...`);
        // 尝试 resume AudioContext（可能是隐性挂起）
        if (this.webAudioContext && this.webAudioContext.state !== 'running') {
          this.webAudioContext.resume().catch(() => {});
        }
      }
    }, 10000); // 每 10 秒检查一次
  }
  
  private stopAudioHealthMonitor(): void {
    if (this.audioHealthInterval) {
      clearInterval(this.audioHealthInterval);
      this.audioHealthInterval = null;
    }
  }
  
  /**
   * 🔧 麦克风恢复：当检测到麦克风流死亡时，重新获取并重建音频管道
   */
  private async recoverMicrophone(): Promise<void> {
    console.log('[MiniProgramAudio] 🔄 Recovering microphone...');
    
    try {
      // 清理旧的音频管道
      if (this.webSource) {
        this.webSource.disconnect();
        this.webSource = null;
      }
      if (this.webProcessor) {
        this.webProcessor.disconnect();
        this.webProcessor = null;
      }
      if (this.webMediaStream) {
        this.webMediaStream.getTracks().forEach(t => t.stop());
        this.webMediaStream = null;
      }
      if (this.webAudioContext && this.webAudioContext.state !== 'closed') {
        this.webAudioContext.close().catch(() => {});
      }
      this.webAudioContext = null;
      
      // 重新初始化录音（复用 initRecorder 中的 Web Audio 逻辑）
      await this.initRecorder();
      
      this.lastAudioEnergyTime = Date.now();
      this.silentFrameCount = 0;
      console.log('[MiniProgramAudio] ✅ Microphone recovered successfully');
    } catch (error) {
      console.error('[MiniProgramAudio] ❌ Microphone recovery failed:', error);
    }
  }
  
  /**
   * 🔧 iOS 小程序后台切换恢复：监听 visibilitychange 并 resume AudioContext
   */
  private setupVisibilityListener(): void {
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        console.log('[MiniProgramAudio] Page became visible, resuming audio contexts');
        
        // 恢复录音 AudioContext
        if (this.webAudioContext && this.webAudioContext.state === 'suspended') {
          this.webAudioContext.resume().then(() => {
            console.log('[MiniProgramAudio] Recording AudioContext resumed');
          }).catch(e => {
            console.error('[MiniProgramAudio] Failed to resume recording context:', e);
          });
        }
        
        // 恢复播放 AudioContext
        if (this.playbackContext && this.playbackContext.state === 'suspended') {
          this.playbackContext.resume().then(() => {
            console.log('[MiniProgramAudio] Playback AudioContext resumed');
          }).catch(e => {
            console.error('[MiniProgramAudio] Failed to resume playback context:', e);
          });
        }
        
        // 🔧 重置心跳计数（后台期间可能丢失了 pong）
        this.missedPongs = 0;
        this.lastPongTime = Date.now();
        
        // 🔧 断线恢复优化：主动检测 WebSocket 状态
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.warn('[MiniProgramAudio] WebSocket disconnected while in background, triggering reconnect');
          this.handleDisconnect();
        }
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  private removeVisibilityListener(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private handleDisconnect(): void {
    this.stopHeartbeat();
    
    // 🔧 只在之前是已连接状态时才尝试重连
    const wasConnected = this.status === 'connected';
    
    if (wasConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 5000); // 指数退避：1s, 2s, 4s (最多5s)
      
      console.log(`[MiniProgramAudio] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      this.updateStatus('connecting');
      
      setTimeout(() => {
        this.connect().then(() => {
          console.log('[MiniProgramAudio] Reconnect successful');
          this.reconnectAttempts = 0;
          this.startRecording(); // 重连成功后恢复录音
        }).catch((error) => {
          console.error('[MiniProgramAudio] Reconnect failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[MiniProgramAudio] Max reconnect attempts reached');
            this.updateStatus('error');
          }
        });
      }, delay);
    } else if (!wasConnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[MiniProgramAudio] Not reconnecting - wasConnected:', wasConnected, 'attempts:', this.reconnectAttempts);
      this.updateStatus('disconnected');
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.config.onStatusChange(status);
  }
}
