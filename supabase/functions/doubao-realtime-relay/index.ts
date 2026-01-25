/**
 * 豆包语音大模型 WebSocket Relay
 * 
 * 由于豆包 API 要求 HTTP Headers 认证，而浏览器 WebSocket 无法发送自定义 Headers，
 * 本 Relay 使用原生 TCP 连接手动完成 WebSocket 握手。
 * 
 * 认证方式：HTTP Headers（必需）
 * - X-Api-App-Key: APP ID
 * - X-Api-Access-Key: Access Token  
 * - X-Api-Resource-Id: 资源 ID
 * - X-Api-Connect-Id: 连接追踪 ID
 */

import { corsHeaders } from '../_shared/cors.ts';

const DOUBAO_HOST = 'openspeech.bytedance.com';
const DOUBAO_PATH = '/api/v3/sauc/bigmodel';

// 豆包协议常量
const PROTOCOL_VERSION = 0x01;
const HEADER_SIZE = 0x01;
const MESSAGE_TYPE_FULL_CLIENT = 0x01;
const MESSAGE_TYPE_AUDIO_ONLY = 0x02;
const MESSAGE_TYPE_FULL_SERVER = 0x09;
const MESSAGE_TYPE_AUDIO_ONLY_SERVER = 0x0B;
const MESSAGE_TYPE_ERROR = 0x0F;
const SERIALIZATION_JSON = 0x01;
const COMPRESSION_NONE = 0x00;

// 构建豆包协议 Header
function buildHeader(messageType: number, serialization: number = SERIALIZATION_JSON, compression: number = COMPRESSION_NONE): Uint8Array {
  const header = new Uint8Array(4);
  header[0] = (PROTOCOL_VERSION << 4) | HEADER_SIZE;
  header[1] = (messageType << 4) | 0x00;
  header[2] = (serialization << 4) | compression;
  header[3] = 0x00;
  return header;
}

// 解析豆包协议 Header
function parseHeader(data: Uint8Array): { messageType: number; serialization: number; compression: number; payloadSize: number } {
  const messageType = (data[1] >> 4) & 0x0F;
  const serialization = (data[2] >> 4) & 0x0F;
  const compression = data[2] & 0x0F;
  const payloadSize = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
  return { messageType, serialization, compression, payloadSize };
}

// 构建 Full Client Request
function buildFullClientRequest(userId: string, instructions: string): Uint8Array {
  const payload = {
    user: { uid: userId },
    audio: {
      format: 'pcm',
      sample_rate: 16000,
      bits: 16,
      channel: 1
    },
    request: {
      model_name: 'doubao-speech-vision-pro-250515',
      enable_vad: true,
      vad_stop_time: 800,
      text: instructions
    }
  };
  
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const header = buildHeader(MESSAGE_TYPE_FULL_CLIENT);
  const message = new Uint8Array(8 + payloadBytes.length);
  message.set(header, 0);
  message[4] = (payloadBytes.length >> 24) & 0xFF;
  message[5] = (payloadBytes.length >> 16) & 0xFF;
  message[6] = (payloadBytes.length >> 8) & 0xFF;
  message[7] = payloadBytes.length & 0xFF;
  message.set(payloadBytes, 8);
  return message;
}

// 构建 Audio Only Request
function buildAudioOnlyRequest(audioData: Uint8Array): Uint8Array {
  const header = buildHeader(MESSAGE_TYPE_AUDIO_ONLY, 0x00, COMPRESSION_NONE);
  const message = new Uint8Array(8 + audioData.length);
  message.set(header, 0);
  message[4] = (audioData.length >> 24) & 0xFF;
  message[5] = (audioData.length >> 16) & 0xFF;
  message[6] = (audioData.length >> 8) & 0xFF;
  message[7] = audioData.length & 0xFF;
  message.set(audioData, 8);
  return message;
}

// 解析服务端响应
function parseServerResponse(data: Uint8Array): { type: string; payload?: unknown; audio?: Uint8Array; error?: string } {
  if (data.length < 8) {
    return { type: 'error', error: 'Invalid response: too short' };
  }
  
  const { messageType, payloadSize } = parseHeader(data);
  const payloadData = data.slice(8, 8 + payloadSize);
  
  if (messageType === MESSAGE_TYPE_FULL_SERVER) {
    try {
      const jsonStr = new TextDecoder().decode(payloadData);
      const payload = JSON.parse(jsonStr);
      return { type: 'text', payload };
    } catch (e) {
      return { type: 'error', error: `Failed to parse JSON: ${e}` };
    }
  } else if (messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER) {
    return { type: 'audio', audio: payloadData };
  } else if (messageType === MESSAGE_TYPE_ERROR) {
    try {
      const errorJson = JSON.parse(new TextDecoder().decode(payloadData));
      return { type: 'error', error: errorJson.message || 'Unknown error' };
    } catch {
      return { type: 'error', error: 'Unknown error from server' };
    }
  }
  
  return { type: 'unknown', payload: { messageType } };
}

