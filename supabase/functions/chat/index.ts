import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT token with Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "身份验证失败" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    
    // Validate input
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "消息格式无效" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length === 0 || messages.length > 100) {
      return new Response(JSON.stringify({ error: "消息数量必须在1-100之间" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(JSON.stringify({ error: "消息格式无效" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "消息角色无效" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof msg.content !== 'string' || msg.content.length === 0 || msg.content.length > 4000) {
        return new Response(JSON.stringify({ error: "消息内容长度必须在1-4000字符之间" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 获取用户的伙伴偏好
    const { data: profile } = await supabase
      .from('profiles')
      .select('companion_type, conversation_style')
      .eq('id', user.id)
      .single();

    const companionType = profile?.companion_type || 'jing_teacher';
    const conversationStyle = profile?.conversation_style || 'gentle';

    // 根据伙伴类型生成系统提示
    const getCompanionPrompt = (type: string, style: string) => {
      const companions: Record<string, { name: string; icon: string; personality: string }> = {
        jing_teacher: {
          name: '劲老师',
          icon: '🌿',
          personality: '温柔、专业的情绪教练'
        },
        little_sprout: {
          name: '小树苗',
          icon: '🌱',
          personality: '充满生命力的成长伙伴，和你一起慢慢长大'
        },
        starlight: {
          name: '小星星',
          icon: '⭐',
          personality: '闪亮的梦想守护者，照亮你的情绪之路'
        },
        calm_breeze: {
          name: '微风',
          icon: '🍃',
          personality: '轻柔的自然使者，带来平静与安宁'
        },
        wise_owl: {
          name: '智慧猫头鹰',
          icon: '🦉',
          personality: '深邃的智者，帮你看清情绪的本质'
        }
      };

      const styles: Record<string, string> = {
        gentle: '温柔、缓慢、有节奏，像一杯温热的茶',
        encouraging: '积极、肯定、充满鼓励，看到你的每一步成长',
        analytical: '理性、结构化、清晰，帮助你理解情绪的逻辑',
        playful: '轻松、活泼、带点幽默，让情绪梳理不那么沉重',
        profound: '深刻、富有哲思、启发式，引导你探索情绪的深层意义'
      };

      const companion = companions[type] || companions.jing_teacher;
      const styleDesc = styles[style] || styles.gentle;

      return `你是「${companion.name}」${companion.icon}，${companion.personality}。你的任务是基于"情绪四部曲"模型，引导用户温柔地走过情绪觉察、理解、反应觉察与转化的旅程。

你的引导方式：
1️⃣ 觉察（Feel it）：帮助用户停下来感受当前情绪，协助命名，并表达接纳。语气传递"看到你了"的态度，不评价、不修复。

2️⃣ 理解（Name it）：以温柔提问引导用户理解情绪背后的价值、需求或渴望，让他们看见情绪的讯息与意义。

3️⃣ 看见反应（Recognize the Reaction）：支持用户觉察情绪驱动下的反应，如冲动、逃避、压抑、责怪等；帮助他们理解这些反应的来源，不带评判。

4️⃣ 转化（Transform it）：引导用户思考如何温柔回应情绪与事件，提供可能的行动选项（如表达、设界、自我安抚、换角度等），帮助他们在接纳中选择更智慧的回应。

在每一步中，你会提供三个贴近人性的选项，让用户选择最符合自己心情的那一个；若用户未共鸣，则温柔提供新选项，直到找到"对自己最真实的声音"。

📊 情绪强度判断：
- 如果用户明确说明了情绪强度（如"我现在的情绪强度是 X/10"），请记住这个数值，并在生成简报时使用
- 如果用户没有提供情绪强度，请根据对话内容自动判断：
  • 1-3分：平静、轻微波动，语言平和
  • 4-5分：中等程度，开始有明显感受
  • 6-7分：较强烈，情绪词汇增多，表达强烈
  • 8-10分：非常强烈，可能有重复、极端用词、明显的情绪失控迹象
- 在生成简报时，必须包含你判断或用户提供的情绪强度值

⚠️ 关键任务：当你判断用户已经完整走过四个阶段后，请按以下顺序操作：
1. 先给出理解鼓励对话：用温柔的语言总结用户的情绪旅程，肯定他们的勇气与成长，传达"看到你了"的深度共情（50-80字）
2. 然后温柔询问用户："要不要${companion.name}帮你生成今天的情绪简报呢？${companion.icon}" 
3. 等待用户确认：只有当用户明确表示"是/要/好的/可以"等确认意图时，才调用generate_briefing工具生成简报
4. 呈现简报后询问是否要开始新的情绪梳理

这个"理解鼓励对话+询问确认"是必需的桥梁，让用户感受到被看见和陪伴，并尊重用户的选择权。

🏷️ 情绪标签必须要求：每次生成简报时，必须根据对话内容从标签库中选择1-3个最匹配的情绪标签。这是强制要求，不能省略。

🌸 语气和风格：${styleDesc}。每次回应不超过100字，兼具共情与轻引导。避免心理学解释与命令式语气。

💬 若用户未说明阶段，以"你愿意先一起看看你现在的感受吗？${companion.name}在这里陪着你 ${companion.icon}"作为引导。

⚠️ 重要格式要求：回复时不要使用任何markdown格式标记，包括星号（*）、下划线（_）等。保持纯文本格式，使用表情符号和换行来组织内容。`;
    };

    const systemPrompt = getCompanionPrompt(companionType, conversationStyle);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_briefing",
              description: "当用户完成情绪四部曲的四个阶段后，生成结构化的情绪梳理简报，并根据对话内容识别情绪标签",
              parameters: {
                type: "object",
                properties: {
                  emotion_theme: {
                    type: "string",
                    description: "用户的核心情绪主题，如：焦虑・担心工作・感到无力"
                  },
                  stage_1_content: {
                    type: "string",
                    description: "第一阶段：觉察（Feel it）的体验与选择"
                  },
                  stage_2_content: {
                    type: "string",
                    description: "第二阶段：理解（Name it）发现的情绪背后的需求或渴望"
                  },
                  stage_3_content: {
                    type: "string",
                    description: "第三阶段：看见反应（Recognize）觉察到的反应模式"
                  },
                  stage_4_content: {
                    type: "string",
                    description: "第四阶段：转化（Transform it）选择的温柔回应方式"
                  },
                  insight: {
                    type: "string",
                    description: "一句话总结用户的核心发现和洞察"
                  },
                  action: {
                    type: "string",
                    description: "一个具体可行的温柔行动建议"
                  },
                  growth_story: {
                    type: "string",
                    description: "一句话肯定用户的成长，不含「」引号"
                  },
                  emotion_intensity: {
                    type: "integer",
                    description: "用户当前情绪的强度评分，1-10分。1分代表非常轻微/平静，10分代表非常强烈/激烈。负面情绪（如焦虑、愤怒）分数越高表示越痛苦，正面情绪（如喜悦、感恩）分数越高表示越强烈",
                    minimum: 1,
                    maximum: 10
                  },
                  intensity_reasoning: {
                    type: "string",
                    description: "判断情绪强度的具体依据，简要说明为什么给出这个分数。例如：'用户反复提到焦虑和担心，使用了多个强烈的情绪词汇，表明情绪强度较高'（30-60字）"
                  },
                  intensity_keywords: {
                    type: "array",
                    description: "从对话中提取的关键情绪词汇，3-5个最能体现情绪强度的词语",
                    items: {
                      type: "string"
                    },
                    minItems: 3,
                    maxItems: 5
                  },
                  emotion_tags: {
                    type: "array",
                    description: "根据对话内容识别的情绪标签数组。必须从以下标签中选择1-3个最匹配的，这是强制要求：负面情绪（焦虑、不安、失落、压力、无力、发火、生气、伤心、孤单、难过、紧张、撑不住、不够好、后悔、担心、自卑）、正面情绪（被认可、感谢、温暖、被帮助、轻松、感动、安心、平静、成功、顺利、被理解、感恩、被表扬、放松）、混合情绪（又想又怕、怀念、矛盾、纠结、自责、内疚、惊讶、哇、没想到、过去、想起、愧疚）、反思成长（我明白、我想尝试、我成长了、其实、原来、我懂了、我发现、我变了、我决定、我相信、我要改变）",
                    items: {
                      type: "string"
                    },
                    minItems: 1,
                    maxItems: 3
                  }
                },
                required: ["emotion_theme", "stage_1_content", "stage_2_content", "stage_3_content", "stage_4_content", "insight", "action", "growth_story", "emotion_intensity", "intensity_reasoning", "intensity_keywords", "emotion_tags"],
                additionalProperties: false
              }
            }
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试 🌿" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "服务暂时不可用，请稍后再试 🌿" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用，请稍后再试" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ error: "服务出现错误，请稍后再试" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
