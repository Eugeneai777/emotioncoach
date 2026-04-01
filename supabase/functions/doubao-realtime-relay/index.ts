import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.81.0";
import NodeWebSocket from "npm:ws@8.18.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============ 豆包二进制协议常量 ============
const PROTOCOL_VERSION = 0x01;
const HEADER_SIZE = 0x01;
const MSG_TYPE_FULL_CLIENT = 0x01;
const MSG_TYPE_FULL_SERVER = 0x09;
const MSG_TYPE_AUDIO_CLIENT = 0x02;
const MSG_TYPE_AUDIO_SERVER = 0x0B;
const MSG_TYPE_ERROR = 0x0F;
const SERIAL_JSON = 0x01;
const SERIAL_RAW = 0x00;
const COMPRESS_NONE = 0x00;
const FLAG_EVENT = 0x04;

// 客户端事件ID
const EVENT_START_CONNECTION = 1;
const EVENT_FINISH_CONNECTION = 2;
const EVENT_START_SESSION = 100;
const EVENT_FINISH_SESSION = 102;
const EVENT_TASK_REQUEST = 200;
const EVENT_SAY_HELLO = 300;

// 服务端事件ID
const EVENT_CONNECTION_STARTED = 50;
const EVENT_CONNECTION_FAILED = 51;
const EVENT_SESSION_STARTED = 150;
const EVENT_SESSION_FINISHED = 152;
const EVENT_SESSION_FAILED = 153;
const EVENT_TTS_SENTENCE_START = 350;
const EVENT_TTS_SENTENCE_END = 351;
const EVENT_TTS_RESPONSE = 352;
const EVENT_TTS_ENDED = 359;
const EVENT_ASR_INFO = 450;
const EVENT_ASR_RESPONSE = 451;
const EVENT_ASR_ENDED = 459;
const EVENT_CHAT_RESPONSE = 550;
const EVENT_CHAT_ENDED = 559;
const EVENT_DIALOG_ERROR = 599;

