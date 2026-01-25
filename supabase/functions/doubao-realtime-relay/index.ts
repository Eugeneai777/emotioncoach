/**
 * 豆包语音大模型 WebSocket Relay
 * 
 * 功能：
 * 1. 接收客户端 WebSocket 连接
 * 2. 连接豆包 API（携带认证 Headers）
 * 3. 在客户端 JSON 协议和豆包二进制协议之间进行转换
 * 4. 管理心跳和超时
 * 
 * 豆包 API：wss://openspeech.bytedance.com/api/v3/sauc/bigmodel
 */

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DOUBAO_WS_URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel';

// 豆包协议常量
const PROTOCOL_VERSION = 0x01;
const HEADER_SIZE = 0x01; // 4 bytes
const MESSAGE_TYPE_FULL_CLIENT = 0x01;
const MESSAGE_TYPE_AUDIO_ONLY = 0x02;
const MESSAGE_TYPE_FULL_SERVER = 0x09;
const MESSAGE_TYPE_AUDIO_ONLY_SERVER = 0x0B;
const MESSAGE_TYPE_ERROR = 0x0F;
const SERIALIZATION_JSON = 0x01;
const COMPRESSION_NONE = 0x00;
const COMPRESSION_GZIP = 0x01;

// 构建豆包协议 Header
function buildHeader(messageType: number, serialization: number = SERIALIZATION_JSON, compression: number = COMPRESSION_NONE): Uint8Array {
  const header = new Uint8Array(4);
  header[0] = (PROTOCOL_VERSION << 4) | HEADER_SIZE;
  header[1] = (messageType << 4) | 0x00; // flags = 0
  header[2] = (serialization << 4) | compression;
  header[3] = 0x00; // reserved
  return header;
}

// 解析豆包协议 Header
function parseHeader(data: Uint8Array): { messageType: number; serialization: number; compression: number; payloadSize: number } {
  const messageType = (data[1] >> 4) & 0x0F;
  const serialization = (data[2] >> 4) & 0x0F;
  const compression = data[2] & 0x0F;
  
  // Payload size is in bytes 4-7 (big-endian)
  const payloadSize = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
  
  return { messageType, serialization, compression, payloadSize };
}

// 构建 Full Client Request
function buildFullClientRequest(config: {
  appId: string;
  token: string;
  userId: string;
  instructions: string;
}): Uint8Array {
  const payload = {
    user: {
      uid: config.userId
    },
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
      text: config.instructions
    }
  };
  
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const header = buildHeader(MESSAGE_TYPE_FULL_CLIENT);
  
  // 4 bytes header + 4 bytes payload size + payload
  const message = new Uint8Array(8 + payloadBytes.length);
  message.set(header, 0);
  // Payload size (big-endian)
  message[4] = (payloadBytes.length >> 24) & 0xFF;
  message[5] = (payloadBytes.length >> 16) & 0xFF;
  message[6] = (payloadBytes.length >> 8) & 0xFF;
  message[7] = payloadBytes.length & 0xFF;
  message.set(payloadBytes, 8);
  
  return message;
}

// 构建 Audio Only Request
function buildAudioOnlyRequest(audioData: Uint8Array): Uint8Array {
  const header = buildHeader(MESSAGE_TYPE_AUDIO_ONLY, 0x00, COMPRESSION_NONE); // No serialization for audio
  
  // 4 bytes header + 4 bytes payload size + audio data
  const message = new Uint8Array(8 + audioData.length);
  message.set(header, 0);
  // Payload size (big-endian)
  message[4] = (audioData.length >> 24) & 0xFF;
  message[5] = (audioData.length >> 16) & 0xFF;
  message[6] = (audioData.length >> 8) & 0xFF;
  message[7] = audioData.length & 0xFF;
  message.set(audioData, 8);
  
  return message;
}

