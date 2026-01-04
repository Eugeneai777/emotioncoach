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
      camp_id, 
      session_id,
      day_number,
      conversation_history,
      briefing_data 
    } = await req.json();

    if (!user_id || !day_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract content from briefing_data or conversation
    let behaviorBlock = briefing_data?.actions_performed?.join('、') || '';
    let emotionBlock = briefing_data?.emotion_feeling || '';
    let beliefBlock = briefing_data?.belief_insight || '';
    let smallestProgress = briefing_data?.smallest_progress || '';

    // If no briefing data, extract from conversation
    if (!behaviorBlock && conversation_history) {
      const extractPrompt = `请从以下财富教练对话中提取关键信息：

${conversation_history.map((m: any) => `${m.role === 'user' ? '用户' : '教练'}: ${m.content}`).join('\n')}

请以JSON格式返回以下信息：
{
  "behavior_block": "今日行为卡点（用户做了什么或回避了什么）",
  "emotion_block": "今日情绪卡点（用户的情绪感受）",
  "belief_block": "今日信念卡点（用户发现的限制性信念）",
  "smallest_progress": "明日最小进步承诺"
}`;

      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: extractPrompt }],
          temperature: 0.3,
        }),
      });

      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        const content = extractData.choices?.[0]?.message?.content || '';
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extracted = JSON.parse(jsonMatch[0]);
            behaviorBlock = extracted.behavior_block || '';
            emotionBlock = extracted.emotion_block || '';
            beliefBlock = extracted.belief_block || '';
            smallestProgress = extracted.smallest_progress || '';
          }
        } catch (e) {
          console.error('Failed to parse extraction:', e);
        }
      }
    }

    // Fetch recent journal entries for trend comparison
    const { data: recentEntries } = await supabaseClient
      .from('wealth_journal_entries')
      .select('behavior_score, emotion_score, belief_score, created_at, day_number')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(7);

    // Build trend data for AI prompt
    let trendSection = '';
    if (recentEntries && recentEntries.length > 0) {
      const trendData = recentEntries.map(e => 
        `Day${e.day_number}: 行为${e.behavior_score || '-'} 情绪${e.emotion_score || '-'} 信念${e.belief_score || '-'}`
      ).join('\n');
      
      trendSection = `
【历史数据（最近${recentEntries.length}天）】
${trendData}

请额外输出趋势分析：
- trend_insight: "与历史相比的趋势变化，20字以内"
- focus_suggestion: "基于趋势的关注建议，30字以内"
`;
    }

    // Now score the journal entry with enhanced prompt
    const scorePrompt = `作为财富教练，请根据以下财富日记内容进行三维度评分：

【行为卡点】${behaviorBlock || '未记录'}
【情绪卡点】${emotionBlock || '未记录'}
【信念卡点】${beliefBlock || '未记录'}
【明日进步】${smallestProgress || '未记录'}
${trendSection}

请给出1-5分的评分（1分最低，5分最高）：

评分标准：
- 行为流动度：1=完全卡住无行动, 2=想到但没做, 3=做了一点, 4=有具体行动, 5=自然流动
- 情绪流动度：1=强烈负面情绪, 2=有明显不适, 3=中性, 4=基本平和, 5=轻松愉悦
- 信念松动度：1=完全认同旧信念, 2=察觉到存在, 3=开始质疑, 4=尝试新信念, 5=新信念内化

请以JSON格式返回：
{
  "behavior_score": 1-5,
  "emotion_score": 1-5,
  "belief_score": 1-5,
  "behavior_analysis": "行为分析，20字以内",
  "emotion_analysis": "情绪分析，20字以内",
  "belief_analysis": "信念分析，20字以内",
  "overall_insight": "整体洞察，50字以内",
  "encouragement": "温暖的鼓励话语，30字以内",
  "trend_insight": "趋势分析（如有历史数据），20字以内",
  "focus_suggestion": "关注建议（如有历史数据），30字以内"
}`;

    const scoreResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: scorePrompt }],
        temperature: 0.3,
      }),
    });

    if (!scoreResponse.ok) {
      throw new Error('Failed to get AI score');
    }

    const scoreData = await scoreResponse.json();
    const scoreContent = scoreData.choices?.[0]?.message?.content || '';
    
    let scores = {
      behavior_score: 3,
      emotion_score: 3,
      belief_score: 3,
      ai_insight: {} as Record<string, any>
    };

    try {
      const jsonMatch = scoreContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        scores = {
          behavior_score: Math.min(5, Math.max(1, parsed.behavior_score || 3)),
          emotion_score: Math.min(5, Math.max(1, parsed.emotion_score || 3)),
          belief_score: Math.min(5, Math.max(1, parsed.belief_score || 3)),
          ai_insight: {
            behavior_analysis: parsed.behavior_analysis || '',
            emotion_analysis: parsed.emotion_analysis || '',
            belief_analysis: parsed.belief_analysis || '',
            overall_insight: parsed.overall_insight || '',
            encouragement: parsed.encouragement || '',
            trend_insight: parsed.trend_insight || '',
            focus_suggestion: parsed.focus_suggestion || '',
            summary: briefing_data?.summary || '',
          }
        };
      }
    } catch (e) {
      console.error('Failed to parse scores:', e);
    }

    // Upsert journal entry
    const { data: journalEntry, error: upsertError } = await supabaseClient
      .from('wealth_journal_entries')
      .upsert({
        user_id,
        camp_id: camp_id || null,
        session_id: session_id || null,
        day_number,
        behavior_block: behaviorBlock,
        emotion_block: emotionBlock,
        belief_block: beliefBlock,
        smallest_progress: smallestProgress,
        behavior_score: scores.behavior_score,
        emotion_score: scores.emotion_score,
        belief_score: scores.belief_score,
        ai_insight: scores.ai_insight,
      }, {
        onConflict: 'user_id,camp_id,day_number',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to save journal:', upsertError);
      throw upsertError;
    }

    console.log('✅ 财富日记生成成功:', journalEntry.id);

    return new Response(JSON.stringify({
      success: true,
      journal: journalEntry,
      scores: {
        behavior: scores.behavior_score,
        emotion: scores.emotion_score,
        belief: scores.belief_score,
      },
      insight: scores.ai_insight,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating wealth journal:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
