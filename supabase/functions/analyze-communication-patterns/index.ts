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

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { timeRange = '30d' } = await req.json();

    // 获取用户的沟通简报数据
    let dateFilter = new Date();
    if (timeRange === '7d') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === '30d') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    } else if (timeRange === '90d') {
      dateFilter.setDate(dateFilter.getDate() - 90);
    }

    const { data: briefings, error: briefingsError } = await supabase
      .from('communication_briefings')
      .select('*, conversations!inner(user_id)')
      .eq('conversations.user_id', user.id)
      .gte('created_at', dateFilter.toISOString())
      .order('created_at', { ascending: false });

    if (briefingsError) {
      throw briefingsError;
    }

    if (!briefings || briefings.length === 0) {
      return new Response(
        JSON.stringify({
          common_scenarios: [],
          difficult_patterns: [],
          successful_strategies: [],
          growth_areas: [],
          relationship_insights: '暂无足够数据进行分析',
          recommendations: ['继续记录沟通经历，积累更多数据后可获得个性化洞察']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 准备分析数据
    const analysisData = briefings.map(b => ({
      theme: b.communication_theme,
      scenario: b.scenario_type,
      target: b.target_type,
      difficulty: b.communication_difficulty,
      keywords: b.difficulty_keywords,
      strategy: b.strategy,
      completed: b.action_completed,
      rating: b.outcome_rating
    }));

    const systemPrompt = `你是劲老师，一位专业的沟通模式分析师。基于用户最近${timeRange === '7d' ? '7天' : timeRange === '30d' ? '30天' : '90天'}的${briefings.length}条沟通记录，进行深度分析。

## 分析维度
1. **常见沟通场景**：识别用户最常面对的3-5个沟通情境
2. **沟通难点模式**：发现反复出现的沟通障碍和挑战
3. **成功沟通策略**：总结有效的沟通方法和话术
4. **成长领域**：指出可以进一步提升的方向
5. **人际关系洞察**：分析用户与不同对象的沟通模式

## 分析要求
- 基于数据事实，避免空泛建议
- 看见用户的进步和努力
- 提供具体可操作的改进方向
- 语气温暖鼓励，像朋友对话

请以JSON格式返回分析结果。`;

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
            content: `请分析我的沟通模式。数据：${JSON.stringify(analysisData, null, 2)}` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_pattern_analysis",
            description: "生成沟通模式分析报告",
            parameters: {
              type: "object",
              properties: {
                common_scenarios: {
                  type: "array",
                  items: { type: "string" },
                  description: "常见沟通场景（3-5个），如'与上司讨论工作安排'、'与父母表达需求'等"
                },
                difficult_patterns: {
                  type: "array",
                  items: { type: "string" },
                  description: "沟通难点模式（3-5个），描述反复出现的挑战"
                },
                successful_strategies: {
                  type: "array",
                  items: { type: "string" },
                  description: "成功的沟通策略（3-5个），总结有效方法"
                },
                growth_areas: {
                  type: "array",
                  items: { type: "string" },
                  description: "成长领域（2-4个），指出提升方向"
                },
                relationship_insights: {
                  type: "string",
                  description: "人际关系洞察（100-200字），分析与不同对象的沟通特点"
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  description: "劲老师建议（3-5条），具体可执行的改进建议"
                }
              },
              required: [
                "common_scenarios",
                "difficult_patterns",
                "successful_strategies",
                "growth_areas",
                "relationship_insights",
                "recommendations"
              ]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_pattern_analysis" } }
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
      throw new Error('No analysis generated');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-communication-patterns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});