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

    console.log(`🔍 开始评估用户风险: ${user.id}`);

    // 1. 获取最近7天的日记记录
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentJournals } = await serviceClient
      .from('wealth_journal_entries')
      .select('day_number, emotion_score, action_completed_at, giving_action, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // 2. 获取所有日记记录用于计算首周对比
    const { data: allJournals } = await serviceClient
      .from('wealth_journal_entries')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // 3. 获取未完成的给予行动
    const { data: pendingActions } = await serviceClient
      .from('wealth_journal_entries')
      .select('giving_action, day_number')
      .eq('user_id', user.id)
      .not('giving_action', 'is', null)
      .is('action_completed_at', null)
      .order('day_number', { ascending: false })
      .limit(3);

    // 计算风险指标
    const riskFactors: string[] = [];
    let riskScore = 0;

    // === 维度1：情绪趋势分析（权重30%）===
    const emotionScores = recentJournals
      ?.map(j => j.emotion_score)
      .filter((s): s is number => s !== null && s !== undefined) || [];
    
    if (emotionScores.length >= 3) {
      const firstHalf = emotionScores.slice(Math.floor(emotionScores.length / 2));
      const secondHalf = emotionScores.slice(0, Math.floor(emotionScores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg - 1) {
        riskScore += 25;
        riskFactors.push('情绪分持续下降');
      } else if (secondAvg < firstAvg - 0.5) {
        riskScore += 10;
      }
    }

    // === 维度2：行动完成率（权重25%）===
    const actionsWithGiving = recentJournals?.filter(j => j.giving_action) || [];
    const completedActions = actionsWithGiving.filter(j => j.action_completed_at);
    const actionCompletionRate = actionsWithGiving.length > 0 
      ? completedActions.length / actionsWithGiving.length 
      : 1;
    
    if (actionCompletionRate < 0.3) {
      riskScore += 20;
      riskFactors.push('给予行动完成率低');
    } else if (actionCompletionRate < 0.5) {
      riskScore += 10;
    }

    // === 维度3：连续缺勤天数（权重25%）===
    let daysSinceLastEntry = 0;
    if (recentJournals && recentJournals.length > 0) {
      const lastEntryDate = new Date(recentJournals[0].created_at);
      const now = new Date();
      daysSinceLastEntry = Math.floor((now.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastEntry = 7; // 7天内无记录
    }

    if (daysSinceLastEntry >= 3) {
      riskScore += 25;
      riskFactors.push(`连续${daysSinceLastEntry}天未打卡`);
    } else if (daysSinceLastEntry >= 2) {
      riskScore += 15;
      riskFactors.push('最近2天未打卡');
    }

    // === 维度4：互动衰减（权重20%）===
    if (allJournals && allJournals.length > 7) {
      const firstWeekEntries = allJournals.slice(0, 7).length;
      const recentWeekEntries = recentJournals?.length || 0;
      const engagementRatio = recentWeekEntries / Math.max(firstWeekEntries, 1);
      
      if (engagementRatio < 0.3) {
        riskScore += 20;
        riskFactors.push('互动频率显著下降');
      } else if (engagementRatio < 0.5) {
        riskScore += 10;
      }
    }

    // 确定风险等级
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // 生成干预建议
    let suggestedIntervention = '';
    if (riskLevel === 'high') {
      suggestedIntervention = '温暖开场 + 询问近况 + 降低门槛';
    } else if (riskLevel === 'medium') {
      suggestedIntervention = '关心式问候 + 轻松话题切入';
    } else {
      suggestedIntervention = '正常开场 + 延续上次话题';
    }

    const result = {
      user_id: user.id,
      risk_score: Math.min(100, riskScore),
      risk_level: riskLevel,
      risk_factors: riskFactors,
      suggested_intervention: suggestedIntervention,
      days_since_last_entry: daysSinceLastEntry,
      pending_actions: pendingActions || [],
      metrics: {
        emotion_trend: emotionScores.length >= 2 ? (emotionScores[0] - emotionScores[emotionScores.length - 1]) : 0,
        action_completion_rate: Math.round(actionCompletionRate * 100),
        recent_entries_count: recentJournals?.length || 0,
      }
    };

    console.log(`✅ 风险评估完成:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ 风险评估失败:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
