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
  private playbackAudioContext: AudioContext | null = null;  // ✅ 播放专用 AudioContext
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private audioQueue: Uint8Array[] = [];
  // ✅ PCM16 可能会被服务端拆包到“半个采样”边界（奇数 byte）。
  // 不能直接丢 1 byte，否则会导致后续采样对齐错位，出现“呲呲呲”噪声。
  // 正确做法：缓存最后 1 byte，拼到下一段 PCM 前面。
  private playbackPcmRemainder: Uint8Array | null = null;
  private isPlaying = false;
  private isDisconnected = false;
  private config: DoubaoConfig | null = null;
  private heartbeatInterval: number | null = null;
  private hasSessionClosed = false;
  private inputSampleRate: number = 16000;
  // 有些 realtime 服务需要显式 response.create 才会开始生成（尤其是文本触发或 VAD 轮次结束）
  private awaitingResponse = false;
  
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

  /**
   * 确保播放 AudioContext 在“用户手势”上下文中被创建并 resume。
   * 注意：在某些浏览器/小程序 WebView 中，只要 init() 中发生了 await（如弹出麦克风授权），
   * 后续再 resume 会被视为非手势触发，从而导致“收到音频但完全无声”。
   */
  private async ensurePlaybackAudioContext(tag: string): Promise<void> {
    try {
      if (!this.playbackAudioContext) {
        this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
        console.log('[DoubaoChat] Playback AudioContext created (24kHz), tag:', tag);
      }

      if (this.playbackAudioContext.state === 'suspended') {
        await this.playbackAudioContext.resume();
        console.log('[DoubaoChat] Playback AudioContext resumed, tag:', tag);
      }

      console.log('[DoubaoChat] Playback AudioContext state:', this.playbackAudioContext.state, 'tag:', tag);
    } catch (e) {
      console.warn('[DoubaoChat] Failed to ensure playback AudioContext:', e);
    }
  }

  async init(): Promise<void> {
    console.log('[DoubaoChat] Initializing with Relay architecture...');
    this.onStatusChange('connecting');

    try {
      // 重置播放拆包缓存，避免跨会话残留导致对齐错误
      this.playbackPcmRemainder = null;

      // ✅ 0. 关键：在任何 await 之前就创建并 resume 播放 AudioContext（保证在用户点击手势上下文）
      // 否则某些环境（iOS Safari / 小程序 WebView）会“收到音频但无法播放”。
      await this.ensurePlaybackAudioContext('init:pre-await');

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

      // ✅ 二次兜底：如果上面 pre-await 没成功，这里再确保一次（但这里可能已不在手势上下文）
      await this.ensurePlaybackAudioContext('init:post-mic');

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
          // ✅ 关键：用户说完后显式触发一次生成，避免“能连上但不回应/不出声”
          this.requestResponseCreate('speech_stopped');
          break;

        case 'response.audio.delta':
          this.handleAudioDelta(message.delta);
          this.awaitingResponse = false;
          this.onSpeakingChange('assistant-speaking');
          break;

        case 'response.audio.done':
          this.awaitingResponse = false;
          this.onSpeakingChange('idle');
          break;

        case 'response.audio_transcript.delta':
          if (message.delta) {
            this.awaitingResponse = false;
            this.onTranscript(message.delta, false, 'assistant');
          }
          break;

        case 'response.audio_transcript.done':
          if (message.transcript) {
            this.awaitingResponse = false;
            this.onTranscript(message.transcript, true, 'assistant');
          }
          break;

        case 'response.text':
          // 处理豆包返回的文本消息
          this.awaitingResponse = false;
          // 兼容多种可能的字段：payload.result.text / payload.content / text / delta
          {
            const text =
              message.payload?.result?.text ??
              message.payload?.content ??
              message.text ??
              message.delta;
            if (text) this.onTranscript(String(text), true, 'assistant');
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

       // ✅ 修复：处理 PCM16 奇数长度拆包（半个采样）
       let pcm = bytes;
       if (this.playbackPcmRemainder && this.playbackPcmRemainder.length > 0) {
         const merged = new Uint8Array(this.playbackPcmRemainder.length + bytes.length);
         merged.set(this.playbackPcmRemainder, 0);
         merged.set(bytes, this.playbackPcmRemainder.length);
         pcm = merged;
         this.playbackPcmRemainder = null;
       }

       if (pcm.length % 2 !== 0) {
         // 缓存最后 1 byte，等待下一包补齐
         this.playbackPcmRemainder = pcm.subarray(pcm.length - 1);
         pcm = pcm.subarray(0, pcm.length - 1);
         console.warn('[DoubaoChat] PCM chunk length is odd; buffered 1 byte for next chunk. current=', bytes.length, 'merged=', pcm.length);
       }

      // ✅ 日志：确认收到的音频数据大小
       console.log('[DoubaoChat] Audio delta received:', pcm.length, 'bytes, queue size:', this.audioQueue.length + 1);
       if (pcm.length > 0) {
         this.audioQueue.push(pcm);
       }
      this.playNextAudio();
    } catch (e) {
      console.error('[DoubaoChat] Failed to decode audio:', e);
    }
  }

  private async playNextAudio(): Promise<void> {
    if (this.isPlaying || this.audioQueue.length === 0) return;
    
    // ✅ 检查播放 AudioContext 是否可用
    if (!this.playbackAudioContext) {
      console.warn('[DoubaoChat] No playback AudioContext, creating one...');
      this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
    }
    
    // ✅ 如果 AudioContext 被挂起（浏览器策略），尝试恢复
    if (this.playbackAudioContext.state === 'suspended') {
      try {
        await this.playbackAudioContext.resume();
        console.log('[DoubaoChat] Playback AudioContext resumed');
      } catch (e) {
        console.warn('[DoubaoChat] Failed to resume AudioContext:', e);
      }
    }
    
    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;
    console.log('[DoubaoChat] Playing audio chunk:', audioData.length, 'bytes, remaining in queue:', this.audioQueue.length);

    try {
      const wavData = this.createWavFromPCM(audioData);
      // ✅ 复用 playbackAudioContext
      const arrayBuffer = wavData.buffer.slice(wavData.byteOffset, wavData.byteOffset + wavData.byteLength) as ArrayBuffer;
      const audioBuffer = await this.playbackAudioContext.decodeAudioData(arrayBuffer);
      
      console.log('[DoubaoChat] Audio decoded successfully, duration:', audioBuffer.duration.toFixed(2), 's');
      
      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackAudioContext.destination);
      
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
    // ✅ Doubao 返回的 PCM 是 little-endian PCM16。
    // 这里不要把 byteOffset 之外的“整段 buffer”一起拷贝进去，否则会把无关内存拼到 WAV 里，直接变成噪音。
    // 只应写入本次 chunk 对应的那段 bytes。
    // 理论上 handleAudioDelta 已保证是偶数长度（PCM16 对齐）。这里仅做兜底。
    let pcmBytes = (pcmData.length % 2 === 0)
      ? pcmData
      : pcmData.subarray(0, pcmData.length - 1);

    if (pcmBytes.length !== pcmData.length) {
      console.warn('[DoubaoChat] PCM chunk length still odd in createWavFromPCM; trimmed 1 byte as fallback:', pcmData.length, '->', pcmBytes.length);
    }

    // ✅ 兜底：自动判断字节序（极少数情况下服务端返回的 PCM 可能与预期字节序不一致，
    // 会表现为持续“呲呲呲”噪声）。
    // 我们用一个轻量启发式：比较 LE/BE 两种解读下的“削波比例”和平均幅度，
    // 选择更像语音的那一种。
    const analyzePcm16 = (bytes: Uint8Array, littleEndian: boolean) => {
      const maxSamples = Math.min(2000, Math.floor(bytes.length / 2));
      let sumAbs = 0;
      let clipped = 0;
      for (let i = 0; i < maxSamples; i++) {
        const b0 = bytes[i * 2];
        const b1 = bytes[i * 2 + 1];
        const u16 = littleEndian
          ? (b0 | (b1 << 8))
          : (b1 | (b0 << 8));
        const s16 = u16 & 0x8000 ? u16 - 0x10000 : u16;
        const a = Math.abs(s16);
        sumAbs += a;
        if (a > 30000) clipped++;
      }
      const meanAbs = maxSamples ? sumAbs / maxSamples : 0;
      const clipFrac = maxSamples ? clipped / maxSamples : 0;
      return { meanAbs, clipFrac, samples: maxSamples };
    };

    // 仅对足够长的 chunk 做判断（太短不稳定）
    if (pcmBytes.length >= 200) {
      const le = analyzePcm16(pcmBytes, true);
      const be = analyzePcm16(pcmBytes, false);
      // 经验阈值：LE 削波明显更高，且 BE 更“温和”
      const shouldSwap = (le.clipFrac > 0.25 && be.clipFrac < le.clipFrac * 0.7)
        || (le.meanAbs > 18000 && be.meanAbs < le.meanAbs * 0.7);

      if (shouldSwap) {
        const swapped = new Uint8Array(pcmBytes.length);
        for (let i = 0; i < pcmBytes.length; i += 2) {
          swapped[i] = pcmBytes[i + 1];
          swapped[i + 1] = pcmBytes[i];
        }
        pcmBytes = swapped;
        console.warn('[DoubaoChat] PCM endianness heuristic: swapped bytes (BE fallback).', {
          le,
          be,
        });
      }
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
    const dataSize = pcmBytes.byteLength;

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

    const wavArray = new Uint8Array(wavHeader.byteLength + pcmBytes.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(pcmBytes, wavHeader.byteLength);

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

    this.requestResponseCreate('sendTextMessage');
  }

  /**
   * 触发 AI 开场白
   * 发送一个静默的文本消息作为对话触发，让 AI 按照 instructions 中的开场白回应
   */
  private triggerGreeting(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[DoubaoChat] Cannot trigger greeting: WebSocket not ready');
      return;
    }

    console.log('[DoubaoChat] Triggering AI greeting with text...');
    
    // 发送一个简单的问候触发 AI 开场
    // 豆包 API 收到用户输入后会根据 instructions 中的开场白配置回应
    this.ws.send(JSON.stringify({ 
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: '你好'
        }]
      }
    }));

    // ✅ 关键：显式触发生成，避免某些情况下仅发送 item.create 不会出音频
    this.requestResponseCreate('greeting');
  }

  private requestResponseCreate(reason: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.awaitingResponse) return;
    this.awaitingResponse = true;
    try {
      this.ws.send(JSON.stringify({ type: 'response.create' }));
      console.log('[DoubaoChat] response.create sent:', reason);
    } catch (e) {
      console.warn('[DoubaoChat] Failed to send response.create:', e);
      this.awaitingResponse = false;
    }
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

    // ✅ 清理播放 AudioContext
    if (this.playbackAudioContext) {
      try {
        this.playbackAudioContext.close();
      } catch (e) {
        console.warn('[DoubaoChat] Failed to close playback AudioContext:', e);
      }
      this.playbackAudioContext = null;
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
    this.playbackPcmRemainder = null;
    this.config = null;

    this.onStatusChange('disconnected');
    console.log('[DoubaoChat] Disconnected');
  }
}
