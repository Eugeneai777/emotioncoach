/**
 * 豆包语音大模型客户端 (Relay 架构)
 * 
 * 使用 WebSocket Relay 连接豆包 Realtime API，实现双向语音对话
 * 
 * 架构说明：
 * 浏览器 <--JSON/WebSocket--> doubao-realtime-relay <--Binary--> 豆包 API
 * 
 * 豆包 API 特点：
 * - 纯 WebSocket 连接（非 WebRTC）
 * - 支持服务端 VAD
 * - PCM16 音频格式 (16kHz 输入，24kHz 输出)
 */

import { supabase } from '@/integrations/supabase/client';

export type DoubaoConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
export type DoubaoSpeakingStatus = 'idle' | 'user-speaking' | 'assistant-speaking';

interface DoubaoConfig {
  relay_url: string;
  session_token: string;
  user_id: string;
  mode: string;
  instructions: string;
  tools: any[];
  audio_config: {
    input_format: string;
    input_sample_rate: number;
    output_format: string;
    output_sample_rate: number;
  };
}

interface DoubaoRealtimeChatOptions {
  onStatusChange: (status: DoubaoConnectionStatus) => void;
  onSpeakingChange: (status: DoubaoSpeakingStatus) => void;
  onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  onToolCall?: (toolName: string, args: any) => void;
  onMessage?: (message: any) => void;
  tokenEndpoint?: string;
  mode?: string;
}

