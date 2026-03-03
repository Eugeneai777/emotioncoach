import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 卡点类型中文名称映射
const behaviorTypeNames: Record<string, string> = {
  mouth: '嘴穷',
  hand: '手穷',
  eye: '眼穷',
  heart: '心穷',
};

const emotionTypeNames: Record<string, string> = {
  anxiety: '金钱焦虑',
  scarcity: '匮乏恐惧',
  comparison: '比较自卑',
  shame: '羞耻厌恶',
  guilt: '消费内疚',
};

const beliefTypeNames: Record<string, string> = {
  lack: '匮乏感',
  linear: '线性思维',
  stigma: '金钱污名',
  unworthy: '不配得感',
  relationship: '关系恐惧',
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
    let behaviorBlock = briefing_data?.behavior_block || briefing_data?.actions_performed?.join('、') || '';
    let emotionBlock = briefing_data?.emotion_block || briefing_data?.emotion_feeling || '';
    let beliefBlock = briefing_data?.belief_block || briefing_data?.belief_insight || '';
    
    // 兜底：确保 behavior_block 不为空（防止完成判定失败）
    if (!behaviorBlock && (emotionBlock || beliefBlock)) {
      behaviorBlock = emotionBlock || beliefBlock || '已完成教练梳理';
    }
    let smallestProgress = briefing_data?.smallest_progress || '';
    
    // 卡点类型和行动建议
    let behaviorType = briefing_data?.behavior_type || null;
    let emotionType = briefing_data?.emotion_type || null;
    let beliefType = briefing_data?.belief_type || null;
    let actionSuggestion = briefing_data?.action_suggestion || '';
    let summary = briefing_data?.summary || '';
    
    // 新增：个性化觉醒数据
    let responsibilityItems = briefing_data?.responsibility_items || null;
    let emotionNeed = briefing_data?.emotion_need || null;
    let beliefSource = briefing_data?.belief_source || null;
    let oldBelief = briefing_data?.old_belief || null;
    let newBelief = briefing_data?.new_belief || null;
    let givingAction = briefing_data?.giving_action || null;
    let personalAwakening = briefing_data?.personal_awakening || null;
    
    // 确保 personalAwakening 是一个对象
    if (personalAwakening && typeof personalAwakening === 'string') {
      try {
        personalAwakening = JSON.parse(personalAwakening);
      } catch (e) {
        personalAwakening = { awakening_moment: personalAwakening };
      }
    }
    personalAwakening = personalAwakening || {};

    // If no briefing data, extract from conversation
    if (!behaviorBlock && conversation_history) {
      const extractPrompt = `请从以下财富教练对话中提取关键信息，并对标到具体卡点类型：

${conversation_history.map((m: any) => `${m.role === 'user' ? '用户' : '教练'}: ${m.content}`).join('\n')}

请以JSON格式返回以下信息：
{
  "behavior_block": "行为卡点描述",
  "behavior_type": "mouth/hand/eye/heart之一（四穷类型）",
  "emotion_block": "情绪卡点描述",
  "emotion_type": "anxiety/scarcity/comparison/shame/guilt之一（五情绪类型）",
  "belief_block": "信念卡点描述",
  "belief_type": "lack/linear/stigma/unworthy/relationship之一（五信念类型）",
  "action_suggestion": "基于卡点的个性化行动建议，30字内",
  "smallest_progress": "明日最小进步承诺"
}

卡点类型说明：
- 行为层四穷：mouth=嘴穷（负面语言）, hand=手穷（不舍得花）, eye=眼穷（只看问题）, heart=心穷（受害者思维）
- 情绪层五情绪：anxiety=金钱焦虑, scarcity=匮乏恐惧, comparison=比较自卑, shame=羞耻厌恶, guilt=消费内疚
- 信念层五信念：lack=匮乏感, linear=线性思维, stigma=金钱污名, unworthy=不配得感, relationship=关系恐惧`;

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
            behaviorType = extracted.behavior_type || null;
            emotionBlock = extracted.emotion_block || '';
            emotionType = extracted.emotion_type || null;
            beliefBlock = extracted.belief_block || '';
            beliefType = extracted.belief_type || null;
            actionSuggestion = extracted.action_suggestion || '';
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
      .select('behavior_score, emotion_score, belief_score, behavior_type, emotion_type, belief_type, created_at, day_number')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(7);

    // Build trend data for AI prompt
    let trendSection = '';
    if (recentEntries && recentEntries.length > 0) {
      const trendData = recentEntries.map(e => 
        `Day${e.day_number}: 行为${e.behavior_score || '-'}(${behaviorTypeNames[e.behavior_type] || '-'}) 情绪${e.emotion_score || '-'}(${emotionTypeNames[e.emotion_type] || '-'}) 信念${e.belief_score || '-'}(${beliefTypeNames[e.belief_type] || '-'})`
      ).join('\n');
      
      trendSection = `
【历史数据（最近${recentEntries.length}天）】
${trendData}

请额外输出趋势分析：
- trend_insight: "与历史相比的趋势变化，包括卡点类型的变化，20字以内"
- focus_suggestion: "基于趋势的关注建议，30字以内"
`;
    }

    // Now score the journal entry with enhanced prompt
    const scorePrompt = `作为财富教练，请根据以下财富日记内容进行三维度评分：

【行为卡点】${behaviorBlock || '未记录'} (类型: ${behaviorTypeNames[behaviorType] || '未识别'})
【情绪卡点】${emotionBlock || '未记录'} (类型: ${emotionTypeNames[emotionType] || '未识别'})
【信念卡点】${beliefBlock || '未记录'} (类型: ${beliefTypeNames[beliefType] || '未识别'})
【行动建议】${actionSuggestion || '未记录'}
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
            summary: summary || briefing_data?.summary || '',
          }
        };
      }
    } catch (e) {
      console.error('Failed to parse scores:', e);
    }

    // 自动生成各层觉醒时刻（如果缺失）
    // 行为层觉醒
    if (!personalAwakening.behavior_awakening && !personalAwakening.awakening_moment) {
      if (responsibilityItems && Array.isArray(responsibilityItems) && responsibilityItems.length > 0) {
        personalAwakening.behavior_awakening = `原来我可以负责：${responsibilityItems[0]}`;
      } else if (behaviorBlock) {
        const behaviorAwakenings: Record<string, string> = {
          heart: '原来我可以选择看到"我能做什么"而非"谁害了我"',
          eye: '原来我可以把注意力从问题转向机会',
          hand: '原来我可以把消费定义为"投资自己"',
          mouth: '原来我可以把一句抱怨换成一句感恩',
        };
        personalAwakening.behavior_awakening = behaviorAwakenings[behaviorType] || `原来我可以觉察到${behaviorTypeNames[behaviorType] || '行为'}模式`;
      }
    } else if (personalAwakening.awakening_moment && !personalAwakening.behavior_awakening) {
      // 兼容旧数据：把 awakening_moment 复制到 behavior_awakening
      personalAwakening.behavior_awakening = personalAwakening.awakening_moment;
    }
    
    // 情绪层觉醒
    if (!personalAwakening.emotion_awakening) {
      if (emotionNeed) {
        const emotionName = emotionTypeNames[emotionType] || '这份情绪';
        personalAwakening.emotion_awakening = `原来我的${emotionName}在告诉我：我需要${emotionNeed}`;
      } else if (emotionBlock) {
        const emotionNeeds: Record<string, string> = {
          anxiety: '安全感',
          scarcity: '被保障',
          comparison: '被认可',
          shame: '被接纳',
          guilt: '被允许享受',
        };
        const need = emotionNeeds[emotionType] || '被看见';
        personalAwakening.emotion_awakening = `原来我的${emotionTypeNames[emotionType] || '情绪'}在告诉我：我需要${need}`;
      }
    }
    
    // 信念层觉醒
    if (!personalAwakening.belief_awakening) {
      if (oldBelief && newBelief) {
        personalAwakening.belief_awakening = `原来"${oldBelief}"只是过去的保护，现在我可以选择"${newBelief}"`;
      } else if (beliefBlock) {
        const newBeliefs: Record<string, string> = {
          lack: '钱是流动的能量，流出去也会流回来',
          linear: '财富可以轻松流向我',
          stigma: '财富让我创造更多价值',
          unworthy: '我值得拥有丰盛',
          relationship: '财富让我更有能力爱人',
        };
        personalAwakening.belief_awakening = `原来我可以选择相信：${newBeliefs[beliefType] || '我值得拥有财富'}`;
      }
    }

    // 构建个性化觉醒简报内容
    const briefingContent = {
      title: `Day ${day_number} 财富觉醒`,
      date: new Date().toISOString(),
      
      // 第一步：行为觉察
      step1: {
        title: "🎯 行为觉察",
        type: behaviorType,
        typeName: behaviorTypeNames[behaviorType] || '未识别',
        description: behaviorBlock,
        score: scores.behavior_score,
        analysis: scores.ai_insight.behavior_analysis,
        responsibility_items: responsibilityItems,
      },
      
      // 第二步：情绪流动
      step2: {
        title: "💛 情绪流动",
        type: emotionType,
        typeName: emotionTypeNames[emotionType] || '未识别',
        description: emotionBlock,
        score: scores.emotion_score,
        analysis: scores.ai_insight.emotion_analysis,
        inner_need: emotionNeed,
      },
      
      // 第三步：信念松动
      step3: {
        title: "💡 信念松动",
        type: beliefType,
        typeName: beliefTypeNames[beliefType] || '未识别',
        description: beliefBlock,
        score: scores.belief_score,
        analysis: scores.ai_insight.belief_analysis,
        source: beliefSource,
        old_belief: oldBelief,
        new_belief: newBelief,
      },
      
      // 第四步：给予行动
      step4: {
        title: "🎁 给予行动",
        giving_action: givingAction,
        action: actionSuggestion,
        tomorrow: smallestProgress,
      },
      
      // 个人化觉醒
      personal_awakening: personalAwakening,
      
      // 整体洞察
      insight: {
        overall: scores.ai_insight.overall_insight,
        encouragement: scores.ai_insight.encouragement,
        trend: scores.ai_insight.trend_insight,
        suggestion: scores.ai_insight.focus_suggestion,
      }
    };

    // 🔧 改进去重逻辑：先查询是否存在，再决定 insert 或 update
    // 原因：当 camp_id 为 NULL 时，PostgreSQL 的 upsert 无法正确匹配（NULL != NULL）
    const campIdNormalized = camp_id && String(camp_id).trim() !== '' ? camp_id : null;
    
    // 使用北京时间获取今日日期
    const today = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).split(' ')[0];
    
    console.log('🔍 查询已有日记:', { user_id, campIdNormalized, day_number, today });
    
    // 先查询是否已存在今日的日记
    let existingEntry = null;
    
    if (campIdNormalized) {
      // 有 camp_id 时：精确匹配 user_id + camp_id + day_number
      const { data } = await supabaseClient
        .from('wealth_journal_entries')
        .select('id')
        .eq('user_id', user_id)
        .eq('camp_id', campIdNormalized)
        .eq('day_number', day_number)
        .maybeSingle();
      existingEntry = data;
    } else {
      // 无 camp_id 时：匹配 user_id + day_number + 今日日期（防止每天重复生成）
      const { data } = await supabaseClient
        .from('wealth_journal_entries')
        .select('id')
        .eq('user_id', user_id)
        .is('camp_id', null)
        .eq('day_number', day_number)
        .gte('created_at', `${today}T00:00:00+08:00`)
        .lt('created_at', `${today}T23:59:59+08:00`)
        .maybeSingle();
      existingEntry = data;
    }
    
    const journalData = {
      user_id,
      camp_id: campIdNormalized,
      session_id: session_id || null,
      day_number,
      behavior_block: behaviorBlock,
      behavior_type: behaviorType,
      emotion_block: emotionBlock,
      emotion_type: emotionType,
      belief_block: beliefBlock,
      belief_type: beliefType,
      smallest_progress: smallestProgress,
      action_suggestion: actionSuggestion,
      briefing_content: briefingContent,
      behavior_score: scores.behavior_score,
      emotion_score: scores.emotion_score,
      belief_score: scores.belief_score,
      ai_insight: scores.ai_insight,
      // 新增个性化字段
      responsibility_items: responsibilityItems,
      emotion_need: emotionNeed,
      belief_source: beliefSource,
      old_belief: oldBelief,
      new_belief: newBelief,
      giving_action: givingAction,
      personal_awakening: personalAwakening,
    };
    
    let journalEntry;
    let upsertError;
    
    if (existingEntry) {
      // 更新已有记录
      console.log('📝 更新已有日记:', existingEntry.id);
      const { data, error } = await supabaseClient
        .from('wealth_journal_entries')
        .update(journalData)
        .eq('id', existingEntry.id)
        .select()
        .single();
      journalEntry = data;
      upsertError = error;
    } else {
      // 插入新记录
      console.log('📝 创建新日记');
      const { data, error } = await supabaseClient
        .from('wealth_journal_entries')
        .insert(journalData)
        .select()
        .single();
      journalEntry = data;
      upsertError = error;
    }

    if (upsertError) {
      console.error('Failed to save journal:', upsertError);
      throw upsertError;
    }

    console.log('✅ 财富日记生成成功:', journalEntry.id, '卡点类型:', behaviorType, emotionType, beliefType);

    // ============= 同步教练给予行动到挑战表 =============
    if (givingAction) {
      const today = new Date().toISOString().split('T')[0];
      
      // 检查是否已存在今日的教练行动挑战
      const { data: existingCoachChallenge } = await supabaseClient
        .from('daily_challenges')
        .select('id')
        .eq('user_id', user_id)
        .eq('target_date', today)
        .eq('source', 'coach_action')
        .maybeSingle();

      if (!existingCoachChallenge) {
        // 创建教练行动挑战记录
        const { error: challengeError } = await supabaseClient
          .from('daily_challenges')
          .insert({
            user_id,
            challenge_type: 'giving',
            challenge_title: givingAction,
            challenge_description: '来自今日教练对话的给予行动',
            difficulty: 'medium',
            points_reward: 20, // 统一积分
            target_date: today,
            is_ai_generated: false,
            target_poor_type: behaviorType || null,
            recommendation_reason: '✨ 这是你在教练对话中的行动承诺',
            source: 'coach_action',
            journal_entry_id: journalEntry.id,
            ai_insight_source: null,
          });

        if (challengeError) {
          console.error('❌ 同步教练行动到挑战表失败:', challengeError);
        } else {
          console.log('✅ 教练行动已同步到挑战表:', givingAction);
        }
      } else {
        console.log('ℹ️ 今日已有教练行动挑战，跳过同步');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      journal: journalEntry,
      scores: {
        behavior: scores.behavior_score,
        emotion: scores.emotion_score,
        belief: scores.belief_score,
      },
      blockTypes: {
        behavior: behaviorType,
        emotion: emotionType,
        belief: beliefType,
      },
      briefing: briefingContent,
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
