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

// Header Flags (第2字节低4位)
const FLAG_HAS_EVENT = 0x04;      // bit 2: 有 event 字段
const FLAG_HAS_SEQUENCE = 0x02;   // bit 1: 有 sequence 字段
const FLAG_HAS_SESSION_ID = 0x01; // bit 0: 有 session_id 字段

// Event Types
const EVENT_START_SESSION = 100;
const EVENT_SESSION_STARTED = 101;
const EVENT_AUDIO_UPLOAD = 200;
const EVENT_AUDIO_STREAM = 201;
const EVENT_TEXT_OUTPUT = 300;
const EVENT_END_SESSION = 900;

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
 */
function parsePacket(data: Uint8Array): {
  messageType: number;
  flags: number;
  serialization: number;
  compression: number;
  sequence?: number;
  event?: number;
  sessionId?: string;
  payloadSize: number;
  payload: Uint8Array;
} | null {
  if (data.length < 8) {
    console.error('[Protocol] Packet too short:', data.length);
    return null;
  }

  const readUint32BE = (buf: Uint8Array, off: number): number => {
    // Ensure unsigned 32-bit
    return (((buf[off] << 24) >>> 0) + (buf[off + 1] << 16) + (buf[off + 2] << 8) + buf[off + 3]) >>> 0;
  };

  const messageType = (data[1] >> 4) & 0x0F;
  const flags = data[1] & 0x0F;
  const serialization = (data[2] >> 4) & 0x0F;
  const compression = data[2] & 0x0F;

  const hasSequence = (flags & FLAG_HAS_SEQUENCE) !== 0;
  const hasEvent = (flags & FLAG_HAS_EVENT) !== 0;
  const hasSessionId = (flags & FLAG_HAS_SESSION_ID) !== 0;

  let offset = 4;
  let sequence: number | undefined;
  let event: number | undefined;
  let sessionId: string | undefined;

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

  // Parse session ID
  if (hasSessionId) {
    if (data.length < offset + 4) return null;
    const sessionIdLen = readUint32BE(data, offset);
    offset += 4;
    if (data.length < offset + sessionIdLen) return null;
    sessionId = new TextDecoder().decode(data.slice(offset, offset + sessionIdLen));
    offset += sessionIdLen;
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

  return {
    messageType,
    flags,
    serialization,
    compression,
    sequence,
    event,
    sessionId,
    payloadSize,
    payload
  };
}

// ============= 消息构建函数 =============

/**
 * 构建 StartSession 请求 (event=100)
 */
function buildStartSessionRequest(userId: string, instructions: string): Uint8Array {
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

  // StartSession: Full Client Request with event=100
  return buildPacket({
    messageType: MESSAGE_TYPE_FULL_CLIENT,
    flags: FLAG_HAS_EVENT,
    event: EVENT_START_SESSION,
    payload: payloadBytes,
    serialization: SERIALIZATION_JSON
  });
}

/**
 * 构建 Audio Upload 请求 (event=200)
 */
function buildAudioUploadRequest(audioData: Uint8Array, sequence: number): Uint8Array {
  return buildPacket({
    messageType: MESSAGE_TYPE_AUDIO_ONLY,
    flags: FLAG_HAS_SEQUENCE | FLAG_HAS_EVENT,
    sequence: sequence,
    event: EVENT_AUDIO_UPLOAD,
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
        payloadLength = (this.buffer[6] << 24) | (this.buffer[7] << 16) | (this.buffer[8] << 8) | this.buffer[9];
        offset = 10;
      }
      
      if (masked) offset += 4;
      
      if (this.buffer.length < offset + payloadLength) break;
      
      let payload = this.buffer.slice(offset, offset + payloadLength);
      
      if (masked) {
        const mask = this.buffer.slice(offset - 4, offset);
        payload = payload.map((b, i) => b ^ mask[i % 4]);
      }
      
      frames.push({ opcode, payload });
      this.buffer = this.buffer.slice(offset + payloadLength);
    }
    
    return frames;
  }
  
  // 获取握手后剩余的数据（用于处理紧跟在握手响应后的 WebSocket 帧）
  getRemainingData(): Uint8Array {
    return this.buffer;
  }
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
      const responseText = new TextDecoder().decode(responseData);
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
      const headerEndIndex = responseText.indexOf('\r\n\r\n');
      if (headerEndIndex !== -1) {
        const headerEndByteIndex = new TextEncoder().encode(responseText.substring(0, headerEndIndex + 4)).length;
        if (headerEndByteIndex < bytesRead) {
          const remainingData = responseData.slice(headerEndByteIndex);
          console.log(`[DoubaoRelay] Found ${remainingData.length} bytes after handshake`);
          parser.append(remainingData);
        }
      }
      
      // 发送 StartSession 请求
      if (sessionConfig) {
        const startSessionPacket = buildStartSessionRequest(userId, sessionConfig.instructions);
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
              if (frame.opcode === 0x02) { // Binary frame
                const parsed = parsePacket(frame.payload);
                
                if (!parsed) {
                  console.error('[DoubaoRelay] Failed to parse Doubao packet');
                  continue;
                }
                
                console.log(`[DoubaoRelay] Received: msgType=${parsed.messageType}, event=${parsed.event}, seq=${parsed.sequence}, payloadSize=${parsed.payloadSize}`);
                
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
                
                // 处理文本/JSON 响应
                if (parsed.messageType === MESSAGE_TYPE_FULL_SERVER && parsed.serialization === SERIALIZATION_JSON) {
                  try {
                    const jsonStr = new TextDecoder().decode(parsed.payload);
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
                    console.error('[DoubaoRelay] Failed to parse JSON:', e);
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
                    console.error('[DoubaoRelay] Error from Doubao:', errorJson);
                    clientSocket.send(JSON.stringify({
                      type: 'error',
                      error: errorJson.message || errorJson.error || 'Unknown error from Doubao',
                      details: errorJson
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
          audioSequence = 0;  // 重置序号
          await connectToDoubao();
          break;

        case 'input_audio_buffer.append':
          if (doubaoConn && isConnected) {
            try {
              const audioBytes = base64ToUint8Array(message.audio);
              const audioPacket = buildAudioUploadRequest(audioBytes, audioSequence++);
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