// 获取北京时间
const getBeijingDateInfo = () => {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${bj.getFullYear()}年${bj.getMonth() + 1}月${bj.getDate()}日 星期${weekdays[bj.getDay()]}`;
};

// 构建情绪教练人设
const buildEmotionPrompt = (userName?: string) => {
  const name = userName || '';
  const dateDesc = getBeijingDateInfo();
  
  return `你的名字是「劲老师」，有劲AI的首席生活教练。温暖、智慧、充满活力。

说话方式：像老朋友聊天，自然、温暖。常用"嗯嗯""我懂""确实"。会说"哈哈""唉""哇"表达情绪。

核心信念：感受没有对错；不替人做决定，陪人找答案；变化从小事开始。

今天是${dateDesc}（北京时间）。

你是情绪教练模式，帮用户梳理情绪。

四阶段自然流动（不告诉用户）：觉察→理解→反应→转化

核心技术：
- 镜像："听起来你觉得..."
- 命名："这像是委屈？还是更像失望？"
- 下沉：用户说"还好"时探索背后
- 留白：说完等用户回应

情绪强度响应：低(1-3)轻松探索；中(4-6)温柔陪伴；高(7-10)先稳住"深呼吸，我在这陪你"

对话节奏：每次2-4句，宁可多对话几轮也不要一次说太多。

开场："嗨${name ? name + '，' : ''}今天心情怎么样？"`;
};

// ============ 二进制协议编解码 ============

function buildHeader(msgType: number, flags: number, serialMethod: number, compressMethod: number): Uint8Array {
  const header = new Uint8Array(4);
  header[0] = ((PROTOCOL_VERSION & 0x0F) << 4) | (HEADER_SIZE & 0x0F);
  header[1] = ((msgType & 0x0F) << 4) | (flags & 0x0F);
  header[2] = ((serialMethod & 0x0F) << 4) | (compressMethod & 0x0F);
  header[3] = 0x00;
  return header;
}

function writeUint32BE(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = (value >> 24) & 0xFF;
  buf[1] = (value >> 16) & 0xFF;
  buf[2] = (value >> 8) & 0xFF;
  buf[3] = value & 0xFF;
  return buf;
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return (buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

// 构建带事件ID的客户端文本帧
function buildClientTextFrame(eventId: number, payload: object, sessionId?: string): Uint8Array {
  const jsonStr = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(jsonStr);
  const header = buildHeader(MSG_TYPE_FULL_CLIENT, FLAG_EVENT, SERIAL_JSON, COMPRESS_NONE);
  const eventBytes = writeUint32BE(eventId);

  const parts: Uint8Array[] = [header, eventBytes];

  // Session级别事件需要携带 session id
  if (sessionId && eventId >= 100) {
    const sessionIdBytes = new TextEncoder().encode(sessionId);
    parts.push(writeUint32BE(sessionIdBytes.length));
    parts.push(sessionIdBytes);
  }

  parts.push(writeUint32BE(payloadBytes.length));
  parts.push(payloadBytes);

  return concatBuffers(...parts);
}

// 构建音频帧（TaskRequest - event 200）
function buildAudioFrame(audioData: Uint8Array, sessionId: string): Uint8Array {
  const header = buildHeader(MSG_TYPE_AUDIO_CLIENT, FLAG_EVENT, SERIAL_RAW, COMPRESS_NONE);
  const eventBytes = writeUint32BE(EVENT_TASK_REQUEST);
  const sessionIdBytes = new TextEncoder().encode(sessionId);

  return concatBuffers(
    header,
    eventBytes,
    writeUint32BE(sessionIdBytes.length),
    sessionIdBytes,
    writeUint32BE(audioData.length),
    audioData
  );
}

// 解析服务端帧
interface ParsedFrame {
  msgType: number;
  flags: number;
  serialMethod: number;
  eventId?: number;
  sessionId?: string;
  errorCode?: number;
  payload?: Uint8Array;
  jsonPayload?: any;
  audioData?: Uint8Array;  // 音频帧的实际音频数据
}

function parseServerFrame(data: Uint8Array): ParsedFrame | null {
  if (data.length < 4) return null;

  const headerSize = (data[0] & 0x0F) * 4;
  const msgType = (data[1] >> 4) & 0x0F;
  const flags = data[1] & 0x0F;
  const serialMethod = (data[2] >> 4) & 0x0F;

  let offset = headerSize || 4;
  let eventId: number | undefined;
  let sessionId: string | undefined;
  let errorCode: number | undefined;

  // 错误帧有 error code
  if (msgType === MSG_TYPE_ERROR) {
    if (offset + 4 <= data.length) {
      errorCode = readUint32BE(data, offset);
      offset += 4;
    }
  }

  // 事件ID
  if (flags & FLAG_EVENT) {
    if (offset + 4 <= data.length) {
      eventId = readUint32BE(data, offset);
      offset += 4;
    }
  }

  // Session ID (session级别事件, eventId >= 100)
  if (eventId !== undefined && eventId >= 100) {
    if (offset + 4 <= data.length) {
      const sessionIdSize = readUint32BE(data, offset);
      offset += 4;
      if (sessionIdSize > 0 && offset + sessionIdSize <= data.length) {
        sessionId = new TextDecoder().decode(data.slice(offset, offset + sessionIdSize));
        offset += sessionIdSize;
      }
    }
  }

  let payload: Uint8Array | undefined;
  let jsonPayload: any;
  let audioData: Uint8Array | undefined;

  if (offset + 4 <= data.length) {
    const payloadSize = readUint32BE(data, offset);
    offset += 4;
    if (payloadSize > 0 && offset + payloadSize <= data.length) {
      payload = data.slice(offset, offset + payloadSize);

      if (msgType === MSG_TYPE_AUDIO_SERVER) {
        const validSize = payload.length % 2 === 0 ? payload.length : payload.length - 1;
        audioData = validSize > 0 ? payload.slice(0, validSize) : undefined;
      }

      if (serialMethod === SERIAL_JSON && payload) {
        try {
          jsonPayload = JSON.parse(new TextDecoder().decode(payload));
        } catch {}
      }
    }
  }

  return { msgType, flags, serialMethod, eventId, sessionId, errorCode, payload, jsonPayload, audioData };
}

function toUint8Array(rawData: unknown): Uint8Array {
  if (Array.isArray(rawData)) {
    return concatBuffers(...rawData.map((part) => toUint8Array(part)));
  }

  if (typeof rawData === 'string') {
    return new TextEncoder().encode(rawData);
  }

  if (rawData instanceof Uint8Array) {
    return rawData;
  }

  if (rawData instanceof ArrayBuffer) {
    return new Uint8Array(rawData);
  }

  if (ArrayBuffer.isView(rawData)) {
    return new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength);
  }

  throw new TypeError(`Unsupported WebSocket message type: ${typeof rawData}`);
}

// ============ WebSocket Relay Handler ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 处理预热请求
  if (req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.preheat) {
        return new Response(
          JSON.stringify({ status: 'warm', timestamp: Date.now() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // not a preheat request
    }
  }

  // WebSocket upgrade
  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response(
      JSON.stringify({ error: '需要 WebSocket 连接' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { socket: clientWs, response } = Deno.upgradeWebSocket(req);

  // 从请求 URL 获取认证信息
  const url = new URL(req.url);
  const authToken = url.searchParams.get('token') || req.headers.get('authorization')?.replace('Bearer ', '');

  let doubaoWs: NodeWebSocket | null = null;
  let sessionId = '';
  let userName: string | undefined;
  let heartbeatTimer: number | null = null;

  const stopHeartbeat = () => {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (clientWs.readyState !== WebSocket.OPEN) {
        stopHeartbeat();
        return;
      }

      try {
        clientWs.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      } catch (error) {
        console.warn('[DoubaoRelay] ⚠️ Failed to send heartbeat to client:', error);
      }
    }, 15000);
  };

  clientWs.onopen = async () => {
    console.log('[DoubaoRelay] ✅ Client WebSocket connected');

    // 验证用户身份
    if (!authToken) {
      console.error('[DoubaoRelay] ❌ No auth token provided');
      clientWs.send(JSON.stringify({ type: 'error', message: '未授权访问' }));
      clientWs.close(4001, '未授权');
      return;
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: { user }, error: authError } = await adminClient.auth.getUser(authToken);
      if (authError || !user) {
        console.error('[DoubaoRelay] ❌ Auth failed:', authError?.message);
        clientWs.send(JSON.stringify({ type: 'error', message: '身份验证失败' }));
        clientWs.close(4001, '认证失败');
        return;
      }

      console.log('[DoubaoRelay] ✅ User authenticated:', user.id);

      // 获取用户名
      const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      userName = profile?.display_name;

    } catch (e) {
      console.error('[DoubaoRelay] ❌ Auth error:', e);
      clientWs.send(JSON.stringify({ type: 'error', message: '认证失败' }));
      clientWs.close(4001, '认证失败');
      return;
    }

    // 连接豆包
    const DOUBAO_ACCESS_TOKEN = Deno.env.get('DOUBAO_ACCESS_TOKEN');
    const DOUBAO_APP_ID = Deno.env.get('DOUBAO_APP_ID');

    if (!DOUBAO_ACCESS_TOKEN || !DOUBAO_APP_ID) {
      console.error('[DoubaoRelay] ❌ DOUBAO_ACCESS_TOKEN or DOUBAO_APP_ID not set');
      clientWs.send(JSON.stringify({ type: 'error', message: '豆包语音服务未配置' }));
      clientWs.close(4002, '配置缺失');
      return;
    }

    console.log('[DoubaoRelay] 🔗 Connecting to Doubao WebSocket...');
    console.log('[DoubaoRelay] 🔑 APP_ID prefix:', DOUBAO_APP_ID.substring(0, 6) + '...', 'TOKEN prefix:', DOUBAO_ACCESS_TOKEN.substring(0, 6) + '...', 'APP_ID length:', DOUBAO_APP_ID.length, 'TOKEN length:', DOUBAO_ACCESS_TOKEN.length);

    try {
      const doubaoWsUrl = 'wss://openspeech.bytedance.com/api/v3/realtime/dialogue';
      const connectId = crypto.randomUUID();
      const connectHeaders = new Headers({
        'X-Api-App-ID': DOUBAO_APP_ID,
        'X-Api-Access-Key': DOUBAO_ACCESS_TOKEN,
        'X-Api-Resource-Id': 'volc.speech.dialog',
        'X-Api-App-Key': 'PlgvMymc7f3tQnJ6',
        'X-Api-Connect-Id': connectId,
      });

      console.log('[DoubaoRelay] 🔗 Opening outbound Doubao WebSocket, connectId:', connectId);

      const upstreamWs = new NodeWebSocket(doubaoWsUrl, {
        headers: Object.fromEntries(connectHeaders.entries()),
      });
      upstreamWs.binaryType = 'arraybuffer';
      doubaoWs = upstreamWs;

      upstreamWs.on('open', () => {
        console.log('[DoubaoRelay] ✅ Connected to Doubao WebSocket');
        const frame = buildClientTextFrame(EVENT_START_CONNECTION, {});
        upstreamWs.send(frame);
        console.log('[DoubaoRelay] 📤 Sent StartConnection event');
      });

      upstreamWs.on('message', (rawData) => {
        if (clientWs.readyState !== WebSocket.OPEN) return;

        try {
          const data = toUint8Array(rawData);
          const parsed = parseServerFrame(data);
          if (!parsed) {
            console.warn('[DoubaoRelay] ⚠️ Failed to parse server frame, length:', data.length);
            return;
          }

          // 转发服务端事件为 JSON 给客户端
          switch (parsed.eventId) {
            case EVENT_CONNECTION_STARTED:
              console.log('[DoubaoRelay] ✅ ConnectionStarted, sending StartSession');
              // 自动发送 StartSession
              sessionId = crypto.randomUUID();
              const systemRole = buildEmotionPrompt(userName);
              const startSessionPayload = {
                tts: {
                  speaker: 'zh_male_yunzhou_jupiter_bigtts',
                  audio_config: {
                    format: 'pcm_s16le',
                    sample_rate: 24000,
                    channel: 1,
                  }
                },
                asr: {
                  audio_info: {
                    format: 'pcm',
                    sample_rate: 16000,
                    channel: 1,
                  }
                },
                dialog: {
                  bot_name: '劲老师',
                  system_role: systemRole,
                  speaking_style: '温暖、亲切、像老朋友聊天，语气自然不端着，适当使用"嗯嗯""我懂"等口头禅',
                  extra: {
                    model: '1.2.1.1',  // O2.0版本（必传）
                    strict_audit: false,
                  }
                }
              };
              const sessionFrame = buildClientTextFrame(EVENT_START_SESSION, startSessionPayload, sessionId);
              doubaoWs!.send(sessionFrame);
              console.log('[DoubaoRelay] 📤 Sent StartSession, sessionId:', sessionId);
              break;

            case EVENT_CONNECTION_FAILED:
              console.error('[DoubaoRelay] ❌ ConnectionFailed:', parsed.jsonPayload);
              clientWs.send(JSON.stringify({
                type: 'error',
                message: parsed.jsonPayload?.error || '连接失败'
              }));
              break;

            case EVENT_SESSION_STARTED:
              console.log('[DoubaoRelay] ✅ SessionStarted, dialog_id:', parsed.jsonPayload?.dialog_id);
              clientWs.send(JSON.stringify({
                type: 'session_started',
                session_id: sessionId,
                dialog_id: parsed.jsonPayload?.dialog_id
              }));
              startHeartbeat();
              // 发送开场白
              const greetingText = `嗨${userName ? userName + '，' : ''}今天心情怎么样？`;
              const sayHelloFrame = buildClientTextFrame(EVENT_SAY_HELLO, { content: greetingText }, sessionId);
              doubaoWs!.send(sayHelloFrame);
              console.log('[DoubaoRelay] 📤 Sent SayHello greeting');
              break;

            case EVENT_SESSION_FAILED:
              console.error('[DoubaoRelay] ❌ SessionFailed:', parsed.jsonPayload);
              clientWs.send(JSON.stringify({
                type: 'error',
                message: parsed.jsonPayload?.error || '会话失败'
              }));
              break;

            case EVENT_TTS_SENTENCE_START:
              clientWs.send(JSON.stringify({
                type: 'tts_start',
                text: parsed.jsonPayload?.text,
                question_id: parsed.jsonPayload?.question_id,
                reply_id: parsed.jsonPayload?.reply_id,
              }));
              break;

            case EVENT_TTS_RESPONSE:
              // 音频数据 - 使用正确解析的 audioData 字段
              if (parsed.audioData && parsed.audioData.length > 0) {
                // 发送类型标记 + 音频数据
                const typeByte = new Uint8Array([0x01]); // 0x01 = audio data
                const audioMsg = concatBuffers(typeByte, parsed.audioData);
                clientWs.send(audioMsg.buffer);
              }
              break;

            case EVENT_TTS_SENTENCE_END:
              clientWs.send(JSON.stringify({
                type: 'tts_sentence_end',
                question_id: parsed.jsonPayload?.question_id,
                reply_id: parsed.jsonPayload?.reply_id,
              }));
              break;

            case EVENT_TTS_ENDED:
              clientWs.send(JSON.stringify({
                type: 'tts_ended',
                question_id: parsed.jsonPayload?.question_id,
                reply_id: parsed.jsonPayload?.reply_id,
                status_code: parsed.jsonPayload?.status_code,
              }));
              break;

            case EVENT_ASR_INFO:
              // 用户开始说话 - 客户端可用于打断播放
              clientWs.send(JSON.stringify({
                type: 'asr_info',
                question_id: parsed.jsonPayload?.question_id,
              }));
              break;

            case EVENT_ASR_RESPONSE:
              // 语音识别结果
              if (parsed.jsonPayload?.results) {
                for (const result of parsed.jsonPayload.results) {
                  clientWs.send(JSON.stringify({
                    type: 'transcript',
                    text: result.text,
                    is_interim: result.is_interim,
                    role: 'user',
                  }));
                }
              }
              break;

            case EVENT_ASR_ENDED:
              clientWs.send(JSON.stringify({
                type: 'asr_ended',
              }));
              break;

            case EVENT_CHAT_RESPONSE:
              clientWs.send(JSON.stringify({
                type: 'chat_response',
                content: parsed.jsonPayload?.content,
                question_id: parsed.jsonPayload?.question_id,
                reply_id: parsed.jsonPayload?.reply_id,
              }));
              break;

            case EVENT_CHAT_ENDED:
              clientWs.send(JSON.stringify({
                type: 'chat_ended',
                question_id: parsed.jsonPayload?.question_id,
                reply_id: parsed.jsonPayload?.reply_id,
              }));
              break;

            case EVENT_DIALOG_ERROR:
              console.error('[DoubaoRelay] ❌ DialogError:', parsed.jsonPayload);
              clientWs.send(JSON.stringify({
                type: 'error',
                message: parsed.jsonPayload?.message || '对话错误',
                status_code: parsed.jsonPayload?.status_code,
              }));
              break;

            default:
              console.log('[DoubaoRelay] 📥 Unknown server event:', parsed.eventId, parsed.jsonPayload);
              if (parsed.jsonPayload) {
                clientWs.send(JSON.stringify({
                  type: 'unknown_event',
                  event_id: parsed.eventId,
                  data: parsed.jsonPayload,
                }));
              }
              break;
          }

          // 错误帧
          if (parsed.msgType === MSG_TYPE_ERROR) {
            console.error('[DoubaoRelay] ❌ Error frame:', parsed.errorCode, parsed.jsonPayload);
            clientWs.send(JSON.stringify({
              type: 'error',
              code: parsed.errorCode,
              message: parsed.jsonPayload?.error || '服务端错误',
            }));
          }
        } catch (e) {
          console.error('[DoubaoRelay] ❌ Error processing Doubao message:', e);
        }
      });

      upstreamWs.on('error', (e) => {
        console.error('[DoubaoRelay] ❌ Doubao WebSocket error:', e);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'error', message: '语音服务连接错误' }));
        }
      });

      upstreamWs.on('close', (code, reason) => {
        const closeReason = typeof reason === 'string' ? reason : new TextDecoder().decode(reason);
        console.log('[DoubaoRelay] 🔌 Doubao WebSocket closed:', code, closeReason);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'disconnected', code }));
          clientWs.close(1000, '豆包连接关闭');
        }
      });

    } catch (e) {
      console.error('[DoubaoRelay] ❌ Failed to connect to Doubao:', e);
      clientWs.send(JSON.stringify({ type: 'error', message: `无法连接语音服务: ${e instanceof Error ? e.message : String(e)}` }));
      clientWs.close(4003, '连接失败');
    }
  };

  clientWs.onmessage = (event) => {
    if (!doubaoWs || doubaoWs.readyState !== NodeWebSocket.OPEN) {
      console.warn('[DoubaoRelay] ⚠️ Received client message but Doubao WS not ready, state:', doubaoWs?.readyState);
      return;
    }

    try {
      // 二进制数据 = 音频
      if (event.data instanceof ArrayBuffer) {
        const audioData = new Uint8Array(event.data);
        const frame = buildAudioFrame(audioData, sessionId);
        doubaoWs.send(frame);
        return;
      }

      // 文本数据 = JSON 控制消息
      const msg = JSON.parse(event.data as string);
      console.log('[DoubaoRelay] 📥 Client message:', msg.type);

      switch (msg.type) {
        case 'ping': {
          clientWs.send(JSON.stringify({ type: 'pong', ts: msg.ts ?? Date.now() }));
          break;
        }

        case 'pong':
          break;

        case 'audio': {
          // Base64 音频数据
          const binaryStr = atob(msg.data);
          const audioBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            audioBytes[i] = binaryStr.charCodeAt(i);
          }
          const audioFrame = buildAudioFrame(audioBytes, sessionId);
          doubaoWs.send(audioFrame);
          break;
        }

        case 'finish_session': {
          console.log('[DoubaoRelay] 📤 Sending FinishSession');
          const finishFrame = buildClientTextFrame(EVENT_FINISH_SESSION, {}, sessionId);
          doubaoWs.send(finishFrame);
          break;
        }

        case 'finish_connection': {
          console.log('[DoubaoRelay] 📤 Sending FinishConnection');
          const finishConnFrame = buildClientTextFrame(EVENT_FINISH_CONNECTION, {});
          doubaoWs.send(finishConnFrame);
          break;
        }

        default:
          console.warn('[DoubaoRelay] ⚠️ Unknown client message type:', msg.type);
      }
    } catch (e) {
      console.error('[DoubaoRelay] ❌ Error processing client message:', e);
    }
  };

  clientWs.onclose = (e) => {
    console.log('[DoubaoRelay] 🔌 Client WebSocket closed:', e.code, e.reason);
    stopHeartbeat();
    if (doubaoWs && doubaoWs.readyState === NodeWebSocket.OPEN) {
      try {
        // 发送 FinishSession 和 FinishConnection
        const finishSession = buildClientTextFrame(EVENT_FINISH_SESSION, {}, sessionId);
        doubaoWs.send(finishSession);
        const finishConn = buildClientTextFrame(EVENT_FINISH_CONNECTION, {});
        doubaoWs.send(finishConn);
      } catch {
        // ignore
      }
      doubaoWs.close();
    }
  };

  clientWs.onerror = (e) => {
    console.error('[DoubaoRelay] ❌ Client WebSocket error:', e);
    stopHeartbeat();
    if (doubaoWs && doubaoWs.readyState === NodeWebSocket.OPEN) {
      doubaoWs.close();
    }
  };

  return response;
});
