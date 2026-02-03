/**
 * 豆包语音大模型 WebSocket Relay (完整二进制协议实现)
 * 
 * 由于豆包 API 要求 HTTP Headers 认证，而浏览器 WebSocket 无法发送自定义 Headers，
 * 本 Relay 使用原生 TCP 连接手动完成 WebSocket 握手。
 * 
 * 认证方式：HTTP Headers（必需）
 * - X-Api-App-Key: APP ID
 * - X-Api-Access-Key: Access Token  
 * - X-Api-Resource-Id: 资源 ID
 * - X-Api-Connect-Id: 连接追踪 ID
 * 
 * 豆包二进制协议格式：
 * Header(4字节) + [Sequence?] + [Event?] + [SessionIdSize + SessionId?] + PayloadSize(4字节) + Payload
 */

import { corsHeaders } from '../_shared/cors.ts';

const DOUBAO_HOST = 'openspeech.bytedance.com';
const DOUBAO_PATH = '/api/v3/realtime/dialogue';

// ✅ 情绪教练：前端只做纯语音交互（不展示 AI 文本）。
// 为了降低微信 WebView 的消息/JSON 处理压力，这里默认停止向前端转发 assistant 文本。
// （不影响语音音频流；persona 校验仍在后端完成）
const FORWARD_ASSISTANT_TEXT = false;

// 固定的 App Key (豆包文档要求)
const FIXED_APP_KEY = 'PlgvMymc7f3tQnJ6';

// 豆包协议常量
const PROTOCOL_VERSION = 0x01;
const HEADER_SIZE = 0x01;

// Message Types
const MESSAGE_TYPE_FULL_CLIENT = 0x01;      // Full Client Request (JSON)
const MESSAGE_TYPE_AUDIO_ONLY = 0x02;       // Audio Only Client Request
const MESSAGE_TYPE_FULL_SERVER = 0x09;      // Full Server Response (JSON)
const MESSAGE_TYPE_AUDIO_ONLY_SERVER = 0x0B; // Audio Only Server Response
const MESSAGE_TYPE_ERROR = 0x0F;            // Error Response

// Serialization
const SERIALIZATION_NONE = 0x00;
const SERIALIZATION_JSON = 0x01;

// Compression
const COMPRESSION_NONE = 0x00;

// Header Flags (byte1 low 4 bits)
// ============================================================================
// 豆包二进制协议 V1 Flags 定义
// ============================================================================
// 
// 官方文档和实际观察的 Flags 布局：
//   - bit 0 (0x01): HAS_SEQUENCE
//   - bit 1 (0x02): (保留/未使用)
//   - bit 2 (0x04): HAS_EVENT
//   - bit 3 (0x08): HAS_SESSION_ID (作为独立字段)
//
// 但实际服务端响应 (event=150/352 等) 中，SessionID 是**作为 payload 的一部分**发送的，
// 而不是通过 FLAG_HAS_SESSION_ID 标记的独立字段！
//
// 关键发现 (2026-01-25):
//   服务端响应 byte1=0x94 → msgType=9, flags=0x04 (HAS_EVENT)
//   后续是: Event(4) + PayloadSize(4) + Payload(可能包含 SessionID 或音频)
//
// 因此，对于服务端响应，我们不应该期望 FLAG_HAS_SESSION_ID 被设置。
// ============================================================================

const FLAG_HAS_SEQUENCE = 0x01;        // bit 0: 有 sequence 字段
const FLAG_HAS_EVENT = 0x04;           // bit 2: 有 event 字段
const FLAG_HAS_SESSION_ID = 0x08;      // bit 3: 有 session_id 字段 (作为独立字段，服务端响应中通常不使用)

// Event Types
const EVENT_START_SESSION = 100;
const EVENT_SESSION_STARTED = 101;
// Some deployments of Doubao realtime dialogue return an ACK-like event=150 whose payload is the sessionId (UUID)
// before/without emitting event=101. If we don't treat it as "session ready", the relay will drop audio forever.
const EVENT_SESSION_ACK = 150;
const EVENT_AUDIO_UPLOAD = 200;
const EVENT_AUDIO_STREAM = 201;
// ✅ 文本触发事件（用于让模型“开口/回复”）
// - 300: SayHello（常用于开场触发）
// - 501: ChatTextQuery（常用于普通文本提问触发）
const EVENT_SAY_HELLO = 300;
const EVENT_CHAT_TEXT_QUERY = 501;
const EVENT_END_SESSION = 900;

// 豆包端到端对话事件码（官方文档 - 用于接收服务端响应）
const EVENT_TTS_START = 350;        // TTS 开始
const EVENT_TTS_END = 351;          // TTS 分句结束  
const EVENT_TTS_RESPONSE = 352;     // TTS 音频数据 ✅ 主要音频输出事件
const EVENT_ASR_START = 450;        // ASR 开始
const EVENT_ASR_RESPONSE = 451;     // ASR 识别结果
const EVENT_CHAT_START = 459;       // 对话开始
const EVENT_CHAT_RESPONSE = 550;    // 模型文本回复
const EVENT_RESPONSE_DONE = 559;    // 回复完成

// ============= 豆包语音大模型 2.0 官方支持音色 =============
// doubao-speech-vision-pro-250515 模型推荐使用 jupiter_bigtts 系列音色
// 普通 TTS 音色（moon_bigtts/wvae_bigtts/mars_bigtts）在端到端实时模型中可能不可用
// 
// 官方端到端推荐音色：https://www.volcengine.com/docs/6561/1257543
// 
// ✅ 前端 ID -> 后端真实音色 ID 映射
// 前端保持语义化名称，后端转换为实际可用的音色
const VOICE_TYPE_MAP: Record<string, string> = {
  // 前端 voice_type -> 后端实际音色
  'zh_male_M392_conversation_wvae_bigtts': 'zh_male_yunzhou_jupiter_bigtts',      // 智慧长者 -> 清爽沉稳男声
  'zh_male_yuanboxiaoshu_moon_bigtts': 'zh_male_xiaotian_jupiter_bigtts',          // 渊博小叔 -> 清爽磁性男声
  'zh_female_xinlingjitang_moon_bigtts': 'zh_female_xiaohe_jupiter_bigtts',        // 心灵鸡汤 -> 甜美活泼女声
  'zh_female_wenroushunv_mars_bigtts': 'zh_female_vv_jupiter_bigtts',              // 温柔淑女 -> 活泼灵动女声 (默认)
};

// 实时端到端模型支持的有效音色
const VALID_VOICE_TYPES = new Set([
  // 端到端优化的 jupiter 系列（推荐）
  'zh_male_yunzhou_jupiter_bigtts',        // 清爽沉稳男声
  'zh_male_xiaotian_jupiter_bigtts',       // 清爽磁性男声
  'zh_female_vv_jupiter_bigtts',           // 活泼灵动女声 (默认)
  'zh_female_xiaohe_jupiter_bigtts',       // 甜美活泼女声
]);

// 解析音色：先做前端 ID -> 后端 ID 映射，再验证是否有效
const resolveProviderVoiceType = (voiceType?: string): string | undefined => {
  const v = (voiceType ?? '').trim();
  if (!v) return undefined;
  
  // 1. 先检查是否需要映射（前端传来的语义化 ID）
  if (VOICE_TYPE_MAP[v]) {
    const mapped = VOICE_TYPE_MAP[v];
    console.log(`[DoubaoRelay] 🎙️ Voice mapped: ${v} -> ${mapped}`);
    return mapped;
  }
  
  // 2. 检查是否是直接有效的音色 ID
  if (VALID_VOICE_TYPES.has(v)) {
    return v;
  }
  
  // 3. 如果是旧版 BV 格式，返回 undefined 让系统使用默认音色
  if (v.startsWith('BV') && v.includes('_streaming')) {
    console.warn(`[DoubaoRelay] ⚠️ Legacy BV format not supported: ${v}, will use default`);
    return undefined;
  }
  
  // 4. 其他未知格式，尝试使用但可能失败
  console.warn(`[DoubaoRelay] ⚠️ Unknown voice type: ${v}, attempting to use as-is`);
  return v;
};

// ============= 协议构建函数 =============

/**
 * 构建豆包协议 Header (4字节)
 * byte0: (protocol_version << 4) | header_size
 * byte1: (message_type << 4) | flags
 * byte2: (serialization << 4) | compression
 * byte3: reserved (0x00)
 */