export class DoubaoRealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private audioQueue: Uint8Array[] = [];
  private isPlaying = false;
  private isDisconnected = false;
  private config: DoubaoConfig | null = null;
  private heartbeatInterval: number | null = null;
  private hasSessionClosed = false;
  private inputSampleRate: number = 16000;
  
  private onStatusChange: (status: DoubaoConnectionStatus) => void;
  private onSpeakingChange: (status: DoubaoSpeakingStatus) => void;
  private onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  private onToolCall?: (toolName: string, args: any) => void;
  private onMessage?: (message: any) => void;
  private tokenEndpoint: string;
  private mode: string;

  constructor(options: DoubaoRealtimeChatOptions) {
    this.onStatusChange = options.onStatusChange;
    this.onSpeakingChange = options.onSpeakingChange;
    this.onTranscript = options.onTranscript;
    this.onToolCall = options.onToolCall;
    this.onMessage = options.onMessage;
    this.tokenEndpoint = options.tokenEndpoint || 'doubao-realtime-token';
    this.mode = options.mode || 'emotion';
  }

  async init(): Promise<void> {
    console.log('[DoubaoChat] Initializing with Relay architecture...');
    this.onStatusChange('connecting');

    try {
      // 1. 获取 Relay 连接配置
      const { data, error } = await supabase.functions.invoke(this.tokenEndpoint, {
        body: { mode: this.mode }
      });

      if (error || !data) {
        // 解析错误详情
        const errorCode = data?.code || error?.message || 'UNKNOWN_ERROR';
        const errorMessage = data?.message || data?.error || error?.message || 'Failed to get Doubao relay config';
        
        console.error('[DoubaoChat] ❌ Token error:', { errorCode, errorMessage });
        
        // 抛出带有错误类型的错误，供上层判断是否需要重新登录
        const err = new Error(errorMessage) as Error & { code?: string };
        err.code = errorCode;
        throw err;
      }

      this.config = data as DoubaoConfig;
      this.inputSampleRate = this.config.audio_config?.input_sample_rate || 16000;
      console.log('[DoubaoChat] ✅ Relay config received:', { 
        relay_url: this.config.relay_url, 
        user_id: this.config.user_id 
      });

      // 2. 请求麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.audio_config.input_sample_rate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('[DoubaoChat] Microphone access granted');

      // 3. 初始化音频上下文
      this.audioContext = new AudioContext({
        // 注意：浏览器不一定会严格按该值创建；需要在采集时做重采样兜底
        sampleRate: this.inputSampleRate
      });
      console.log('[DoubaoChat] AudioContext sampleRate:', this.audioContext.sampleRate, 'target:', this.inputSampleRate);

      // 4. 建立 WebSocket 连接到 Relay
      const wsUrl = `${this.config.relay_url}?session_token=${this.config.session_token}&user_id=${this.config.user_id}&mode=${this.config.mode}`;
      console.log('[DoubaoChat] Connecting to relay...');
      this.ws = new WebSocket(wsUrl);

      await this.setupWebSocket();
      console.log('[DoubaoChat] WebSocket connected to relay');

      this.hasSessionClosed = false;

      // 5. 发送 session 初始化请求（让 relay 连接豆包）
      this.sendSessionInit();

      // 6. 启动心跳
      this.startHeartbeat();

    } catch (error) {
      console.error('[DoubaoChat] Init error:', error);
      this.onStatusChange('error');
      throw error;
    }
  }

  private setupWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not created'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 30000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('[DoubaoChat] WebSocket opened');
        resolve();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[DoubaoChat] WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('[DoubaoChat] WebSocket closed:', event.code, event.reason);
        this.stopHeartbeat();
        if (!this.isDisconnected) {
          this.onStatusChange('disconnected');
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  private sendSessionInit(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) return;

    // 发送初始化请求，让 Relay 连接到豆包
    const initRequest = {
      type: 'session.init',
      instructions: this.config.instructions,
      tools: this.config.tools
    };

    this.ws.send(JSON.stringify(initRequest));
    console.log('[DoubaoChat] Session init request sent');
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 公开的启动录音方法（用于符合 AudioClient 接口）
  startRecording(): void {
    if (!this.audioContext || !this.mediaStream) return;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.isDisconnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const actualRate = this.audioContext?.sampleRate || this.inputSampleRate;

      // ✅ 关键修复：如果实际采样率不是 16kHz，先重采样到 16kHz
      const data16k = actualRate === this.inputSampleRate
        ? inputData
        : this.resampleFloat32(inputData, actualRate, this.inputSampleRate);

      const audioBase64 = this.encodeAudioForAPI(data16k);

      // 发送音频数据到 Relay
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioBase64
      }));

      this.onSpeakingChange('user-speaking');
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    console.log('[DoubaoChat] Recording started');
  }

  /**
   * 将 Float32 PCM 从 sourceRate 重采样到 targetRate（简单抽样/插值，足够用于语音 ASR）
   */
  private resampleFloat32(input: Float32Array, sourceRate: number, targetRate: number): Float32Array {
    if (sourceRate === targetRate) return input;
    if (!sourceRate || !targetRate || sourceRate < 8000 || targetRate < 8000) return input;

    const ratio = sourceRate / targetRate;
    const newLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const pos = i * ratio;
      const left = Math.floor(pos);
      const right = Math.min(left + 1, input.length - 1);
      const frac = pos - left;
      output[i] = input[left] * (1 - frac) + input[right] * frac;
    }
    return output;
  }

  private encodeAudioForAPI(float32Array: Float32Array): string {
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
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('[DoubaoChat] Received:', message.type);

      this.onMessage?.(message);

      switch (message.type) {
        case 'session.connected':
          if (this.hasSessionClosed) {
            console.warn('[DoubaoChat] Ignoring session.connected after session.closed');
            return;
          }
          console.log('[DoubaoChat] Relay connected to Doubao');
          // 1. 启动录音
          this.startRecording();
          // 2. 触发 AI 开场白
          this.triggerGreeting();
          this.onStatusChange('connected');
          break;

        case 'session.closed':
          console.log('[DoubaoChat] Session closed by relay');
          this.hasSessionClosed = true;
          // 立刻停止录音，避免继续发送音频导致 relay 端 BrokenPipe 刷屏
          this.stopRecording();
          this.onStatusChange('disconnected');
          break;

        case 'heartbeat':
        case 'pong':
          // 心跳响应，忽略
          break;

        case 'input_audio_buffer.speech_started':
          this.onSpeakingChange('user-speaking');
          break;

        case 'input_audio_buffer.speech_stopped':
          this.onSpeakingChange('idle');
          break;

        case 'response.audio.delta':
          this.handleAudioDelta(message.delta);
          this.onSpeakingChange('assistant-speaking');
          break;

        case 'response.audio.done':
          this.onSpeakingChange('idle');
          break;

        case 'response.audio_transcript.delta':
          if (message.delta) {
            this.onTranscript(message.delta, false, 'assistant');
          }
          break;

        case 'response.audio_transcript.done':
          if (message.transcript) {
            this.onTranscript(message.transcript, true, 'assistant');
          }
          break;

        case 'response.text':
          // 处理豆包返回的文本消息
          if (message.payload?.result?.text) {
            this.onTranscript(message.payload.result.text, true, 'assistant');
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (message.transcript) {
            this.onTranscript(message.transcript, true, 'user');
          }
          break;

        case 'response.function_call_arguments.done':
          if (message.name && message.arguments) {
            try {
              const args = JSON.parse(message.arguments);
              console.log('[DoubaoChat] Tool call:', message.name, args);
              this.onToolCall?.(message.name, args);
            } catch (e) {
              console.error('[DoubaoChat] Failed to parse tool arguments:', e);
            }
          }
          break;

        case 'error':
          console.error('[DoubaoChat] Relay error:', message.error, message.details);
          // 如果 relay 已经明确返回错误，标记为 closed，避免后续“假 connected”触发录音
          this.hasSessionClosed = true;
          break;
      }
    } catch (e) {
      console.error('[DoubaoChat] Failed to parse message:', e);
    }
  }

  private handleAudioDelta(base64Audio: string): void {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.audioQueue.push(bytes);
      this.playNextAudio();
    } catch (e) {
      console.error('[DoubaoChat] Failed to decode audio:', e);
    }
  }

  private async playNextAudio(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0) return;
    
    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const arrayBuffer = wavData.buffer.slice(wavData.byteOffset, wavData.byteOffset + wavData.byteLength) as ArrayBuffer;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        this.isPlaying = false;
        this.playNextAudio();
      };
      
      source.start(0);
    } catch (e) {
      console.error('[DoubaoChat] Failed to play audio:', e);
      this.isPlaying = false;
      this.playNextAudio();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = int16Data.byteLength;

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer.slice(0)), wavHeader.byteLength);

    return wavArray;
  }

  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    }));

    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  /**
   * 触发 AI 开场白
   * 发送 response.create 请求，让 AI 根据 instructions 中配置的开场白主动发言
   */
  private triggerGreeting(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[DoubaoChat] Cannot trigger greeting: WebSocket not ready');
      return;
    }

    console.log('[DoubaoChat] Triggering AI greeting...');
    
    // 发送 response.create 事件触发 AI 响应
    this.ws.send(JSON.stringify({ 
      type: 'response.create',
      response: {
        modalities: ['text', 'audio']
      }
    }));
  }

  // 停止录音方法（用于符合 AudioClient 接口）
  stopRecording(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    console.log('[DoubaoChat] Recording stopped');
  }

  disconnect(): void {
    console.log('[DoubaoChat] Disconnecting...');
    this.isDisconnected = true;
    this.stopHeartbeat();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      // 通知 relay 关闭
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'session.close' }));
      }
      this.ws.close();
      this.ws = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
    this.config = null;

    this.onStatusChange('disconnected');
    console.log('[DoubaoChat] Disconnected');
  }
}