// Base64 转 Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Uint8Array 转 Base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 生成 WebSocket Key
function generateWebSocketKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// WebSocket Frame 解析器
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
        // For simplicity, we only handle up to 32-bit lengths
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
}

// 构建 WebSocket Frame
function buildWebSocketFrame(data: Uint8Array, opcode: number = 0x02): Uint8Array {
  const mask = new Uint8Array(4);
  crypto.getRandomValues(mask);
  
  let header: Uint8Array;
  if (data.length < 126) {
    header = new Uint8Array(6);
    header[0] = 0x80 | opcode; // FIN + opcode
    header[1] = 0x80 | data.length; // MASK + length
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
    // 64-bit length (simplified to 32-bit)
    header[6] = (data.length >> 24) & 0xFF;
    header[7] = (data.length >> 16) & 0xFF;
    header[8] = (data.length >> 8) & 0xFF;
    header[9] = data.length & 0xFF;
    header.set(mask, 10);
  }
  
  // Apply mask to payload
  const maskedPayload = data.map((b, i) => b ^ mask[i % 4]);
  
  const frame = new Uint8Array(header.length + maskedPayload.length);
  frame.set(header, 0);
  frame.set(maskedPayload, header.length);
  
  return frame;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
        `X-Api-App-Key: ${DOUBAO_APP_ID}`,
        `X-Api-Access-Key: ${DOUBAO_ACCESS_TOKEN}`,
        'X-Api-Resource-Id: volc.bigasr.sauc.duration',
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
      
      const responseText = new TextDecoder().decode(responseBuffer.slice(0, bytesRead));
      console.log(`[DoubaoRelay] Handshake response: ${responseText.substring(0, 200)}`);
      
      if (!responseText.includes('101')) {
        throw new Error(`WebSocket handshake failed: ${responseText.substring(0, 100)}`);
      }
      
      console.log('[DoubaoRelay] WebSocket handshake successful');
      isConnected = true;
      
      // 发送初始化请求
      if (sessionConfig) {
        const initRequest = buildFullClientRequest(userId, sessionConfig.instructions);
        const frame = buildWebSocketFrame(initRequest);
        await doubaoConn.write(frame);
        console.log('[DoubaoRelay] Sent init request to Doubao');
      }
      
      // 通知客户端连接成功
      clientSocket.send(JSON.stringify({ 
        type: 'session.connected',
        message: 'Connected to Doubao API'
      }));
      
      // 开始读取响应
      const parser = new WebSocketFrameParser();
      const readLoop = async () => {
        const buffer = new Uint8Array(65536);
        
        while (isConnected && doubaoConn) {
          try {
            const n = await doubaoConn.read(buffer);
            if (n === null || n === 0) {
              console.log('[DoubaoRelay] Connection closed by Doubao');
              break;
            }
            
            parser.append(buffer.slice(0, n));
            const frames = parser.getFrames();
            
            for (const frame of frames) {
              if (frame.opcode === 0x02) { // Binary frame
                const parsed = parseServerResponse(frame.payload);
                console.log(`[DoubaoRelay] Received from Doubao: type=${parsed.type}`);
                
                if (parsed.type === 'audio' && parsed.audio) {
                  clientSocket.send(JSON.stringify({
                    type: 'response.audio.delta',
                    delta: uint8ArrayToBase64(parsed.audio)
                  }));
                } else if (parsed.type === 'text' && parsed.payload) {
                  clientSocket.send(JSON.stringify({
                    type: 'response.text',
                    payload: parsed.payload
                  }));
                  
                  const payloadObj = parsed.payload as Record<string, unknown>;
                  const result = payloadObj.result as Record<string, unknown> | undefined;
                  if (result?.text) {
                    clientSocket.send(JSON.stringify({
                      type: 'response.audio_transcript.delta',
                      delta: result.text
                    }));
                  }
                } else if (parsed.type === 'error') {
                  clientSocket.send(JSON.stringify({
                    type: 'error',
                    error: parsed.error
                  }));
                }
              } else if (frame.opcode === 0x08) { // Close frame
                console.log('[DoubaoRelay] Received close frame from Doubao');
                isConnected = false;
              } else if (frame.opcode === 0x09) { // Ping
                // Send pong
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
      
      // Start read loop without blocking
      readLoop().catch(err => {
        console.error('[DoubaoRelay] Read loop error:', err);
      });
      
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
          await connectToDoubao();
          break;

        case 'input_audio_buffer.append':
          if (doubaoConn && isConnected) {
            try {
              const audioBytes = base64ToUint8Array(message.audio);
              const audioRequest = buildAudioOnlyRequest(audioBytes);
              const frame = buildWebSocketFrame(audioRequest);
              await doubaoConn.write(frame);
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
          if (doubaoConn) {
            try {
              const closeFrame = buildWebSocketFrame(new Uint8Array(0), 0x08);
              await doubaoConn.write(closeFrame);
              doubaoConn.close();
            } catch {
              // Ignore close errors
            }
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
