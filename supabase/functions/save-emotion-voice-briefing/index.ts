import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

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
      return new Response(
        JSON.stringify({ error: '未授权访问' }),
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
        JSON.stringify({ error: '身份验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      emotion_theme,
      emotion_tags,
      stage_1_content,
      stage_2_content,
      stage_3_content,
      stage_4_content,
      insight,
      action,
      emotion_intensity,
      growth_story
    } = body;

    console.log('Saving emotion voice briefing for user:', user.id);
    console.log('Briefing data:', { emotion_theme, emotion_tags, emotion_intensity });

    // 1. 创建 conversation 记录
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `语音情绪梳理：${emotion_theme}`
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      throw convError;
    }

    console.log('Created conversation:', conversation.id);

    // 2. 创建 emotion_coaching_session 记录
    const { data: session, error: sessionError } = await supabase
      .from('emotion_coaching_sessions')
      .insert({
        user_id: user.id,
        conversation_id: conversation.id,
        current_stage: 5,
        status: 'completed',
        stage_1_insight: stage_1_content,
        stage_2_insight: stage_2_content,
        stage_3_insight: stage_3_content,
        stage_4_insight: stage_4_content
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }

    console.log('Created session:', session.id);

    // 3. 创建 briefing 记录
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .insert({
        conversation_id: conversation.id,
        emotion_theme: emotion_theme,
        emotion_intensity: emotion_intensity || null,
        stage_1_content: stage_1_content,
        stage_2_content: stage_2_content,
        stage_3_content: stage_3_content,
        stage_4_content: stage_4_content,
        insight: insight,
        action: action,
        growth_story: growth_story || null
      })
      .select()
      .single();

    if (briefingError) {
      console.error('Error creating briefing:', briefingError);
      throw briefingError;
    }

    console.log('Created briefing:', briefing.id);

    // 4. 处理情绪标签
    if (emotion_tags && emotion_tags.length > 0) {
      for (const tagName of emotion_tags) {
        // 查找或创建标签
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', user.id)
          .maybeSingle();

        let tagId = existingTag?.id;

        if (!tagId) {
          // 创建新标签
          const { data: newTag, error: tagCreateError } = await supabase
            .from('tags')
            .insert({
              name: tagName,
              user_id: user.id,
              color: getTagColor(tagName)
            })
            .select()
            .single();

          if (!tagCreateError && newTag) {
            tagId = newTag.id;
          }
        }

        // 关联标签到简报
        if (tagId) {
          await supabase
            .from('briefing_tags')
            .insert({
              briefing_id: briefing.id,
              tag_id: tagId
            })
            .select();
        }
      }
    }

    // 5. 检查是否有活跃的训练营，自动打卡
    const today = new Date().toISOString().split('T')[0];
    const { data: activeCamp } = await supabase
      .from('training_camps')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('camp_type', 'emotion_journal_21')
      .maybeSingle();

    if (activeCamp && !activeCamp.check_in_dates?.includes(today)) {
      const newCheckInDates = [...(activeCamp.check_in_dates || []), today];
      
      await supabase
        .from('training_camps')
        .update({
          check_in_dates: newCheckInDates,
          completed_days: newCheckInDates.length
        })
        .eq('id', activeCamp.id);

      console.log('Auto check-in for training camp:', activeCamp.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        briefing_id: briefing.id,
        conversation_id: conversation.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error saving emotion voice briefing:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 根据标签名称返回颜色
function getTagColor(tagName: string): string {
  const colorMap: Record<string, string> = {
    // 负面情绪 - 暖色系
    '焦虑': '#EF4444',
    '愤怒': '#DC2626',
    '恐惧': '#F97316',
    '悲伤': '#3B82F6',
    '失落': '#6366F1',
    '委屈': '#EC4899',
    '压力': '#F59E0B',
    '疲惫': '#8B5CF6',
    '无力': '#64748B',
    // 正面情绪 - 冷色系
    '平静': '#10B981',
    '喜悦': '#22C55E',
    '感恩': '#14B8A6',
    '希望': '#06B6D4',
    '释然': '#0EA5E9',
    '成长': '#84CC16'
  };
  
  return colorMap[tagName] || '#6B7280';
}
