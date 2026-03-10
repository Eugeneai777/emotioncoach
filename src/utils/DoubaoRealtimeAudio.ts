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

/**
 * ============ WeChat/iOS 手势解锁预热缓存 ============
 *
 * 背景：微信移动端（尤其 iOS WKWebView）对音频/麦克风有“用户手势”限制：
 * - AudioContext 的 create/resume 必须发生在点击/触摸的同步调用栈内
 * - getUserMedia 也经常要求在用户手势内触发，否则会“不弹授权框/一直连接中”
 *
 * 现实：CoachVoiceChat 的 startCall 往往在 useEffect/异步链路里触发（扣费/查 session 等 await），
 * 会丢失用户手势上下文。
 *
 * 方案：在真正的点击入口（EmotionVoiceCallCTA）里预热，并在 DoubaoRealtimeChat.init() 中“接管”这些资源。
 */
type DoubaoPrewarmOptions = {
  includeMicrophone?: boolean;
};

const PREWARM_TTL_MS = 2 * 60 * 1000;

const doubaoPrewarmState = {
  updatedAt: 0,
  playbackCtx: null as AudioContext | null,
  recordingCtx: null as AudioContext | null,
  micStream: null as MediaStream | null,
  micPromise: null as Promise<MediaStream | null> | null,
};

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
  is_reconnect?: boolean; // ✅ 标记是否为重连
}

interface DoubaoRealtimeChatOptions {
  onStatusChange: (status: DoubaoConnectionStatus) => void;
  onSpeakingChange: (status: DoubaoSpeakingStatus) => void;
  onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  onToolCall?: (toolName: string, args: any) => void;
  onMessage?: (message: any) => void;
  tokenEndpoint?: string;
  mode?: string;
  voiceType?: string; // 豆包音色类型，如 'BV158_streaming'
}

