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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { weeks = 4 } = await req.json();

    console.log(`Analyzing tag trends for user ${user.id}, ${weeks} weeks`);

    // 扣费
    try {
      await fetch(`${supabaseUrl}/functions/v1/deduct-quota`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_key: 'tag_trend_analysis',
          source: 'analyze_tag_trends',
        })
      });
      console.log(`✅ 标签趋势分析扣费成功`);
    } catch (e) {
      console.error('扣费失败:', e);
    }

    // 获取用户的所有标签
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id);

    if (tagsError) throw tagsError;

    if (!tags || tags.length === 0) {
      return new Response(
        JSON.stringify({ trends: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const weeklyData = [];

    // 分析每周数据
    for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (weekOffset * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      weeklyData.push({
        weekNumber: weeks - weekOffset,
        weekLabel: weekOffset === 0 ? '本周' : `${weekOffset}周前`,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });
    }

    // 为每个标签计算趋势
    const trends = [];

    for (const tag of tags) {
      const weeklyUsage = [];

      for (const week of weeklyData) {
        // 获取该周使用该标签的briefing数量
        const { data: briefingTags, error: btError } = await supabase
          .from('briefing_tags')
          .select(`
            briefing_id,
            briefings!inner(
              created_at,
              emotion_intensity,
              conversation_id,
              conversations!inner(user_id)
            )
          `)
          .eq('tag_id', tag.id)
          .gte('briefings.created_at', week.startDate)
          .lt('briefings.created_at', week.endDate)
          .eq('briefings.conversations.user_id', user.id);

        if (btError) {
          console.error(`Error fetching briefing tags for tag ${tag.id}:`, btError);
          weeklyUsage.push({ count: 0, avgIntensity: 0 });
          continue;
        }

        const count = briefingTags?.length || 0;
        const intensities = briefingTags?.map((bt: any) => bt.briefings?.emotion_intensity).filter(Boolean) || [];
        const avgIntensity = intensities.length > 0 
          ? intensities.reduce((sum: number, val: number) => sum + val, 0) / intensities.length 
          : 0;

        weeklyUsage.push({
          weekNumber: week.weekNumber,
          weekLabel: week.weekLabel,
          count,
          avgIntensity: Math.round(avgIntensity * 10) / 10,
        });
      }

      // 计算趋势指标
      const recentWeek = weeklyUsage[0]; // 本周
      const previousWeek = weeklyUsage[1]; // 上周
      const firstWeek = weeklyUsage[weeklyUsage.length - 1]; // 第一周

      const weeklyAvg = weeklyUsage.reduce((sum, w) => sum + w.count, 0) / weeklyUsage.length;
      const changeFromPrevious = previousWeek 
        ? ((recentWeek.count - previousWeek.count) / Math.max(previousWeek.count, 1)) * 100 
        : 0;
      const changeFromFirst = firstWeek 
        ? ((recentWeek.count - firstWeek.count) / Math.max(firstWeek.count, 1)) * 100 
        : 0;

      // 计算优先级分数
      const frequencyScore = (recentWeek.count / 7) * 100;
      const trendScore = changeFromPrevious;
      const intensityScore = recentWeek.avgIntensity * 10;
      
      const priority = 
        frequencyScore * 0.4 + 
        Math.abs(trendScore) * 0.4 + 
        intensityScore * 0.2;

      trends.push({
        tagId: tag.id,
        tagName: tag.name,
        sentiment: tag.sentiment,
        weeklyUsage,
        currentWeekCount: recentWeek.count,
        weeklyAvg: Math.round(weeklyAvg * 10) / 10,
        changeFromPrevious: Math.round(changeFromPrevious * 10) / 10,
        changeFromFirst: Math.round(changeFromFirst * 10) / 10,
        avgIntensity: recentWeek.avgIntensity,
        priority: Math.round(priority * 10) / 10,
      });
    }

    // 按优先级排序
    trends.sort((a, b) => b.priority - a.priority);

    console.log(`Analyzed ${trends.length} tag trends`);

    return new Response(
      JSON.stringify({ trends }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-tag-trends:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
