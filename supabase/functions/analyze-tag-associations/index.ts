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

    const { minOccurrences = 3 } = await req.json();

    console.log(`Analyzing tag associations for user ${user.id}`);

    // 获取用户所有标签
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id);

    if (tagsError) throw tagsError;

    if (!tags || tags.length === 0) {
      return new Response(
        JSON.stringify({ associations: [], patterns: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取所有briefing_tags关联
    const { data: briefingTags, error: btError } = await supabase
      .from('briefing_tags')
      .select(`
        briefing_id,
        tag_id,
        briefings!inner(
          created_at,
          emotion_intensity,
          conversations!inner(user_id)
        )
      `)
      .eq('briefings.conversations.user_id', user.id);

    if (btError) throw btError;

    // 按briefing分组
    const briefingTagMap: Record<string, any[]> = {};
    (briefingTags || []).forEach((bt: any) => {
      if (!briefingTagMap[bt.briefing_id]) {
        briefingTagMap[bt.briefing_id] = [];
      }
      briefingTagMap[bt.briefing_id].push(bt);
    });

    // 计算标签共现矩阵
    const coOccurrenceMatrix: Record<string, Record<string, number>> = {};
    const associationDetails: Record<string, any> = {};

    Object.values(briefingTagMap).forEach((tagList: any[]) => {
      if (tagList.length < 2) return; // 需要至少2个标签才能形成关联

      const intensity = tagList[0].briefings.emotion_intensity;
      
      // 遍历所有标签对
      for (let i = 0; i < tagList.length; i++) {
        for (let j = i + 1; j < tagList.length; j++) {
          const tag1 = tagList[i].tag_id;
          const tag2 = tagList[j].tag_id;
          
          // 确保按字典序排列，避免重复
          const [first, second] = tag1 < tag2 ? [tag1, tag2] : [tag2, tag1];
          const key = `${first}:${second}`;

          if (!coOccurrenceMatrix[first]) {
            coOccurrenceMatrix[first] = {};
          }
          coOccurrenceMatrix[first][second] = (coOccurrenceMatrix[first][second] || 0) + 1;

          // 记录详细信息
          if (!associationDetails[key]) {
            associationDetails[key] = {
              count: 0,
              intensities: [],
              dates: [],
            };
          }
          associationDetails[key].count++;
          if (intensity) {
            associationDetails[key].intensities.push(intensity);
          }
          associationDetails[key].dates.push(tagList[0].briefings.created_at);
        }
      }
    });

    // 构建关联数组
    const associations = [];
    const tagMap = new Map(tags.map(t => [t.id, t]));

    for (const [tag1Id, pairs] of Object.entries(coOccurrenceMatrix)) {
      for (const [tag2Id, count] of Object.entries(pairs)) {
        if (count < minOccurrences) continue;

        const tag1 = tagMap.get(tag1Id);
        const tag2 = tagMap.get(tag2Id);
        
        if (!tag1 || !tag2) continue;

        const key = `${tag1Id}:${tag2Id}`;
        const details = associationDetails[key];
        const avgIntensity = details.intensities.length > 0
          ? details.intensities.reduce((sum: number, val: number) => sum + val, 0) / details.intensities.length
          : null;

        associations.push({
          tag1: {
            id: tag1.id,
            name: tag1.name,
            color: tag1.color,
            sentiment: tag1.sentiment,
          },
          tag2: {
            id: tag2.id,
            name: tag2.name,
            color: tag2.color,
            sentiment: tag2.sentiment,
          },
          count,
          avgIntensity: avgIntensity ? Math.round(avgIntensity * 10) / 10 : null,
          strength: count / Object.keys(briefingTagMap).length, // 关联强度（占比）
          lastOccurrence: details.dates[details.dates.length - 1],
        });
      }
    }

    // 按出现次数排序
    associations.sort((a, b) => b.count - a.count);

    // 识别模式
    const patterns = identifyPatterns(associations, tags);

    console.log(`Found ${associations.length} tag associations`);

    return new Response(
      JSON.stringify({ associations, patterns }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-tag-associations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function identifyPatterns(associations: any[], tags: any[]) {
  const patterns = [];

  // 模式1：负面标签集群（多个负面标签经常一起出现）
  const negativeAssociations = associations.filter(a => 
    a.tag1.sentiment === 'negative' && a.tag2.sentiment === 'negative'
  );
  if (negativeAssociations.length >= 2) {
    patterns.push({
      type: 'negative_cluster',
      title: '负面情绪集群',
      description: '以下负面标签经常一起出现，可能存在关联触发因素',
      associations: negativeAssociations.slice(0, 3),
      severity: 'high',
      icon: '⚠️',
    });
  }

  // 模式2：正负对冲（正面和负面标签共现）
  const mixedAssociations = associations.filter(a =>
    (a.tag1.sentiment === 'positive' && a.tag2.sentiment === 'negative') ||
    (a.tag1.sentiment === 'negative' && a.tag2.sentiment === 'positive')
  );
  if (mixedAssociations.length > 0) {
    patterns.push({
      type: 'mixed_emotions',
      title: '复杂情绪模式',
      description: '正面和负面情绪同时出现，说明你在某些情境下体验到矛盾的感受',
      associations: mixedAssociations.slice(0, 3),
      severity: 'medium',
      icon: '🔄',
    });
  }

  // 模式3：高强度关联（某些标签几乎总是一起出现）
  const strongAssociations = associations.filter(a => a.strength > 0.7);
  if (strongAssociations.length > 0) {
    patterns.push({
      type: 'strong_correlation',
      title: '强关联模式',
      description: '这些标签几乎总是一起出现，可能代表一种固定的情绪反应模式',
      associations: strongAssociations.slice(0, 3),
      severity: 'medium',
      icon: '🔗',
    });
  }

  // 模式4：成长指标（正面标签间的关联）
  const positiveAssociations = associations.filter(a =>
    a.tag1.sentiment === 'positive' && a.tag2.sentiment === 'positive'
  );
  if (positiveAssociations.length > 0) {
    patterns.push({
      type: 'positive_cluster',
      title: '积极成长模式',
      description: '这些正面标签经常一起出现，说明你在某些方面建立了良性循环',
      associations: positiveAssociations.slice(0, 3),
      severity: 'low',
      icon: '✨',
    });
  }

  return patterns;
}
