/**
 * 豆包端到端实时语音客户端
 * 通过 WebSocket 连接到 doubao-realtime-relay Edge Function
 * 接口与 RealtimeChat 兼容，供 CoachVoiceChat 在情绪教练模式下使用
 */

import { supabase } from "@/integrations/supabase/client";

type StatusCallback = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
type TranscriptCallback = (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
type MessageCallback = (message: any) => void;

const HEARTBEAT_INTERVAL_MS = 15000;
const MIN_PLAYABLE_PCM_BYTES = 9600; // 约 200ms 的 24kHz/16-bit/mono PCM，避免碎片过小导致断续

export class DoubaoRealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isDisconnected = false;
  private preAcquiredStream: MediaStream | null = null;

  // 音频播放队列
  private audioChunks: Uint8Array[] = [];
  private playQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private playbackAudioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private interruptFlag = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pcmRemainder: Uint8Array | null = null; // 残留的奇数字节

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
            this.appendAudioChunk(audioData);
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
          this.stopHeartbeat();
          this.onStatusChange('error');
          reject(new Error('WebSocket 连接错误'));
        }
      };

      this.ws.onclose = (e) => {
        console.log('[DoubaoClient] WebSocket closed:', e.code, e.reason);
        this.stopHeartbeat();
        if (!this.isDisconnected) {
          this.onStatusChange('disconnected');
        }
        this.endRecording();
      };
    });
  }

  private handleServerMessage(msg: any, onSessionStarted?: (value: void) => void) {
    switch (msg.type) {
      case 'session_started':
        console.log('[DoubaoClient] Session started:', msg.session_id);
        this.onStatusChange('connected');
        this.startHeartbeat();
        this.beginRecording();
        onSessionStarted?.();
        break;

      case 'ping':
        if (this.ws?.readyState === WebSocket.OPEN && !this.isDisconnected) {
          try {
            this.ws.send(JSON.stringify({ type: 'pong', ts: msg.ts ?? Date.now() }));
          } catch {
            // ignore heartbeat response failures
          }
        }
        break;

      case 'pong':
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
        this.flushAudioChunks(true);
        break;

      case 'tts_ended':
        // 一轮回复结束
        this.flushAudioChunks(true);
        this.assistantText = '';
        this.onMessage({ type: 'response.audio.done' });
        break;

      case 'chat_ended':
        // 对话回复结束
        this.assistantText = '';
        break;

      case 'asr_info':
        // 用户开始说话 - 打断播放
        this.clearAllAudio();
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
        this.stopHeartbeat();
        this.onStatusChange('disconnected');
        break;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isDisconnected) {
        this.stopHeartbeat();
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        this.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      } catch (error) {
        console.warn('[DoubaoClient] Heartbeat failed:', error);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
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

  private endRecording() {
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

  // ============ 音频播放 (PCM 16-bit, 24kHz, mono) ============

  private appendAudioChunk(audioData: Uint8Array) {
    if (audioData.length === 0) return;
    this.audioChunks.push(audioData);

    const totalBufferedBytes = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (totalBufferedBytes >= MIN_PLAYABLE_PCM_BYTES) {
      this.flushAudioChunks();
    }
  }

  private flushAudioChunks(force = false) {
    if (this.audioChunks.length === 0) return;

    const totalLen = this.audioChunks.reduce((s, c) => s + c.length, 0);
    if (!force && totalLen < MIN_PLAYABLE_PCM_BYTES) return;

    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    this.audioChunks = [];
    this.playQueue.push(merged.buffer);
    if (!this.isPlaying) {
      this.processPlayQueue();
    }
  }

  private alignPcmBytes(data: ArrayBuffer): ArrayBuffer {
    let bytes = new Uint8Array(data);

    // Prepend any leftover byte from the previous chunk
    if (this.pcmRemainder) {
      const merged = new Uint8Array(this.pcmRemainder.length + bytes.length);
      merged.set(this.pcmRemainder, 0);
      merged.set(bytes, this.pcmRemainder.length);
      bytes = merged;
      this.pcmRemainder = null;
    }

    // If odd length, stash the last byte for the next chunk
    if (bytes.length % 2 !== 0) {
      this.pcmRemainder = bytes.slice(bytes.length - 1);
      bytes = bytes.slice(0, bytes.length - 1);
    }

    if (bytes.length === 0) return new ArrayBuffer(0);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  private async processPlayQueue() {
    if (this.playQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    if (!this.playbackAudioContext || this.playbackAudioContext.state === 'closed') {
      this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
    }
    const playCtx = this.playbackAudioContext;

    while (this.playQueue.length > 0 && !this.interruptFlag) {
      const rawData = this.playQueue.shift()!;
      const data = this.alignPcmBytes(rawData);
      if (data.byteLength === 0) continue;
      try {
        // PCM Int16 -> Float32 AudioBuffer
        const int16 = new Int16Array(data);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }
        const audioBuffer = playCtx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        if (this.interruptFlag) break;
        await new Promise<void>((resolve) => {
          const source = playCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playCtx.destination);
          source.onended = () => {
            this.currentSource = null;
            resolve();
          };
          this.currentSource = source;
          source.start(0);
        });
      } catch (e) {
        console.warn('[DoubaoClient] Audio play error:', e);
      }
    }

    this.isPlaying = false;
    this.interruptFlag = false;
  }

  private clearAllAudio() {
    this.audioChunks = [];
    this.playQueue = [];
    this.pcmRemainder = null;
    this.interruptFlag = true;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  // ============ 公共接口 ============

  disconnect() {
    if (this.isDisconnected) return;
    this.isDisconnected = true;
    this.stopHeartbeat();

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

    this.endRecording();
    this.clearAllAudio();
    this.pcmRemainder = null;
    this.onStatusChange('disconnected');
  }

  // 兼容 RealtimeChat 的 sendTextMessage
  sendTextMessage(text: string) {
    // 豆包暂不支持 text query through relay，可以扩展
    console.log('[DoubaoClient] sendTextMessage not implemented for Doubao:', text);
  }
}
