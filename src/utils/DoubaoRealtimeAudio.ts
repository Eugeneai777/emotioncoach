/**
 * 豆包端到端实时语音客户端
 * 通过 WebSocket 连接到 doubao-realtime-relay Edge Function
 * 接口与 RealtimeChat 兼容，供 CoachVoiceChat 在情绪教练模式下使用
 */

import { supabase } from "@/integrations/supabase/client";

type StatusCallback = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
type TranscriptCallback = (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
type MessageCallback = (message: any) => void;

export class DoubaoRealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isDisconnected = false;
  private preAcquiredStream: MediaStream | null = null;

  // 音频播放队列
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  // 累积的 assistant 文本
  private assistantText = '';

  constructor(
    private onMessage: MessageCallback,
    private onStatusChange: StatusCallback,
    private onTranscript: TranscriptCallback,
    preAcquiredStream?: MediaStream | null
  ) {
    this.preAcquiredStream = preAcquiredStream || null;
  }

  async init() {
    const CONNECTION_TIMEOUT_MS = 30000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('连接超时，请检查网络后重试')), CONNECTION_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.initConnection(), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  private async initConnection() {
    this.isDisconnected = false;
    this.onStatusChange('connecting');

    // 获取 auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('请先登录');
    }

    // 获取麦克风
    if (!this.preAcquiredStream) {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
    } else {
      this.mediaStream = this.preAcquiredStream;
    }

    // 构建 WebSocket URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const wsUrl = supabaseUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    const fullUrl = `${wsUrl}/functions/v1/doubao-realtime-relay?token=${session.access_token}`;

    // 连接 WebSocket
    this.ws = new WebSocket(fullUrl);
    this.ws.binaryType = 'arraybuffer';

    return new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket 创建失败'));

      this.ws.onopen = () => {
        console.log('[DoubaoClient] WebSocket connected to relay');
      };

      this.ws.onmessage = (event) => {
        if (this.isDisconnected) return;

        // 二进制 = 音频数据（第一字节为类型标记）
        if (event.data instanceof ArrayBuffer) {
          const data = new Uint8Array(event.data);
          if (data.length > 1 && data[0] === 0x01) {
            // 音频数据，去掉类型标记
            const audioData = data.slice(1);
            this.playAudio(audioData.buffer);
          }
          return;
        }

        // 文本 = JSON 控制消息
        try {
          const msg = JSON.parse(event.data as string);
          this.handleServerMessage(msg, resolve);
        } catch (e) {
          console.error('[DoubaoClient] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[DoubaoClient] WebSocket error:', e);
        if (!this.isDisconnected) {
          this.onStatusChange('error');
          reject(new Error('WebSocket 连接错误'));
        }
      };

      this.ws.onclose = (e) => {
        console.log('[DoubaoClient] WebSocket closed:', e.code, e.reason);
        if (!this.isDisconnected) {
          this.onStatusChange('disconnected');
        }
        this.stopRecording();
      };
    });
  }

  private handleServerMessage(msg: any, onSessionStarted?: (value: void) => void) {
    switch (msg.type) {
      case 'session_started':
        console.log('[DoubaoClient] Session started:', msg.session_id);
        this.onStatusChange('connected');
        this.beginRecording();
        onSessionStarted?.();
        break;

      case 'transcript':
        this.onTranscript(msg.text, !msg.is_interim, msg.role || 'user');
        break;

      case 'tts_start':
        // AI 开始说话
        if (msg.text) {
          this.assistantText = msg.text;
          this.onTranscript(msg.text, false, 'assistant');
        }
        this.onMessage({ type: 'response.audio.started' });
        break;

      case 'chat_response':
        // AI 文本回复（流式）
        if (msg.content) {
          this.assistantText += msg.content;
          this.onTranscript(this.assistantText, false, 'assistant');
        }
        break;

      case 'tts_sentence_end':
        // 一句话结束
        if (this.assistantText) {
          this.onTranscript(this.assistantText, true, 'assistant');
        }
        break;

      case 'tts_ended':
        // 一轮回复结束
        this.assistantText = '';
        this.onMessage({ type: 'response.audio.done' });
        break;

      case 'chat_ended':
        // 对话回复结束
        this.assistantText = '';
        break;

      case 'asr_info':
        // 用户开始说话 - 打断播放
        this.clearAudioQueue();
        this.onMessage({ type: 'input_audio_buffer.speech_started' });
        break;

      case 'asr_ended':
        this.onMessage({ type: 'input_audio_buffer.speech_stopped' });
        break;

      case 'error':
        console.error('[DoubaoClient] Server error:', msg.message);
        this.onMessage({ type: 'error', error: { message: msg.message } });
        break;

      case 'disconnected':
        this.onStatusChange('disconnected');
        break;
    }
  }

  // ============ 录音相关 ============

  private beginRecording() {
    if (!this.mediaStream) return;

    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      // 使用 4096 缓冲大小，约 256ms 每包
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isDisconnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Float32 -> Int16 PCM
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // 直接发送二进制音频
        this.ws!.send(int16Data.buffer);
      };

      this.sourceNode.connect(this.scriptProcessor);
      // 静音输出防回声
      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;
      this.scriptProcessor.connect(silentGain);
      silentGain.connect(this.audioContext.destination);

      console.log('[DoubaoClient] Recording started');
    } catch (e) {
      console.error('[DoubaoClient] Failed to start recording:', e);
    }
  }

  private stopRecording() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  // ============ 音频播放 ============

  private async playAudio(audioData: ArrayBuffer) {
    this.audioQueue.push(audioData);
    if (!this.isPlaying) {
      await this.processAudioQueue();
    }
  }

  private async processAudioQueue() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    // 创建播放用 AudioContext（24kHz 或 48kHz 都可以，浏览器会自动重采样）
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext({ sampleRate: 48000 });
    }
    const playCtx = this.audioContext;

    while (this.audioQueue.length > 0) {
      const data = this.audioQueue.shift()!;
      try {
        // 豆包返回的是 OGG/Opus，浏览器原生支持解码
        const audioBuffer = await playCtx.decodeAudioData(data.slice(0));
        await new Promise<void>((resolve) => {
          const source = playCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playCtx.destination);
          source.onended = () => resolve();
          source.start(0);
        });
      } catch (e) {
        console.warn('[DoubaoClient] Audio decode/play error:', e);
        // 跳过无法解码的音频包继续播放下一个
      }
    }

    this.isPlaying = false;
  }

  private clearAudioQueue() {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  // ============ 公共接口 ============

  disconnect() {
    if (this.isDisconnected) return;
    this.isDisconnected = true;

    console.log('[DoubaoClient] Disconnecting');

    // 发送结束信号
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'finish_session' }));
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'finish_connection' }));
            this.ws.close(1000, '用户断开');
          }
        }, 100);
      } catch {
        this.ws.close();
      }
    }

    this.stopRecording();
    this.clearAudioQueue();
    this.onStatusChange('disconnected');
  }

  // 兼容 RealtimeChat 的 sendTextMessage
  sendTextMessage(text: string) {
    // 豆包暂不支持 text query through relay，可以扩展
    console.log('[DoubaoClient] sendTextMessage not implemented for Doubao:', text);
  }
}
