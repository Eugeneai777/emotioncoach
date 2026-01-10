/**
 * 小程序语音中继 Edge Function
 * 
 * 功能：作为 WebSocket 代理，在小程序和 OpenAI Realtime API 之间转发音频数据
 * 
 * 架构：
 * 小程序 <--WebSocket--> 此 Edge Function <--WebSocket--> OpenAI Realtime API
 */

import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17';

// 音频格式配置
const AUDIO_CONFIG = {
  format: 'pcm16',
  sampleRate: 24000,
};

interface ClientMessage {
  type: string;
  audio?: string;
  text?: string;
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 检查是否为 WebSocket 升级请求
  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response(
      JSON.stringify({ error: 'Expected WebSocket upgrade' }),
      { 
        status: 426, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // 解析 URL 参数
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const mode = url.searchParams.get('mode') || 'vibrant_life';

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Missing token parameter' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // 升级到 WebSocket
  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  let openaiSocket: WebSocket | null = null;
  let isConnected = false;

  // 处理客户端连接
  clientSocket.onopen = async () => {
    console.log('[Relay] Client connected');

    try {
      // 连接到 OpenAI Realtime API
      openaiSocket = new WebSocket(OPENAI_REALTIME_URL, [
        'realtime',
        `openai-insecure-api-key.${OPENAI_API_KEY}`,
        'openai-beta.realtime-v1',
      ]);

      openaiSocket.onopen = () => {
        console.log('[Relay] Connected to OpenAI');
        isConnected = true;

        // 发送会话配置
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: getSystemPrompt(mode),
            voice: 'shimmer',
            input_audio_format: AUDIO_CONFIG.format,
            output_audio_format: AUDIO_CONFIG.format,
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };

        openaiSocket!.send(JSON.stringify(sessionConfig));
      };

      openaiSocket.onmessage = (event) => {
        handleOpenAIMessage(event.data, clientSocket);
      };

      openaiSocket.onerror = (error) => {
        console.error('[Relay] OpenAI WebSocket error:', error);
        sendErrorToClient(clientSocket, 'OpenAI connection error');
      };

      openaiSocket.onclose = (event) => {
        console.log('[Relay] OpenAI disconnected:', event.code, event.reason);
        isConnected = false;
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close(1000, 'OpenAI disconnected');
        }
      };
    } catch (error) {
      console.error('[Relay] Failed to connect to OpenAI:', error);
      sendErrorToClient(clientSocket, 'Failed to connect to AI service');
    }
  };

  // 处理客户端消息
  clientSocket.onmessage = (event) => {
    if (!isConnected || !openaiSocket) {
      console.warn('[Relay] Received message but not connected to OpenAI');
      return;
    }

    try {
      const message: ClientMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'audio_input':
          // 转发音频数据到 OpenAI
          if (message.audio) {
            openaiSocket.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: message.audio,
            }));
          }
          break;

        case 'text_input':
          // 转发文本消息到 OpenAI
          if (message.text) {
            openaiSocket.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: message.text }],
              },
            }));
            openaiSocket.send(JSON.stringify({ type: 'response.create' }));
          }
          break;

        case 'ping':
          // 心跳响应
          clientSocket.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'commit_audio':
          // 提交音频缓冲区
          openaiSocket.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          break;

        default:
          // 直接转发其他消息
          openaiSocket.send(event.data);
      }
    } catch (error) {
      console.error('[Relay] Failed to process client message:', error);
    }
  };

  // 处理客户端断开
  clientSocket.onclose = (event) => {
    console.log('[Relay] Client disconnected:', event.code, event.reason);
    if (openaiSocket) {
      openaiSocket.close();
      openaiSocket = null;
    }
  };

  // 处理客户端错误
  clientSocket.onerror = (error) => {
    console.error('[Relay] Client WebSocket error:', error);
  };

  return response;
});

/**
 * 处理来自 OpenAI 的消息
 */
