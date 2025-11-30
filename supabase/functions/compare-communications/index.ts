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
      throw new Error('Unauthorized');
    }

    const { briefingId1, briefingId2 } = await req.json();

    if (!briefingId1 || !briefingId2) {
      throw new Error('Both briefing IDs are required');
    }

    // 获取两个简报的详细数据
    const { data: briefings, error: briefingsError } = await supabase
      .from('communication_briefings')
      .select('*, conversations!inner(user_id)')
      .in('id', [briefingId1, briefingId2])
      .eq('conversations.user_id', user.id);

    if (briefingsError || !briefings || briefings.length !== 2) {
      throw new Error('Failed to fetch briefings');
    }

    const [briefing1, briefing2] = briefings.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const systemPrompt = `你是劲老师，帮助用户对比分析两次沟通经历，看见成长变化。

## 对比分析重点
1. **沟通方式的演变**：话术、策略、应对方式的改进
2. **难度处理能力**：面对相似挑战时的表现变化
3. **视角转换**：理解他人的深度变化
4. **行动执行**：从想法到实践的进步
5. **成长亮点**：值得鼓励和肯定的进步

## 分析原则
- 聚焦进步，而非批评不足
- 具体举例，避免空泛
- 鼓励持续成长
- 语气温暖友好`;

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
            content: `请对比分析我的两次沟通：
            
第一次（${new Date(briefing1.created_at).toLocaleDateString()}）：
${JSON.stringify({
  theme: briefing1.communication_theme,
  scenario: briefing1.scenario_type,
  difficulty: briefing1.communication_difficulty,
  strategy: briefing1.strategy,
  keywords: briefing1.difficulty_keywords
}, null, 2)}

第二次（${new Date(briefing2.created_at).toLocaleDateString()}）：
${JSON.stringify({
  theme: briefing2.communication_theme,
  scenario: briefing2.scenario_type,
  difficulty: briefing2.communication_difficulty,
  strategy: briefing2.strategy,
  keywords: briefing2.difficulty_keywords
}, null, 2)}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_comparison",
            description: "生成沟通对比分析",
            parameters: {
              type: "object",
              properties: {
                evolution_summary: {
                  type: "string",
                  description: "沟通方式演变总结（100-150字）"
                },
                difficulty_handling: {
                  type: "string",
                  description: "难度处理能力分析（80-120字）"
                },
                perspective_growth: {
                  type: "string",
                  description: "视角转换的成长（80-120字）"
                },
                action_progress: {
                  type: "string",
                  description: "行动执行的进步（80-120字）"
                },
                growth_highlights: {
                  type: "array",
                  items: { type: "string" },
                  description: "成长亮点（3-5条具体例子）"
                },
                encouragement: {
                  type: "string",
                  description: "劲老师的鼓励（50-80字）"
                }
              },
              required: [
                "evolution_summary",
                "difficulty_handling",
                "perspective_growth",
                "action_progress",
                "growth_highlights",
                "encouragement"
              ]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_comparison" } }
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
      throw new Error('No comparison generated');
    }

    const comparison = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...comparison,
        briefing1: {
          id: briefing1.id,
          theme: briefing1.communication_theme,
          date: briefing1.created_at
        },
        briefing2: {
          id: briefing2.id,
          theme: briefing2.communication_theme,
          date: briefing2.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compare-communications:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});