import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`);
    }

    const { period = 'week' } = await req.json();

    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data: briefings, error: briefingsError } = await supabase
      .from('communication_briefings')
      .select('*, conversations!inner(user_id)')
      .eq('conversations.user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (briefingsError) {
      throw briefingsError;
    }

    if (!briefings || briefings.length === 0) {
      return new Response(
        JSON.stringify({
          summary: `本${period === 'week' ? '周' : '月'}暂无沟通记录`,
          total_count: 0,
          avg_difficulty: 0,
          scenarios: {},
          improvements: [],
          challenges: [],
          encouragement: '开始记录你的沟通经历吧！'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stats = {
      total: briefings.length,
      avgDifficulty: briefings.reduce((sum, b) => sum + (b.communication_difficulty || 0), 0) / briefings.length,
      scenarios: briefings.reduce((acc, b) => {
        acc[b.scenario_type] = (acc[b.scenario_type] || 0) + 1;
        return acc;
      }, {}),
      completed: briefings.filter(b => b.action_completed).length,
      ratings: briefings.filter(b => b.outcome_rating).map(b => b.outcome_rating)
    };

    const systemPrompt = `你是劲老师，为用户生成${period === 'week' ? '周' : '月'}度沟通复盘报告。

## 报告内容
1. **整体总结**：本周期沟通表现概述
2. **数据洞察**：次数、场景分布、平均难度
3. **成长亮点**：进步和突破
4. **待改进点**：反复出现的挑战
5. **下周期建议**：具体可行的改进方向
6. **鼓励语**：温暖的肯定和激励

语气温暖、具体、鼓励。`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `请生成我的${period === 'week' ? '周' : '月'}度沟通复盘。数据：${JSON.stringify(stats, null, 2)}

沟通记录：
${briefings.slice(0, 10).map(b => `- ${b.communication_theme} (难度${b.communication_difficulty}, ${b.scenario_type})`).join('\n')}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_review",
            description: "生成沟通复盘报告",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "整体总结（100-150字）"
                },
                total_count: {
                  type: "integer",
                  description: "沟通记录总数"
                },
                avg_difficulty: {
                  type: "number",
                  description: "平均沟通难度"
                },
                scenarios: {
                  type: "object",
                  description: "场景分布统计"
                },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                  description: "成长亮点（3-5条）"
                },
                challenges: {
                  type: "array",
                  items: { type: "string" },
                  description: "待改进点（2-4条）"
                },
                next_steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "下周期建议（3-4条）"
                },
                encouragement: {
                  type: "string",
                  description: "劲老师的鼓励（50-80字）"
                }
              },
              required: [
                "summary",
                "total_count",
                "avg_difficulty",
                "scenarios",
                "improvements",
                "challenges",
                "next_steps",
                "encouragement"
              ]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_review" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No review generated');
    }

    const review = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(review),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-communication-review:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});