import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateServiceRole } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate that this is an internal service call
  const authError = validateServiceRole(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, campId, force } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    // Check if summary already exists (unless force regenerate)
    if (!force) {
      const { data: existingSummary } = await supabase
        .from('camp_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('camp_id', campId)
        .single();

      if (existingSummary) {
        return new Response(
          JSON.stringify({ success: true, summary: existingSummary, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user's journal entries for this camp
    const { data: entries } = await supabase
      .from('wealth_journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('camp_id', campId)
      .order('day_number', { ascending: true });

    // Get user's awakening progress
    const { data: progress } = await supabase
      .from('user_awakening_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's assessment for baseline
    const { data: assessment } = await supabase
      .from('wealth_block_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const userName = profile?.display_name || '学员';
    const journalCount = entries?.length || 0;

    // Calculate daily scores
    const dailyScores = entries?.map(entry => ({
      day: entry.day_number,
      score: calculateDayScore(entry),
      date: entry.created_at
    })) || [];

    // Calculate growth metrics - PRIORITY: use baseline_awakening from progress table
    let baselineAwakening = 50; // default fallback
    
    if (progress?.baseline_awakening !== null && progress?.baseline_awakening !== undefined) {
      // Priority 1: Use synced baseline from user_awakening_progress
      baselineAwakening = progress.baseline_awakening;
    } else if (assessment) {
      // Priority 2: Calculate from assessment scores (1-5 scale to awakening)
      // Formula: awakening_start = 100 - blockage_score, blockage = total_score / 150 * 100
      const totalScore = (assessment.behavior_score || 50) + (assessment.emotion_score || 50) + (assessment.belief_score || 50);
      baselineAwakening = Math.round(100 - (totalScore / 150 * 100));
    }

    // Use current_awakening from progress table (single source of truth)
    const currentAwakening = progress?.current_awakening ?? baselineAwakening;
    const awakeningGrowth = currentAwakening - baselineAwakening;

    // Calculate dimension-specific growth using same unified scale
    // Journal entries are 1-5, convert to 0-100: ((avg - 1) / 4) * 100
    // Baseline is 0-50 blockage score, convert to 0-100 awakening: 100 - (score / 50 * 100)
    const behaviorScores = entries?.filter(e => e.behavior_score != null).map(e => e.behavior_score) || [];
    const emotionScores = entries?.filter(e => e.emotion_score != null).map(e => e.emotion_score) || [];
    const beliefScores = entries?.filter(e => e.belief_score != null).map(e => e.belief_score) || [];

    // Convert journal 1-5 to 0-100 awakening percentage
    const avgBehavior = behaviorScores.length > 0 
      ? Math.round(((behaviorScores.reduce((a, b) => a + b, 0) / behaviorScores.length) - 1) / 4 * 100)
      : 50;
    const avgEmotion = emotionScores.length > 0
      ? Math.round(((emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length) - 1) / 4 * 100)
      : 50;
    const avgBelief = beliefScores.length > 0
      ? Math.round(((beliefScores.reduce((a, b) => a + b, 0) / beliefScores.length) - 1) / 4 * 100)
      : 50;

    // Convert baseline 0-50 blockage to 0-100 awakening for comparison
    const baselineBehaviorAwakening = 100 - Math.round((progress?.baseline_behavior ?? 25) / 50 * 100);
    const baselineEmotionAwakening = 100 - Math.round((progress?.baseline_emotion ?? 25) / 50 * 100);
    const baselineBeliefAwakening = 100 - Math.round((progress?.baseline_belief ?? 25) / 50 * 100);

    const behaviorGrowth = avgBehavior - baselineBehaviorAwakening;
    const emotionGrowth = avgEmotion - baselineEmotionAwakening;
    const beliefGrowth = avgBelief - baselineBeliefAwakening;

    // Determine focus areas based on entries
    const focusAreas = determineFocusAreas(entries || [], assessment);

    // Determine unlocked achievements
    const achievements = determineAchievements(entries || [], dailyScores);

    // Find biggest breakthrough
    const biggestBreakthrough = findBiggestBreakthrough(entries || []);

    // Generate AI coach message
    const aiMessage = await generateAIMessage(
      userName,
      awakeningGrowth,
      behaviorGrowth,
      emotionGrowth,
      beliefGrowth,
      journalCount,
      biggestBreakthrough,
      focusAreas
    );

    // Save summary to database using upsert to handle force regeneration
    const summaryData = {
      user_id: userId,
      camp_id: campId,
      start_awakening: baselineAwakening,
      end_awakening: currentAwakening,
      awakening_growth: awakeningGrowth,
      behavior_growth: behaviorGrowth,
      emotion_growth: emotionGrowth,
      belief_growth: beliefGrowth,
      daily_scores: dailyScores,
      biggest_breakthrough: biggestBreakthrough,
      focus_areas: focusAreas,
      achievements_unlocked: achievements,
      ai_coach_message: aiMessage,
      generated_at: new Date().toISOString()
    };

    const { data: summary, error: upsertError } = await supabase
      .from('camp_summaries')
      .upsert(summaryData, { 
        onConflict: 'user_id,camp_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting summary:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating camp summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateDayScore(entry: any): number {
  const behavior = entry.behavior_score || 0;
  const emotion = entry.emotion_score || 0;
  const belief = entry.belief_score || 0;
  // Convert 1-5 scale to 0-100
  return Math.round(((behavior + emotion + belief) / 3 - 1) / 4 * 100);
}

function determineFocusAreas(entries: any[], assessment: any): string[] {
  const areas: string[] = [];
  
  // Check dominant type from assessment
  if (assessment?.dominant_poor === 'behavior') {
    areas.push('行为觉察');
  } else if (assessment?.dominant_poor === 'emotion') {
    areas.push('情绪觉察');
  } else if (assessment?.dominant_poor === 'belief') {
    areas.push('信念转化');
  }

  // Check giving actions completed
  const givingCount = entries.filter(e => e.giving_action).length;
  if (givingCount >= 3) {
    areas.push('给予实践');
  }

  // Check meditation completion
  const meditationCount = entries.filter(e => e.meditation_completed).length;
  if (meditationCount >= 5) {
    areas.push('冥想修炼');
  }

  return areas.slice(0, 4); // Max 4 areas
}

function determineAchievements(entries: any[], dailyScores: any[]): string[] {
  const achievements: string[] = [];

  if (entries.length >= 1) achievements.push('first_checkin');
  if (entries.length >= 3) achievements.push('streak_3');
  if (entries.length >= 7) achievements.push('streak_7');

  // Check for dimension mastery (avg score >= 4)
  const avgBehavior = entries.length > 0 
    ? entries.reduce((sum, e) => sum + (e.behavior_score || 0), 0) / entries.length
    : 0;
  const avgEmotion = entries.length > 0
    ? entries.reduce((sum, e) => sum + (e.emotion_score || 0), 0) / entries.length
    : 0;
  const avgBelief = entries.length > 0
    ? entries.reduce((sum, e) => sum + (e.belief_score || 0), 0) / entries.length
    : 0;

  if (avgBehavior >= 4) achievements.push('behavior_master');
  if (avgEmotion >= 4) achievements.push('emotion_master');
  if (avgBelief >= 4) achievements.push('belief_master');

  // Check for giving champion
  const givingCount = entries.filter(e => e.giving_action).length;
  if (givingCount >= 5) achievements.push('giving_champion');

  // Check for breakthrough (any score jump of 2+ points)
  for (let i = 1; i < dailyScores.length; i++) {
    if (dailyScores[i].score - dailyScores[i - 1].score >= 20) {
      achievements.push('breakthrough');
      break;
    }
  }

  return achievements;
}

function findBiggestBreakthrough(entries: any[]): string {
  // Find the entry with highest combined score
  let bestEntry = entries[0];
  let bestScore = 0;

  for (const entry of entries) {
    const score = (entry.behavior_score || 0) + (entry.emotion_score || 0) + (entry.belief_score || 0);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (!bestEntry) {
    return "在7天的旅程中，你开启了财富觉醒的第一步，这本身就是最大的突破。";
  }

  // Extract breakthrough from entry content
  const behaviorLabel = bestEntry.behavior_label || '';
  const emotionLabel = bestEntry.emotion_label || '';
  const beliefLabel = bestEntry.belief_label || '';

  if (behaviorLabel || emotionLabel || beliefLabel) {
    return `第${bestEntry.day_number}天，你在${behaviorLabel ? '行为（' + behaviorLabel + '）' : ''}${emotionLabel ? '情绪（' + emotionLabel + '）' : ''}${beliefLabel ? '信念（' + beliefLabel + '）' : ''}方面展现了深刻的觉察力，这是你最闪耀的时刻。`;
  }

  return `在第${bestEntry.day_number}天，你达到了训练营中的最高觉醒状态，这是你突破自我的关键时刻。`;
}

async function generateAIMessage(
  userName: string,
  awakeningGrowth: number,
  behaviorGrowth: number,
  emotionGrowth: number,
  beliefGrowth: number,
  journalCount: number,
  breakthrough: string,
  focusAreas: string[]
): Promise<string> {
  // Generate a personalized message based on growth metrics
  const growthLevel = awakeningGrowth >= 15 ? 'excellent' : awakeningGrowth >= 8 ? 'good' : 'steady';
  const mainGrowth = Math.max(behaviorGrowth, emotionGrowth, beliefGrowth);
  const mainArea = behaviorGrowth === mainGrowth ? '行为' : emotionGrowth === mainGrowth ? '情绪' : '信念';

  let message = '';

  if (growthLevel === 'excellent') {
    message = `亲爱的${userName}，

恭喜你完成了7天财富觉醒之旅！🎉

你的觉醒指数提升了${awakeningGrowth}点，这是一个令人惊喜的成长！你在${mainArea}层面展现出了特别的觉察力和转化能力。

在这7天里，你完成了${journalCount}次深度教练对话，每一次都是与自己内心的真诚对话。${breakthrough}

你已经证明了自己有能力突破旧的财富模式，建立新的富足信念。记住，真正的财富觉醒不是一蹴而就，而是持续的觉察与成长。

愿你带着这份觉醒的力量，继续在财富自由的道路上前行！

—— 你的AI财富教练`;
  } else if (growthLevel === 'good') {
    message = `亲爱的${userName}，

恭喜你完成7天财富觉醒训练营！✨

你的觉醒指数稳步提升了${awakeningGrowth}点，${mainArea}层面的成长尤为明显。这说明你已经开始突破一些根深蒂固的财富限制信念。

${journalCount}次教练对话，每一次都让你离真正的财富自由更近一步。${breakthrough}

成长是一个持续的过程，你已经播下了觉醒的种子。接下来，继续保持每日的觉察练习，让这些新的信念和行为模式逐渐成为你的第二天性。

期待见证你更大的突破！

—— 你的AI财富教练`;
  } else {
    message = `亲爱的${userName}，

感谢你完成了7天财富觉醒之旅！🌱

每一次觉察都是宝贵的，你的觉醒指数提升了${awakeningGrowth}点。虽然数字看起来可能不大，但改变的种子已经种下。

在${journalCount}次教练对话中，你开始正视自己的财富模式和限制信念。这份勇气本身就是最大的收获。${breakthrough}

觉醒不是一场短跑，而是一场马拉松。你已经迈出了关键的第一步。建议你继续保持每日的觉察练习，给自己更多时间和耐心。

相信自己，财富觉醒的大门已经向你敞开！

—— 你的AI财富教练`;
  }

  return message;
}