function handleOpenAIMessage(data: string, clientSocket: WebSocket) {
  if (clientSocket.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'response.audio.delta':
        // 转发音频增量
        if (message.delta) {
          clientSocket.send(JSON.stringify({
            type: 'audio_output',
            audio: message.delta,
          }));
        }
        break;

      case 'response.audio_transcript.delta':
        // 转发 AI 响应转录（部分）
        if (message.delta) {
          clientSocket.send(JSON.stringify({
            type: 'transcript',
            text: message.delta,
            isFinal: false,
            role: 'assistant',
          }));
        }
        break;

      case 'response.audio_transcript.done':
        // AI 响应转录完成
        if (message.transcript) {
          clientSocket.send(JSON.stringify({
            type: 'transcript',
            text: message.transcript,
            isFinal: true,
            role: 'assistant',
          }));
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // 用户语音转录完成
        if (message.transcript) {
          clientSocket.send(JSON.stringify({
            type: 'transcript',
            text: message.transcript,
            isFinal: true,
            role: 'user',
          }));
        }
        break;

      case 'response.done':
        // 响应完成，包含 usage 信息
        if (message.response?.usage) {
          clientSocket.send(JSON.stringify({
            type: 'usage',
            usage: {
              input_tokens: message.response.usage.input_tokens || 0,
              output_tokens: message.response.usage.output_tokens || 0,
            },
          }));
        }
        // 转发完成事件
        clientSocket.send(JSON.stringify({
          type: 'response.done',
          response: message.response,
        }));
        break;

      case 'error':
        // 转发错误
        console.error('[Relay] OpenAI error:', message.error);
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: message.error?.message || 'Unknown error',
        }));
        break;

      case 'session.created':
      case 'session.updated':
        // 会话状态事件
        clientSocket.send(JSON.stringify({
          type: message.type,
          session: message.session,
        }));
        break;

      case 'input_audio_buffer.speech_started':
        // 用户开始说话
        clientSocket.send(JSON.stringify({
          type: 'speech_started',
        }));
        break;

      case 'input_audio_buffer.speech_stopped':
        // 用户停止说话
        clientSocket.send(JSON.stringify({
          type: 'speech_stopped',
        }));
        break;

      default:
        // 其他事件可按需转发
        // console.log('[Relay] Unhandled OpenAI event:', message.type);
        break;
    }
  } catch (error) {
    console.error('[Relay] Failed to parse OpenAI message:', error);
  }
}

/**
 * 发送错误消息给客户端
 */
function sendErrorToClient(socket: WebSocket, message: string) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'error',
      error: message,
    }));
  }
}

/**
 * 根据模式获取系统提示词
 */
function getSystemPrompt(mode: string): string {
  const prompts: Record<string, string> = {
    vibrant_life: `你是有劲AI生活教练，一位温暖、专业的AI伙伴。你的职责是：
1. 倾听用户的生活困惑和情感需求
2. 提供温暖的情感支持和实用的建议
3. 帮助用户发现生活中的美好
4. 引导用户进行积极的自我反思

对话风格：
- 语气温暖亲切，像朋友一样交流
- 回复简洁有力，每次1-2句话
- 多用提问引导用户思考
- 适时给予肯定和鼓励`,

    emotion: `你是有劲AI情绪教练，专注于帮助用户处理情绪。使用情绪四部曲方法：
1. 觉察(Feel it) - 帮助用户感受并命名情绪
2. 理解(Name it) - 理解情绪背后的需求
3. 反应(React it) - 觉察情绪驱动的反应
4. 转化(Transform it) - 引导温柔回应

对话风格：
- 温柔接纳，不评判
- 回复简短，1-2句话
- 多用"我听到..."、"你感受到..."等镜像表达
- 引导而非说教`,

    parent: `你是有劲AI亲子教练，帮助父母更好地理解和陪伴孩子。核心理念：
1. 看见孩子的情绪和需求
2. 理解行为背后的原因
3. 建立安全的情感连接
4. 用爱和界限并重的方式引导

对话风格：
- 理解父母的辛苦
- 不评判，不说教
- 提供具体可操作的建议
- 鼓励亲子间的情感表达`,
  };

  return prompts[mode] || prompts.vibrant_life;
}