// 解析服务端响应
function parseServerResponse(data: Uint8Array): { type: string; payload?: any; audio?: Uint8Array; error?: string } {
  if (data.length < 8) {
    return { type: 'error', error: 'Invalid response: too short' };
  }
  
  const { messageType, serialization, compression, payloadSize } = parseHeader(data);
  const payloadData = data.slice(8, 8 + payloadSize);
  
  if (messageType === MESSAGE_TYPE_FULL_SERVER) {
    // JSON response
    try {
      let jsonStr: string;
      if (compression === COMPRESSION_GZIP) {
        // Decompress gzip - use pako or similar
        // For now, assume no compression
        jsonStr = new TextDecoder().decode(payloadData);
      } else {
        jsonStr = new TextDecoder().decode(payloadData);
      }
      const payload = JSON.parse(jsonStr);
      return { type: 'text', payload };
    } catch (e) {
      return { type: 'error', error: `Failed to parse JSON: ${e}` };
    }
  } else if (messageType === MESSAGE_TYPE_AUDIO_ONLY_SERVER) {
    // Audio response
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
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

  // Parse URL parameters
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get('session_token');
  const userId = url.searchParams.get('user_id') || 'anonymous';
  const mode = url.searchParams.get('mode') || 'emotion';

  console.log(`[DoubaoRelay] New connection: userId=${userId}, mode=${mode}`);

  // Upgrade to WebSocket
  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  let doubaoSocket: WebSocket | null = null;
  let isConnected = false;
  let sessionConfig: { instructions: string } | null = null;
  let heartbeatInterval: number | null = null;

  // Connect to Doubao API
  const connectToDoubao = async () => {
    try {
      // 构建带认证的 URL
      const doubaoUrl = `${DOUBAO_WS_URL}?appid=${DOUBAO_APP_ID}`;
      
      console.log(`[DoubaoRelay] Connecting to Doubao: ${doubaoUrl}`);
      
      // Deno WebSocket with headers
      doubaoSocket = new WebSocket(doubaoUrl);
      
      // Note: Deno's WebSocket doesn't support custom headers in constructor
      // We'll send auth in the first message
      
      doubaoSocket.onopen = () => {
        console.log('[DoubaoRelay] Connected to Doubao');
        isConnected = true;
        
        // Send Full Client Request to initialize session
        if (sessionConfig) {
          const initRequest = buildFullClientRequest({
            appId: DOUBAO_APP_ID!,
            token: DOUBAO_ACCESS_TOKEN!,
            userId: userId,
            instructions: sessionConfig.instructions
          });
          doubaoSocket!.send(initRequest);
          console.log('[DoubaoRelay] Sent init request to Doubao');
        }
        
        // Notify client
        clientSocket.send(JSON.stringify({ 
          type: 'session.connected',
          message: 'Connected to Doubao API'
        }));
      };

      doubaoSocket.onmessage = (event) => {
        try {
          if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
            // Handle binary response from Doubao
            const processData = async (data: ArrayBuffer) => {
              const bytes = new Uint8Array(data);
              const parsed = parseServerResponse(bytes);
              
              console.log(`[DoubaoRelay] Received from Doubao: type=${parsed.type}`);
              
              if (parsed.type === 'audio' && parsed.audio) {
                // Send audio to client as base64
                clientSocket.send(JSON.stringify({
                  type: 'response.audio.delta',
                  delta: uint8ArrayToBase64(parsed.audio)
                }));
              } else if (parsed.type === 'text' && parsed.payload) {
                // Forward text response
                clientSocket.send(JSON.stringify({
                  type: 'response.text',
                  payload: parsed.payload
                }));
                
                // Check for transcript
                if (parsed.payload.result?.text) {
                  clientSocket.send(JSON.stringify({
                    type: 'response.audio_transcript.delta',
                    delta: parsed.payload.result.text
                  }));
                }
              } else if (parsed.type === 'error') {
                clientSocket.send(JSON.stringify({
                  type: 'error',
                  error: parsed.error
                }));
              }
            };
            
            if (event.data instanceof Blob) {
              event.data.arrayBuffer().then(processData);
            } else {
              processData(event.data);
            }
          }
        } catch (err) {
          console.error('[DoubaoRelay] Error processing Doubao message:', err);
        }
      };

      doubaoSocket.onerror = (event) => {
        console.error('[DoubaoRelay] Doubao WebSocket error:', event);
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: 'Doubao connection error'
        }));
      };

      doubaoSocket.onclose = (event) => {
        console.log(`[DoubaoRelay] Doubao connection closed: code=${event.code}, reason=${event.reason}`);
        isConnected = false;
        
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'session.closed',
            code: event.code,
            reason: event.reason
          }));
        }
      };
    } catch (err) {
      console.error('[DoubaoRelay] Failed to connect to Doubao:', err);
      clientSocket.send(JSON.stringify({
        type: 'error',
        error: `Failed to connect to Doubao: ${err}`
      }));
    }
  };

  // Client WebSocket handlers
  clientSocket.onopen = () => {
    console.log('[DoubaoRelay] Client connected');
    
    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, 30000);
  };

  clientSocket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`[DoubaoRelay] Received from client: type=${message.type}`);

      switch (message.type) {
        case 'session.init':
          // Initialize session with instructions
          sessionConfig = {
            instructions: message.instructions || ''
          };
          
          // Connect to Doubao
          await connectToDoubao();
          break;

        case 'input_audio_buffer.append':
          // Forward audio to Doubao
          if (doubaoSocket && isConnected) {
            const audioBytes = base64ToUint8Array(message.audio);
            const audioRequest = buildAudioOnlyRequest(audioBytes);
            doubaoSocket.send(audioRequest);
          }
          break;

        case 'input_audio_buffer.commit':
          // Send end-of-audio signal if needed
          console.log('[DoubaoRelay] Audio buffer committed');
          break;

        case 'response.cancel':
          // Cancel ongoing response
          console.log('[DoubaoRelay] Response cancelled');
          break;

        case 'ping':
          clientSocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'session.close':
          // Clean close
          if (doubaoSocket) {
            doubaoSocket.close();
          }
          break;

        default:
          console.log(`[DoubaoRelay] Unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('[DoubaoRelay] Error processing client message:', err);
    }
  };

  clientSocket.onerror = (event) => {
    console.error('[DoubaoRelay] Client WebSocket error:', event);
  };

  clientSocket.onclose = () => {
    console.log('[DoubaoRelay] Client disconnected');
    
    // Cleanup
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    if (doubaoSocket && doubaoSocket.readyState === WebSocket.OPEN) {
      doubaoSocket.close();
    }
  };

  return response;
});
