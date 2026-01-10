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
      createInnerAudioContext?: () => any;
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
        unlink: (options: any) => void;
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
      encodeBitRate: 48000,
      format: 'PCM', // PCM 格式
      frameSize: 3, // 每帧 3KB，平衡延迟和网络开销
    });
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
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
    if (!wx?.getRecorderManager) {
      console.warn('[MiniProgramAudio] wx.getRecorderManager not available');
      return;
    }

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
      return;
    }

    this.audioPlayer = wx.createInnerAudioContext();
    this.audioPlayer.obeyMuteSwitch = false; // 不受静音开关影响

    this.audioPlayer.onEnded(() => {
      this.isPlaying = false;
      this.playNextInQueue();
    });

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
    if (this.audioQueue.length === 0 || !this.audioPlayer) {
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
      
      if (wx?.getFileSystemManager && wx?.env?.USER_DATA_PATH) {
        // 小程序环境：写入临时文件后播放
        const fs = wx.getFileSystemManager();
        const arrayBuffer = wx.base64ToArrayBuffer?.(base64Audio);
        
        if (!arrayBuffer) {
          console.error('[MiniProgramAudio] Failed to convert base64 to ArrayBuffer');
          this.isPlaying = false;
          this.playNextInQueue();
          return;
        }
        
        const tempPath = `${wx.env.USER_DATA_PATH}/audio_${Date.now()}.pcm`;
        
        fs.writeFile({
          filePath: tempPath,
          data: arrayBuffer,
          encoding: 'binary',
          success: () => {
            if (this.audioPlayer) {
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
      } else if (wx?.base64ToArrayBuffer) {
        // Web 环境降级：使用 Blob URL
        const arrayBuffer = wx.base64ToArrayBuffer(base64Audio);
        const blob = new Blob([arrayBuffer], { type: 'audio/pcm' });
        const url = URL.createObjectURL(blob);
        this.audioPlayer.src = url;
        this.audioPlayer.play();
      } else {
        console.error('[MiniProgramAudio] No audio playback method available');
        this.isPlaying = false;
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('[MiniProgramAudio] Error playing audio:', error);
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