export class DoubaoRealtimeChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private playbackAudioContext: AudioContext | null = null;  // ✅ 播放专用 AudioContext
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private audioQueue: Uint8Array[] = [];
  // ✅ PCM16 可能会被服务端拆包到"半个采样"边界（奇数 byte）。
  // 不能直接丢 1 byte，否则会导致后续采样对齐错位，出现"呲呲呲"噪声。
  // 正确做法：缓存最后 1 byte，拼到下一段 PCM 前面。
  private playbackPcmRemainder: Uint8Array | null = null;
  private isPlaying = false;
  // 🔧 打断支持：保存当前播放的 AudioBufferSourceNode，以便用户打断时能立即停止
  private currentPlaybackSource: AudioBufferSourceNode | null = null;
  private isDisconnected = false;
  private config: DoubaoConfig | null = null;
  private heartbeatInterval: number | null = null;
  private hasSessionClosed = false;
  private inputSampleRate: number = 16000;
  // 有些 realtime 服务需要显式 response.create 才会开始生成（尤其是文本触发或 VAD 轮次结束）
  private awaitingResponse = false;

  // ✅ 固定开场白（用于兜底触发）
  // 说明：部分情况下 bot_first_speak / welcome_message 不会生效，
  // 若仅发送 response.create 也可能不会生成任何内容，因此这里在接通后
  // 通过“隐藏文本触发”来确保一定会播报该欢迎语。
  private static readonly FIXED_GREETING = '你好呀，我是劲老师，今天想聊点什么喃？';
  // 🔧 WeChat 连接超时修复：等待 session.connected 的超时计时器和回调
  private sessionConnectedTimeout: number | null = null;
  private sessionConnectedResolver: (() => void) | null = null;
  private sessionConnectedRejecter: ((err: Error) => void) | null = null;
  // 🔧 播放端增益节点：提升 AI 回复音量（移动端微信扬声器音量偏小）
  private playbackGainNode: GainNode | null = null;

  // 🔧 iOS 微信浏览器：页面切后台/前台后 AudioContext 可能被挂起，导致"完全没检测到说话"
  private visibilityHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  
  // 🔧 心跳超时检测：防止微信环境下静默断连
  // 注意：用户长时间说话时可能没有 AI 回复，但 pong 应该始终正常返回
  private lastHeartbeatResponse: number = 0;
  private missedHeartbeats: number = 0;
  // 🔧 Heartbeat interval 本身也可能在 WebView 中被“冻结/延迟执行”，
  // 若直接按时间差累加 missed，会在恢复后误判为断连。
  // 因此：
  // 1) 只要收到任意 WS 消息就视为“连接活着”，更新 lastHeartbeatResponse
  // 2) 检测到定时器严重漂移时，跳过一次超时判定并重置计数
  private lastHeartbeatTick: number = 0;
  private static readonly HEARTBEAT_INTERVAL_MS = 15000;
   private static readonly HEARTBEAT_TIMEOUT_START_MS = 180000; // 180s 后才开始判定"心跳超时"（放宽至3分钟）
  private static readonly HEARTBEAT_TIMER_DRIFT_MS = 30000; // interval 漂移超过 30s 认为发生了冻结/系统调度
   private static readonly MAX_MISSED_HEARTBEATS = 20; // 更宽容，避免移动端误判（约 6-8 分钟级别）
  
  // 🔧 新增：AI 回复状态跟踪，用于区分"AI正在回复"和"空闲等待用户"
  // AI 正在回复时绝对不超时，只有在 AI 回复结束后用户长时间不说话才超时
  private isAssistantSpeaking: boolean = false;
  private lastResponseEndTime: number = 0; // AI 最后一次回复结束的时间
  private static readonly USER_IDLE_TIMEOUT = 180000; // 用户空闲超时：3 分钟
  
  // 🔧 iOS 微信：WebSocket 可能被系统静默回收，需要主动检测 readyState
  private lastReadyStateCheck: number = 0;
  private static readonly READY_STATE_CHECK_INTERVAL = 5000; // 每 5 秒检查一次

  // ✅ 最终兜底：微信 WebView 可能在前台也“静默回收” WebSocket。
  // 我们无法从根因上完全禁止断连，但可以做到“断了自动恢复、用户无感”。
  private everConnected = false; // 仅在成功 session.connected(ready) 后置为 true
  private reconnectInProgress = false;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private static readonly MAX_RECONNECT_ATTEMPTS = 10; // 增加重试次数到 10
  private static readonly RECONNECT_BACKOFF_MS = [100, 200, 400, 600, 1000, 1500, 2000, 3000, 4000, 5000]; // 更快的初始重试
  
  // ✅ 静默重连增强：重连期间保持 UI 状态不变，用户完全无感
  private isReconnectingSilently = false;
  private reconnectStartTime = 0;
  private static readonly SILENT_RECONNECT_TIMEOUT_MS = 12000; // 12秒内静默重连，超过则上报
  
  // ✅ 断连时保存 AI 回复状态，用于重连后"续接"未完成的回复
  private wasAssistantSpeakingWhenDisconnected = false;
  
  // ✅ 重连通知回调（可选）：允许上层展示轻量提示
  private onReconnectProgress?: (stage: 'start' | 'retrying' | 'success' | 'failed', attempt?: number) => void;

  // ✅ 主动预防性重连：在平台 wall-clock 超时杀死 Edge Function 之前，主动切换到新实例
  // Supabase Edge Function 硬性超时约 150 秒，我们在 85 秒时主动轮换
  private sessionRotationTimer: number | null = null;
  private sessionConnectedAt: number = 0;
  private isProactiveRotating: boolean = false;
  private static readonly SESSION_ROTATION_INTERVAL_MS = 85_000; // 85秒，远在平台超时前

  // ✅ 给上层“用户活动检测”喂低频事件，避免被误判无活动自动挂断
  private lastUserAudioActivityEventAt = 0;

  // =====================
  // 本地麦克风“真实说话”判定（用于避免误打断）
  //
  // 背景：Relay 为绕过上游“上行空闲”超时，会注入极低幅度保活噪声。
  // 某些环境下该噪声可能触发服务端 speech_started，导致前端误执行“打断 AI 播放”，
  // 表现为：AI 回复说到一半突然停止，但通话未挂断、可以继续交流。
  //
  // 方案：只有当本地麦克风也在近期检测到足够能量的语音输入时，才打断 AI。
  // =====================
  private lastLocalSpeechAt = 0;
  private lastLocalRms = 0;
  private lastLocalPeak = 0;
  private static readonly LOCAL_SPEECH_CONFIRM_WINDOW_MS = 800;
  private static readonly LOCAL_SPEECH_PEAK_THRESHOLD = 0.02;
  private static readonly LOCAL_SPEECH_RMS_THRESHOLD = 0.008;

  private onStatusChange: (status: DoubaoConnectionStatus) => void;
  private onSpeakingChange: (status: DoubaoSpeakingStatus) => void;
  private onTranscript: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  private onToolCall?: (toolName: string, args: any) => void;
  private onMessage?: (message: any) => void;
  private tokenEndpoint: string;
  private mode: string;
  private voiceType: string;

  constructor(options: DoubaoRealtimeChatOptions) {
    this.onStatusChange = options.onStatusChange;
    this.onSpeakingChange = options.onSpeakingChange;
    this.onTranscript = options.onTranscript;
    this.onToolCall = options.onToolCall;
    this.onMessage = options.onMessage;
    this.tokenEndpoint = options.tokenEndpoint || 'doubao-realtime-token';
    this.mode = options.mode || 'emotion';
    // 🔧 强化音色默认值：确保始终使用有效的音色 ID
    // 新版 doubao-speech-vision-pro 模型需要使用长格式 ID
    const DEFAULT_VOICE = 'zh_male_M392_conversation_wvae_bigtts'; // 智慧长者
    const resolvedVoiceType = options.voiceType && options.voiceType.trim() !== '' 
      ? options.voiceType 
      : DEFAULT_VOICE;
    this.voiceType = resolvedVoiceType;
    console.log('[DoubaoChat] Constructor voiceType:', { 
      input: options.voiceType, 
      resolved: resolvedVoiceType 
    });
  }

  /**
   * ✅ 微信手势预热：在用户点击/触摸同步栈内调用。
   * - 同步创建并触发 resume()（不等待）
   * - 可选在手势内触发 getUserMedia（可避免微信“卡连接中/不弹授权框”）
   */
  static prewarmAudioContexts(options: DoubaoPrewarmOptions = {}): void {
    const includeMicrophone = options.includeMicrophone === true;
    doubaoPrewarmState.updatedAt = Date.now();

    try {
      if (!doubaoPrewarmState.playbackCtx || doubaoPrewarmState.playbackCtx.state === 'closed') {
        doubaoPrewarmState.playbackCtx = new AudioContext({ sampleRate: 24000 });
        console.log('[DoubaoChat] ✅ Prewarm: playback AudioContext created');
      }
      // 关键：触发即可，不 await
      void doubaoPrewarmState.playbackCtx.resume().catch(() => {});
    } catch (e) {
      console.warn('[DoubaoChat] Prewarm playback AudioContext failed:', e);
    }

    try {
      if (!doubaoPrewarmState.recordingCtx || doubaoPrewarmState.recordingCtx.state === 'closed') {
        doubaoPrewarmState.recordingCtx = new AudioContext();
        console.log('[DoubaoChat] ✅ Prewarm: recording AudioContext created');
      }
      void doubaoPrewarmState.recordingCtx.resume().catch(() => {});
    } catch (e) {
      console.warn('[DoubaoChat] Prewarm recording AudioContext failed:', e);
    }

    // 麦克风：只在明确需要时触发，避免 hover/touchstart 就弹授权
    if (includeMicrophone && !doubaoPrewarmState.micPromise && navigator.mediaDevices?.getUserMedia) {
      try {
        doubaoPrewarmState.micPromise = navigator.mediaDevices
          .getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          .then((stream) => {
            doubaoPrewarmState.micStream = stream;
            console.log('[DoubaoChat] ✅ Prewarm: microphone stream acquired');
            return stream;
          })
          .catch((err) => {
            console.warn('[DoubaoChat] Prewarm microphone failed:', err);
            return null;
          });
      } catch (e) {
        console.warn('[DoubaoChat] Prewarm microphone threw:', e);
      }
    }
  }

  private isPrewarmFresh(): boolean {
    return Date.now() - doubaoPrewarmState.updatedAt <= PREWARM_TTL_MS;
  }

  /**
   * 尝试接管在用户手势内预热好的 AudioContext。
   * 注意：这里不要关闭/销毁旧的 ctx（它们本来就是要被复用的）。
   */
  private adoptPrewarmedAudioContexts(tag: string): void {
    if (!this.isPrewarmFresh()) return;

    if (!this.playbackAudioContext && doubaoPrewarmState.playbackCtx) {
      this.playbackAudioContext = doubaoPrewarmState.playbackCtx;
      doubaoPrewarmState.playbackCtx = null;
      console.log('[DoubaoChat] ✅ Adopted prewarmed playback AudioContext, tag:', tag);
    }

    if ((!this.audioContext || this.audioContext.state === 'closed') && doubaoPrewarmState.recordingCtx) {
      this.audioContext = doubaoPrewarmState.recordingCtx;
      doubaoPrewarmState.recordingCtx = null;
      console.log('[DoubaoChat] ✅ Adopted prewarmed recording AudioContext, tag:', tag);
    }
  }

  /**
   * 尝试接管在用户手势内触发的麦克风流（避免 init() 再次 getUserMedia）。
   */
  private async adoptPrewarmedMicrophone(tag: string): Promise<void> {
    if (this.mediaStream) return;
    if (!this.isPrewarmFresh()) return;

    // 先等 promise（如果仍在 pending）
    if (doubaoPrewarmState.micPromise) {
      const stream = await doubaoPrewarmState.micPromise;
      // promise 使用一次就清掉，避免复用过期
      doubaoPrewarmState.micPromise = null;
      if (stream) {
        doubaoPrewarmState.micStream = stream;
      }
    }

    if (doubaoPrewarmState.micStream) {
      this.mediaStream = doubaoPrewarmState.micStream;
      doubaoPrewarmState.micStream = null;
      console.log('[DoubaoChat] ✅ Adopted prewarmed microphone stream, tag:', tag);
    }
  }

  /**
   * 确保播放 AudioContext 在"用户手势"上下文中被创建并 resume。
   * 注意：在某些浏览器/小程序 WebView 中，只要 init() 中发生了 await（如弹出麦克风授权），
   * 后续再 resume 会被视为非手势触发，从而导致"收到音频但完全无声"。
   */
  private async ensurePlaybackAudioContext(tag: string): Promise<void> {
    try {
      if (!this.playbackAudioContext) {
        this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
        console.log('[DoubaoChat] Playback AudioContext created (24kHz), tag:', tag);
        
        // 🔧 创建播放增益节点：移动端微信扬声器音量偏小，增益 2.5 倍
        try {
          this.playbackGainNode = this.playbackAudioContext.createGain();
          // 增益系数 4.0：大幅提升音量（用户反馈 2.5 仍偏小）
          this.playbackGainNode.gain.value = 4.0;
          this.playbackGainNode.connect(this.playbackAudioContext.destination);
          console.log('[DoubaoChat] Playback GainNode created with 4.0x gain');
        } catch (e) {
          console.warn('[DoubaoChat] Failed to create playback GainNode:', e);
        }
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

  /**
   * 🔧 确保录音 AudioContext 可用且为 running。
   * iOS 微信 WKWebView 中，AudioContext 很容易在非手势阶段创建后处于 suspended，
   * 这会导致 ScriptProcessor 的 onaudioprocess 不触发，进而完全没有音频上行。
   */
  private async ensureRecordingAudioContext(tag: string): Promise<void> {
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        // 注意：不强依赖 sampleRate；实际采样率以 audioContext.sampleRate 为准，后续会重采样到 inputSampleRate。
        this.audioContext = new AudioContext();
        console.log('[DoubaoChat] Recording AudioContext created, sampleRate:', this.audioContext.sampleRate, 'tag:', tag);
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[DoubaoChat] Recording AudioContext resumed, tag:', tag);
      }

      console.log('[DoubaoChat] Recording AudioContext state:', this.audioContext.state, 'tag:', tag);
    } catch (e) {
      console.warn('[DoubaoChat] Failed to ensure recording AudioContext:', e);
    }
  }

  private async resumeAudioContexts(tag: string): Promise<void> {
    await this.ensurePlaybackAudioContext(tag);
    await this.ensureRecordingAudioContext(tag);
  }

 /**
  * ✅ 重连修复：重建整个音频播放链路
  * 微信 WebView 在后台时可能暂停/回收 AudioContext，
  * 简单 resume() 不够，需要重新创建 GainNode 并连接到 destination
  */
 private async rebuildAudioPipeline(tag: string): Promise<void> {
   console.log('[DoubaoChat] 🔄 Rebuilding audio pipeline, tag:', tag);
   
   // 1. 清空音频播放队列和 PCM 缓冲
   this.clearAudioQueueAndStopPlayback();
   this.playbackPcmRemainder = null;
   
   // 2. 强制重建播放 AudioContext（如果状态异常则关闭重建）
   if (this.playbackAudioContext) {
     try {
       // 检查状态，如果 closed 或异常则重建
       if (this.playbackAudioContext.state === 'closed') {
         console.log('[DoubaoChat] Playback AudioContext was closed, recreating...');
         this.playbackAudioContext = null;
         this.playbackGainNode = null;
       } else if (this.playbackAudioContext.state === 'suspended') {
         // 尝试 resume
         await this.playbackAudioContext.resume();
         console.log('[DoubaoChat] Playback AudioContext resumed from suspended');
       }
     } catch (e) {
       console.warn('[DoubaoChat] Error checking playback AudioContext state, recreating:', e);
       this.playbackAudioContext = null;
       this.playbackGainNode = null;
     }
   }
   
   // 3. 如果 AudioContext 不存在则创建
   if (!this.playbackAudioContext) {
     try {
       this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
       console.log('[DoubaoChat] Playback AudioContext recreated (24kHz), tag:', tag);
     } catch (e) {
       console.error('[DoubaoChat] Failed to create playback AudioContext:', e);
     }
   }
   
   // 4. 强制 resume（即使状态显示 running 也调用一次，某些 WebView 状态不准）
   if (this.playbackAudioContext) {
     try {
       await this.playbackAudioContext.resume();
       console.log('[DoubaoChat] Playback AudioContext force resumed, state:', this.playbackAudioContext.state);
     } catch (e) {
       console.warn('[DoubaoChat] Failed to force resume playback AudioContext:', e);
     }
   }
   
   // 5. 重建 GainNode（关键！重连后音频无声通常是因为 GainNode 未重建）
   if (this.playbackAudioContext && (!this.playbackGainNode || this.playbackGainNode.context !== this.playbackAudioContext)) {
     try {
       this.playbackGainNode = this.playbackAudioContext.createGain();
       this.playbackGainNode.gain.value = 4.0;
       this.playbackGainNode.connect(this.playbackAudioContext.destination);
       console.log('[DoubaoChat] Playback GainNode rebuilt with 4.0x gain');
     } catch (e) {
       console.warn('[DoubaoChat] Failed to rebuild playback GainNode:', e);
     }
   }
   
   // 6. 确保录音 AudioContext 正常
   await this.ensureRecordingAudioContext(tag);
    
    // 7. ✅ 关键修复：检查并重建麦克风流
    // 微信 WebView 可能在后台静默回收麦克风流（track.readyState 变为 'ended'）
    await this.ensureMediaStream(tag);
   
   console.log('[DoubaoChat] 🔄 Audio pipeline rebuild complete, tag:', tag, {
     playbackState: this.playbackAudioContext?.state,
     recordingState: this.audioContext?.state,
      hasGainNode: !!this.playbackGainNode,
      hasMediaStream: !!this.mediaStream,
      micTrackState: this.mediaStream?.getAudioTracks()[0]?.readyState
   });
 }

  /**
   * ✅ 关键修复：确保麦克风流有效
   * 微信 WebView 在后台时可能静默回收麦克风流，导致：
   * - mediaStream 对象仍然存在
   * - 但 track.readyState 已变为 'ended'
   * - ScriptProcessor 的 onaudioprocess 仍会触发，但 inputBuffer 全是 0
   * - 结果：音频在发送，但全是静音，ASR 无法识别
   */
  private async ensureMediaStream(tag: string): Promise<void> {
    let needNewStream = false;
    
    // 情况 1：完全没有流
    if (!this.mediaStream) {
      console.log('[DoubaoChat] No mediaStream, need to acquire one, tag:', tag);
      needNewStream = true;
    } else {
      // 情况 2：流存在但 track 已失效
      const audioTracks = this.mediaStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.log('[DoubaoChat] MediaStream has no audio tracks, need new one, tag:', tag);
        needNewStream = true;
      } else {
        const track = audioTracks[0];
        // readyState: 'live' = 正常, 'ended' = 已被停止/回收
        if (track.readyState !== 'live') {
          console.log('[DoubaoChat] ⚠️ Microphone track state is', track.readyState, ', acquiring new stream, tag:', tag);
          needNewStream = true;
          // 清理旧的失效流
          try {
            this.mediaStream.getTracks().forEach(t => t.stop());
          } catch (e) {
            // ignore
          }
          this.mediaStream = null;
        } else {
          // ✅ 额外检查：track.enabled 和 track.muted
          console.log('[DoubaoChat] ✅ MediaStream is valid, tag:', tag, {
            trackState: track.readyState,
            enabled: track.enabled,
            muted: track.muted,
            label: track.label
          });
          
          // 如果 track 被静音，尝试恢复
          if (track.muted) {
            console.warn('[DoubaoChat] ⚠️ Microphone track is muted, this may cause ASR to fail');
          }
          if (!track.enabled) {
            console.warn('[DoubaoChat] ⚠️ Microphone track is disabled, enabling...');
            track.enabled = true;
          }
        }
      }
    }
    
    if (needNewStream) {
      try {
        // 尝试接管预热的麦克风流
        await this.adoptPrewarmedMicrophone(tag);
        
        // 如果仍然没有，重新获取
        if (!this.mediaStream) {
          console.log('[DoubaoChat] Acquiring new microphone stream via getUserMedia, tag:', tag);
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          console.log('[DoubaoChat] ✅ New microphone stream acquired, tag:', tag);
        }
      } catch (e) {
        console.error('[DoubaoChat] ❌ Failed to acquire microphone stream:', e);
        throw new Error('Failed to acquire microphone: ' + String(e));
      }
    }
  }

  /**
   * 🔧 打断支持：清空音频播放队列并停止当前播放
   * 当用户开始说话（打断 AI）时调用，避免：
   * 1. 扬声器继续播放 AI 语音
   * 2. 麦克风采集到混合音频导致 ASR 识别错误
   */
  private clearAudioQueueAndStopPlayback(): void {
    // 清空队列中待播放的音频
    const queueLength = this.audioQueue.length;
    this.audioQueue = [];
    
    // 清空 PCM 缓存
    this.playbackPcmRemainder = null;
    
    // 停止当前正在播放的音频
    if (this.currentPlaybackSource) {
      try {
        this.currentPlaybackSource.stop();
        this.currentPlaybackSource.disconnect();
      } catch (e) {
        // 可能已经播放完毕，忽略错误
      }
      this.currentPlaybackSource = null;
    }
    
    this.isPlaying = false;
    
    if (queueLength > 0) {
      console.log('[DoubaoChat] 🔇 Interrupt: cleared', queueLength, 'queued audio chunks and stopped playback');
    }
  }

  private setupLifecycleListeners(): void {
    // 避免重复绑定
    this.removeLifecycleListeners();

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        console.log('[DoubaoChat] Page became visible, resuming audio contexts');
        void this.resumeAudioContexts('visibilitychange');
      }
    };

    this.focusHandler = () => {
      // iOS 微信里有时不会触发 visibilitychange，但会触发 focus/pageshow
      console.log('[DoubaoChat] Window focus/pageshow, resuming audio contexts');
      void this.resumeAudioContexts('focus');
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('pageshow', this.focusHandler);
  }

  private removeLifecycleListeners(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      window.removeEventListener('pageshow', this.focusHandler);
      this.focusHandler = null;
    }
  }

  /**
   * 🔧 清理 session.connected 等待状态
   */
  private clearSessionConnectedWait(): void {
    if (this.sessionConnectedTimeout) {
      clearTimeout(this.sessionConnectedTimeout);
      this.sessionConnectedTimeout = null;
    }
    this.sessionConnectedResolver = null;
    this.sessionConnectedRejecter = null;
  }

  /**
   * 🔧 等待 session.connected 消息，带超时
   * 解决微信浏览器/小程序中连接一直卡在"连接中"的问题
   */
  private waitForSessionConnected(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 保存 resolver/rejecter 供 handleMessage 调用
      this.sessionConnectedResolver = resolve;
      this.sessionConnectedRejecter = reject;

      // 45秒超时（微信网络可能较慢）
      const SESSION_TIMEOUT_MS = 45000;
      this.sessionConnectedTimeout = window.setTimeout(() => {
        console.error('[DoubaoChat] ❌ Session connection timeout after', SESSION_TIMEOUT_MS / 1000, 's');
        this.clearSessionConnectedWait();
        reject(new Error('语音服务连接超时，请检查网络后重试'));
      }, SESSION_TIMEOUT_MS);

      console.log('[DoubaoChat] Waiting for session.connected (timeout:', SESSION_TIMEOUT_MS / 1000, 's)');
    });
  }

  async init(): Promise<void> {
    console.log('[DoubaoChat] Initializing with Relay architecture...');
    this.onStatusChange('connecting');

    // ✅ 先尝试接管“用户手势内预热”的资源
    this.adoptPrewarmedAudioContexts('init:pre');

    // ✅ 关键 iOS 微信修复：在任何 await（包括 getUserMedia）之前，
    // 同步创建 AudioContext 并调用 resume()（不等待 Promise resolve），
    // 确保浏览器将其视为 "用户手势触发"。
    // 如果延迟到 await 之后再创建，AudioContext 会一直 suspended。
    if (!this.playbackAudioContext) {
      try {
        this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
        console.log('[DoubaoChat] Playback AudioContext created (sync, 24kHz)');
      } catch (e) {
        console.warn('[DoubaoChat] Failed to create playback AudioContext:', e);
      }
    }
    // 立即 resume（即使失败也继续）
    this.playbackAudioContext?.resume().catch(() => {});

    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        this.audioContext = new AudioContext();
        console.log('[DoubaoChat] Recording AudioContext created (sync), sampleRate:', this.audioContext.sampleRate);
      } catch (e) {
        console.warn('[DoubaoChat] Failed to create recording AudioContext:', e);
      }
    }
    this.audioContext?.resume().catch(() => {});

    // 监听页面可见性切换（iOS 微信切后台/前台恢复）
    this.setupLifecycleListeners();

    try {
      // 重置播放拆包缓存，避免跨会话残留导致对齐错误
      this.playbackPcmRemainder = null;

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
      await this.adoptPrewarmedMicrophone('init:pre');
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.config.audio_config.input_sample_rate,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('[DoubaoChat] Microphone access granted (fresh getUserMedia)');
      } else {
        console.log('[DoubaoChat] Microphone stream ready (prewarmed/adopted)');
      }

      // 3. ✅ 二次兜底：如果上面 pre-await 没成功，这里再确保一次（但这里可能已不在手势上下文）
      await this.ensurePlaybackAudioContext('init:post-mic');
      await this.ensureRecordingAudioContext('init:post-mic');
      console.log('[DoubaoChat] Recording context sampleRate:', this.audioContext?.sampleRate, 'target inputSampleRate:', this.inputSampleRate);

      // 4. 建立 WebSocket 连接到 Relay
      // ✅ 透传 is_reconnect 给 relay：用于后端跳过 welcome_message / bot_first_speak
      const isReconnectParam = this.config.is_reconnect ? 'true' : 'false';
      const wsUrl = `${this.config.relay_url}?session_token=${this.config.session_token}&user_id=${this.config.user_id}&mode=${this.config.mode}&is_reconnect=${isReconnectParam}`;
      console.log('[DoubaoChat] Connecting to relay...');
      this.ws = new WebSocket(wsUrl);

      await this.setupWebSocket();
      console.log('[DoubaoChat] WebSocket connected to relay');

      this.hasSessionClosed = false;

      // 🔧 5. 关键修复：在发送 session.init 之前就设置 waitForSessionConnected 的 resolver
      // 因为 relay 会在收到 session.init 后立即发送 session.connected，
      // 如果我们先发送再设置 resolver，可能会错过这个消息
      const sessionConnectedPromise = this.waitForSessionConnected();

      // 6. 发送 session 初始化请求（让 relay 连接豆包）
      this.sendSessionInit();

      // 7. 启动心跳
      this.startHeartbeat();

      // 8. 等待 session.connected 消息（带超时）
      // 这是微信环境下解决"一直连接中"问题的关键
      await sessionConnectedPromise;
      console.log('[DoubaoChat] ✅ Session connected successfully');

    } catch (error) {
      console.error('[DoubaoChat] Init error:', error);
      this.clearSessionConnectedWait();
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
        console.log('[DoubaoChat] ✅ WebSocket opened successfully');
        resolve();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[DoubaoChat] ❌ WebSocket error:', error);
        // 🔧 如果正在等待 session.connected，也要拒绝那个 Promise
        if (this.sessionConnectedRejecter) {
          this.sessionConnectedRejecter(new Error('WebSocket error during session init'));
          this.clearSessionConnectedWait();
        }
        reject(error);
      };

      this.ws.onclose = (event) => {
        // 🔧 增强诊断日志：iOS 微信环境下需要更多信息定位断开原因
        const connectionDuration = Date.now() - (this.lastHeartbeatResponse || Date.now());
        console.log('[DoubaoChat] WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          connectionDurationMs: connectionDuration,
          missedHeartbeats: this.missedHeartbeats,
          isAssistantSpeaking: this.isAssistantSpeaking,
        });
        this.stopHeartbeat();
        // 🔧 如果正在等待 session.connected，也要拒绝那个 Promise
        if (this.sessionConnectedRejecter) {
          this.sessionConnectedRejecter(new Error('WebSocket closed during session init'));
          this.clearSessionConnectedWait();
        }
        if (!this.isDisconnected) {
          // ✅ 若曾经成功连通，则自动重连（微信 WebView 常见“静默回收”）
          if (this.everConnected) {
            void this.scheduleReconnect('ws_close', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
          } else {
            this.onStatusChange('disconnected');
          }
        }
      };

      this.ws.onmessage = (event) => {
        // 🔧 优化微信环境：移除高频日志，防止 WebView 性能问题导致断连
        this.handleMessage(event.data);
      };
    });
  }

  private sendSessionInit(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) return;

    // 🔧 修复音色传递：确保 voice_type 始终有值
    // 优先级：this.voiceType（构造函数已确保非空）> config 返回 > 硬编码默认
    // 新版模型需要长格式 ID
    const finalVoiceType = this.voiceType || (this.config as any).voice_type || 'zh_male_M392_conversation_wvae_bigtts';
    
    // ✅ 重连兜底：即使 token 端没有成功把 history 注入 instructions，
    // 这里也强制附加最近对话，确保模型“接着聊”。
    let finalInstructions = this.config.instructions;
    try {
      if (this.config.is_reconnect === true && this.conversationHistory.length > 0) {
        const recent = this.conversationHistory.slice(-12);
        const historyText = recent
          .map((m) => (m.role === 'user' ? `用户：${m.content}` : `劲老师：${m.content}`))
          .join('\n');

        const last = recent[recent.length - 1];
        const continuationHint = last?.role === 'user'
          ? `用户刚才最后一句是：“${last.content}”。请直接回应这句话，并保持语气连贯。`
          : `你刚才最后一句是：“${last.content}”。如果用户短暂沉默，请自然追问/延展该话题。`;

        finalInstructions = `${finalInstructions}\n\n---\n【重要：断线重连续接】\n你正在与同一位用户继续刚才的通话。不要重新自我介绍，不要重新打招呼。\n\n最近对话：\n${historyText}\n\n续接要求：\n${continuationHint}\n`;
        console.log('[DoubaoChat] ✅ Reconnect continuity instructions appended:', {
          historyCount: recent.length,
          appendedLength: finalInstructions.length - (this.config.instructions?.length || 0),
        });
      }
    } catch (e) {
      console.warn('[DoubaoChat] Failed to append reconnect continuity instructions:', e);
      finalInstructions = this.config.instructions;
    }

    const initRequest = {
      type: 'session.init',
      instructions: finalInstructions,
      tools: this.config.tools,
      voice_type: finalVoiceType,
      // ✅ 关键修复：传递重连标志，让 relay 禁用开场白
      is_reconnect: this.config.is_reconnect === true
    };

    this.ws.send(JSON.stringify(initRequest));
    console.log('[DoubaoChat] 📤 Session init request sent:', {
      voice_type: finalVoiceType,
      instructions_length: finalInstructions?.length || 0,
      instructions_preview: finalInstructions?.substring(0, 80) + '...',
      is_reconnect: this.config.is_reconnect === true
    });
  }

  private startHeartbeat(): void {
    // 🔧 修复微信环境连接中断：心跳间隔 15s
    // 关键改进：区分"AI正在回复"和"空闲等待用户"两种状态
    // - AI 正在回复时：绝对不超时
    // - AI 回复结束后：用户 2 分钟不说话才超时
    this.lastHeartbeatResponse = Date.now();
    this.lastResponseEndTime = Date.now(); // 初始化为当前时间
    this.missedHeartbeats = 0;
    this.isAssistantSpeaking = false;
    this.lastReadyStateCheck = Date.now();
    this.lastHeartbeatTick = Date.now();
    
    this.heartbeatInterval = window.setInterval(() => {
      const now = Date.now();

      // 🔧 关键：检测 interval 执行是否被“冻结/延迟”。
      // 在 iOS/Android 微信 WebView 中，即便前台亮屏，也可能出现短暂停顿，
      // 如果我们直接用 timeSinceLastResponse 累加 missed，会误判断连。
      const tickDrift = now - this.lastHeartbeatTick - DoubaoRealtimeChat.HEARTBEAT_INTERVAL_MS;
      this.lastHeartbeatTick = now;
      if (tickDrift > DoubaoRealtimeChat.HEARTBEAT_TIMER_DRIFT_MS) {
        console.warn('[DoubaoChat] ⚠️ Heartbeat timer drift detected, skipping timeout check once:', {
          tickDrift,
          readyState: this.ws?.readyState,
        });
        // 恢复后先“放过一次”，避免立刻误判。
        this.missedHeartbeats = 0;
        this.lastHeartbeatResponse = now;
      }
      
      // 🔧 iOS 微信关键修复：主动检测 WebSocket readyState
      // iOS 微信 WebView 可能静默回收 WebSocket，onclose 事件不触发
      // 通过主动检测 readyState 发现问题
      if (now - this.lastReadyStateCheck > DoubaoRealtimeChat.READY_STATE_CHECK_INTERVAL) {
        this.lastReadyStateCheck = now;
        const wsState = this.ws?.readyState;
        
        // WebSocket 状态：0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
        if (wsState !== WebSocket.OPEN) {
          console.error(`[DoubaoChat] ❌ WebSocket readyState=${wsState} (not OPEN), connection lost`);
          this.onMessage?.({ type: 'debug.disconnect', reason: 'ws_not_open', wsState });
          this.stopHeartbeat();
          if (this.everConnected && !this.isDisconnected) {
            void this.scheduleReconnect('ws_not_open', { wsState });
          } else {
            this.onStatusChange('disconnected');
          }
          return;
        }
      }
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        const timeSinceLastResponse = now - this.lastHeartbeatResponse;
        
        // 🔧 关键修复：AI 正在回复时，绝对不检测超时
        if (this.isAssistantSpeaking) {
          // AI 正在说话，重置 missedHeartbeats，不检测超时
          this.missedHeartbeats = 0;
          // 仍然发送 ping 保持连接活跃
          try {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          } catch (e) {
            console.error('[DoubaoChat] ❌ Failed to send ping during AI speaking:', e);
            this.onMessage?.({ type: 'debug.disconnect', reason: 'ping_send_failed_during_ai', error: String(e) });
            this.stopHeartbeat();
            this.onStatusChange('disconnected');
          }
          return;
        }
        
        // AI 回复结束后，检查用户空闲超时（2 分钟）
        const timeSinceResponseEnd = now - this.lastResponseEndTime;
        if (timeSinceResponseEnd > DoubaoRealtimeChat.USER_IDLE_TIMEOUT) {
          console.log(`[DoubaoChat] User idle timeout: ${Math.round(timeSinceResponseEnd / 1000)}s since AI finished speaking`);
          this.onMessage?.({ type: 'debug.disconnect', reason: 'user_idle_timeout', seconds: Math.round(timeSinceResponseEnd / 1000) });
          this.stopHeartbeat();
          this.onStatusChange('disconnected');
          return;
        }
        
        // 检测心跳响应超时（连接可能已断开）
        // ✅ 重要修复：只在超过更长阈值后才开始累计 missed，避免移动端调度/卡顿误判。
        if (timeSinceLastResponse > DoubaoRealtimeChat.HEARTBEAT_TIMEOUT_START_MS && this.lastHeartbeatResponse > 0) {
          this.missedHeartbeats++;
          console.warn(`[DoubaoChat] ⚠️ Heartbeat timeout: ${timeSinceLastResponse}ms since last response, missed: ${this.missedHeartbeats}/${DoubaoRealtimeChat.MAX_MISSED_HEARTBEATS}`);
          
          if (this.missedHeartbeats >= DoubaoRealtimeChat.MAX_MISSED_HEARTBEATS) {
            console.error('[DoubaoChat] ❌ Connection appears dead, triggering disconnect');
            this.onMessage?.({
              type: 'debug.disconnect',
              reason: 'heartbeat_timeout',
              timeSinceLastResponse,
              missed: this.missedHeartbeats,
            });
            this.stopHeartbeat();
            if (this.everConnected && !this.isDisconnected) {
              void this.scheduleReconnect('heartbeat_timeout', { timeSinceLastResponse, missed: this.missedHeartbeats });
            } else {
              this.onStatusChange('disconnected');
            }
            return;
          }
        } else {
          // 收到响应，重置计数
          this.missedHeartbeats = 0;
        }
        
        // 发送 ping（带异常捕获）
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          console.error('[DoubaoChat] ❌ Failed to send ping:', e);
          this.missedHeartbeats++;
          if (this.missedHeartbeats >= DoubaoRealtimeChat.MAX_MISSED_HEARTBEATS) {
            this.onMessage?.({ type: 'debug.disconnect', reason: 'ping_send_failed', error: String(e) });
            this.stopHeartbeat();
            if (this.everConnected && !this.isDisconnected) {
              void this.scheduleReconnect('ping_send_failed', { error: String(e) });
            } else {
              this.onStatusChange('disconnected');
            }
          }
        }
      }
    }, DoubaoRealtimeChat.HEARTBEAT_INTERVAL_MS);
  }

  // ✅ 收集当前对话历史，重连时传给新 session 保持上下文
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  // ✅ 增量转录缓冲：用于在收不到 done 事件时也能保存对话历史
  private currentUserTranscriptBuffer = '';
  private currentAssistantTranscriptBuffer = '';

  /**
   * ✅ 强制将缓冲区中未完成的转录内容保存到历史记录
   * 在重连或断开前调用，确保即使没收到 .done 事件也能保留最后一段对话
   */
  private flushTranscriptBuffersToHistory(): void {
    // 先保存用户发言缓冲区
    if (this.currentUserTranscriptBuffer.trim()) {
      console.log('[DoubaoChat] 🔄 Flushing user transcript buffer to history:', this.currentUserTranscriptBuffer.length, 'chars');
      this.conversationHistory.push({ 
        role: 'user', 
        content: this.currentUserTranscriptBuffer.trim() 
      });
      this.currentUserTranscriptBuffer = '';
    }
    
    // 再保存 AI 回复缓冲区
    if (this.currentAssistantTranscriptBuffer.trim()) {
      console.log('[DoubaoChat] 🔄 Flushing assistant transcript buffer to history:', this.currentAssistantTranscriptBuffer.length, 'chars');
      this.conversationHistory.push({ 
        role: 'assistant', 
        content: this.currentAssistantTranscriptBuffer.trim() 
      });
      this.currentAssistantTranscriptBuffer = '';
    }
    
    // 限制历史长度
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    
    console.log('[DoubaoChat] 📝 Conversation history after flush:', this.conversationHistory.length, 'messages');
  }

  private async scheduleReconnect(trigger: string, meta?: Record<string, unknown>): Promise<void> {
    if (this.isDisconnected) return;
    if (!this.everConnected) return;
    if (this.reconnectInProgress) return;

    this.reconnectInProgress = true;
    this.reconnectAttempts = 0;
    
    // ✅ 静默重连：记录开始时间，用于判断是否超过静默阈值
    this.isReconnectingSilently = true;
    this.reconnectStartTime = Date.now();
    
    // ✅ 关键修复：记录断连时 AI 是否正在回复
    // 如果 AI 正在说话时断连，重连后需要让 AI 主动"续接"未完成的回复
    this.wasAssistantSpeakingWhenDisconnected = this.isAssistantSpeaking;
    console.log('[DoubaoChat] 📌 Saved assistant speaking state for reconnect:', this.wasAssistantSpeakingWhenDisconnected);

    // ✅ 重连前强制保存缓冲区中未完成的转录内容到历史记录
    // 这样即使断线时没收到 .done 事件，也能保留最后一段对话
    this.flushTranscriptBuffersToHistory();

    // 断开时先停录音/播放，避免后台还在跑 ScriptProcessor 导致资源升高（微信更容易因此回收连接）
    try {
      this.onSpeakingChange('idle');
    } catch {
      // ignore
    }
    try {
      this.stopRecording();
    } catch {
      // ignore
    }
    this.clearAudioQueueAndStopPlayback();

    // ✅ 静默重连：完全不改变 UI 状态，用户无感
    // 仅发送 debug 事件供开发者调试
    this.onMessage?.({ type: 'debug.reconnect', stage: 'start', trigger, meta, at: Date.now() });
    this.onReconnectProgress?.('start', 0);
    
    // ✅ 关键：不调用 this.onStatusChange('connecting'); 保持 connected 状态
    // 用户在 UI 上看到的仍然是"通话中"

    const sleep = (ms: number) => new Promise<void>((resolve) => {
      this.reconnectTimer = window.setTimeout(() => resolve(), ms);
    });

    for (let i = 0; i < DoubaoRealtimeChat.MAX_RECONNECT_ATTEMPTS; i++) {
      if (this.isDisconnected) break;
      const attempt = i + 1;
      const backoff = DoubaoRealtimeChat.RECONNECT_BACKOFF_MS[Math.min(i, DoubaoRealtimeChat.RECONNECT_BACKOFF_MS.length - 1)];

      try {
        // 第一次立即尝试，后续才等待
        if (i > 0) {
          this.onMessage?.({ type: 'debug.reconnect', stage: 'retrying', attempt, backoff });
          this.onReconnectProgress?.('retrying', attempt);
          await sleep(backoff);
        }

        this.reconnectAttempts = attempt;
        
        // ✅ 检查是否超过静默重连时间阈值
        const elapsed = Date.now() - this.reconnectStartTime;
        if (elapsed > DoubaoRealtimeChat.SILENT_RECONNECT_TIMEOUT_MS) {
          console.warn('[DoubaoChat] ⚠️ Silent reconnect timeout exceeded, notifying user', { elapsed, threshold: DoubaoRealtimeChat.SILENT_RECONNECT_TIMEOUT_MS });
          this.onMessage?.({ type: 'reconnect.slow', elapsed, attempt });
        }
        
        await this.reconnectOnce(trigger);

        // ✅ 重连成功
        this.onMessage?.({ type: 'debug.reconnect', stage: 'success', attempt, duration: Date.now() - this.reconnectStartTime });
        this.onReconnectProgress?.('success', attempt);
        this.isReconnectingSilently = false;
        this.reconnectInProgress = false;
        this.reconnectAttempts = 0;
        
        console.log('[DoubaoChat] ✅ Silent reconnect successful, user should not notice any interruption');
        return;
      } catch (e) {
        console.warn('[DoubaoChat] Reconnect attempt failed', { attempt, error: String(e) });
        this.onMessage?.({ type: 'debug.reconnect', stage: 'failed_attempt', attempt, error: String(e) });
      }
    }

    // ✅ 所有重试都失败了，才通知用户
    this.isReconnectingSilently = false;
    this.reconnectInProgress = false;
    this.onReconnectProgress?.('failed', this.reconnectAttempts);
    this.onMessage?.({ type: 'debug.reconnect', stage: 'giveup', attempts: this.reconnectAttempts, duration: Date.now() - this.reconnectStartTime });
    
    // 只有在完全放弃时才改变 UI 状态
    this.onStatusChange('disconnected');
  }

  private async reconnectOnce(trigger: string): Promise<void> {
    console.log('[DoubaoChat] 🔄 Reconnecting silently...', { 
      trigger, 
      historyLength: this.conversationHistory.length,
      elapsed: Date.now() - this.reconnectStartTime
    });

    // 关闭旧 ws
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'session.close' }));
          } catch {
            // ignore
          }
        }
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

   // ✅ 重连修复：强制重建播放音频链路
   // 微信 WebView 可能在后台暂停/回收 AudioContext，简单 resume 不够
   await this.rebuildAudioPipeline('reconnect');

    // ✅ 重连时传递对话历史，让新 session 保持上下文
    // 增加更多上下文信息，确保 AI 能无缝续接
    const historyForReconnect = this.conversationHistory.length > 0 
      ? this.conversationHistory.slice(-16) // 最近 16 条消息
      : undefined;
    
    const { data, error } = await supabase.functions.invoke(this.tokenEndpoint, {
      body: { 
        mode: this.mode,
        conversation_history: historyForReconnect,
        is_reconnect: true,
      },
    });

    if (error || !data) {
      const errorMessage = (data as any)?.message || (data as any)?.error || error?.message || 'Failed to get relay config during reconnect';
      throw new Error(errorMessage);
    }

    this.config = data as DoubaoConfig;
    this.inputSampleRate = this.config.audio_config?.input_sample_rate || 16000;
    this.hasSessionClosed = false;

    // ✅ 重连时明确标记 is_reconnect=true，relay 将跳过欢迎语与主动开场
    const wsUrl = `${this.config.relay_url}?session_token=${this.config.session_token}&user_id=${this.config.user_id}&mode=${this.config.mode}&is_reconnect=true`;
    this.ws = new WebSocket(wsUrl);
    await this.setupWebSocket();

    const sessionConnectedPromise = this.waitForSessionConnected();
    this.sendSessionInit();
    this.startHeartbeat();
    await sessionConnectedPromise;

   // ✅ 重连成功后重新启动录音
   // 注意：startRecording 会检查 processor/source 是否已存在，避免重复
   if (!this.processor && !this.source) {
     await this.startRecording();
     console.log('[DoubaoChat] 🔄 Reconnect complete: recording restarted');
   } else {
     console.log('[DoubaoChat] 🔄 Reconnect complete: recording already active');
   }
   
   // ✅ 关键修复：如果断连时 AI 正在回复，发送续接指令让 AI 继续
   // 豆包的每个 session 是独立的，不会自动"继续"之前的回复
   // 需要主动发送一个触发信号，让 AI 根据历史上下文继续回应
   if (this.wasAssistantSpeakingWhenDisconnected && this.conversationHistory.length > 0 && !this.isDisconnected) {
     console.log('[DoubaoChat] 🔄 AI was speaking when disconnected, sending continuation trigger...');
     
     // 延迟一小段时间确保 session 完全就绪
     setTimeout(() => {
       if (this.ws?.readyState === WebSocket.OPEN && !this.isDisconnected) {
         // 发送一个隐式的"继续"指令，不会显示在对话中
         // 让 AI 根据 instructions 中注入的历史上下文自然续接
         this.ws.send(JSON.stringify({
           type: 'continuation.trigger',
           hint: '请继续你刚才说到一半的话',
         }));
         console.log('[DoubaoChat] ✅ Continuation trigger sent');
       }
     }, 300);
     
     // 重置状态
     this.wasAssistantSpeakingWhenDisconnected = false;
   } else if (this.conversationHistory.length > 0 && !this.isDisconnected) {
     console.log('[DoubaoChat] ✅ Silent reconnect: context preserved, AI should continue naturally');
   }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ✅ 主动预防性重连：在 Edge Function 被平台超时杀死之前，主动切换到新实例
  // 这是解决"豆包语音 ~2 分钟自动断开"的根本方案
  private startSessionRotation(): void {
    this.stopSessionRotation();
    console.log(`[DoubaoChat] 🔄 Session rotation scheduled in ${DoubaoRealtimeChat.SESSION_ROTATION_INTERVAL_MS / 1000}s`);
    this.sessionRotationTimer = window.setTimeout(() => {
      void this.proactiveRotate();
    }, DoubaoRealtimeChat.SESSION_ROTATION_INTERVAL_MS);
  }

  private stopSessionRotation(): void {
    if (this.sessionRotationTimer) {
      clearTimeout(this.sessionRotationTimer);
      this.sessionRotationTimer = null;
    }
  }

  private async proactiveRotate(): Promise<void> {
    // 防止在用户已断开、正在重连、或 AI 正在说话时触发
    if (this.isDisconnected || this.reconnectInProgress || this.isProactiveRotating) {
      console.log('[DoubaoChat] 🔄 Skipping proactive rotation:', { 
        isDisconnected: this.isDisconnected, 
        reconnectInProgress: this.reconnectInProgress,
        isProactiveRotating: this.isProactiveRotating
      });
      return;
    }

    // 如果 AI 正在说话，延迟 5 秒再检查
    if (this.isAssistantSpeaking) {
      console.log('[DoubaoChat] 🔄 AI is speaking, deferring rotation by 5s');
      this.sessionRotationTimer = window.setTimeout(() => {
        void this.proactiveRotate();
      }, 5000);
      return;
    }

    this.isProactiveRotating = true;
    const sessionAge = Date.now() - this.sessionConnectedAt;
    console.log(`[DoubaoChat] 🔄 Proactive session rotation starting (session age: ${Math.round(sessionAge / 1000)}s)`);

    // 保存对话历史
    this.flushTranscriptBuffersToHistory();
    this.wasAssistantSpeakingWhenDisconnected = false;

    try {
      // 停止心跳和录音
      this.stopHeartbeat();
      this.stopRecording();
      this.clearAudioQueueAndStopPlayback();

      // 关闭旧 WebSocket
      if (this.ws) {
        try {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'session.close' }));
          }
          this.ws.close();
        } catch { /* ignore */ }
        this.ws = null;
      }

      // 重建音频管道
      await this.rebuildAudioPipeline('proactive_rotation');

      // 获取新的 relay session
      const historyForReconnect = this.conversationHistory.length > 0 
        ? this.conversationHistory.slice(-16)
        : undefined;
      
      const { data, error } = await supabase.functions.invoke(this.tokenEndpoint, {
        body: { 
          mode: this.mode,
          conversation_history: historyForReconnect,
          is_reconnect: true,
        },
      });

      if (error || !data) {
        throw new Error((data as any)?.message || (data as any)?.error || error?.message || 'Failed to get relay config');
      }

      this.config = data as DoubaoConfig;
      this.inputSampleRate = this.config.audio_config?.input_sample_rate || 16000;
      this.hasSessionClosed = false;

      // 连接新的 relay（标记为重连，跳过开场白）
      const wsUrl = `${this.config.relay_url}?session_token=${this.config.session_token}&user_id=${this.config.user_id}&mode=${this.config.mode}&is_reconnect=true`;
      this.ws = new WebSocket(wsUrl);
      await this.setupWebSocket();

      const sessionConnectedPromise = this.waitForSessionConnected();
      this.sendSessionInit();
      this.startHeartbeat();
      await sessionConnectedPromise;

      // 重新启动录音
      if (!this.processor && !this.source) {
        await this.startRecording();
      }

      console.log(`[DoubaoChat] 🔄 ✅ Proactive rotation complete! New session started.`);
      this.onMessage?.({ type: 'debug.rotation', status: 'success', sessionAge: Math.round(sessionAge / 1000) });

    } catch (e) {
      console.error('[DoubaoChat] 🔄 ❌ Proactive rotation failed, falling back to reactive reconnect:', e);
      this.onMessage?.({ type: 'debug.rotation', status: 'failed', error: String(e) });
      // 失败了就走正常重连逻辑
      if (!this.isDisconnected && this.everConnected) {
        this.isProactiveRotating = false;
        void this.scheduleReconnect('proactive_rotation_failed', { error: String(e) });
        return;
      }
    } finally {
      this.isProactiveRotating = false;
    }
  }

    // 没在播 AI，没必要打断
    if (!this.isAssistantSpeaking) return false;

    // 录音链路不可用时，为避免回声/串音，保守策略：仍允许打断
    if (!this.processor) return true;

    const now = Date.now();
    const isRecent = now - this.lastLocalSpeechAt <= DoubaoRealtimeChat.LOCAL_SPEECH_CONFIRM_WINDOW_MS;
    const energyOk =
      this.lastLocalPeak >= DoubaoRealtimeChat.LOCAL_SPEECH_PEAK_THRESHOLD ||
      this.lastLocalRms >= DoubaoRealtimeChat.LOCAL_SPEECH_RMS_THRESHOLD;
    return isRecent && energyOk;
  }

  // 公开的启动录音方法（用于符合 AudioClient 接口）
  // 🔧 修复：改为异步方法，确保 AudioContext 完全就绪后再创建音频链路
  async startRecording(): Promise<void> {
    // ✅ 幂等保护：避免重复调用导致多个 ScriptProcessor 并行工作（会造成重复上行/异常回声/多路触发）
    if (this.processor || this.source) {
      console.warn('[DoubaoChat] startRecording called while already recording; ignoring');
      return;
    }
    if (!this.audioContext || !this.mediaStream) {
      console.warn('[DoubaoChat] startRecording: missing audioContext or mediaStream', {
        hasAudioContext: !!this.audioContext,
        audioContextState: this.audioContext?.state,
        hasMediaStream: !!this.mediaStream,
        micTrackState: this.mediaStream?.getAudioTracks()[0]?.readyState
      });
      return;
    }
    
    // ✅ 关键检查：确保录音 AudioContext 没有被关闭
    if (this.audioContext.state === 'closed') {
      console.error('[DoubaoChat] ❌ Recording AudioContext is closed, cannot start recording');
      return;
    }
    
    // ✅ 关键检查：确保麦克风 track 仍然有效
    const audioTracks = this.mediaStream.getAudioTracks();
    if (audioTracks.length === 0 || audioTracks[0].readyState !== 'live') {
      console.error('[DoubaoChat] ❌ Microphone track is not live:', {
        trackCount: audioTracks.length,
        trackState: audioTracks[0]?.readyState
      });
      return;
    }
    
    // ✅ 额外诊断：打印麦克风和 AudioContext 的详细状态
    const micTrack = audioTracks[0];
    console.log('[DoubaoChat] 🎙️ Starting recording with:', {
      audioContextState: this.audioContext.state,
      audioContextSampleRate: this.audioContext.sampleRate,
      targetSampleRate: this.inputSampleRate,
      needsResampling: this.audioContext.sampleRate !== this.inputSampleRate,
      micTrackState: micTrack.readyState,
      micTrackEnabled: micTrack.enabled,
      micTrackMuted: micTrack.muted,
      micTrackLabel: micTrack.label,
      micTrackSettings: micTrack.getSettings?.() || 'N/A'
    });

    // 🔧 关键修复：必须等待 AudioContext 完全 resume 后再创建音频链路
    // iOS 微信 WebView 中，如果 AudioContext 仍在 suspended 状态，
    // ScriptProcessor 的 onaudioprocess 回调虽然会触发，但 inputBuffer 全是 0
    if (this.audioContext.state === 'suspended') {
      console.log('[DoubaoChat] ⏳ Recording AudioContext is suspended, waiting for resume...');
      try {
        await this.audioContext.resume();
        console.log('[DoubaoChat] ✅ Recording AudioContext resumed, state:', this.audioContext.state);
      } catch (e) {
        console.error('[DoubaoChat] ❌ Failed to resume recording AudioContext:', e);
        // 尝试重建 AudioContext
        try {
          this.audioContext = new AudioContext();
          await this.audioContext.resume();
          console.log('[DoubaoChat] ✅ Recording AudioContext rebuilt and resumed');
        } catch (e2) {
          console.error('[DoubaoChat] ❌ Failed to rebuild recording AudioContext:', e2);
          return;
        }
      }
    }
    
    // 🔧 二次确认：即使上面没有进入 suspended 分支，也确保状态正确
    if (this.audioContext.state !== 'running') {
      console.warn('[DoubaoChat] ⚠️ AudioContext state is', this.audioContext.state, ', attempting resume...');
      try {
        await this.audioContext.resume();
        // 等待一小段时间让状态完全生效
        await new Promise(r => setTimeout(r, 100));
        console.log('[DoubaoChat] AudioContext state after retry:', this.audioContext.state);
      } catch (e) {
        console.error('[DoubaoChat] Failed to resume AudioContext on retry:', e);
      }
    }

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // ✅ 移动端麦克风增益优化：使用 GainNode 提升采集音量
    // iOS 微信等环境下麦克风默认增益较低，导致 ASR 识别不准
    let gainNode: GainNode | null = null;
    try {
      gainNode = this.audioContext.createGain();
      // 增益系数 2.5 左右，提升低音量语音的识别率
      // 不宜过高，否则会导致削波失真
      gainNode.gain.value = 2.5;
      console.log('[DoubaoChat] Audio gain set to 2.5x for mobile optimization');
    } catch (e) {
      console.warn('[DoubaoChat] Failed to create GainNode:', e);
    }
    
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.isDisconnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const now = Date.now();

      const inputData = e.inputBuffer.getChannelData(0);
      const actualRate = this.audioContext?.sampleRate || this.inputSampleRate;

      // ✅ 关键诊断：检测输入音频是否全是静音/接近静音
      // 如果全是静音，可能是麦克风被系统静默回收或权限问题
      let maxAmplitude = 0;
      let sumSquares = 0;
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.abs(inputData[i]);
        if (sample > maxAmplitude) maxAmplitude = sample;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / inputData.length);

      // ✅ 记录本地能量，用于 speech_started 去抖（防止 relay keepalive 噪声误打断）
      this.lastLocalPeak = maxAmplitude;
      this.lastLocalRms = rms;
      if (
        maxAmplitude >= DoubaoRealtimeChat.LOCAL_SPEECH_PEAK_THRESHOLD ||
        rms >= DoubaoRealtimeChat.LOCAL_SPEECH_RMS_THRESHOLD
      ) {
        this.lastLocalSpeechAt = now;
      }
      
      // 每 50 帧（约 10 秒）打印一次音频电平诊断
      if (!this._audioLevelLogCounter) this._audioLevelLogCounter = 0;
      this._audioLevelLogCounter++;
      if (this._audioLevelLogCounter % 50 === 1) {
        console.log('[DoubaoChat] 🎙️ Audio level:', {
          maxAmplitude: maxAmplitude.toFixed(4),
          rms: rms.toFixed(4),
          sampleRate: actualRate,
          targetRate: this.inputSampleRate,
          bufferLength: inputData.length,
          isSilent: maxAmplitude < 0.001
        });
      }
      
      // ⚠️ 静音警告：如果连续静音太久，可能需要重新获取麦克风
      if (maxAmplitude < 0.0001) {
        if (!this._silentFrameCount) this._silentFrameCount = 0;
        this._silentFrameCount++;
        
        // 连续 50 帧静音（约 10 秒）发出警告并尝试恢复
        if (this._silentFrameCount === 50) {
          console.warn('[DoubaoChat] ⚠️ Sustained silence detected - microphone may be muted or reclaimed');
          this.onMessage?.({ 
            type: 'debug.audio_silence', 
            silentFrames: this._silentFrameCount,
            maxAmplitude,
            audioContextState: this.audioContext?.state,
            micTrackState: this.mediaStream?.getAudioTracks()[0]?.readyState
          });
          
          // 🔧 尝试恢复：检查麦克风状态并重新获取
          const track = this.mediaStream?.getAudioTracks()[0];
          if (track && track.readyState === 'ended') {
            console.error('[DoubaoChat] ❌ Microphone track ended! Attempting to recover...');
            void this.attemptMicrophoneRecovery();
          } else if (this.audioContext?.state === 'suspended') {
            console.warn('[DoubaoChat] ⚠️ AudioContext suspended during recording, resuming...');
            void this.audioContext.resume().then(() => {
              console.log('[DoubaoChat] AudioContext resumed after silence detection');
            });
          }
        }
      } else {
        this._silentFrameCount = 0; // 有声音，重置计数
      }

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

      // ✅ 每 1s 上报一次“用户仍在输出音频”，用于上层无活动检测（避免误挂断）
      if (now - this.lastUserAudioActivityEventAt > 1000) {
        this.lastUserAudioActivityEventAt = now;
        this.onMessage?.({ type: 'input_audio_buffer.append', timestamp: now });
      }

      // ⚠️ 不在这里更新 speaking 状态，改为由 relay 的 ASR 事件驱动
      // 避免与 assistant-speaking 状态冲突导致抖动
    };

    // 连接音频处理链：source -> gainNode -> processor -> destination
    if (gainNode) {
      this.source.connect(gainNode);
      gainNode.connect(this.processor);
    } else {
      this.source.connect(this.processor);
    }
    this.processor.connect(this.audioContext.destination);
    console.log('[DoubaoChat] Recording started with mobile audio optimization');
  }

  /**
   * 🔧 尝试恢复麦克风流
   * 在检测到持续静音且麦克风 track 已结束时调用
   */
  private async attemptMicrophoneRecovery(): Promise<void> {
    console.log('[DoubaoChat] 🔄 Attempting microphone recovery...');
    
    // 停止当前录音
    this.stopRecording();
    
    // 清理旧的麦克风流
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {
        // ignore
      }
      this.mediaStream = null;
    }
    
    // 重新获取麦克风
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log('[DoubaoChat] ✅ Microphone recovered successfully');
      
      // 重新启动录音
      await this.startRecording();
      console.log('[DoubaoChat] ✅ Recording restarted after microphone recovery');
    } catch (e) {
      console.error('[DoubaoChat] ❌ Failed to recover microphone:', e);
      this.onMessage?.({ type: 'debug.microphone_recovery_failed', error: String(e) });
    }
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

  // 🔧 优化微信环境：日志计数器，每 100 条音频消息打印一次
  private audioMsgCount = 0;
  private _audioLevelLogCounter = 0;
  private _silentFrameCount = 0;

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // ✅ 关键修复：只要收到任意 WS 消息，就说明连接仍然活着。
      // 之前仅 heartbeat/pong 会更新时间戳，导致在持续音频/转录流中也可能被误判“超时”。
      this.lastHeartbeatResponse = Date.now();
      this.missedHeartbeats = 0;
      
      // 🔧 优化微信环境：大幅减少日志输出频率，防止 WebView 性能问题
      // 音频消息每 100 条打印一次，其他消息正常打印
      if (message.type === 'response.audio.delta') {
        this.audioMsgCount++;
        if (this.audioMsgCount % 100 === 0) {
          console.log(`[DoubaoChat] Audio delta #${this.audioMsgCount}, queue: ${this.audioQueue.length}`);
        }
      } else if (message.type !== 'heartbeat' && message.type !== 'pong') {
        // 心跳/pong 完全静默，其他消息正常打印
        console.log('[DoubaoChat] Received:', message.type);
      }

      this.onMessage?.(message);

      switch (message.type) {
        case 'session.connected':
          if (this.hasSessionClosed) {
            console.warn('[DoubaoChat] Ignoring session.connected after session.closed');
            return;
          }
          // ✅ relay 现在会在真正 ready(ACK/101/兜底) 后才发 connected。
          // 仅在 ready 时触发录音+开场白，避免“过早发送你好被后端丢弃”导致 IdleTimeout。
          if (message.ready === false) {
            console.log('[DoubaoChat] session.connected received but not ready; waiting...');
            return;
          }
          console.log('[DoubaoChat] Relay connected to Doubao');
          const isFirstConnect = !this.everConnected;
          this.everConnected = true;
          this.sessionConnectedAt = Date.now();
          // 🔧 解决 waitForSessionConnected 的 Promise
          if (this.sessionConnectedResolver) {
            this.sessionConnectedResolver();
            this.clearSessionConnectedWait();
          }
          // 1. 启动录音（异步，但不阻塞后续流程）
          void this.startRecording().then(() => {
            console.log('[DoubaoChat] ✅ Recording started after session.connected');
          }).catch((e) => {
            console.error('[DoubaoChat] ❌ Failed to start recording:', e);
          });
          this.onStatusChange('connected');
          
          // ✅ 启动主动预防性重连定时器
          this.startSessionRotation();
          
          // 2. ✅ 问候语由后端 bot_first_speak: true 处理，前端不再触发
          // 避免双重问候（后端 welcome_message + 前端 triggerGreeting）
          const skipGreeting = message.skip_greeting === true;
          if (skipGreeting) {
            console.log('[DoubaoChat] ✅ Skipping greeting (reconnect session)');
          } else {
            console.log('[DoubaoChat] ✅ First connect, greeting handled by backend bot_first_speak');
          }
          break;

        case 'session.closed':
          console.log('[DoubaoChat] Session closed by relay');
          this.hasSessionClosed = true;
          // 🔧 如果正在等待连接，拒绝 Promise
          if (this.sessionConnectedRejecter) {
            this.sessionConnectedRejecter(new Error('Session closed by relay before connected'));
            this.clearSessionConnectedWait();
          }
          // 立刻停止录音，避免继续发送音频导致 relay 端 BrokenPipe 刷屏
          this.stopRecording();
          if (this.everConnected && !this.isDisconnected) {
            void this.scheduleReconnect('session_closed', { code: (message as any).code, reason: (message as any).reason });
          } else {
            this.onStatusChange('disconnected');
          }
          break;

        // 🔧 修复 switch-case 穿透问题：心跳重置和业务逻辑分离
        case 'heartbeat':
        case 'pong':
          // 心跳/pong 已在上方统一刷新 lastHeartbeatResponse；这里保持分支存在，便于阅读
          break;

        case 'input_audio_buffer.speech_started':
          // 🔧 用户开始说话（打断 AI）- 关键修复！
          // 必须立即停止 AI 音频播放，否则：
          // 1. 扬声器继续播放 AI 语音
          // 2. 麦克风采集到 AI 语音 + 用户语音的混合
          // 3. ASR 识别结果混杂/错误（如"不想听牛"）
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;

          // ✅ 仅当本地麦克风也确认“真的在说话”时，才打断 AI 播放。
          // 否则可能是 relay 保活噪声触发的误报，打断会造成“AI 回复中途停止”。
          if (this.shouldInterruptAssistantOnSpeechStarted()) {
            this.isAssistantSpeaking = false; // 用户打断，AI 不再说话
            this.lastResponseEndTime = Date.now(); // 重置空闲计时起点
            this.clearAudioQueueAndStopPlayback();
            this.onSpeakingChange('user-speaking');
          } else {
            console.log('[DoubaoChat] Ignoring speech_started (local mic energy not confirmed)');
          }
          break;

        case 'input_audio_buffer.speech_stopped':
          // 用户停止说话
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          this.onSpeakingChange('idle');
          break;

        case 'response.audio.delta':
          // AI 音频流数据 - 这是关键修复点！
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          this.isAssistantSpeaking = true; // 🔧 关键：标记 AI 正在说话，此时绝对不超时
          if (message.delta) {
            this.handleAudioDelta(message.delta);
            this.onSpeakingChange('assistant-speaking');
          }
          break;

        case 'response.audio.done':
          // AI 音频响应完成
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          this.isAssistantSpeaking = false; // 🔧 关键：AI 说完了
          this.lastResponseEndTime = Date.now(); // 🔧 从此刻开始计算用户空闲时间
          // 延迟设置 idle，避免在音频播放过程中就切换状态
          setTimeout(() => {
            this.onSpeakingChange('idle');
          }, 500);
          break;

        case 'response.done':
          // 整个响应完成
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          this.awaitingResponse = false;
          // 双重保险：response.done 也标记 AI 回复结束
          if (this.isAssistantSpeaking) {
            this.isAssistantSpeaking = false;
            this.lastResponseEndTime = Date.now();
          }
          break;

        case 'response.audio_transcript.delta':
          // AI 转录增量
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          if (message.delta) {
            this.onTranscript(message.delta, false, 'assistant');
            // ✅ 累积增量到缓冲区，以防 done 事件丢失
            this.currentAssistantTranscriptBuffer += message.delta;
          }
          break;

        case 'response.audio_transcript.done':
          // AI 转录完成
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          {
            // ✅ 优先使用 done 事件中的完整转录，否则使用缓冲区累积的内容
            const finalTranscript = message.transcript || this.currentAssistantTranscriptBuffer;
            if (finalTranscript) {
              this.onTranscript(finalTranscript, true, 'assistant');
              // ✅ 记录 AI 回复到对话历史（用于重连时恢复上下文）
              this.conversationHistory.push({ role: 'assistant', content: finalTranscript });
              // 限制历史长度，避免内存过大
              if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
              }
            }
            // 清空缓冲区
            this.currentAssistantTranscriptBuffer = '';
          }
          break;

        case 'response.text':
          // 豆包端到端对话的文本回复（event 550）
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          if (message.text) {
            this.onTranscript(message.text, true, 'assistant');
            // ✅ 记录 AI 回复到对话历史
            this.conversationHistory.push({ role: 'assistant', content: message.text });
            if (this.conversationHistory.length > 20) {
              this.conversationHistory = this.conversationHistory.slice(-20);
            }
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // 用户语音转录完成
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          {
            // ✅ 优先使用完整转录，否则使用缓冲区累积的内容
            const finalUserTranscript = message.transcript || this.currentUserTranscriptBuffer;
            if (finalUserTranscript) {
              this.onTranscript(finalUserTranscript, true, 'user');
              // ✅ 记录用户发言到对话历史
              this.conversationHistory.push({ role: 'user', content: finalUserTranscript });
              if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
              }
            }
            // 清空缓冲区
            this.currentUserTranscriptBuffer = '';
          }
          break;

        // ✅ 用户语音转录增量（豆包可能发送该事件）
        case 'conversation.item.input_audio_transcription.delta':
          this.lastHeartbeatResponse = Date.now();
          this.missedHeartbeats = 0;
          if (message.delta) {
            this.onTranscript(message.delta, false, 'user');
            // 累积增量到缓冲区
            this.currentUserTranscriptBuffer += message.delta;
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
          // 如果 relay 已经明确返回错误，标记为 closed，避免后续"假 connected"触发录音
          this.hasSessionClosed = true;
          // 🔧 如果正在等待连接，拒绝 Promise
          if (this.sessionConnectedRejecter) {
            const errMsg = message.error || message.details || 'Relay error';
            this.sessionConnectedRejecter(new Error(errMsg));
            this.clearSessionConnectedWait();
          }

          // ✅ 关键修复：如果在已连接后收到 error，之前不会更新 UI 状态，导致前端卡在“正在聆听”。
          // 这里把通话置为 error，并停止录音/心跳，关闭 ws（但不触发 disconnected 覆盖）。
          try {
            this.onSpeakingChange('idle');
          } catch {
            // ignore
          }

          try {
            this.stopRecording();
          } catch {
            // ignore
          }

          this.stopHeartbeat();

          // 关闭 ws，但避免 onclose 把状态改成 disconnected
          this.isDisconnected = true;
          if (this.ws) {
            try {
              if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'session.close' }));
              }
              this.ws.close();
            } catch {
              // ignore
            }
            this.ws = null;
          }

          this.onStatusChange('error');
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

       // 🔧 优化微信环境：移除高频音频日志
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
      // 🔧 同时创建增益节点，确保音量提升生效
      try {
        this.playbackGainNode = this.playbackAudioContext.createGain();
        this.playbackGainNode.gain.value = 4.0;
        this.playbackGainNode.connect(this.playbackAudioContext.destination);
        console.log('[DoubaoChat] Fallback GainNode created with 4.0x gain');
      } catch (e) {
        console.warn('[DoubaoChat] Failed to create fallback GainNode:', e);
      }
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
      // 🔧 使用增益节点提升音量（移动端微信扬声器偏小）
      if (this.playbackGainNode) {
        source.connect(this.playbackGainNode);
      } else {
        source.connect(this.playbackAudioContext.destination);
      }
      
      // 🔧 打断支持：保存当前播放源引用，以便用户打断时能立即停止
      this.currentPlaybackSource = source;
      
      source.onended = () => {
        // 清除引用（只有当前 source 结束时才清除）
        if (this.currentPlaybackSource === source) {
          this.currentPlaybackSource = null;
        }
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
    // 这里不要把 byteOffset 之外的"整段 buffer"一起拷贝进去，否则会把无关内存拼到 WAV 里，直接变成噪音。
    // 只应写入本次 chunk 对应的那段 bytes。
    // 理论上 handleAudioDelta 已保证是偶数长度（PCM16 对齐）。这里仅做兜底。
    let pcmBytes = (pcmData.length % 2 === 0)
      ? pcmData
      : pcmData.subarray(0, pcmData.length - 1);

    if (pcmBytes.length !== pcmData.length) {
      console.warn('[DoubaoChat] PCM chunk length still odd in createWavFromPCM; trimmed 1 byte as fallback:', pcmData.length, '->', pcmBytes.length);
    }

    // ✅ 兜底：自动判断字节序（极少数情况下服务端返回的 PCM 可能与预期字节序不一致，
    // 会表现为持续"呲呲呲"噪声）。
    // 我们用一个轻量启发式：比较 LE/BE 两种解读下的"削波比例"和平均幅度，
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
      // 经验阈值：LE 削波明显更高，且 BE 更"温和"
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
   * ✅ 重要：不要只发 response.create。
   * - 在部分服务端实现中，没有上下文 item 的 response.create 会返回 no_content。
   * - bot_first_speak / welcome_message 在某些网络/版本下也可能不触发。
   * 因此这里发送一条“隐藏的文本触发”，要求模型先用固定开场白问候。
   */
  private triggerGreeting(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[DoubaoChat] Cannot trigger greeting: WebSocket not ready');
      return;
    }

    // ✅ 发送隐藏触发：不影响用户 ASR，且能强制“带身份”的开场白
    // 注意：这条文本不会被我们主动渲染到 UI（UI 主要展示 ASR + assistant transcript）。
    const triggerText = `请你先用一句固定开场白问候我：${DoubaoRealtimeChat.FIXED_GREETING}`;
    try {
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: triggerText,
          }],
        },
      }));
      console.log('[DoubaoChat] Greeting trigger item sent');
    } catch (e) {
      console.warn('[DoubaoChat] Failed to send greeting trigger item:', e);
    }

    // ✅ 显式触发生成（确保有音频输出）
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectInProgress = false;
    this.reconnectAttempts = 0;
    this.removeLifecycleListeners();
    this.clearSessionConnectedWait();

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

    // ✅ 清理播放增益节点
    if (this.playbackGainNode) {
      try {
        this.playbackGainNode.disconnect();
      } catch (e) {
        console.warn('[DoubaoChat] Failed to disconnect playback GainNode:', e);
      }
      this.playbackGainNode = null;
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
