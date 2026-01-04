import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { 
      user_id,
      assessment_result 
    } = await req.json();

    if (!user_id || !assessment_result) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract profile data from assessment result
    const {
      health_score,
      reaction_pattern,
      dominant_level,
      top_poor,
      top_emotion,
      top_belief,
      assessment_id,
    } = assessment_result;

    // Build coach strategy based on reaction pattern
    const coachStrategies: Record<string, any> = {
      chase: {
        tone: '放慢节奏，帮助用户觉察急切',
        focus: '校准行为节奏，减少用力过猛',
        keyQuestion: '你现在感受到多少「急」或「焦」？',
        avoidance: '避免给出太多行动建议，先稳定情绪',
        description: '追逐模式 - 行动很多但效果不明显'
      },
      avoid: {
        tone: '温暖接纳，建立安全感',
        focus: '渐进式暴露，降低门槛',
        keyQuestion: '这个想法让你有多不舒服？',
        avoidance: '避免推动太快，尊重边界',
        description: '回避模式 - 对金钱话题有抗拒'
      },
      trauma: {
        tone: '极度温柔，提供结构化容器',
        focus: '神经系统调节，陪伴式支持',
        keyQuestion: '你现在身体有什么感觉？',
        avoidance: '避免直接触碰创伤，先稳定',
        description: '创伤模式 - 有较深的金钱创伤'
      },
      harmony: {
        tone: '轻松对话，巩固状态',
        focus: '价值放大，复制成功模式',
        keyQuestion: '今天有什么值得庆祝的？',
        avoidance: '避免过度分析，保持流动',
        description: '和谐模式 - 与金钱关系较健康'
      }
    };

    const coachStrategy = coachStrategies[reaction_pattern] || coachStrategies.harmony;

    // Upsert user wealth profile
    const { data: profile, error: upsertError } = await supabaseClient
      .from('user_wealth_profile')
      .upsert({
        user_id,
        assessment_id: assessment_id || null,
        reaction_pattern: reaction_pattern || 'harmony',
        dominant_poor: top_poor || null,
        dominant_emotion: top_emotion || null,
        dominant_belief: top_belief || null,
        health_score: health_score || 50,
        coach_strategy: coachStrategy,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to sync wealth profile:', upsertError);
      throw upsertError;
    }

    console.log('✅ 用户财富画像同步成功:', profile.id);

    return new Response(JSON.stringify({
      success: true,
      profile,
      coach_strategy: coachStrategy,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error syncing wealth profile:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
