import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权访问，请先登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: '身份验证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Creating OpenAI Realtime session for Vibrant Life Coach...');

    // 有劲生活教练的人设 - 增强版四层对话
    const instructions = `你是有劲生活教练，名叫"劲老师"。你是一位温暖、智慧的心灵导师。

## 核心特质
- 温柔陪伴：用温暖、缓慢、有节奏的语气交流，如同一杯温热的茶
- 共情式教练：提问而非解释、接纳而非修复
- 简洁有力：每次回复2-3句，避免冗长说教

## 四层对话能力

### 1️⃣ 基本对话
用户可以问任何问题，你具备完整的大模型能力。
先共情，再给30秒可执行的小技巧（深呼吸、自我对话、身体感知等）。

### 2️⃣ 智能引导（调用 recommend_coach 或 recommend_tool）
根据对话识别用户需求：
- 情绪困扰、焦虑、压力 → 推荐情绪按钮 (emotion_button)
- 深层情绪需要梳理 → 推荐情绪教练 (emotion)
- 人际沟通、冲突、表达 → 推荐沟通教练 (communication)
- 亲子关系、孩子教育 → 推荐亲子教练 (parent)
- 想把经历变成故事 → 推荐故事教练 (story)
推荐时说明理由，告知用户可以点击界面链接进入。

### 3️⃣ 快速记录（调用 create_gratitude_entry）
识别感恩意图并自动记录：
- "感谢..."、"很庆幸..."、"值得纪念..."、"今天开心的是..."
记录后温柔确认："已帮你记录到感恩日记了 ✨"

### 4️⃣ 智能建议（调用 get_user_insights）
当用户询问状态分析或你认为需要时：
- "帮我分析最近状态" → 调用分析
- "我最近情绪怎么样" → 调用分析
基于返回的数据给出个性化建议。

## 回答风格
- 使用口语化中文
- 多用"你愿意..."、"我们可以一起..."
- 适时使用小表情 🌿💫🌸
- 情绪困扰时优先推荐情绪按钮

开场语："你好呀，我是劲老师～今天想聊点什么呢？无论是随便聊聊，还是有什么想记录的，我都在这里陪着你 🌿"`;

    // 定义工具
    const tools = [
      // 记录类工具
      {
        type: "function",
        name: "create_gratitude_entry",
        description: "当用户表达感恩、感谢、庆幸、幸运等正面情感时调用。触发词：感恩、感谢、庆幸、值得纪念、今天开心",
        parameters: {
          type: "object",
          properties: {
            content: { type: "string", description: "感恩的具体内容，完整提取用户表达" },
            category: { 
              type: "string", 
              enum: ["人际关系", "工作成就", "健康身体", "日常小事", "个人成长", "家庭亲情"],
              description: "感恩类别"
            }
          },
          required: ["content"]
        }
      },
      // 引导类工具
      {
        type: "function",
        name: "recommend_coach",
        description: "当识别到用户需要专业教练深入指导时调用",
        parameters: {
          type: "object",
          properties: {
            coach_type: { 
              type: "string", 
              enum: ["emotion", "parent", "communication", "story", "gratitude"],
              description: "推荐的教练类型"
            },
            reason: { type: "string", description: "推荐理由" }
          },
          required: ["coach_type", "reason"]
        }
      },
      {
        type: "function",
        name: "recommend_tool",
        description: "当用户需要即时工具支持时调用，特别是情绪困扰时优先推荐情绪按钮",
        parameters: {
          type: "object",
          properties: {
            tool_type: { 
              type: "string", 
              enum: ["emotion_button", "breathing", "meditation", "declaration_card"],
              description: "推荐的工具类型"
            },
            reason: { type: "string", description: "推荐理由" }
          },
          required: ["tool_type", "reason"]
        }
      },
      // 分析类工具
      {
        type: "function",
        name: "get_user_insights",
        description: "当用户询问自己最近的状态、模式、趋势，或你认为需要了解用户情况时调用",
        parameters: {
          type: "object",
          properties: {
            insight_type: { 
              type: "string", 
              enum: ["emotion_pattern", "gratitude_themes", "comprehensive"],
              description: "洞察类型：emotion_pattern=情绪模式，gratitude_themes=感恩主题，comprehensive=综合分析"
            }
          },
          required: ["insight_type"]
        }
      },
      {
        type: "function",
        name: "get_recent_briefings",
        description: "当需要回顾用户最近的教练对话历史和简报时调用",
        parameters: {
          type: "object",
          properties: {
            coach_type: { 
              type: "string", 
              enum: ["emotion", "parent", "communication", "all"],
              description: "要查看的教练类型"
            },
            days: { type: "number", description: "查看最近几天，默认7天" }
          }
        }
      },
      // 页面导航工具
      {
        type: "function",
        name: "navigate_to",
        description: "当用户想去某个功能页面时调用。触发词：去、打开、带我去、跳转到、进入、我想看",
        parameters: {
          type: "object",
          properties: {
            destination: {
              type: "string",
              enum: [
                "emotion_button",
                "emotion_coach",
                "parent_coach",
                "communication_coach",
                "story_coach",
                "gratitude_coach",
                "training_camp",
                "community",
                "packages",
                "meditation",
                "history",
                "profile"
              ],
              description: "目标页面：emotion_button=情绪按钮，emotion_coach=情绪教练，parent_coach=亲子教练，communication_coach=沟通教练，story_coach=故事教练，gratitude_coach=感恩教练，training_camp=训练营，community=社区，packages=套餐，meditation=冥想，history=历史记录，profile=个人中心"
            }
          },
          required: ["destination"]
        }
      },
      // 社区搜索工具
      {
        type: "function",
        name: "search_community_posts",
        description: "当用户想搜索社区帖子、看看别人的分享、找相关话题时调用。触发词：社区有人分享过、有没有人讨论、看看别人怎么说、搜索、找一找",
        parameters: {
          type: "object",
          properties: {
            keyword: { 
              type: "string", 
              description: "搜索关键词，如：焦虑、育儿、沟通、感恩等" 
            },
            post_type: { 
              type: "string", 
              enum: ["story", "briefing_share", "checkin", "all"],
              description: "帖子类型：story=故事，briefing_share=简报分享，checkin=打卡，all=全部" 
            },
            limit: { 
              type: "number", 
              description: "返回数量，默认3条" 
            }
          },
          required: ["keyword"]
        }
      },
      // 课程推荐工具
      {
        type: "function",
        name: "recommend_course",
        description: "当用户想学习某个主题、找课程、推荐视频、看教程时调用。触发词：推荐课程、学习、有什么视频、教程、想学",
        parameters: {
          type: "object",
          properties: {
            topic: { 
              type: "string", 
              description: "学习主题关键词，如：焦虑、沟通、领导力、情绪、亲子" 
            },
            limit: { 
              type: "number", 
              description: "推荐数量，默认3条" 
            }
          }
        }
      },
      // 训练营推荐工具
      {
        type: "function",
        name: "recommend_training_camp",
        description: "当用户想参加训练营、系统学习、21天挑战、找营时调用。触发词：训练营、系统学习、21天、营、挑战、想加入",
        parameters: {
          type: "object",
          properties: {
            goal: { 
              type: "string", 
              description: "用户目标，如：情绪管理、亲子关系、突破困境、成长" 
            }
          }
        }
      }
    ];

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "echo", // 男声
        instructions: instructions,
        tools: tools,
        tool_choice: "auto",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vibrant Life Coach realtime session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
