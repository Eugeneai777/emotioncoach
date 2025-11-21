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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { goalId, currentProgress } = await req.json();

    console.log(`Generating coach advice for goal ${goalId}`);

    // 获取目标详情
    const { data: goal, error: goalError } = await supabase
      .from('emotion_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalError) throw goalError;

    if (!goal.target_tag_id) {
      throw new Error('This is not a tag goal');
    }

    // 获取标签信息
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', goal.target_tag_id)
      .single();

    if (tagError) throw tagError;

    // 获取最近的briefings，包含该标签的
    const { data: recentBriefings, error: briefingsError } = await supabase
      .from('briefing_tags')
      .select(`
        briefing_id,
        briefings!inner(
          id,
          created_at,
          emotion_theme,
          emotion_intensity,
          insight,
          action,
          stage_1_content,
          stage_2_content,
          conversations!inner(user_id)
        )
      `)
      .eq('tag_id', goal.target_tag_id)
      .eq('briefings.conversations.user_id', user.id)
      .order('briefings.created_at', { ascending: false })
      .limit(5);

    if (briefingsError) throw briefingsError;

    // 获取标签的其他关联分析（哪些标签经常一起出现）
    const { data: allBriefingTags, error: allTagsError } = await supabase
      .from('briefing_tags')
      .select(`
        briefing_id,
        tag_id,
        tags!inner(name, sentiment)
      `)
      .in('briefing_id', (recentBriefings || []).map((bt: any) => bt.briefing_id));

    if (allTagsError) throw allTagsError;

    // 分析关联标签
    const coOccurringTags: Record<string, number> = {};
    const briefingTagMap: Record<string, any[]> = {};
    
    (allBriefingTags || []).forEach((bt: any) => {
      if (!briefingTagMap[bt.briefing_id]) {
        briefingTagMap[bt.briefing_id] = [];
      }
      briefingTagMap[bt.briefing_id].push(bt);
    });

    Object.values(briefingTagMap).forEach((tags: any[]) => {
      const hasTargetTag = tags.some(t => t.tag_id === goal.target_tag_id);
      if (hasTargetTag) {
        tags.forEach(t => {
          if (t.tag_id !== goal.target_tag_id) {
            coOccurringTags[t.tags.name] = (coOccurringTags[t.tags.name] || 0) + 1;
          }
        });
      }
    });

    const topCoOccurring = Object.entries(coOccurringTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 构建AI提示词
    const systemPrompt = `你是一位专业的情绪管理教练，擅长帮助用户通过标签追踪来改善情绪健康。你的建议应该：
1. 基于数据分析提供具体可行的策略
2. 鼓励而非批评，关注进步而非完美
3. 提供3-5条个性化建议
4. 每条建议包括：具体行动、预期效果、实施难度

返回JSON格式：
{
  "status_message": "简短的状态评价（1句话）",
  "encouragement": "鼓励的话语",
  "strategies": [
    {
      "title": "策略标题",
      "description": "具体做法",
      "expected_benefit": "预期效果",
      "difficulty": "easy" | "medium" | "hard",
      "category": "awareness" | "action" | "prevention" | "substitute"
    }
  ],
  "pattern_insights": "关于标签关联模式的洞察",
  "next_milestone": "下一个里程碑"
}`;

    const userPrompt = `
用户目标：${goal.goal_category === 'tag_reduction' ? '减少' : '增加'}"${tag.name}"标签使用
目标：每周${goal.goal_category === 'tag_reduction' ? '不超过' : '至少'}${goal.target_count}次
当前进度：本周${currentProgress.currentWeeklyCount}次（${currentProgress.percentage}%完成）
状态：${currentProgress.status}

最近5次相关记录：
${(recentBriefings || []).map((bt: any, i: number) => `
${i + 1}. ${new Date(bt.briefings.created_at).toLocaleDateString('zh-CN')}
   情绪主题：${bt.briefings.emotion_theme}
   强度：${bt.briefings.emotion_intensity || '未记录'}/10
   洞察：${bt.briefings.insight || '无'}
   行动：${bt.briefings.action || '无'}
`).join('\n')}

关联标签分析：
"${tag.name}"经常与以下标签一起出现：
${topCoOccurring.map(t => `- ${t.name}（出现${t.count}次）`).join('\n')}

周趋势：
${currentProgress.weeklyData.map((w: any) => 
  `${w.weekLabel}: ${w.count}次 ${w.status === 'success' ? '✓' : w.status === 'warning' ? '△' : '✗'}`
).join('\n')}

请分析用户的情绪模式，提供个性化的应对策略。
`;

    console.log('Calling AI for coaching advice...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let coaching;
    try {
      coaching = JSON.parse(content);
    } catch (parseError) {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        coaching = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // 添加关联标签信息
    coaching.co_occurring_tags = topCoOccurring;

    console.log('Coach advice generated successfully');

    return new Response(
      JSON.stringify(coaching),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tag-goal-coach:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
