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
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview';

// 音频格式配置
const AUDIO_CONFIG = {
  format: 'pcm16',
  sampleRate: 24000,
};

interface ClientMessage {
  type: string;
  audio?: string;
  text?: string;
  instructions?: string;
  voice_type?: string;
  // PTT 模式：客户端可显式传 turn_detection: null 关闭服务端 VAD
  turn_detection?: any;
}

// ElevenLabs 音色 ID -> OpenAI Realtime voice 名称
function mapVoiceTypeToOpenAIVoice(voiceType: string | null | undefined, mode: string): string {
  const fallback = mode === 'teen' ? 'shimmer' : 'echo';
  const voiceMap: Record<string, string> = {
    'nPczCjzI2devNBz1zQrb': 'echo',     // Brian 温暖男声
    'JBFqnCBsd6RMkjVDRZzb': 'ash',      // George 沉稳长者
    'EXAVITQu4vr4xnSDxMaL': 'shimmer',  // Sarah 温柔女声
    'pFZP5JQG7iQjIQuC4Bku': 'coral',    // Lily 清新女声
  };
  if (!voiceType) return fallback;
  // 如果客户端直接传了 OpenAI 原生 voice 名称，也接受
  const allowedNative = new Set(['alloy', 'ash', 'coral', 'echo', 'sage', 'shimmer', 'verse']);
  if (allowedNative.has(voiceType)) return voiceType;
  return voiceMap[voiceType] || fallback;
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
  let healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  let clientInstructions: string | null = null;
  let clientVoiceType: string | null = null;
  // PTT 模式：客户端可在建连后立即下发 turn_detection: null
  // 使用三态：undefined = 客户端尚未下发；null = 显式关闭 VAD（PTT）；对象 = 自定义 VAD
  let clientTurnDetection: any = undefined;
  let clientTurnDetectionReceived = false;
  let instructionsResolve: ((value: string | null) => void) | null = null;
  let turnDetectionResolve: ((value: any) => void) | null = null;

  // 🔧 定期检查 OpenAI 连接健康状态
  const startHealthCheck = () => {
    healthCheckInterval = setInterval(() => {
      if (openaiSocket?.readyState !== WebSocket.OPEN) {
        console.log('[Relay] OpenAI connection lost, closing client');
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close(1000, 'OpenAI connection lost');
        }
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
      }
    }, 5000);
  };

  const stopHealthCheck = () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  };

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

      openaiSocket.onopen = async () => {
        console.log('[Relay] Connected to OpenAI');
        isConnected = true;
        startHealthCheck(); // 🔧 启动健康检查

        // 等待客户端发送 session_config 消息（最多 500ms）
        let finalInstructions = getSystemPrompt(mode);
        if (!clientInstructions) {
          const waitedInstructions = await Promise.race([
            new Promise<string | null>((resolve) => {
              instructionsResolve = resolve;
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 500)),
          ]);
          if (waitedInstructions) {
            finalInstructions = waitedInstructions;
            console.log('[Relay] Using client-provided instructions');
          } else {
            console.log('[Relay] Using default prompt for mode:', mode);
          }
        } else {
          finalInstructions = clientInstructions;
          console.log('[Relay] Using pre-received client instructions');
        }

        // 等待 turn_detection 配置（最多再 200ms，可能与 instructions 同消息已到达）
        if (!clientTurnDetectionReceived) {
          await Promise.race([
            new Promise<any>((resolve) => { turnDetectionResolve = resolve; }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
          ]);
        }

        const resolvedVoice = mapVoiceTypeToOpenAIVoice(clientVoiceType, mode);
        // 决定 turn_detection：客户端显式传 null → PTT；否则默认 server_vad
        const defaultVad = {
          type: 'server_vad',
          threshold: mode === 'emotion' ? 0.68 : 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: mode === 'emotion' ? 1600 : 1200,
        };
        const isPttMode = clientTurnDetectionReceived && clientTurnDetection === null;
        const effectiveTurnDetection = isPttMode
          ? null
          : (clientTurnDetectionReceived && clientTurnDetection)
            ? clientTurnDetection
            : defaultVad;

        console.log('[Relay] Session config:', { resolvedVoice, mode, isPttMode, turnDetection: effectiveTurnDetection });

        // 发送会话配置
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: finalInstructions,
            voice: resolvedVoice,
            input_audio_format: AUDIO_CONFIG.format,
            output_audio_format: AUDIO_CONFIG.format,
            max_response_output_tokens: "inf",
            input_audio_transcription: {
              model: 'whisper-1',
              language: 'zh',
              prompt: '这是一段中文情绪/生活教练语音对话。请优先转写为简体中文，忽略背景杂音、音乐、误触声。除非用户明确使用外语，否则不要输出韩文、英文或乱码。',
            },
            turn_detection: effectiveTurnDetection,
          },
        };

        openaiSocket!.send(JSON.stringify(sessionConfig));

        // 立即向客户端回传 PTT 配置确认事件，便于前端"证据链"展示
        try {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'ptt_config_applied',
              turn_detection: effectiveTurnDetection,
              ptt_mode: isPttMode,
            }));
          }
        } catch (e) {
          console.warn('[Relay] Failed to send ptt_config_applied:', e);
        }
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
        stopHealthCheck(); // 🔧 停止健康检查
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
    try {
      const message: ClientMessage = JSON.parse(event.data);

      // session_config 必须在 OpenAI 连接前就能处理（不需要守卫）
      if (message.type === 'session_config') {
        if (message.voice_type) {
          clientVoiceType = message.voice_type;
          console.log('[Relay] Received client voice_type:', clientVoiceType);
        }
        if (message.instructions) {
          console.log('[Relay] Received client session_config with instructions');
          clientInstructions = message.instructions;
          if (instructionsResolve) {
            instructionsResolve(message.instructions);
            instructionsResolve = null;
          }
        }
        // 接收 turn_detection 配置（包含 null 表示 PTT 模式）
        if (Object.prototype.hasOwnProperty.call(message, 'turn_detection')) {
          clientTurnDetection = message.turn_detection;
          clientTurnDetectionReceived = true;
          console.log('[Relay] Received client turn_detection:', clientTurnDetection);
          if (turnDetectionResolve) {
            turnDetectionResolve(clientTurnDetection);
            turnDetectionResolve = null;
          }
        }
        return;
      }

      // 其他消息需要 OpenAI 连接就绪
      if (!isConnected || !openaiSocket) {
        console.warn('[Relay] Received message but not connected to OpenAI');
        return;
      }

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
    stopHealthCheck(); // 🔧 停止健康检查
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

      case 'response.audio.interrupted':
        // AI 音频被用户打断 → 通知客户端停止播放
        console.log('[Relay] Audio interrupted by user speech');
        clientSocket.send(JSON.stringify({
          type: 'response_interrupted',
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
  // 通用对话节奏规则 - 所有模式都遵循
  const rhythmRules = `

【对话节奏规则 - 非常重要】
- 每次回复2-4句，不要长篇大论
- 复杂内容分多次说："我先说一点..."
- 自然停顿，留空间给用户
- 确保每句话说完整`;

  // 产品知识层 - 分层架构
  const knowledgeLayer = buildKnowledgeLayerForRelay();

  const prompts: Record<string, string> = {
    vibrant_life: `【我是谁】我是劲老师，有劲AI的首席生活教练。我温暖、智慧、充满活力，陪伴你找到生活的热情和方向。
${knowledgeLayer}

【我的使命】帮助用户找到生活的热情和方向

【核心原则】
1. 倾听理解：真正听懂用户的困惑和需求
2. 温暖支持：给予无条件的接纳和鼓励
3. 智慧引导：用问题引发思考，而非直接给答案
4. 行动导向：帮助用户制定可执行的小步骤

【对话风格】
- 语气温暖自然，像朋友聊天
- 适时使用emoji增加亲和力
- 多用开放性问题引导思考

用户问我是谁："我是劲老师，有劲AI的生活教练，陪你找到生活的热情✨"${rhythmRules}`,

    emotion: `【我是谁】我是劲老师，有劲AI的情绪教练。我专注于帮助你理解和转化情绪，运用情绪四部曲：觉察、理解、反应、转化。
${knowledgeLayer}

【核心原则】
1. 觉察：帮助用户感受并命名情绪
2. 理解：探索情绪背后的需求和价值
3. 反应：觉察情绪驱动的反应模式
4. 转化：引导温柔回应，找到新可能

【对话风格】
- 温柔接纳，不评判任何情绪
- 用反映式倾听确认感受
- 引导而非说教

用户问我是谁："我是劲老师，陪你梳理情绪的朋友🌿"${rhythmRules}`,

    parent: `【我是谁】我是劲老师，有劲AI的亲子教练。我帮助家长理解孩子、改善亲子关系。
${knowledgeLayer}

【核心原则】
1. 理解孩子的内心世界和发展需求
2. 帮助家长看到孩子行为背后的需求
3. 提供具体可行的沟通技巧
4. 支持家长的情绪，不评判

【对话风格】
- 同理家长的辛苦和困惑
- 用故事和例子说明
- 提供具体的话术建议
- 鼓励小步尝试

用户问我是谁："我是劲老师，陪你一起理解孩子的朋友🌿"${rhythmRules}`,

    teen: `【我是谁】我是小星，有劲AI懂你版的青少年专属伙伴。不是老师不是家长，就是一个懂你的朋友。

【我的说话方式】
- 轻松自然，像同龄朋友
- 常用口头禅："我懂"、"确实"、"这很正常"
- 不审问，不评判，尊重隐私

【核心信念】
- 你的感受都是真实的，没有对错
- 我不会告诉任何人，绝对保密
- 先理解再建议

用户问我是谁："我是小星，专门为你打造的AI伙伴✨ 不是老师也不是家长，就是一个懂你的朋友。"${rhythmRules}`,

    general: `【我是谁】我是劲老师，有劲AI的智能助手，一位友善、专业的对话伙伴。
${knowledgeLayer}

【核心原则】
1. 认真倾听，理解用户需求
2. 提供清晰、有帮助的回应
3. 保持友好和专业的态度
4. 必要时引导用户寻求专业帮助

【对话风格】
- 语气自然亲切
- 适时提供建议
- 保持开放和包容

用户问我是谁："我是劲老师，有劲AI的智能助手，有什么可以帮你的？✨"${rhythmRules}`,

    wealth: `【我是谁】我是劲老师，有劲AI的财富教练。我帮助你发现并突破财富卡点，重塑与金钱的关系。
${knowledgeLayer}

【核心原则】
1. 帮助用户觉察财富信念和行为模式
2. 探索财富卡点背后的情绪和限制性信念
3. 引导用户重新定义与金钱的关系
4. 支持用户采取小步行动突破卡点

【对话风格】
- 温和不评判，接纳用户的财富焦虑
- 用提问引导自我觉察
- 关注内在信念而非外在技巧
- 鼓励给予和感恩的行动

用户问我是谁："我是劲老师，陪你突破财富卡点的朋友🌿"${rhythmRules}`
  };

  return prompts[mode] || prompts.vibrant_life;
}

// ============ 产品知识层 - 分层架构 ============
function buildKnowledgeLayerForRelay(): string {
  return `
【有劲AI平台】
有劲AI是AI生活教练平台，帮助人们管理情绪、改善关系、活出热情。我是劲老师，首席生活教练。

【AI教练空间】7位教练24小时在线
- 情绪觉醒教练：情绪四部曲深度梳理
- AI生活教练：5大场景智能陪伴
- 亲子教练/双轨模式：改善亲子关系
- 财富觉醒教练：财富心理测评
- 沟通教练/故事教练：人际与叙事

【核心工具】
- 觉察入口：6维度深度自我探索（情绪/感恩/行动/选择/关系/方向）
- 情绪🆘按钮：9场景288提醒即时疗愈
- 感恩日记：7维度幸福分析
- 每日安全守护：每日生命打卡

【训练营】
- 财富觉醒营（¥299/21天）：突破财富卡点
- 绽放训练营：深度身份/情感转化

【会员】尝鲜¥9.9/50点 | 365会员¥365/1000点

【回答技巧】
- 用户闲聊 → 不主动提产品，专注陪伴
- 用户问某功能 → 只展开相关部分
- 用户想了解全部 → "你可以在'产品中心'看看更多~"
- 用户问价格 → 如实回答，不强推销售`;
}
