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

    const { startDate, endDate } = await req.json();

    console.log(`Generating weekly report for user ${user.id} from ${startDate} to ${endDate}`);

    // 获取该周期内的所有标签使用数据
    const { data: briefingTags, error: btError } = await supabase
      .from('briefing_tags')
      .select(`
        tag_id,
        briefing_id,
        tags!inner(name, color, sentiment),
        briefings!inner(
          created_at,
          emotion_theme,
          emotion_intensity,
          insight,
          conversations!inner(user_id)
        )
      `)
      .gte('briefings.created_at', startDate)
      .lte('briefings.created_at', endDate)
      .eq('briefings.conversations.user_id', user.id);

    if (btError) throw btError;

    // 统计标签使用情况
    const tagStats: Record<string, any> = {};
    const intensityByDay: Record<string, number[]> = {};

    (briefingTags || []).forEach((bt: any) => {
      const tagName = bt.tags.name;
      const date = new Date(bt.briefings.created_at).toLocaleDateString('zh-CN');

      if (!tagStats[tagName]) {
        tagStats[tagName] = {
          name: tagName,
          color: bt.tags.color,
          sentiment: bt.tags.sentiment,
          count: 0,
          intensities: [],
          themes: [],
        };
      }

      tagStats[tagName].count++;
      if (bt.briefings.emotion_intensity) {
        tagStats[tagName].intensities.push(bt.briefings.emotion_intensity);
      }
      if (bt.briefings.emotion_theme) {
        tagStats[tagName].themes.push(bt.briefings.emotion_theme);
      }

      // 按日统计强度
      if (!intensityByDay[date]) {
        intensityByDay[date] = [];
      }
      if (bt.briefings.emotion_intensity) {
        intensityByDay[date].push(bt.briefings.emotion_intensity);
      }
    });

    // 计算统计指标
    const tagSummaries = Object.values(tagStats).map((tag: any) => ({
      name: tag.name,
      color: tag.color,
      sentiment: tag.sentiment,
      count: tag.count,
      avgIntensity: tag.intensities.length > 0
        ? tag.intensities.reduce((sum: number, val: number) => sum + val, 0) / tag.intensities.length
        : null,
      topThemes: [...new Set(tag.themes)].slice(0, 3),
    }));

    // 按使用次数排序
    tagSummaries.sort((a, b) => b.count - a.count);

    // 按日统计平均强度
    const dailyIntensities = Object.entries(intensityByDay).map(([date, values]) => ({
      date,
      avgIntensity: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length,
    }));

    dailyIntensities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 获取用户档案
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // 使用AI生成周报洞察
    const systemPrompt = `你是一位专业的情绪分析师，需要为用户生成本周的情绪报告。报告应该：
1. 总结本周的整体情绪状态
2. 识别主要的情绪模式和趋势
3. 提供3-5条具体的建议
4. 语气温暖、鼓励，关注成长

返回JSON格式：
{
  "summary": "本周情绪总结（2-3句话）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "concerns": ["需要关注的点1", "需要关注的点2"],
  "recommendations": [
    {
      "title": "建议标题",
      "description": "具体建议内容"
    }
  ],
  "outlook": "下周展望（1-2句话）"
}`;

    const userPrompt = `
时间范围：${startDate} 至 ${endDate}

标签使用统计：
${tagSummaries.map(t => `- ${t.name}（${t.sentiment}）：${t.count}次${t.avgIntensity ? `，平均强度${t.avgIntensity.toFixed(1)}` : ''}`).join('\n')}

每日情绪强度：
${dailyIntensities.map(d => `${d.date}：${d.avgIntensity.toFixed(1)}/10 (${d.count}次记录)`).join('\n')}

高频情绪主题：
${tagSummaries.slice(0, 5).map(t => `${t.name}: ${t.topThemes.join(', ')}`).join('\n')}

请生成本周情绪报告。
`;

    console.log('Calling AI for weekly insights...');

    // 扣费
    try {
      await fetch(`${supabaseUrl}/functions/v1/deduct-quota`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_key: 'tag_report',
          source: 'generate_tag_report',
          metadata: { startDate, endDate }
        })
      });
      console.log(`✅ 标签报告扣费成功`);
    } catch (e) {
      console.error('扣费失败:', e);
    }

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
      console.error('AI API error:', response.status);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let insights;
    try {
      insights = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI insights');
      }
    }

    console.log('Weekly report generated successfully');

    return new Response(
      JSON.stringify({
        period: { startDate, endDate },
        userName: profile?.display_name || '用户',
        tagSummaries,
        dailyIntensities,
        insights,
        totalRecords: briefingTags?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-tag-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
