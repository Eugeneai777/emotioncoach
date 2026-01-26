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
const EVENT_TEXT_OUTPUT = 300;
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
    
    // 验证 sessionIdLen 是否合理 (UUID 是 36 字节)
    if (sessionIdLen > 0 && sessionIdLen <= 128) {
      if (data.length < offset + sessionIdLen) return null;
      sessionId = new TextDecoder().decode(data.slice(offset, offset + sessionIdLen));
      offset += sessionIdLen;
    } else if (sessionIdLen > 128) {
      // sessionIdLen 异常大，说明前 4 字节可能不是 sessionIdLen 而是 payloadSize
      // 回退 offset，让后续代码把它当作 payloadSize 处理
      console.warn(`[Protocol] sessionIdLen=${sessionIdLen} looks like payloadSize, rolling back`);
      offset -= 4;
    }
    // sessionIdLen === 0 的情况：跳过，继续读 payloadSize
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

/**
 * 构建 StartSession 请求 (event=100)
 * 根据官方文档，StartSession 必须包含 Event + SessionID
 * 二进制帧格式: Header(4) + Event(4) + SessionIdLen(4) + SessionId + PayloadSize(4) + Payload
 */
function buildStartSessionRequest(userId: string, instructions: string, sessionId: string): Uint8Array {
  const payload = {
    user: { uid: userId },
    audio: {
      format: 'pcm',
      sample_rate: 16000,
      bits: 16,
      channel: 1
    },
    tts: {
      format: 'pcm',
      sample_rate: 24000,
      bits: 16,
      channel: 1
    },
    request: {
      model_name: 'doubao-speech-vision-pro-250515',
      enable_vad: true,
      vad_stop_time: 800,
      enable_tts: true,
      bot_name: '情绪教练',
      system_role: instructions
    }
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  console.log('[Protocol] StartSession payload:', JSON.stringify(payload).substring(0, 200) + '...');
  console.log('[Protocol] StartSession sessionId:', sessionId);

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
  let sessionConfig: { instructions: string } | null = null;
  let heartbeatInterval: number | null = null;
  let audioSequence = 0;  // 音频包序号
  let sessionStarted = false;  // 标记 session 是否已成功启动
  let doubaoSessionId: string | null = null; // StartSession 生成的 sessionId，后续 Audio Upload 必须复用

  const connectToDoubao = async () => {
    try {
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
        
        const startSessionPacket = buildStartSessionRequest(userId, sessionConfig.instructions, doubaoSessionId);
        const frame = buildWebSocketFrame(startSessionPacket);
        await doubaoConn.write(frame);
        console.log(`[DoubaoRelay] Sent StartSession request (${startSessionPacket.length} bytes)`);
      }
      
      // 开始读取响应
      const readLoop = async () => {
        const buffer = new Uint8Array(65536);
        
        while (isConnected && doubaoConn) {
          try {
            const n = await doubaoConn.read(buffer);
            if (n === null || n === 0) {
              console.log('[DoubaoRelay] Connection closed by Doubao');
              isConnected = false;
              break;
            }
            
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
                
                console.log(`[DoubaoRelay] Received: msgType=${parsed.messageType}, event=${parsed.event}, seq=${parsed.sequence}, errCode=${parsed.errorCode}, payloadSize=${parsed.payloadSize}`);
                
                // 🔍 调试：对于音频类型消息，打印更详细的解析信息
                if (parsed.messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER) {
                  console.log(`[DoubaoRelay] AudioPacket detail: flags=0x${parsed.flags.toString(16)}, hasSession=${parsed.sessionId ? 'yes' : 'no'}, payloadLen=${parsed.payload.length}`);
                }
                
                // ⚠️ 优先处理 TTS 音频响应 (event=352) - 豆包实际发送音频的事件码
                // 这必须在 JSON 解析之前处理，因为 payload 是二进制 PCM 数据
                if (parsed.event === EVENT_TTS_RESPONSE) {
                  if (parsed.payload.length > 0) {
                    // 🔍 详细日志：确认音频大小 (正常应该是几 KB，不是 36 字节)
                    console.log(`[DoubaoRelay] TTS audio forwarding: ${parsed.payload.length} bytes (expected: several KB, NOT 36)`);
                    clientSocket.send(JSON.stringify({
                      type: 'response.audio.delta',
                      delta: uint8ArrayToBase64(parsed.payload)
                    }));
                  } else {
                    console.warn(`[DoubaoRelay] TTS audio payload is empty!`);
                  }
                  continue; // 跳过后续处理，防止 JSON 解析失败
                }
                
                // 处理 TTS 开始/结束事件 (event=350/351) - payload 通常是 sessionId，跳过 JSON 解析
                if (parsed.event === EVENT_TTS_START || parsed.event === EVENT_TTS_END) {
                  console.log(`[DoubaoRelay] TTS event: ${parsed.event === EVENT_TTS_START ? 'start' : 'end'}`);
                  continue;
                }
                
                // 处理 SessionStarted 事件 (event=101)
                if (parsed.event === EVENT_SESSION_STARTED) {
                  sessionStarted = true;
                  console.log('[DoubaoRelay] Session started successfully!');
                  
                  // 通知客户端连接成功
                  clientSocket.send(JSON.stringify({ 
                    type: 'session.connected',
                    message: 'Connected to Doubao API - Session started'
                  }));
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
                    clientSocket.send(JSON.stringify({
                      type: 'session.connected',
                      message: 'Connected to Doubao API - Session ACK'
                    }));
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
                  // 尝试安全解析，但失败时不报错（静默跳过）
                  try {
                    const jsonStr = new TextDecoder().decode(parsed.payload);
                    // 检查是否看起来像 JSON
                    if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
                      const payload = JSON.parse(jsonStr);
                      console.log(`[DoubaoRelay] Event ${parsed.event} payload:`, JSON.stringify(payload).substring(0, 200));
                      
                       // ASR 识别结果（用户说话的转写）
                       // 前端 DoubaoRealtimeAudio.ts 期望使用 OpenAI 风格事件：conversation.item.input_audio_transcription.completed
                       // 否则用户会出现“能听到但说不了/没反应”的感知。
                       if (parsed.event === EVENT_ASR_RESPONSE && payload.result?.text) {
                         const transcript = String(payload.result.text);
                         clientSocket.send(JSON.stringify({
                           type: 'conversation.item.input_audio_transcription.completed',
                           transcript,
                         }));
                       }
                      
                       // Chat 回复文本（模型文本）
                       // 有些 payload 结构为 { text: "..." }，有些为 { result: { text: "..." } }
                       if (parsed.event === EVENT_CHAT_RESPONSE) {
                         const text = payload.text ?? payload.result?.text;
                         if (text) {
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
                    console.error('[DoubaoRelay] Error from Doubao:', { errorCode: parsed.errorCode, errorJson });
                    clientSocket.send(JSON.stringify({
                      type: 'error',
                      error: errorJson.message || errorJson.error || 'Unknown error from Doubao',
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
                
                clientSocket.send(JSON.stringify({
                  type: 'session.closed',
                  code: closeCode,
                  reason: closeReason
                }));
                
              } else if (frame.opcode === 0x09) { // Ping
                const pong = buildWebSocketFrame(frame.payload, 0x0A);
                await doubaoConn.write(pong);
              }
            }
          } catch (err) {
            console.error('[DoubaoRelay] Read error:', err);
            break;
          }
        }
        
        if (clientSocket.readyState === WebSocket.OPEN) {
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
    
    heartbeatInterval = setInterval(() => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, 30000);
  };

  clientSocket.onmessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`[DoubaoRelay] Received from client: type=${message.type}`);

      switch (message.type) {
        case 'session.init':
          sessionConfig = {
            instructions: message.instructions || ''
          };
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
              
              if (!userText) {
                console.warn('[DoubaoRelay] Empty text message, skipping');
                break;
              }
              
              console.log(`[DoubaoRelay] Sending text trigger: "${userText}"`);

              // ✅ 获取并递增序列号（与音频包共用计数器）
              const currentSequence = audioSequence++;
              console.log(`[DoubaoRelay] Text message sequence: ${currentSequence}`);

              // 构建文本消息的 payload（豆包对话协议要求特定格式）
              const textPayload = JSON.stringify({
                text: userText
              });
              
              const payloadBytes = new TextEncoder().encode(textPayload);
              const sessionIdBytes = new TextEncoder().encode(doubaoSessionId);
              
              // 构建完整数据包
              // ✅ Header(4) + Sequence(4) + Event(4) + SessionIdLen(4) + SessionId + PayloadSize(4) + Payload
              const EVENT_TEXT_INPUT = 200; // 使用音频事件码（豆包对话模式下文本和音频共用）
              const flags = FLAG_HAS_SEQUENCE | FLAG_HAS_EVENT;  // ✅ 添加 FLAG_HAS_SEQUENCE
              const header = buildHeader(MESSAGE_TYPE_FULL_CLIENT, flags, SERIALIZATION_JSON);
              
              const totalSize = 4 + 4 + 4 + 4 + sessionIdBytes.length + 4 + payloadBytes.length;
              const packet = new Uint8Array(totalSize);
              let offset = 0;
              
              // Header
              packet.set(header, offset);
              offset += 4;
              
              // ✅ Sequence (4 bytes, big-endian)
              packet[offset] = (currentSequence >> 24) & 0xff;
              packet[offset + 1] = (currentSequence >> 16) & 0xff;
              packet[offset + 2] = (currentSequence >> 8) & 0xff;
              packet[offset + 3] = currentSequence & 0xff;
              offset += 4;
              
              // Event
              packet[offset] = (EVENT_TEXT_INPUT >> 24) & 0xff;
              packet[offset + 1] = (EVENT_TEXT_INPUT >> 16) & 0xff;
              packet[offset + 2] = (EVENT_TEXT_INPUT >> 8) & 0xff;
              packet[offset + 3] = EVENT_TEXT_INPUT & 0xff;
              offset += 4;
              
              // SessionIdLen + SessionId
              const sidLen = sessionIdBytes.length;
              packet[offset] = (sidLen >> 24) & 0xff;
              packet[offset + 1] = (sidLen >> 16) & 0xff;
              packet[offset + 2] = (sidLen >> 8) & 0xff;
              packet[offset + 3] = sidLen & 0xff;
              offset += 4;
              packet.set(sessionIdBytes, offset);
              offset += sidLen;
              
              // PayloadSize + Payload
              packet[offset] = (payloadBytes.length >> 24) & 0xff;
              packet[offset + 1] = (payloadBytes.length >> 16) & 0xff;
              packet[offset + 2] = (payloadBytes.length >> 8) & 0xff;
              packet[offset + 3] = payloadBytes.length & 0xff;
              offset += 4;
              packet.set(payloadBytes, offset);
              
              const frame = buildWebSocketFrame(packet);
              await doubaoConn.write(frame);
              
              console.log(`[DoubaoRelay] ✅ Sent text message with seq=${currentSequence} (${payloadBytes.length} bytes)`);
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
