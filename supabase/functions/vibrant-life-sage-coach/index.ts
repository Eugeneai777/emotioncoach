import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('未提供认证信息');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('用户认证失败');
    }

    console.log(`🧘‍♀️ 有劲生活教练 - 用户: ${user.id}`);

    // 从数据库加载系统提示词
    const { data: templateData } = await supabase
      .from('coach_templates')
      .select('system_prompt')
      .eq('coach_key', 'vibrant_life_sage')
      .single();

    const systemPrompt = templateData?.system_prompt || `你是劲老师，一位温暖的生活教练。帮助用户探索问题、找到方向。`;

    // 定义推荐工具
    const tools = [
      {
        type: "function",
        function: {
          name: "coach_recommendation",
          description: "根据用户当前的主题和需求，推荐最适合的有劲生活馆专业教练。",
          parameters: {
            type: "object",
            properties: {
              user_issue_summary: {
                type: "string",
                description: "用户当前遇到的主要问题或困扰的简要总结。"
              },
              recommended_coach_key: {
                type: "string",
                enum: ["emotion", "parent", "communication"],
                description: "推荐的专业教练标识：emotion=情绪觉醒教练, parent=家长情绪教练, communication=卡内基沟通教练"
              },
              reasoning: {
                type: "string",
                description: "推荐该类型教练的简要理由，说明其如何帮助用户解决问题。"
              }
            },
            required: ["user_issue_summary", "recommended_coach_key", "reasoning"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "video_course_recommendation",
          description: "根据用户当前的话题，推荐相关的视频课程深入学习。",
          parameters: {
            type: "object",
            properties: {
              topic_summary: {
                type: "string",
                description: "用户关心的主题总结"
              },
              recommended_category: {
                type: "string",
                enum: ["领导力", "情绪管理", "沟通技巧", "亲子关系", "自我成长"],
                description: "推荐的视频类别"
              },
              learning_goal: {
                type: "string",
                description: "观看视频能达成的学习目标"
              }
            },
            required: ["topic_summary", "recommended_category", "learning_goal"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "tool_recommendation",
          description: "根据用户需求，推荐有劲生活馆能量工作室的实用工具。",
          parameters: {
            type: "object",
            properties: {
              user_need: {
                type: "string",
                description: "用户当前的需求或状态"
              },
              recommended_tool_id: {
                type: "string",
                enum: ["breathing", "meditation", "first-aid", "mindfulness", "gratitude", "values", "strengths", "vision", "habits", "energy", "sleep", "declaration"],
                description: "推荐的工具ID"
              },
              usage_reason: {
                type: "string",
                description: "为什么这个工具适合当前情况"
              }
            },
            required: ["user_need", "recommended_tool_id", "usage_reason"]
          }
        }
      }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error(`AI gateway error ${aiResponse.status}:`, errorBody);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请联系管理员充值。" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status} - ${errorBody}`);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('❌ 有劲生活教练错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
