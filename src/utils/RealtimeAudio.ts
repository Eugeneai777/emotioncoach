import { supabase } from "@/integrations/supabase/client";

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
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  private tokenEndpoint: string;

  constructor(
    private onMessage: (message: any) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void,
    private onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void,
    tokenEndpoint: string = 'realtime-token'
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.tokenEndpoint = tokenEndpoint;
  }

  async init() {
    try {
      this.onStatusChange('connecting');
      
      // 获取临时令牌（使用可配置的 endpoint）
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(this.tokenEndpoint);
      
      if (tokenError || !tokenData?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;

      // 创建 WebRTC 连接
      this.pc = new RTCPeerConnection();

      // 设置远程音频
      this.pc.ontrack = e => {
        this.audioEl.srcObject = e.streams[0];
      };

      // 添加本地音频轨道
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);

      // 设置数据通道
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        this.onStatusChange('connected');
      });

      this.dc.addEventListener("close", () => {
        this.onStatusChange('disconnected');
      });

      this.dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          this.handleEvent(event);
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      });

      // 创建并设置本地描述
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 连接到 OpenAI Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);

      // 初始化音频上下文和队列
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

    } catch (error) {
      console.error("Error initializing chat:", error);
      this.onStatusChange('error');
      throw error;
    }
  }

  private handleEvent(event: any) {
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
    if (!this.dc || this.dc.readyState !== 'open') {
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
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioQueue?.clear();
    this.audioContext?.close();
    this.onStatusChange('disconnected');
  }
}