function buildHeader(
  messageType: number, 
  flags: number = 0x00,
  serialization: number = SERIALIZATION_JSON, 
  compression: number = COMPRESSION_NONE
): Uint8Array {
  const header = new Uint8Array(4);
  header[0] = (PROTOCOL_VERSION << 4) | HEADER_SIZE;
  header[1] = (messageType << 4) | (flags & 0x0F);
  header[2] = (serialization << 4) | compression;
  header[3] = 0x00;
  return header;
}

/**
 * 构建完整的豆包协议消息包
 * 根据 flags 动态添加 sequence, event, session_id 字段
 */
function buildPacket(options: {
  messageType: number;
  flags?: number;
  sequence?: number;
  event?: number;
  sessionId?: string;
  payload?: Uint8Array;
  serialization?: number;
}): Uint8Array {
  const {
    messageType,
    flags = 0x00,
    sequence,
    event,
    sessionId,
    payload = new Uint8Array(0),
    serialization = SERIALIZATION_JSON
  } = options;

  // 计算各部分大小
  const hasSequence = (flags & FLAG_HAS_SEQUENCE) !== 0;
  const hasEvent = (flags & FLAG_HAS_EVENT) !== 0;
  const hasSessionId = (flags & FLAG_HAS_SESSION_ID) !== 0;

  let optionalFieldsSize = 0;
  if (hasSequence) optionalFieldsSize += 4;  // sequence: 4 bytes
  if (hasEvent) optionalFieldsSize += 4;     // event: 4 bytes
  
  let sessionIdBytes: Uint8Array | null = null;
  if (hasSessionId && sessionId) {
    sessionIdBytes = new TextEncoder().encode(sessionId);
    optionalFieldsSize += 4 + sessionIdBytes.length;  // size(4) + data
  }

  // 总大小: header(4) + optional fields + payload_size(4) + payload
  const totalSize = 4 + optionalFieldsSize + 4 + payload.length;
  const packet = new Uint8Array(totalSize);
  let offset = 0;

  // 1. Header (4 bytes)
  const header = buildHeader(messageType, flags, serialization);
  packet.set(header, offset);
  offset += 4;

  // 2. Optional: Sequence (4 bytes, big-endian)
  if (hasSequence && sequence !== undefined) {
    packet[offset] = (sequence >> 24) & 0xFF;
    packet[offset + 1] = (sequence >> 16) & 0xFF;
    packet[offset + 2] = (sequence >> 8) & 0xFF;
    packet[offset + 3] = sequence & 0xFF;
    offset += 4;
  }

  // 3. Optional: Event (4 bytes, big-endian)
  if (hasEvent && event !== undefined) {
    packet[offset] = (event >> 24) & 0xFF;
    packet[offset + 1] = (event >> 16) & 0xFF;
    packet[offset + 2] = (event >> 8) & 0xFF;
    packet[offset + 3] = event & 0xFF;
    offset += 4;
  }

  // 4. Optional: Session ID (size + data)
  if (hasSessionId && sessionIdBytes) {
    const len = sessionIdBytes.length;
    packet[offset] = (len >> 24) & 0xFF;
    packet[offset + 1] = (len >> 16) & 0xFF;
    packet[offset + 2] = (len >> 8) & 0xFF;
    packet[offset + 3] = len & 0xFF;
    offset += 4;
    packet.set(sessionIdBytes, offset);
    offset += len;
  }

  // 5. Payload Size (4 bytes, big-endian)
  packet[offset] = (payload.length >> 24) & 0xFF;
  packet[offset + 1] = (payload.length >> 16) & 0xFF;
  packet[offset + 2] = (payload.length >> 8) & 0xFF;
  packet[offset + 3] = payload.length & 0xFF;
  offset += 4;

  // 6. Payload
  packet.set(payload, offset);

  return packet;
}

/**
 * 解析豆包协议 Header 和可选字段
 * 
 * ⚠️ 关键发现 (2026-01-25):
 * 豆包服务端对于 TTS/ASR 响应 (event=350/351/352/450/451/550/559 等)，
 * 即使 flags=0x04 (只标记 HAS_EVENT)，实际布局仍然是：
 *   Header(4) + Event(4) + SessionIdLen(4) + SessionId(36) + PayloadSize(4) + Payload
 * 
 * 即 **SessionID 总是紧跟在 Event 后面发送**，不论 FLAG_HAS_SESSION_ID 是否设置。
 * 这与发送端（客户端）的行为不同，发送端必须设置 FLAG_HAS_SESSION_ID 才会写入 SessionID。
 */
function parsePacket(data: Uint8Array): {
  messageType: number;
  flags: number;
  serialization: number;
  compression: number;
  sequence?: number;
  event?: number;
  sessionId?: string;
  errorCode?: number;
  payloadSize: number;
  payload: Uint8Array;
} | null {
  if (data.length < 8) {
    console.error('[Protocol] Packet too short:', data.length);
    return null;
  }

  const readUint32BE = (buf: Uint8Array, off: number): number => {
    return (((buf[off] << 24) >>> 0) + (buf[off + 1] << 16) + (buf[off + 2] << 8) + buf[off + 3]) >>> 0;
  };

  // 服务端响应里“可能”会在 event 后带 sessionIdLen + sessionId。
  // 但对音频帧来说，这并不总是成立：如果把音频的前 4 字节误读成 sessionIdLen，
  // 会导致后续 payload 整体错位，产生明显“呲呲呲”噪声。
  // 因此：仅当长度为 36 且内容符合 UUID 格式时，才认定为 sessionId；否则回退。
  const isUuidLike = (s: string): boolean => {
    // 8-4-4-4-12
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
  };

  // Validate protocol/version/header_size early
  const protocolVersion = (data[0] >> 4) & 0x0F;
  const headerSize = data[0] & 0x0F;
  if (protocolVersion !== PROTOCOL_VERSION || headerSize !== HEADER_SIZE) {
    console.warn('[Protocol] Invalid Doubao packet header, skipping', {
      protocolVersion,
      headerSize,
      firstBytes: toHexPreview(data, 16),
    });
    return null;
  }

  const messageType = (data[1] >> 4) & 0x0F;
  const flags = data[1] & 0x0F;
  const serialization = (data[2] >> 4) & 0x0F;
  const compression = data[2] & 0x0F;

  const hasSequence = (flags & FLAG_HAS_SEQUENCE) !== 0;
  const hasEvent = (flags & FLAG_HAS_EVENT) !== 0;
  const hasSessionIdFlag = (flags & FLAG_HAS_SESSION_ID) !== 0;

  let offset = 4;
  let sequence: number | undefined;
  let event: number | undefined;
  let sessionId: string | undefined;
  let errorCode: number | undefined;

  // Parse sequence
  if (hasSequence) {
    if (data.length < offset + 4) return null;
    sequence = readUint32BE(data, offset);
    offset += 4;
  }

  // Parse event
  if (hasEvent) {
    if (data.length < offset + 4) return null;
    event = readUint32BE(data, offset);
    offset += 4;
  }

  // ============================================================================
  // ⚠️ 关键修复：豆包服务端响应中，SessionID 总是紧跟在 Event 后面
  // ============================================================================
  // 
  // 豆包的"端到端对话"服务端响应 (msgType=9/11, event=150/350/351/352/450/451/550/559 等)
  // 即使 flags 中没有设置 FLAG_HAS_SESSION_ID (0x08)，
  // 服务端仍然会在 Event 后面写入 SessionIdLen(4) + SessionId(36)。
  // 
  // 判断条件：如果是服务端消息 (msgType=9 或 11) 且有 event，则总是尝试读取 sessionId
  // ============================================================================
  
  const isServerMessage = messageType === MESSAGE_TYPE_FULL_SERVER || messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER;
  const shouldReadSessionId = hasSessionIdFlag || (isServerMessage && hasEvent);
  
  if (shouldReadSessionId) {
    if (data.length < offset + 4) return null;
    const sessionIdLen = readUint32BE(data, offset);
    offset += 4;

    // sessionIdLen === 0：跳过，继续读 payloadSize
    if (sessionIdLen === 0) {
      // no-op
    } else if (sessionIdLen === 36) {
      if (data.length < offset + sessionIdLen) return null;
      const candidate = new TextDecoder().decode(data.slice(offset, offset + sessionIdLen));
      if (isUuidLike(candidate)) {
        sessionId = candidate;
        offset += sessionIdLen;
      } else {
        // 不是 UUID，回退：把这 4 字节当作 payloadSize 解析
        console.warn('[Protocol] sessionIdLen=36 but payload is not UUID; rolling back', {
          preview: candidate.slice(0, 16),
        });
        offset -= 4;
      }
    } else {
      // 非 0/36：高度怀疑其实是 payloadSize（或协议变体），回退
      console.warn(`[Protocol] sessionIdLen=${sessionIdLen} is not 0/36; rolling back`);
      offset -= 4;
    }
  }

  // Special-case: MESSAGE_TYPE_ERROR format is:
  // header(4) + error_code(4) + payload_size(4) + payload(JSON)
  if (messageType === MESSAGE_TYPE_ERROR) {
    if (data.length < offset + 8) return null;
    errorCode = readUint32BE(data, offset);
    offset += 4;
  }

  // Parse payload size
  if (data.length < offset + 4) return null;
  const payloadSize = readUint32BE(data, offset);
  offset += 4;

  // Parse payload
  if (data.length < offset + payloadSize) {
    console.error('[Protocol] Payload size exceeds buffer:', { payloadSize, available: data.length - offset });
    return null;
  }
  const payload = data.slice(offset, offset + payloadSize);

  // 🔍 DEBUG: 打印解析结果
  console.log(`[Protocol] Parsed: msgType=${messageType}, flags=0x${flags.toString(16)}, event=${event}, sessionId=${sessionId ? sessionId.substring(0,8) + '...' : 'none'}, payloadSize=${payloadSize}`);

  return {
    messageType,
    flags,
    serialization,
    compression,
    sequence,
    event,
    sessionId,
    errorCode,
    payloadSize,
    payload
  };
}

