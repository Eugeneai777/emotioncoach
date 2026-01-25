/**
 * 豆包语音大模型客户端
 * 
 * 使用 WebSocket 连接豆包 Realtime API，实现双向语音对话
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
  ws_url: string;
  app_id: string;
  token: string;
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
    console.log('[DoubaoChat] Initializing...');
    this.onStatusChange('connecting');

    try {
      // 1. 获取豆包连接配置
      const { data, error } = await supabase.functions.invoke(this.tokenEndpoint, {
        body: { mode: this.mode }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to get Doubao token');
      }

      this.config = data as DoubaoConfig;
      console.log('[DoubaoChat] Config received:', { ws_url: this.config.ws_url, app_id: this.config.app_id });

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
        sampleRate: this.config.audio_config.input_sample_rate
      });

      // 4. 建立 WebSocket 连接
      const wsUrl = `${this.config.ws_url}?appid=${this.config.app_id}&token=${this.config.token}`;
      this.ws = new WebSocket(wsUrl);

      await this.setupWebSocket();
      console.log('[DoubaoChat] WebSocket connected');

      // 5. 发送 session 配置
      this.sendSessionUpdate();

      // 6. 开始音频录制
      this.startRecording();

      this.onStatusChange('connected');
      console.log('[DoubaoChat] Initialization complete');

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
        if (!this.isDisconnected) {
          this.onStatusChange('disconnected');
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  private sendSessionUpdate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        tools: this.config.tools,
        tool_choice: 'auto',
        temperature: 0.8
      }
    };

    this.ws.send(JSON.stringify(sessionConfig));
    console.log('[DoubaoChat] Session config sent');
  }

  // 公开的启动录音方法（用于符合 AudioClient 接口）
  startRecording(): void {
    if (!this.audioContext || !this.mediaStream) return;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.isDisconnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const audioBase64 = this.encodeAudioForAPI(inputData);

      // 发送音频数据
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
        case 'session.created':
          console.log('[DoubaoChat] Session created');
          break;

        case 'session.updated':
          console.log('[DoubaoChat] Session updated');
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
          console.error('[DoubaoChat] API error:', message);
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

  // 停止录音方法（用于符合 AudioClient 接口）
  stopRecording(): void {
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.source) {
      this.source.disconnect();
    }
    console.log('[DoubaoChat] Recording stopped');
  }

  disconnect(): void {
    console.log('[DoubaoChat] Disconnecting...');
    this.isDisconnected = true;

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
