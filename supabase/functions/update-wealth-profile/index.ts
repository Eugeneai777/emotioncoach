import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type name mappings
const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷',
  lazy: '懒穷', 
  slow: '慢穷',
  impulsive: '冲穷'
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '焦虑',
  scarcity: '匮乏',
  guilt: '内疚',
  fear: '恐惧'
};

const beliefTypeNames: Record<string, string> = {
  unworthy: '不配得',
  lack: '匮乏信念',
  face: '面子困境',
  limit: '自我设限'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 update-wealth-profile 被调用');

  try {
    const body = await req.json();
    const { user_id, camp_id, force_update = false } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get current profile
    const { data: currentProfile, error: profileError } = await supabaseClient
      .from('user_wealth_profile')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ 获取当前画像失败:', profileError);
      throw profileError;
    }

    if (!currentProfile) {
      console.log('⚠️ 用户画像不存在，跳过更新');
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Profile not found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get recent journal entries (last 7 days)
    const { data: recentJournals, error: journalError } = await supabaseClient
      .from('wealth_journal_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('day_number', { ascending: false })
      .limit(7);

    if (journalError) {
      console.error('❌ 获取日记失败:', journalError);
      throw journalError;
    }

    if (!recentJournals || recentJournals.length === 0) {
      console.log('⚠️ 没有日记数据，跳过更新');
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'No journal entries found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Calculate dominant types from journals
    const behaviorCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    const beliefCounts: Record<string, number> = {};
    
    let totalBehaviorScore = 0;
    let totalEmotionScore = 0;
    let totalBeliefScore = 0;
    let validJournalCount = 0;

    for (const journal of recentJournals) {
      if (journal.behavior_type) {
        behaviorCounts[journal.behavior_type] = (behaviorCounts[journal.behavior_type] || 0) + 1;
      }
      if (journal.emotion_type) {
        emotionCounts[journal.emotion_type] = (emotionCounts[journal.emotion_type] || 0) + 1;
      }
      if (journal.belief_type) {
        beliefCounts[journal.belief_type] = (beliefCounts[journal.belief_type] || 0) + 1;
      }
      
      if (journal.behavior_score || journal.emotion_score || journal.belief_score) {
        totalBehaviorScore += journal.behavior_score || 0;
        totalEmotionScore += journal.emotion_score || 0;
        totalBeliefScore += journal.belief_score || 0;
        validJournalCount++;
      }
    }

    // Find most frequent types
    const getDominant = (counts: Record<string, number>): string | null => {
      let maxCount = 0;
      let dominant = null;
      for (const [type, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = type;
        }
      }
      return dominant;
    };

    const newDominantPoor = getDominant(behaviorCounts);
    const newDominantEmotion = getDominant(emotionCounts);
    const newDominantBelief = getDominant(beliefCounts);

    // Calculate new health score (average of three layer scores, scaled to 0-100)
    // Formula: (combinedAvg - 1) / 4 * 100 - matches frontend useWealthJournalEntries.awakeningIndex
    let newHealthScore = currentProfile.health_score || 50;
    if (validJournalCount > 0) {
      const avgBehavior = totalBehaviorScore / validJournalCount;
      const avgEmotion = totalEmotionScore / validJournalCount;
      const avgBelief = totalBeliefScore / validJournalCount;
      // Scores are 1-5, convert to 0-100 scale: (avg - 1) / 4 * 100
      const combinedAvg = (avgBehavior + avgEmotion + avgBelief) / 3;
      newHealthScore = Math.round(((combinedAvg - 1) / 4) * 100);
    }

    // Calculate current week
    const maxDayNumber = Math.max(...recentJournals.map(j => j.day_number || 1));
    const currentWeek = Math.ceil(maxDayNumber / 7);

    // 4. Check if significant changes occurred
    const hasChanges = 
      newDominantPoor !== currentProfile.dominant_poor ||
      newDominantEmotion !== currentProfile.dominant_emotion ||
      newDominantBelief !== currentProfile.dominant_belief ||
      Math.abs(newHealthScore - (currentProfile.health_score || 50)) >= 5 ||
      currentWeek > (currentProfile.current_week || 1);

    if (!hasChanges && !force_update) {
      console.log('ℹ️ 画像无显著变化，跳过更新');
      return new Response(JSON.stringify({ 
        success: true, 
        updated: false,
        reason: 'No significant changes' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Save current profile as snapshot before updating
    const existingSnapshots = currentProfile.profile_snapshots || [];
    const newSnapshot = {
      week: currentProfile.current_week || 1,
      snapshot: {
        dominant_poor: currentProfile.dominant_poor,
        dominant_emotion: currentProfile.dominant_emotion,
        dominant_belief: currentProfile.dominant_belief,
        health_score: currentProfile.health_score,
        reaction_pattern: currentProfile.reaction_pattern,
      },
      created_at: new Date().toISOString(),
    };
    
    // Keep only last 21 snapshots (3 months of weekly data)
    const updatedSnapshots = [...existingSnapshots, newSnapshot].slice(-21);

    // 6. Generate AI insight comparing old vs new
    let evolutionInsight = '';
    
    if (existingSnapshots.length > 0) {
      const firstSnapshot = existingSnapshots[0]?.snapshot || {};
      const oldHealthScore = firstSnapshot.health_score || currentProfile.health_score || 50;
      const scoreDiff = newHealthScore - oldHealthScore;
      
      if (scoreDiff > 10) {
        evolutionInsight = `你的觉醒指数从 ${oldHealthScore} 提升到了 ${newHealthScore}，觉察力显著增强！`;
      } else if (scoreDiff > 0) {
        evolutionInsight = `你的觉醒指数稳步提升，从 ${oldHealthScore} 到 ${newHealthScore}。`;
      } else if (scoreDiff < -10) {
        evolutionInsight = `觉醒之路会有波动，觉醒指数从 ${oldHealthScore} 变为 ${newHealthScore}，这是调整期的正常现象。`;
      } else {
        evolutionInsight = `你的觉醒状态保持稳定，继续保持觉察。`;
      }

      // Add type change insights
      if (newDominantPoor && newDominantPoor !== firstSnapshot.dominant_poor) {
        const oldName = behaviorTypeNames[firstSnapshot.dominant_poor] || firstSnapshot.dominant_poor;
        const newName = behaviorTypeNames[newDominantPoor] || newDominantPoor;
        evolutionInsight += ` 行为层从"${oldName}"转向"${newName}"。`;
      }
      if (newDominantEmotion && newDominantEmotion !== firstSnapshot.dominant_emotion) {
        const oldName = emotionTypeNames[firstSnapshot.dominant_emotion] || firstSnapshot.dominant_emotion;
        const newName = emotionTypeNames[newDominantEmotion] || newDominantEmotion;
        evolutionInsight += ` 情绪层从"${oldName}"转向"${newName}"。`;
      }
    }

    // 7. Update profile
    const updateData = {
      dominant_poor: newDominantPoor || currentProfile.dominant_poor,
      dominant_emotion: newDominantEmotion || currentProfile.dominant_emotion,
      dominant_belief: newDominantBelief || currentProfile.dominant_belief,
      health_score: newHealthScore,
      current_week: currentWeek,
      profile_snapshots: updatedSnapshots,
      last_updated_from_journal: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 更新画像:', updateData);

    const { data: updatedProfile, error: updateError } = await supabaseClient
      .from('user_wealth_profile')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 更新画像失败:', updateError);
      throw updateError;
    }

    console.log('✅ 活画像更新成功');

    return new Response(JSON.stringify({
      success: true,
      updated: true,
      profile: updatedProfile,
      evolution_insight: evolutionInsight,
      changes: {
        health_score_diff: newHealthScore - (currentProfile.health_score || 50),
        week_changed: currentWeek !== (currentProfile.current_week || 1),
        dominant_poor_changed: newDominantPoor !== currentProfile.dominant_poor,
        dominant_emotion_changed: newDominantEmotion !== currentProfile.dominant_emotion,
        dominant_belief_changed: newDominantBelief !== currentProfile.dominant_belief,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating wealth profile:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