// ============= 消息构建函数 =============

type PromptStrategy = 'system_role_only' | 'redundant_fields';

/**
 * 构建 StartSession 请求 (event=100)
 * 根据官方文档，StartSession 必须包含 Event + SessionID
 * 二进制帧格式: Header(4) + Event(4) + SessionIdLen(4) + SessionId + PayloadSize(4) + Payload
 */
function buildStartSessionRequest(
  userId: string,
  instructions: string,
  sessionId: string,
  voiceType?: string,
  promptStrategy: PromptStrategy = 'system_role_only'
): Uint8Array {
  // ✅ 统一计算最终音色：
  // - 先做别名映射（长ID -> BV）
  // - 若为空则不指定音色（让服务端使用默认音色，避免 45000001 导致“连接后无回复”）
  const resolvedVoiceType = resolveProviderVoiceType(voiceType);

  const ttsAudioConfig: Record<string, unknown> = {
    channel: 1,
    format: 'pcm_s16le',
    sample_rate: 24000,
  };
  const tts: Record<string, unknown> = {
    audio_config: ttsAudioConfig,
  };

  if (resolvedVoiceType) {
    // ✅ 兼容多版本字段：尽可能把 voiceType 写进所有可能被读取的位置
    (ttsAudioConfig as any).voice_type = resolvedVoiceType;
    (ttsAudioConfig as any).speaker_name = resolvedVoiceType;
    (tts as any).voice_type = resolvedVoiceType;
    (tts as any).speaker = resolvedVoiceType;
  }

  // ✅ 豆包端到端实时对话 API (doubao-speech-vision-pro-250515)
  // 支持两套 prompt 注入策略：
  // - system_role_only：仅写入 request.system_role（默认）
  // - redundant_fields：同时写入 system_role/system_prompt/bot_system_prompt（兜底）
  const request: Record<string, unknown> = {
    model_name: 'doubao-speech-vision-pro-250515',
    enable_vad: true,
    vad_stop_time: 800,
    vad_max_speech_time: 600, // ✅ 修复：从 60s 增加到 600s（10分钟），避免长通话被截断
    vad_silence_time: 300,
    enable_tts: true,
    bot_name: '劲老师',
    // speaking_style 为可选字段，但在部分场景下能增强“说话风格”稳定性
    speaking_style: '温暖、接纳、专业；使用简体中文；像朋友一样自然对话',
    // ✅ 开场白：让 AI 主动开口说固定的欢迎语
    bot_first_speak: true,
    welcome_message: '你好呀，我是劲老师，今天想聊点什么喃？',
  };

  // ✅ 始终使用 redundant_fields 策略，确保首次连接就注入 prompt
  // 移除 persona fallback 自动重连逻辑，避免对话中途突然中断
  (request as any).system_role = instructions;
  (request as any).system_prompt = instructions;
  (request as any).bot_system_prompt = instructions;

  if (resolvedVoiceType) {
    (request as any).tts_speaker = resolvedVoiceType;
    (request as any).tts_voice_type = resolvedVoiceType;
  }

  const payload = {
    user: { uid: userId },
    audio: {
      format: 'pcm',
      sample_rate: 16000,
      bits: 16,
      channel: 1
    },
    // ✅ 关键修复：豆包文档中 `format: "pcm"` 代表 32bit PCM（常见为 F32LE/PCM32），
    // 若前端按 PCM16 写 WAV 头会产生持续"呲呲噪声"。
    // 因此这里强制请求 16bit 小端 PCM：pcm_s16le。
    // 参考：官方说明 tts.audio_config.format = "pcm_s16le"。
    tts,
    request,
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  // ✅ 详细调试日志：确认发送给豆包的完整配置
  const finalVoiceType = resolvedVoiceType;
  console.log('[Protocol] 📤 ============ StartSession Debug ============');
  console.log('[Protocol] 🎙️ voice_type param received:', voiceType);
  console.log('[Protocol] 🎙️ voice_type final (after fallback):', finalVoiceType);
  console.log('[Protocol] 🎙️ payload.tts.voice_type:', (payload as any).tts?.voice_type);
  console.log('[Protocol] 🎙️ payload.tts.audio_config.voice_type:', (payload as any).tts?.audio_config?.voice_type);
  // ✅ 重要：日志不要打印 full payload（太大容易被日志系统截断/丢弃），只打印关键字段
  console.log('[DoubaoRelay] StartSession debug:', {
    sessionId,
    model_name: (request as any).model_name,
    bot_name: (request as any).bot_name,
    prompt_strategy: promptStrategy,
    prompt_fields: {
      system_role: Boolean((request as any).system_role),
      system_prompt: Boolean((request as any).system_prompt),
      bot_system_prompt: Boolean((request as any).bot_system_prompt),
    },
    system_role_len: typeof instructions === 'string' ? instructions.length : 0,
    system_role_preview: (instructions || '').substring(0, 120),
    voice_type_final: finalVoiceType || '(none)',
  });

  /**
   * ✅ IMPORTANT: StartSession 的字段布局与 “flags” 不完全一致。
   * 官方示例中 flags=0x04(HAS_EVENT)，但仍然紧跟写入 SessionID(len + bytes)。
   * 若我们错误地依赖 FLAG_HAS_SESSION_ID / FLAG_HAS_SEQUENCE，会导致服务端按官方格式解码时字段错位，
   * 继而出现 autoAssignedSequence mismatch 等“连接后无反应”的问题。
   */
  const flags = FLAG_HAS_EVENT; // StartSession 只标记 HAS_EVENT
  const header = buildHeader(MESSAGE_TYPE_FULL_CLIENT, flags, SERIALIZATION_JSON);

  const sessionIdBytes = new TextEncoder().encode(sessionId);

  // layout: header(4) + event(4) + sessionIdLen(4) + sessionId + payloadSize(4) + payload
  const totalSize = 4 + 4 + 4 + sessionIdBytes.length + 4 + payloadBytes.length;
  const packet = new Uint8Array(totalSize);
  let offset = 0;

  // header
  packet.set(header, offset);
  offset += 4;

  // event (uint32be)
  packet[offset] = (EVENT_START_SESSION >> 24) & 0xff;
  packet[offset + 1] = (EVENT_START_SESSION >> 16) & 0xff;
  packet[offset + 2] = (EVENT_START_SESSION >> 8) & 0xff;
  packet[offset + 3] = EVENT_START_SESSION & 0xff;
  offset += 4;

  // sessionIdLen + sessionId
  const sidLen = sessionIdBytes.length;
  packet[offset] = (sidLen >> 24) & 0xff;
  packet[offset + 1] = (sidLen >> 16) & 0xff;
  packet[offset + 2] = (sidLen >> 8) & 0xff;
  packet[offset + 3] = sidLen & 0xff;
  offset += 4;
  packet.set(sessionIdBytes, offset);
  offset += sidLen;

  // payloadSize + payload
  packet[offset] = (payloadBytes.length >> 24) & 0xff;
  packet[offset + 1] = (payloadBytes.length >> 16) & 0xff;
  packet[offset + 2] = (payloadBytes.length >> 8) & 0xff;
  packet[offset + 3] = payloadBytes.length & 0xff;
  offset += 4;
  packet.set(payloadBytes, offset);

  return packet;
}

/**
 * 构建 Audio Upload 请求 (event=200)
 */
function buildAudioUploadRequest(audioData: Uint8Array, sequence: number, sessionId: string): Uint8Array {
  return buildPacket({
    messageType: MESSAGE_TYPE_AUDIO_ONLY,
    // ⚠️ Critical: Audio Upload 必须携带 sessionId，否则服务端可能无法将音频归属到会话
    flags: FLAG_HAS_SEQUENCE | FLAG_HAS_EVENT | FLAG_HAS_SESSION_ID,
    sequence: sequence,
    event: EVENT_AUDIO_UPLOAD,
    sessionId,
    payload: audioData,
    serialization: SERIALIZATION_NONE
  });
}

/**
 * 构建 EndSession 请求 (event=900)
 */
function buildEndSessionRequest(): Uint8Array {
  return buildPacket({
    messageType: MESSAGE_TYPE_FULL_CLIENT,
    flags: FLAG_HAS_EVENT,
    event: EVENT_END_SESSION,
    payload: new Uint8Array(0),
    serialization: SERIALIZATION_NONE
  });
}

// ============= 工具函数 =============

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function generateWebSocketKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// ============= WebSocket Frame 处理 =============

class WebSocketFrameParser {
  private buffer: Uint8Array = new Uint8Array(0);
  private fragmentedOpcode: number | null = null;
  private fragmentedPayload: Uint8Array[] = [];

  append(data: Uint8Array): void {
    const newBuffer = new Uint8Array(this.buffer.length + data.length);
    newBuffer.set(this.buffer, 0);
    newBuffer.set(data, this.buffer.length);
    this.buffer = newBuffer;
  }

  getFrames(): { opcode: number; payload: Uint8Array }[] {
    const frames: { opcode: number; payload: Uint8Array }[] = [];

    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];

      const fin = (firstByte & 0x80) !== 0;
      const opcode = firstByte & 0x0F;
      const masked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7F;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < 4) break;
        payloadLength = (this.buffer[2] << 8) | this.buffer[3];
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) break;
        // 64-bit length in network byte order. Most frames are <2^32; read low 32 bits.
        const high =
          ((this.buffer[2] << 24) | (this.buffer[3] << 16) | (this.buffer[4] << 8) | this.buffer[5]) >>> 0;
        const low =
          ((this.buffer[6] << 24) | (this.buffer[7] << 16) | (this.buffer[8] << 8) | this.buffer[9]) >>> 0;
        if (high !== 0) {
          console.warn('[Protocol] WebSocket frame payload length too large (high!=0), dropping parser buffer', { high, low });
          this.buffer = new Uint8Array(0);
          break;
        }
        payloadLength = low;
        offset = 10;
      }

      if (masked) offset += 4;
      if (this.buffer.length < offset + payloadLength) break;

      let payload = this.buffer.slice(offset, offset + payloadLength);
      if (masked) {
        const mask = this.buffer.slice(offset - 4, offset);
        payload = payload.map((b, i) => b ^ mask[i % 4]);
      }

      // Fragmentation support: opcode 0x00 continuation
      if (opcode === 0x00) {
        if (this.fragmentedOpcode !== null) {
          this.fragmentedPayload.push(payload);
          if (fin) {
            frames.push({ opcode: this.fragmentedOpcode, payload: mergeUint8Arrays(this.fragmentedPayload) });
            this.fragmentedOpcode = null;
            this.fragmentedPayload = [];
          }
        }
      } else if (fin) {
        frames.push({ opcode, payload });
      } else {
        this.fragmentedOpcode = opcode;
        this.fragmentedPayload = [payload];
      }

      this.buffer = this.buffer.slice(offset + payloadLength);
    }

    return frames;
  }

  // 获取握手后剩余的数据（用于处理紧跟在握手响应后的 WebSocket 帧）
  getRemainingData(): Uint8Array {
    return this.buffer;
  }
}

function mergeUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return merged;
}

function findHeaderEnd(data: Uint8Array): number {
  // Find \r\n\r\n in bytes
  for (let i = 0; i <= data.length - 4; i++) {
    if (data[i] === 13 && data[i + 1] === 10 && data[i + 2] === 13 && data[i + 3] === 10) return i + 4;
  }
  return -1;
}

function toHexPreview(bytes: Uint8Array, max = 32): string {
  const n = Math.min(max, bytes.length);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(bytes[i].toString(16).padStart(2, '0'));
  return parts.join(' ');
}

function buildWebSocketFrame(data: Uint8Array, opcode: number = 0x02): Uint8Array {
  const mask = new Uint8Array(4);
  crypto.getRandomValues(mask);
  
  let header: Uint8Array;
  if (data.length < 126) {
    header = new Uint8Array(6);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | data.length;
    header.set(mask, 2);
  } else if (data.length < 65536) {
    header = new Uint8Array(8);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header[2] = (data.length >> 8) & 0xFF;
    header[3] = data.length & 0xFF;
    header.set(mask, 4);
  } else {
    header = new Uint8Array(14);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    // 8 bytes length (network byte order). We only use low 32 bits.
    header[2] = 0x00;
    header[3] = 0x00;
    header[4] = 0x00;
    header[5] = 0x00;
    header[6] = (data.length >> 24) & 0xFF;
    header[7] = (data.length >> 16) & 0xFF;
    header[8] = (data.length >> 8) & 0xFF;
    header[9] = data.length & 0xFF;
    header.set(mask, 10);
  }
  
  const maskedPayload = data.map((b, i) => b ^ mask[i % 4]);
  
  const frame = new Uint8Array(header.length + maskedPayload.length);
  frame.set(header, 0);
  frame.set(maskedPayload, header.length);
  
  return frame;
}

