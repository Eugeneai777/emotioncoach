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
    const { camp_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get camp info
    const { data: camp } = await supabaseClient
      .from('training_camps')
      .select('start_date, completed_days')
      .eq('id', camp_id)
      .eq('user_id', user.id)
      .single();

    if (!camp) {
      return new Response(JSON.stringify({ error: 'Camp not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate current week
    const weekNumber = Math.ceil((camp.completed_days || 1) / 7);

    // Get recent journal entries (last 7 days)
    const { data: entries } = await supabaseClient
      .from('wealth_journal_entries')
      .select('behavior_score, emotion_score, belief_score, action_completed_at, action_difficulty')
      .eq('camp_id', camp_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    // Get user's wealth profile
    const { data: wealthProfile } = await serviceClient
      .from('user_wealth_profile')
      .select('health_score, reaction_pattern')
      .eq('user_id', user.id)
      .single();

    // Calculate layer progress (lower score = more stuck = needs more weight)
    const behaviorScores = entries?.filter(e => e.behavior_score).map(e => e.behavior_score!) || [];
    const emotionScores = entries?.filter(e => e.emotion_score).map(e => e.emotion_score!) || [];
    const beliefScores = entries?.filter(e => e.belief_score).map(e => e.belief_score!) || [];

    const avgBehavior = behaviorScores.length > 0 
      ? behaviorScores.reduce((a, b) => a + b, 0) / behaviorScores.length 
      : 3;
    const avgEmotion = emotionScores.length > 0 
      ? emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length 
      : 3;
    const avgBelief = beliefScores.length > 0 
      ? beliefScores.reduce((a, b) => a + b, 0) / beliefScores.length 
      : 3;

    // Calculate completion rate
    const completedActions = entries?.filter(e => e.action_completed_at).length || 0;
    const totalActions = entries?.length || 1;
    const completionRate = completedActions / totalActions;

    // Initial weights
    let behaviorWeight = 0.33;
    let emotionWeight = 0.33;
    let beliefWeight = 0.34;

    // Adjust weights based on scores (lower score = more stuck = higher weight)
    // Invert scores: 5 - avgScore gives 0-4 range where higher = more stuck
    const behaviorStuck = 5 - avgBehavior;
    const emotionStuck = 5 - avgEmotion;
    const beliefStuck = 5 - avgBelief;
    const totalStuck = behaviorStuck + emotionStuck + beliefStuck;

    if (totalStuck > 0) {
      // Distribute weights proportionally to how stuck each layer is
      behaviorWeight = 0.2 + (behaviorStuck / totalStuck) * 0.4;
      emotionWeight = 0.2 + (emotionStuck / totalStuck) * 0.4;
      beliefWeight = 0.2 + (beliefStuck / totalStuck) * 0.4;
    }

    // Normalize to sum to 1
    const totalWeight = behaviorWeight + emotionWeight + beliefWeight;
    behaviorWeight = Math.round((behaviorWeight / totalWeight) * 100) / 100;
    emotionWeight = Math.round((emotionWeight / totalWeight) * 100) / 100;
    beliefWeight = Math.round((1 - behaviorWeight - emotionWeight) * 100) / 100;

    // Identify focus areas
    const focusAreas: string[] = [];
    if (behaviorWeight > 0.4) focusAreas.push('行为层需要更多练习');
    if (emotionWeight > 0.4) focusAreas.push('情绪层需要更多觉察');
    if (beliefWeight > 0.4) focusAreas.push('信念层需要更多松动');
    if (completionRate < 0.5) focusAreas.push('行动完成率需要提升');

    // Generate adjustment reason
    let adjustmentReason = '';
    const dominantLayer = behaviorWeight > emotionWeight && behaviorWeight > beliefWeight 
      ? '行为' 
      : emotionWeight > beliefWeight 
        ? '情绪' 
        : '信念';
    
    if (weekNumber === 1) {
      adjustmentReason = `第${weekNumber}周：建立基础觉察，三层均衡探索`;
    } else if (completionRate < 0.3) {
      adjustmentReason = `第${weekNumber}周：行动完成率${(completionRate * 100).toFixed(0)}%，重点降低难度，建立信心`;
    } else {
      adjustmentReason = `第${weekNumber}周：${dominantLayer}层得分较低，本周重点关注`;
    }

    // Save weights
    const { error: insertError } = await supabaseClient
      .from('user_training_weights')
      .insert({
        user_id: user.id,
        camp_id,
        week_number: weekNumber,
        behavior_weight: behaviorWeight,
        emotion_weight: emotionWeight,
        belief_weight: beliefWeight,
        focus_areas: focusAreas,
        adjustment_reason: adjustmentReason
      });

    if (insertError) {
      console.error('Error saving weights:', insertError);
    }

    return new Response(JSON.stringify({
      week_number: weekNumber,
      weights: {
        behavior: behaviorWeight,
        emotion: emotionWeight,
        belief: beliefWeight
      },
      scores: {
        behavior: avgBehavior.toFixed(1),
        emotion: avgEmotion.toFixed(1),
        belief: avgBelief.toFixed(1)
      },
      focus_areas: focusAreas,
      adjustment_reason: adjustmentReason,
      completion_rate: (completionRate * 100).toFixed(0) + '%'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-user-weights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
