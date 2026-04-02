import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token = authHeader.replace('Bearer ', '');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: '身份验证失败' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { transcript, duration_minutes } = await req.json();

    if (!transcript || transcript.length < 50) {
      return new Response(JSON.stringify({ error: '对话内容过短，无法生成简报' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[EmotionBriefing] User: ${user.id}, transcript: ${transcript.length} chars`);

    // Dedup check: skip if briefing exists in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentBriefings } = await adminClient
      .from('briefings')
      .select('id, conversation_id!inner(user_id)')
      .gte('created_at', fiveMinAgo)
      .limit(1);

    // Check via conversations table for user's recent briefings
    const { data: recentConvs } = await adminClient
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', fiveMinAgo)
      .limit(1);

    if (recentConvs && recentConvs.length > 0) {
      // Check if there's a briefing for this conversation
      const { data: existingBriefing } = await adminClient
        .from('briefings')
        .select('id')
        .eq('conversation_id', recentConvs[0].id)
        .limit(1);

      if (existingBriefing && existingBriefing.length > 0) {
        console.log('[EmotionBriefing] Skipping: briefing already exists within 5 min');
        return new Response(JSON.stringify({
          success: true,
          briefing_id: existingBriefing[0].id,
          skipped: true,
          message: '最近已有简报，跳过重复生成'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Step 1: Use AI to extract structured emotion data
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `你是一个情绪教练简报分析师。根据用户与情绪教练的语音对话记录，提取结构化的情绪简报数据。
请严格按照工具定义的格式输出。
- emotion_theme: 用一句简短的话概括今天的情绪主题（如"工作压力下的焦虑与自我怀疑"）
- emotion_tags: 识别出的情绪标签数组（如["焦虑","压力","疲惫"]），最多5个
- emotion_intensity: 情绪强度1-10，根据对话内容判断
- stage_1_content: 觉察阶段 - 用户最初表达了什么情绪/困扰
- stage_2_content: 理解阶段 - 情绪背后的原因和深层需求
- stage_3_content: 反应阶段 - 用户的应对方式和行为模式
- stage_4_content: 转化阶段 - 新的视角和可能的改变方向
- insight: 核心洞察，一句精炼的觉察总结
- action: 微行动建议，具体可执行的一小步
- growth_story: 成长寄语，温暖鼓励的话`
          },
          {
            role: 'user',
            content: `以下是一段${duration_minutes || '若干'}分钟的情绪教练语音对话记录，请提取结构化简报：\n\n${transcript}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_emotion_briefing',
            description: '创建结构化情绪简报',
            parameters: {
              type: 'object',
              properties: {
                emotion_theme: { type: 'string', description: '情绪主题' },
                emotion_tags: { type: 'array', items: { type: 'string' }, description: '情绪标签' },
                emotion_intensity: { type: 'number', description: '情绪强度1-10' },
                stage_1_content: { type: 'string', description: '觉察阶段内容' },
                stage_2_content: { type: 'string', description: '理解阶段内容' },
                stage_3_content: { type: 'string', description: '反应阶段内容' },
                stage_4_content: { type: 'string', description: '转化阶段内容' },
                insight: { type: 'string', description: '核心洞察' },
                action: { type: 'string', description: '微行动建议' },
                growth_story: { type: 'string', description: '成长寄语' },
              },
              required: ['emotion_theme', 'emotion_tags', 'emotion_intensity', 'stage_1_content', 'stage_2_content', 'stage_3_content', 'stage_4_content', 'insight', 'action', 'growth_story'],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_emotion_briefing' } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[EmotionBriefing] AI gateway error:', aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI服务繁忙，请稍后重试' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI额度不足，请联系管理员' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('[EmotionBriefing] No tool call in AI response:', JSON.stringify(aiResult));
      throw new Error('AI未返回结构化数据');
    }

    const briefingData = JSON.parse(toolCall.function.arguments);
    console.log('[EmotionBriefing] AI extracted:', {
      theme: briefingData.emotion_theme,
      tags: briefingData.emotion_tags,
      intensity: briefingData.emotion_intensity,
    });

    // Step 2: Save to database (replicating save-emotion-voice-briefing logic)
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // 2a. Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `语音情绪梳理：${briefingData.emotion_theme}`
      })
      .select()
      .single();

    if (convError) {
      console.error('[EmotionBriefing] Error creating conversation:', convError);
      throw convError;
    }

    // 2b. Create emotion_coaching_session
    const { error: sessionError } = await supabase
      .from('emotion_coaching_sessions')
      .insert({
        user_id: user.id,
        conversation_id: conversation.id,
        current_stage: 5,
        status: 'completed',
        stage_1_insight: briefingData.stage_1_content,
        stage_2_insight: briefingData.stage_2_content,
        stage_3_insight: briefingData.stage_3_content,
        stage_4_insight: briefingData.stage_4_content,
      });

    if (sessionError) {
      console.error('[EmotionBriefing] Error creating session:', sessionError);
      throw sessionError;
    }

    // 2c. Create briefing
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .insert({
        conversation_id: conversation.id,
        emotion_theme: briefingData.emotion_theme,
        emotion_intensity: briefingData.emotion_intensity || null,
        stage_1_content: briefingData.stage_1_content,
        stage_2_content: briefingData.stage_2_content,
        stage_3_content: briefingData.stage_3_content,
        stage_4_content: briefingData.stage_4_content,
        insight: briefingData.insight,
        action: briefingData.action,
        growth_story: briefingData.growth_story || null,
      })
      .select()
      .single();

    if (briefingError) {
      console.error('[EmotionBriefing] Error creating briefing:', briefingError);
      throw briefingError;
    }

    console.log('[EmotionBriefing] Created briefing:', briefing.id);

    // 2d. Handle emotion tags
    if (briefingData.emotion_tags && briefingData.emotion_tags.length > 0) {
      for (const tagName of briefingData.emotion_tags) {
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', user.id)
          .maybeSingle();

        let tagId = existingTag?.id;

        if (!tagId) {
          const { data: newTag, error: tagCreateError } = await supabase
            .from('tags')
            .insert({ name: tagName, user_id: user.id, color: getTagColor(tagName) })
            .select()
            .single();

          if (!tagCreateError && newTag) {
            tagId = newTag.id;
          }
        }

        if (tagId) {
          await supabase.from('briefing_tags').insert({
            briefing_id: briefing.id,
            tag_id: tagId,
          });
        }
      }
    }

    // 2e. Auto check-in for training camp
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
        .update({ check_in_dates: newCheckInDates, completed_days: newCheckInDates.length })
        .eq('id', activeCamp.id);
      console.log('[EmotionBriefing] Auto check-in for camp:', activeCamp.id);
    }

    return new Response(JSON.stringify({
      success: true,
      briefing_id: briefing.id,
      conversation_id: conversation.id,
      briefing_data: {
        emotion_theme: briefingData.emotion_theme,
        emotion_tags: briefingData.emotion_tags,
        emotion_intensity: briefingData.emotion_intensity,
        insight: briefingData.insight,
        action: briefingData.action,
        growth_story: briefingData.growth_story,
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[EmotionBriefing] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function getTagColor(tagName: string): string {
  const colorMap: Record<string, string> = {
    '焦虑': '#EF4444', '愤怒': '#DC2626', '恐惧': '#F97316',
    '悲伤': '#3B82F6', '失落': '#6366F1', '委屈': '#EC4899',
    '压力': '#F59E0B', '疲惫': '#8B5CF6', '无力': '#64748B',
    '平静': '#10B981', '喜悦': '#22C55E', '感恩': '#14B8A6',
    '希望': '#06B6D4', '释然': '#0EA5E9', '成长': '#84CC16',
  };
  return colorMap[tagName] || '#6B7280';
}