// ============= 主服务 =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response(
      JSON.stringify({ error: 'Expected WebSocket upgrade' }),
      { status: 426, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const DOUBAO_APP_ID = Deno.env.get('DOUBAO_APP_ID');
  const DOUBAO_ACCESS_TOKEN = Deno.env.get('DOUBAO_ACCESS_TOKEN');

  if (!DOUBAO_APP_ID || !DOUBAO_ACCESS_TOKEN) {
    console.error('[DoubaoRelay] Missing Doubao credentials');
    return new Response(
      JSON.stringify({ error: 'Doubao API credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id') || 'anonymous';
  const mode = url.searchParams.get('mode') || 'emotion';

  console.log(`[DoubaoRelay] New connection: userId=${userId}, mode=${mode}`);

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  let doubaoConn: Deno.TlsConn | null = null;
  let isConnected = false;
  let sessionConfig: { instructions: string; voiceType: string; promptStrategy: PromptStrategy } | null = null;
  let heartbeatInterval: number | null = null;
  let audioSequence = 0;  // 音频包序号
  let sessionStarted = false;  // 标记 session 是否已成功启动
  let doubaoSessionId: string | null = null; // StartSession 生成的 sessionId，后续 Audio Upload 必须复用
  let hasGreeted = false;
  let clientAudioAppendCount = 0;

  // ✅ 音色降级：当 speaker id 不在 timber 内时（45000001），自动降级为“不指定音色”并重连一次。
  // 目的：避免前端卡在“正在聆听”但无回复。
  let speakerFallbackAttempted = false;

  // ✅ Persona 兜底：当检测到模型仍自称“豆包”，自动切换 promptStrategy 重连一次。
  let personaFallbackAttempted = false;
  let pendingIdentityCheck = false;
  let identityReplyBuffer = '';

  // 身份问题检测（同时用于语音 ASR 与文字输入）
  const IDENTITY_QUESTION_RE = /你是谁|你叫什么|你是豆包|你是什么模型|你是什么/;

  // ✅ 自动重连期间不要向前端发送 session.closed
  // 否则前端会把会话标记为 closed，从而忽略后续真正 ready 的 session.connected
  let isReconnecting = false;

  // ✅ Ready 兜底：部分部署可能不返回 event=101/150
  let sessionReadySent = false;
  let sessionReadyTimer: number | null = null;

  const clearSessionReadyTimer = () => {
    if (sessionReadyTimer) {
      try {
        clearTimeout(sessionReadyTimer);
      } catch {
        // ignore
      }
      sessionReadyTimer = null;
    }
  };

  // ✅ 防止“重复 session.init / 重连”导致多条 Doubao 连接并存，从而出现“双路语音叠加”。
  // 每次 connectToDoubao 都会递增 generation；旧连接/旧 readLoop 会自动退出。
  let connectionGeneration = 0;

  const cleanupDoubaoConnection = (reason: string) => {
    clearSessionReadyTimer();
    sessionReadySent = false;
    if (doubaoConn) {
      try {
        console.log('[DoubaoRelay] Cleaning up existing Doubao connection, reason:', reason);
        doubaoConn.close();
      } catch {
        // ignore
      }
    }
    doubaoConn = null;
    isConnected = false;
    sessionStarted = false;
    doubaoSessionId = null;
    hasGreeted = false;
  };

  const connectToDoubao = async () => {
    try {
      // ✅ 任何一次新的 connect 都视为“新一代连接”，旧 readLoop 必须退出
      const myGeneration = ++connectionGeneration;

      // 如果前一次连接仍存在，先清理，避免双路连接向同一 clientSocket 推送音频
      if (doubaoConn || isConnected) {
        cleanupDoubaoConnection('connectToDoubao:reconnect');
      }

      const connectId = crypto.randomUUID();
      console.log(`[DoubaoRelay] Connecting to ${DOUBAO_HOST} with connectId=${connectId}`);
      
      // 建立 TLS 连接
      doubaoConn = await Deno.connectTls({
        hostname: DOUBAO_HOST,
        port: 443,
      });
      
      console.log('[DoubaoRelay] TLS connection established');
      
      // 发送 WebSocket 握手请求
      const wsKey = generateWebSocketKey();
      const handshakeRequest = [
        `GET ${DOUBAO_PATH} HTTP/1.1`,
        `Host: ${DOUBAO_HOST}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Version: 13',
        `Sec-WebSocket-Key: ${wsKey}`,
        `X-Api-App-Key: ${FIXED_APP_KEY}`,
        `X-Api-App-ID: ${DOUBAO_APP_ID}`,
        `X-Api-Access-Key: ${DOUBAO_ACCESS_TOKEN}`,
        'X-Api-Resource-Id: volc.speech.dialog',
        `X-Api-Connect-Id: ${connectId}`,
        '',
        ''
      ].join('\r\n');
      
      console.log('[DoubaoRelay] Sending WebSocket handshake...');
      await doubaoConn.write(new TextEncoder().encode(handshakeRequest));
      
      // 读取握手响应
      const responseBuffer = new Uint8Array(4096);
      const bytesRead = await doubaoConn.read(responseBuffer);
      
      if (bytesRead === null || bytesRead === 0) {
        throw new Error('No response from server');
      }
      
      const responseData = responseBuffer.slice(0, bytesRead);
      const headerEnd = findHeaderEnd(responseData);
      const responseText = new TextDecoder().decode(
        headerEnd === -1 ? responseData : responseData.slice(0, headerEnd)
      );
      console.log(`[DoubaoRelay] Handshake response: ${responseText.substring(0, 300)}`);
      
      if (!responseText.includes('101')) {
        // 提取错误信息
        const statusMatch = responseText.match(/HTTP\/\d\.\d (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';
        throw new Error(`WebSocket handshake failed with status ${status}: ${responseText.substring(0, 200)}`);
      }
      
      console.log('[DoubaoRelay] WebSocket handshake successful!');
      isConnected = true;
      
      // 解析握手后可能紧跟的 WebSocket 帧数据
      const parser = new WebSocketFrameParser();
      if (headerEnd !== -1 && headerEnd < bytesRead) {
        const remainingData = responseData.slice(headerEnd);
        console.log(`[DoubaoRelay] Found ${remainingData.length} bytes after handshake`);
        parser.append(remainingData);
      }
      
      // 发送 StartSession 请求
      if (sessionConfig) {
        // 生成客户端 SessionID (UUID)
        doubaoSessionId = crypto.randomUUID();
        console.log(`[DoubaoRelay] Generated SessionID: ${doubaoSessionId}`);
        
        // ✅ 传递音色配置到 StartSession
        const startSessionPacket = buildStartSessionRequest(
          userId,
          sessionConfig.instructions,
          doubaoSessionId,
          sessionConfig.voiceType,
          sessionConfig.promptStrategy
        );
        const frame = buildWebSocketFrame(startSessionPacket);
        await doubaoConn.write(frame);
        console.log(`[DoubaoRelay] Sent StartSession request (${startSessionPacket.length} bytes), voiceType: ${sessionConfig.voiceType}`);

        // ✅ 不再“乐观 connected”：之前会导致前端过早触发 greeting，
        // relay 侧因 session 未 ready 丢弃文本，最终出现“正在聆听但无回复/IdleTimeout”。
        sessionStarted = true;
        sessionReadySent = false;
        clearSessionReadyTimer();
        console.log('[DoubaoRelay] ✅ StartSession sent; waiting for ACK (101/150) or timeout fallback');

        // 兜底：若 1.5s 内没有 ACK/101 且未进入重连，则认为可用并通知前端开始录音/触发开场
        sessionReadyTimer = setTimeout(() => {
          if (
            myGeneration === connectionGeneration &&
            clientSocket.readyState === WebSocket.OPEN &&
            doubaoConn &&
            isConnected &&
            sessionStarted &&
            doubaoSessionId &&
            !isReconnecting &&
            !sessionReadySent
          ) {
            sessionReadySent = true;
            console.warn('[DoubaoRelay] No ACK observed; sending session.connected via timeout fallback');
            clientSocket.send(JSON.stringify({
              type: 'session.connected',
              message: 'Connected to Doubao API - Ready (timeout fallback)',
              ready: true,
              reason: 'no_ack_timeout'
            }));
          }
        }, 1500) as unknown as number;
      }
      
      // 开始读取响应
      const readLoop = async () => {
        const buffer = new Uint8Array(65536);
        let lastReadTime = Date.now();
        let readTimeoutWarned = false;

        // ✅ 只允许当前 generation 的 loop 运行；一旦出现新连接，旧 loop 会自动退出
        while (isConnected && doubaoConn && myGeneration === connectionGeneration) {
          try {
            const n = await doubaoConn.read(buffer);
            const now = Date.now();
            const elapsed = now - lastReadTime;
            
            // 🔧 诊断日志：如果读取间隔超过 10 秒，记录一次（帮助排查微信环境卡顿）
            if (elapsed > 10000 && !readTimeoutWarned) {
              console.warn(`[DoubaoRelay] ⚠️ Long read gap detected: ${elapsed}ms since last data`);
              readTimeoutWarned = true;
            }
            lastReadTime = now;
            
            if (n === null || n === 0) {
              console.log(`[DoubaoRelay] Connection closed by Doubao (n=${n}, elapsed=${elapsed}ms)`);
              isConnected = false;
              break;
            }
            
            // 重置警告标志
            readTimeoutWarned = false;
            
            parser.append(buffer.slice(0, n));
            const frames = parser.getFrames();
            
            for (const frame of frames) {
              if (frame.opcode === 0x01) { // Text frame
                const text = new TextDecoder().decode(frame.payload);
                console.log('[DoubaoRelay] Received text frame:', text.substring(0, 300));
                clientSocket.send(JSON.stringify({
                  type: 'response.text_frame',
                  text,
                }));
                continue;
              }

              if (frame.opcode === 0x02) { // Binary frame
                const parsed = parsePacket(frame.payload);
                
                if (!parsed) {
                  console.error('[DoubaoRelay] Failed to parse Doubao packet', {
                    frameLen: frame.payload.length,
                    firstBytes: toHexPreview(frame.payload, 24),
                  });
                  continue;
                }
                
                // 🔧 优化日志：只打印关键事件，避免音频包日志刷屏导致中断
                const isAudioPacket = parsed.event === EVENT_TTS_RESPONSE;
                const logPacket = !isAudioPacket || (audioSequence % 100 === 0);
                if (logPacket) {
                  console.log(`[DoubaoRelay] Received: msgType=${parsed.messageType}, event=${parsed.event}, seq=${parsed.sequence}, errCode=${parsed.errorCode}, payloadSize=${parsed.payloadSize}`);
                }
                
                // 🔍 调试：对于音频类型消息，每 100 个包打印一次详细信息
                if (parsed.messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER && audioSequence % 100 === 0) {
                  console.log(`[DoubaoRelay] AudioPacket detail: flags=0x${parsed.flags.toString(16)}, hasSession=${parsed.sessionId ? 'yes' : 'no'}, payloadLen=${parsed.payload.length}`);
                }
                
                // ⚠️ 优先处理 TTS 音频响应 (event=352) - 豆包实际发送音频的事件码
                // 这必须在 JSON 解析之前处理，因为 payload 是二进制 PCM 数据
                if (parsed.event === EVENT_TTS_RESPONSE) {
                  if (parsed.payload.length > 0) {
                    const base64Audio = uint8ArrayToBase64(parsed.payload);
                    // 🔧 优化：每 100 个音频包才打印一次日志，避免刷屏
                    if (audioSequence % 100 === 0) {
                      console.log(`[DoubaoRelay] ✅ TTS audio forwarding: ${parsed.payload.length} PCM bytes -> ${base64Audio.length} base64 chars (seq=${audioSequence})`);
                    }
                    
                    try {
                      clientSocket.send(JSON.stringify({
                        type: 'response.audio.delta',
                        delta: base64Audio
                      }));
                    } catch (sendErr) {
                      console.error(`[DoubaoRelay] ❌ Failed to send audio to client:`, sendErr);
                    }
                  } else if (audioSequence % 100 === 0) {
                    console.warn(`[DoubaoRelay] TTS audio payload is empty!`);
                  }
                  continue; // 跳过后续处理，防止 JSON 解析失败
                }
                
                // 处理 TTS 开始/结束事件 (event=350/351) - payload 通常是 sessionId，跳过 JSON 解析
                if (parsed.event === EVENT_TTS_START || parsed.event === EVENT_TTS_END) {
                  console.log(`[DoubaoRelay] TTS event: ${parsed.event === EVENT_TTS_START ? 'start' : 'end'}`);
                  // ✅ 修复：转发 TTS 结束事件给前端，让 UI 能正确切换 speaking 状态
                  if (parsed.event === EVENT_TTS_END && clientSocket.readyState === WebSocket.OPEN) {
                    clientSocket.send(JSON.stringify({ type: 'response.audio.done' }));
                  }
                  continue;
                }
                
                // 处理 SessionStarted 事件 (event=101)
                if (parsed.event === EVENT_SESSION_STARTED) {
                  sessionStarted = true;
                  console.log('[DoubaoRelay] Session started successfully!');

                  if (!sessionReadySent && clientSocket.readyState === WebSocket.OPEN) {
                    sessionReadySent = true;
                    isReconnecting = false;
                    clearSessionReadyTimer();
                    clientSocket.send(JSON.stringify({ 
                      type: 'session.connected',
                      message: 'Connected to Doubao API - Session started',
                      ready: true,
                      reason: 'event_101'
                    }));
                  }
                  continue;
                }

                // ✅ 将豆包 ASR 开始事件映射为“用户开始说话”（前端用来更新 speaking 状态）
                if (parsed.event === EVENT_ASR_START) {
                  console.log(`[DoubaoRelay] 🎙️ ASR开始: 检测到用户语音输入`);
                  clientSocket.send(JSON.stringify({ type: 'input_audio_buffer.speech_started' }));
                  continue;
                }

                // 兼容：豆包 API 的 event=150 (SESSION_ACK) 可能有两种 payload 格式：
                // 1. 新格式：JSON 对象 {"dialog_id":"..."}
                // 2. 旧格式：裸 UUID 字符串（与 doubaoSessionId 匹配）
                if (parsed.event === EVENT_SESSION_ACK && parsed.payloadSize > 0) {
                  const payloadStr = new TextDecoder().decode(parsed.payload).trim();
                  console.log(`[DoubaoRelay] SESSION_ACK payload: "${payloadStr.substring(0, 100)}"`);
                  
                  let isValidSessionAck = false;
                  
                  // 尝试解析为 JSON（新格式）
                  try {
                    if (payloadStr.startsWith('{')) {
                      const ackPayload = JSON.parse(payloadStr);
                      // 只要收到 dialog_id 就认为会话已就绪
                      if (ackPayload.dialog_id) {
                        console.log(`[DoubaoRelay] Session ACK with dialog_id: ${ackPayload.dialog_id}`);
                        isValidSessionAck = true;
                      }
                    }
                  } catch {
                    // 不是有效 JSON，尝试旧格式
                  }
                  
                  // 旧格式兼容：payload 是 sessionId 本身
                  if (!isValidSessionAck && doubaoSessionId && payloadStr === doubaoSessionId) {
                    console.log(`[DoubaoRelay] Session ACK with matching sessionId`);
                    isValidSessionAck = true;
                  }
                  
                  if (isValidSessionAck) {
                    sessionStarted = true;
                    console.log('[DoubaoRelay] ✅ Session started - ACK received (event=150)');
                    if (!sessionReadySent && clientSocket.readyState === WebSocket.OPEN) {
                      sessionReadySent = true;
                      isReconnecting = false;
                      clearSessionReadyTimer();
                      clientSocket.send(JSON.stringify({
                        type: 'session.connected',
                        message: 'Connected to Doubao API - Session ACK',
                        ready: true,
                        reason: 'event_150'
                      }));
                    }
                    continue;
                  }
                }
                
                // 跳过 ASR/Chat 相关的非 JSON payload 事件 (event=450/451/459/550/559)
                // 这些事件的 payload 通常是 sessionId（UUID 字符串），不是有效 JSON
                if (parsed.event === EVENT_ASR_START || 
                    parsed.event === EVENT_ASR_RESPONSE || 
                    parsed.event === EVENT_CHAT_START ||
                    parsed.event === EVENT_CHAT_RESPONSE ||
                    parsed.event === EVENT_RESPONSE_DONE) {
                  
                  // ✅ 修复：转发 response.done 给前端，让前端能正确重置 awaitingResponse 状态
                  if (parsed.event === EVENT_RESPONSE_DONE && clientSocket.readyState === WebSocket.OPEN) {
                    console.log('[DoubaoRelay] ✅ Forwarding response.done to client');
                    clientSocket.send(JSON.stringify({ type: 'response.done' }));
                  }
                  
                  // 尝试安全解析，但失败时不报错（静默跳过）
                  try {
                    const jsonStr = new TextDecoder().decode(parsed.payload);
                    // 检查是否看起来像 JSON
                    if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
                      const payload = JSON.parse(jsonStr);
                      console.log(`[DoubaoRelay] Event ${parsed.event} payload:`, JSON.stringify(payload).substring(0, 200));
                      
                       // ASR 识别结果（用户说话的转写）
                       // 前端 DoubaoRealtimeAudio.ts 期望使用 OpenAI 风格事件：conversation.item.input_audio_transcription.completed
                       // 否则用户会出现"能听到但说不了/没反应"的感知。
                       // 豆包 ASR payload 结构：
                       // - { extra: { origin_text: "你好", endpoint: true, ... } } - 常见格式
                       // - { result: { text: "你好" } } - 备选格式
                       if (parsed.event === EVENT_ASR_RESPONSE) {
                         const transcript = payload.extra?.origin_text ?? payload.result?.text;
                         // 只在有 endpoint=true（用户说完）且有文本时转发，避免重复发送中间结果
                         const isEndpoint = payload.extra?.endpoint === true;
                         console.log(`[DoubaoRelay] 🎤 ASR识别: "${transcript || '(empty)'}", endpoint=${isEndpoint}`);
                         if (transcript && isEndpoint) {
                           console.log(`[DoubaoRelay] 🗣️ 用户说话(最终): "${transcript}"`);

                            // ✅ 如果用户在问“你是谁/你叫什么”等身份问题，开启本轮 persona 校验
                             const normalized = String(transcript).replace(/\s+/g, '');
                             pendingIdentityCheck = IDENTITY_QUESTION_RE.test(normalized);
                            if (pendingIdentityCheck) {
                              identityReplyBuffer = '';
                              console.log('[DoubaoRelay] IdentityCheck armed for next assistant reply');
                            }

                           clientSocket.send(JSON.stringify({
                             type: 'conversation.item.input_audio_transcription.completed',
                             transcript: String(transcript),
                           }));
                            // ✅ 兼容前端逻辑：在“最终转写”出现时，认为用户说话结束
                            clientSocket.send(JSON.stringify({ type: 'input_audio_buffer.speech_stopped' }));
                         }
                       }
                      
                       // Chat 回复文本（模型文本）
                       // 豆包 API 返回的 payload 结构可能为:
                       // - { content: "..." } - 最常见的流式文本格式
                       // - { text: "..." }
                       // - { result: { text: "..." } }
                       if (parsed.event === EVENT_CHAT_RESPONSE) {
                         const text = payload.content ?? payload.text ?? payload.result?.text;
                          // 仅用于后端 persona 检查；不再转发到前端（纯语音体验）

                          // ✅ Persona fallback: 若用户问身份但模型仍自称“豆包”，自动重连并切换 promptStrategy
                          if (pendingIdentityCheck && typeof text === 'string' && text.length > 0) {
                            identityReplyBuffer += text;

                            // 流式拼接后再判断，避免单字 delta（"豆"/"包"）时漏检
                            const hitDoubao = identityReplyBuffer.includes('豆包');
                            const hitJing = identityReplyBuffer.includes('静老师');

                            if (hitDoubao) {
                              // ⚠️ 仅记录日志，不触发重连（重连会导致用户对话突然中断）
                              console.warn('[DoubaoRelay] Persona mismatch: model still says Doubao. Prompt may not be applied.', {
                                buffer_preview: identityReplyBuffer.substring(0, 80),
                              });
                              pendingIdentityCheck = false;
                            }

                            if (hitJing) {
                              pendingIdentityCheck = false;
                            }
                          }

                          if (FORWARD_ASSISTANT_TEXT && text && clientSocket.readyState === WebSocket.OPEN) {
                            clientSocket.send(JSON.stringify({
                              type: 'response.audio_transcript.delta',
                              delta: String(text),
                            }));
                          }
                       }
                    }
                  } catch {
                    // 非 JSON payload，静默跳过
                  }
                  continue;
                }
                
                // 处理其他文本/JSON 响应
                if (parsed.messageType === MESSAGE_TYPE_FULL_SERVER && parsed.serialization === SERIALIZATION_JSON) {
                  try {
                    const jsonStr = new TextDecoder().decode(parsed.payload);
                    // 有些事件 payload 可能不是 JSON（例如纯 sessionId 字符串）；JSON.parse 失败时直接跳过即可
                    if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                      continue;
                    }
                    const payload = JSON.parse(jsonStr);
                    console.log('[DoubaoRelay] JSON payload:', JSON.stringify(payload).substring(0, 200));

                    if (FORWARD_ASSISTANT_TEXT && clientSocket.readyState === WebSocket.OPEN) {
                      clientSocket.send(JSON.stringify({
                        type: 'response.text',
                        payload: payload,
                        event: parsed.event
                      }));

                      // 提取文本转写
                      if (payload.result?.text) {
                        clientSocket.send(JSON.stringify({
                          type: 'response.audio_transcript.delta',
                          delta: payload.result.text
                        }));
                      }

                      // 处理 TTS 文本
                      if (payload.tts?.text) {
                        clientSocket.send(JSON.stringify({
                          type: 'response.audio_transcript.delta',
                          delta: payload.tts.text
                        }));
                      }
                    }
                  } catch (e) {
                    // 解析失败时静默跳过，避免日志刷屏
                    console.warn('[DoubaoRelay] Non-JSON payload for event:', parsed.event);
                  }
                }
                
                // 处理音频响应 (event=201 Audio Stream)
                if (parsed.messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER || parsed.event === EVENT_AUDIO_STREAM) {
                  if (parsed.payload.length > 0) {
                    clientSocket.send(JSON.stringify({
                      type: 'response.audio.delta',
                      delta: uint8ArrayToBase64(parsed.payload)
                    }));
                  }
                }
                
                // 处理错误
                if (parsed.messageType === MESSAGE_TYPE_ERROR) {
                  try {
                    const errorJson = JSON.parse(new TextDecoder().decode(parsed.payload));
                    const errorMsg = String(errorJson.message || errorJson.error || 'Unknown error from Doubao');
                    console.error('[DoubaoRelay] Error from Doubao:', { errorCode: parsed.errorCode, errorJson });

                    const isSpeakerNotFound = parsed.errorCode === 45000001 && /speaker id=.*not found/i.test(errorMsg);

                    // ✅ 自动降级：第一次遇到 speaker not found，不向前端透传 type=error（否则前端会进入 hasSessionClosed=true 状态，忽略后续 session.connected）
                    if (isSpeakerNotFound && !speakerFallbackAttempted && sessionConfig) {
                      speakerFallbackAttempted = true;
                      isReconnecting = true;
                      clearSessionReadyTimer();
                      const originalVoice = sessionConfig.voiceType;

                      console.warn('[DoubaoRelay] ⚠️ Speaker not found, auto-fallback to default voice (omit voice_type) and reconnecting once', {
                        originalVoice,
                      });

                      if (clientSocket.readyState === WebSocket.OPEN) {
                        clientSocket.send(JSON.stringify({
                          type: 'voice.fallback',
                          reason: 'speaker_not_found',
                          from: originalVoice,
                          to: 'default',
                          details: { error_code: parsed.errorCode, message: errorMsg }
                        }));
                      }

                      // 降级：不指定音色（让服务端使用默认音色）
                      sessionConfig.voiceType = '';

                      // 重置序号/状态并重连
                      audioSequence = 2;
                      cleanupDoubaoConnection('speaker_not_found_autofallback');
                      setTimeout(() => {
                        if (clientSocket.readyState === WebSocket.OPEN) {
                          void connectToDoubao();
                        }
                      }, 0);

                      continue;
                    }

                    clientSocket.send(JSON.stringify({
                      type: 'error',
                      error: errorMsg,
                      details: { error_code: parsed.errorCode, ...errorJson }
                    }));
                  } catch {
                    console.error('[DoubaoRelay] Unknown error from server');
                    clientSocket.send(JSON.stringify({
                      type: 'error',
                      error: 'Unknown error from Doubao server'
                    }));
                  }
                }
                
              } else if (frame.opcode === 0x08) { // Close frame
                let closeCode = 1000;
                let closeReason = 'Connection closed';
                
                if (frame.payload.length >= 2) {
                  closeCode = (frame.payload[0] << 8) | frame.payload[1];
                  if (frame.payload.length > 2) {
                    closeReason = new TextDecoder().decode(frame.payload.slice(2));
                  }
                }
                
                console.log(`[DoubaoRelay] Received close frame: code=${closeCode}, reason=${closeReason}`);
                isConnected = false;
                
                if (!isReconnecting && myGeneration === connectionGeneration && clientSocket.readyState === WebSocket.OPEN) {
                  clientSocket.send(JSON.stringify({
                    type: 'session.closed',
                    code: closeCode,
                    reason: closeReason
                  }));
                }
                
              } else if (frame.opcode === 0x09) { // Ping
                const pong = buildWebSocketFrame(frame.payload, 0x0A);
                await doubaoConn.write(pong);
              }
            }
          } catch (err) {
            // 🔧 增强错误日志：区分不同类型的断开原因
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorName = err instanceof Error ? err.name : 'UnknownError';
            console.error(`[DoubaoRelay] Read error: ${errorName}: ${errorMessage}`);
            
            // 检查是否是连接被远端关闭
            if (errorMessage.includes('connection') || errorMessage.includes('reset') || errorMessage.includes('closed')) {
              console.warn('[DoubaoRelay] ⚠️ Connection appears to be reset by remote peer');
            }
            break;
          }
        }

        if (myGeneration !== connectionGeneration) {
          console.log('[DoubaoRelay] Read loop exited due to newer connection generation', {
            myGeneration,
            connectionGeneration,
          });
          // ✅ 重连导致旧 loop 退出：不通知前端 session.closed
          return;
        }
        
        // 🔧 增强日志：记录读循环退出原因
        console.log('[DoubaoRelay] Read loop exited', {
          isConnected,
          hasDoubaoConn: !!doubaoConn,
          myGeneration,
          connectionGeneration,
          clientSocketState: clientSocket.readyState,
        });
        
        if (!isReconnecting && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'session.closed',
            code: 1000,
            reason: 'Connection closed'
          }));
        }
      };
      
      // Start read loop
      readLoop().catch(err => {
        console.error('[DoubaoRelay] Read loop error:', err);
      });
      
      // ⚠️ 不再在超时情况下发送 session.connected：
      // 这会导致前端开始录音并持续推送音频，但实际上 Doubao 端可能尚未完成会话启动/已经返回错误。
      
    } catch (err) {
      console.error('[DoubaoRelay] Failed to connect to Doubao:', err);
      
      clientSocket.send(JSON.stringify({
        type: 'error',
        error: `Failed to connect to Doubao: ${err}`
      }));
      
      clientSocket.send(JSON.stringify({
        type: 'session.closed',
        code: 1011,
        reason: 'Doubao connection failed'
      }));
    }
  };

  clientSocket.onopen = () => {
    console.log('[DoubaoRelay] Client connected');
    
    // 🔧 修复微信环境连接中断：将心跳间隔从 30s 缩短到 15s
    // 微信 WebView 对空闲 WebSocket 的超时控制较严格
    // 同时向 Doubao 发送 WebSocket ping 帧，保持双向连接活跃
    heartbeatInterval = setInterval(async () => {
      // 1. 向前端发送心跳
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
      // 2. 🔧 关键修复：同时向 Doubao 发送 WebSocket ping 帧
      // 防止 relay->Doubao 连接因空闲被云网关或 Doubao 服务端断开
      if (doubaoConn && isConnected) {
        try {
          const pingFrame = buildWebSocketFrame(new Uint8Array([]), 0x09); // opcode 0x09 = ping
          await doubaoConn.write(pingFrame);
        } catch (e) {
          console.warn('[DoubaoRelay] Failed to send ping to Doubao:', e);
        }
      }
    }, 15000);
  };

  // 🔧 增强诊断：明确记录是谁先断开（微信端断 / relay 断 / doubao 断）
  clientSocket.onclose = (event: CloseEvent) => {
    console.log('[DoubaoRelay] Client socket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    if (heartbeatInterval) {
      try {
        clearInterval(heartbeatInterval);
      } catch {
        // ignore
      }
      heartbeatInterval = null;
    }

    // 客户端断开时，立即清理 doubao 连接，避免悬挂连接导致异常 shutdown
    cleanupDoubaoConnection('clientSocket.onclose');
  };

  clientSocket.onerror = (event: Event) => {
    console.warn('[DoubaoRelay] Client socket error', event);
  };

  clientSocket.onmessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'input_audio_buffer.append') {
        clientAudioAppendCount++;
        // 避免日志刷屏：每 50 条记录一次
        if (clientAudioAppendCount % 50 === 0) {
          console.log(`[DoubaoRelay] Received from client: type=input_audio_buffer.append (#${clientAudioAppendCount})`);
        }
      } else {
        console.log(`[DoubaoRelay] Received from client: type=${message.type}`);
      }

      switch (message.type) {
        case 'session.init':
          // ✅ session.init 可能因前端重连/重复 init 触发；必须先清理旧连接，避免双路语音
          cleanupDoubaoConnection('session.init');
          speakerFallbackAttempted = false;
          isReconnecting = false;
          sessionReadySent = false;
          clearSessionReadyTimer();
          sessionConfig = {
            instructions: message.instructions || '',
            // ⚠️ 不再强制默认长ID：若不传 voice_type，则让服务端使用默认音色（更稳，避免 45000001 导致无回复）
            voiceType: (message.voice_type ?? ''),
            promptStrategy: 'system_role_only',
          };

          // reset persona checks per new session
          personaFallbackAttempted = false;
          pendingIdentityCheck = false;
          identityReplyBuffer = '';
          // ✅ 调试日志：确认 prompt 和音色是否正确接收（避免 emoji，便于日志检索）
          console.log('[DoubaoRelay] session.init received', {
            instructions_len: sessionConfig.instructions.length,
            instructions_preview: sessionConfig.instructions.substring(0, 120),
            voiceType: sessionConfig.voiceType || '(none)',
            promptStrategy: sessionConfig.promptStrategy,
          });
          // ✅ Fix: StartSession 使用 sequence=1；音频包从 sequence=2 开始递增
          audioSequence = 2;
          sessionStarted = false;
          doubaoSessionId = null;
          await connectToDoubao();
          break;

        case 'input_audio_buffer.append':
          if (doubaoConn && isConnected) {
            try {
              if (!sessionStarted) {
                // 前端可能会在 UI 显示“连接中/已连接”时就开始推流；但 Doubao 侧 session 还没 ready。
                // 不要提前发，否则服务端可能丢弃。
                return;
              }
              if (!doubaoSessionId) {
                console.warn('[DoubaoRelay] Dropping audio: sessionId not ready');
                return;
              }

              const audioBytes = base64ToUint8Array(message.audio);
              const audioPacket = buildAudioUploadRequest(audioBytes, audioSequence++, doubaoSessionId);
              const frame = buildWebSocketFrame(audioPacket);
              await doubaoConn.write(frame);
              
              // 每 50 个包记录一次日志，避免刷屏
              if (audioSequence % 50 === 0) {
                console.log(`[DoubaoRelay] Sent audio packet #${audioSequence}, size=${audioBytes.length}`);
              }
            } catch (err) {
              console.error('[DoubaoRelay] Error sending audio:', err);
            }
          }
          break;

        case 'input_audio_buffer.commit':
          console.log('[DoubaoRelay] Audio buffer committed');
          break;

        // ✅ 兼容前端 OpenAI 风格的“显式触发生成”事件。
        // 豆包端到端对话主要依赖 server-side VAD + 输入事件（音频/文本）自动触发生成，
        // 因此这里做 noop 处理，避免前端一直看到“unknown message type”。
        case 'response.create':
          // noop
          break;

        case 'response.cancel':
          console.log('[DoubaoRelay] Response cancelled');
          break;

        case 'ping':
          clientSocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'session.close':
          if (doubaoConn && isConnected) {
            try {
              // 发送 EndSession
              const endSessionPacket = buildEndSessionRequest();
              const endFrame = buildWebSocketFrame(endSessionPacket);
              await doubaoConn.write(endFrame);
              console.log('[DoubaoRelay] Sent EndSession request');
              
              // 发送 WebSocket close frame
              const closeFrame = buildWebSocketFrame(new Uint8Array([0x03, 0xE8]), 0x08); // 1000
              await doubaoConn.write(closeFrame);
              doubaoConn.close();
            } catch {
              // Ignore close errors
            }
          }
          isConnected = false;
          break;

        // 处理文本消息触发（用于开场白）
        case 'conversation.item.create':
          console.log('[DoubaoRelay] Received conversation.item.create, session state:', {
            hasConn: !!doubaoConn,
            isConnected,
            sessionStarted,
            hasSessionId: !!doubaoSessionId
          });
          
          if (doubaoConn && isConnected && sessionStarted && doubaoSessionId) {
            try {
              // 提取用户文本
              const userText = message.item?.content?.[0]?.text || message.text || '';

              // ✅ 文字输入也需要启用身份校验（否则只有语音问“你是谁”才会触发 persona 兜底）
              const normalizedText = String(userText).replace(/\s+/g, '');
              pendingIdentityCheck = IDENTITY_QUESTION_RE.test(normalizedText);
              if (pendingIdentityCheck) {
                identityReplyBuffer = '';
                console.log('[DoubaoRelay] IdentityCheck armed for next assistant reply (text input)');
              }
              
              if (!userText) {
                console.warn('[DoubaoRelay] Empty text message, skipping');
                break;
              }
              
              console.log(`[DoubaoRelay] Sending text trigger: "${userText}"`);

              // ✅ 获取并递增序列号（与音频包共用计数器）
              const currentSequence = audioSequence++;
              console.log(`[DoubaoRelay] Text message sequence: ${currentSequence}`);

              // ✅ 选择正确的“文本触发”事件码
              // 经验结论：SayHello(300) 在部分端到端模型上会触发“豆包”内置自我介绍，
              // 从而覆盖我们注入的 system_role（静老师人格）。
              // 因此这里统一使用 ChatTextQuery(501)，让 system_role 生效。
              const normalized = userText.trim().toLowerCase();
              const isGreeting = !hasGreeted && (normalized === '你好' || normalized === 'hello' || normalized === 'hi');
              const eventId = EVENT_CHAT_TEXT_QUERY;
              if (isGreeting) hasGreeted = true;

              // 构建文本 payload（官方常用字段为 content）
              const payloadBytes = new TextEncoder().encode(JSON.stringify({ content: userText }));

              const packet = buildPacket({
                messageType: MESSAGE_TYPE_FULL_CLIENT,
                flags: FLAG_HAS_SEQUENCE | FLAG_HAS_EVENT | FLAG_HAS_SESSION_ID,
                sequence: currentSequence,
                event: eventId,
                sessionId: doubaoSessionId,
                payload: payloadBytes,
                serialization: SERIALIZATION_JSON,
              });
              
              const frame = buildWebSocketFrame(packet);
              await doubaoConn.write(frame);

              console.log(`[DoubaoRelay] ✅ Sent text trigger event=${eventId} seq=${currentSequence} (${payloadBytes.length} bytes)`);
            } catch (err) {
              console.error('[DoubaoRelay] Error sending text message:', err);
            }
          } else {
            console.warn('[DoubaoRelay] Cannot send text: session not ready', {
              hasConn: !!doubaoConn,
              isConnected,
              sessionStarted,
              hasSessionId: !!doubaoSessionId
            });
          }
          break;

        default:
          console.log(`[DoubaoRelay] Unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('[DoubaoRelay] Error processing client message:', err);
    }
  };

  clientSocket.onerror = (event: Event) => {
    console.error('[DoubaoRelay] Client WebSocket error:', event);
  };

  clientSocket.onclose = () => {
    console.log('[DoubaoRelay] Client disconnected');
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    isConnected = false;
    if (doubaoConn) {
      try {
        doubaoConn.close();
      } catch {
        // Ignore close errors
      }
    }
  };

  return response;
});
