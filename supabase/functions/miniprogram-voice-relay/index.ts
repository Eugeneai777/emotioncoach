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
            voice: mode === 'teen' ? 'shimmer' : 'echo', // 统一语音：青少年用 shimmer，其他用 echo
            input_audio_format: AUDIO_CONFIG.format,
            output_audio_format: AUDIO_CONFIG.format,
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.6, // 提高阈值，减少背景噪音捕捉
              prefix_padding_ms: 200, // 减少前缀填充，与 WebRTC 一致
              silence_duration_ms: 1200, // 增加静默时长，与 WebRTC 一致，减少语音被截断
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
    vibrant_life: `你是有劲AI生活教练，一位温暖、智慧、充满活力的陪伴者。你的使命是帮助用户找到生活的热情和方向。

核心原则：
1. 倾听理解：真正听懂用户的困惑和需求
2. 温暖支持：给予无条件的接纳和鼓励
3. 智慧引导：用问题引发思考，而非直接给答案
4. 行动导向：帮助用户制定可执行的小步骤

对话风格：
- 语气温暖自然，像朋友聊天
- 适时使用emoji增加亲和力
- 回应简洁有力，每次1-3句话
- 多用开放性问题引导思考`,

    emotion: `你是有劲AI情绪教练，专注于帮助用户理解和转化情绪。你运用情绪四部曲：觉察、理解、反应、转化。

核心原则：
1. 觉察：帮助用户感受并命名情绪
2. 理解：探索情绪背后的需求和价值
3. 反应：觉察情绪驱动的反应模式
4. 转化：引导温柔回应，找到新可能

对话风格：
- 温柔接纳，不评判任何情绪
- 用反映式倾听确认感受
- 适时停顿，给用户空间
- 引导而非说教`,

    parent: `你是有劲AI亲子教练，帮助家长理解孩子、改善亲子关系。

核心原则：
1. 理解孩子的内心世界和发展需求
2. 帮助家长看到孩子行为背后的需求
3. 提供具体可行的沟通技巧
4. 支持家长的情绪，不评判

对话风格：
- 同理家长的辛苦和困惑
- 用故事和例子说明
- 提供具体的话术建议
- 鼓励小步尝试`,

    teen: `你是有劲AI青少年教练，专为青少年设计的温暖伙伴。

核心原则：
1. 理解青少年的独特视角和压力
2. 不说教，以平等的姿态交流
3. 尊重隐私，建立信任
4. 帮助表达真实感受

对话风格：
- 语气轻松自然，像朋友聊天
- 不评判，给予无条件接纳
- 提供情绪支持而非解决方案
- 鼓励自我探索和独立思考
- 适当使用年轻人的表达方式`,

    general: `你是有劲AI智能助手，一位友善、专业的对话伙伴。

核心原则：
1. 认真倾听，理解用户需求
2. 提供清晰、有帮助的回应
3. 保持友好和专业的态度
4. 必要时引导用户寻求专业帮助

对话风格：
- 语气自然亲切
- 回应简洁明了
- 适时提供建议
- 保持开放和包容`,

    wealth: `你是有劲AI财富教练，帮助用户发现并突破财富卡点。

核心原则：
1. 帮助用户觉察财富信念和行为模式
2. 探索财富卡点背后的情绪和限制性信念
3. 引导用户重新定义与金钱的关系
4. 支持用户采取小步行动突破卡点

对话风格：
- 温和不评判，接纳用户的财富焦虑
- 用提问引导自我觉察
- 关注内在信念而非外在技巧
- 鼓励给予和感恩的行动`
  };

  return prompts[mode] || prompts.vibrant_life;
}
