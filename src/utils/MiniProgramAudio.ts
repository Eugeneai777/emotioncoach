/**
 * 小程序专用音频客户端
 * 使用 WebSocket 连接 Edge Function 中继服务器，实现与 OpenAI Realtime API 的通信
 * 
 * 架构：
 * 小程序 wx.录音API <-> WebSocket <-> Edge Function <-> OpenAI Realtime API
 */

import { supabase } from '@/integrations/supabase/client';

// 扩展 Window 接口以支持小程序 API（与 platform.ts 保持一致）
declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        getEnv: (callback: (res: { miniprogram: boolean }) => void) => void;
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
      canIUse?: (api: string) => boolean;
      arrayBufferToBase64?: (buffer: ArrayBuffer) => string;
      base64ToArrayBuffer?: (base64: string) => ArrayBuffer;
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
      env?: {
        USER_DATA_PATH: string;
      };
    };
  }
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MiniProgramAudioConfig {
  onMessage: (message: any) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  onUsageUpdate?: (usage: { input_tokens: number; output_tokens: number }) => void;
  tokenEndpoint: string;
  mode: string;
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

  constructor(config: MiniProgramAudioConfig) {
    this.config = config;
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
    this.stopRecording();
    this.stopAudioPlayback();

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

    this.recorder.start({
      duration: 60000, // 最长 60 秒
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

  private async getEphemeralToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke(this.config.tokenEndpoint, {
        body: { mode: this.config.mode },
      });

      if (error) {
        console.error('[MiniProgramAudio] Token error:', error);
        return null;
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

      // 监听录音帧数据
      this.recorder.onFrameRecorded((res: { frameBuffer: ArrayBuffer; isLastFrame: boolean }) => {
        if (this.ws?.readyState === WebSocket.OPEN && res.frameBuffer) {
          // 将音频数据转为 Base64 并发送
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
      // 请求麦克风权限
      this.webMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // 创建 AudioContext
      this.webAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      // 创建音频源
      this.webSource = this.webAudioContext.createMediaStreamSource(this.webMediaStream);
      
      // 创建处理节点（每帧 8192 样本，减少数据碎片提升音质）
      this.webProcessor = this.webAudioContext.createScriptProcessor(8192, 1, 1);
      
      this.webProcessor.onaudioprocess = (e) => {
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
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
        fail: () => resolve(false),
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

        case 'pong':
          // 心跳响应
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

  private playPCMWithWebAudio(base64Audio: string): void {
    try {
      const arrayBuffer = this.base64ToArrayBuffer(base64Audio);
      
      if (!arrayBuffer) {
        this.isPlaying = false;
        this.playNextInQueue();
        return;
      }

      // 使用 AudioContext 播放 PCM
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      source.connect(audioContext.destination);
      source.onended = () => {
        this.isPlaying = false;
        this.playNextInQueue();
        audioContext.close();
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
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 每 30 秒发送心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleDisconnect(): void {
    this.stopHeartbeat();
    
    if (this.status === 'connected' && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[MiniProgramAudio] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[MiniProgramAudio] Reconnect failed:', error);
        });
      }, 1000 * this.reconnectAttempts); // 指数退避
    } else {
      this.updateStatus('disconnected');
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.config.onStatusChange(status);
  }
}
