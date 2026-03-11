import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 有劲AI服务推荐配置
const SERVICE_RECOMMENDATIONS: Record<string, {
  name: string;
  route: string;
  description: string;
  icon: string;
  gradient: string;
}> = {
  emotion: {
    name: '情绪教练',
    route: '/emotion-coach',
    description: '通过情绪四部曲深度梳理情绪',
    icon: '💚',
    gradient: 'from-emerald-50 to-green-50'
  },
  parent: {
    name: '亲子教练',
    route: '/parent-coach',
    description: '改善亲子关系，理解孩子',
    icon: '💜',
    gradient: 'from-purple-50 to-violet-50'
  },
  wealth: {
    name: '财富觉醒训练营',
    route: '/wealth-camp-intro',
    description: '发现并突破财富卡点',
    icon: '💰',
    gradient: 'from-amber-50 to-yellow-50'
  },
  gratitude: {
    name: '感恩教练',
    route: '/gratitude-journal',
    description: '记录感恩时刻，提升幸福感',
    icon: '🙏',
    gradient: 'from-pink-50 to-rose-50'
  },
  alive_check: {
    name: '每日平安打卡',
    route: '/alive-check',
    description: '每日生命签到，唤醒生活热情',
    icon: '🌱',
    gradient: 'from-green-50 to-emerald-50'
  },
  emotion_button: {
    name: '情绪按钮',
    route: '/emotion-button',
    description: '288条认知提醒，即时情绪疗愈',
    icon: '🔘',
    gradient: 'from-blue-50 to-cyan-50'
  },
  communication: {
    name: '沟通教练',
    route: '/communication-coach',
    description: '提升沟通技巧，改善人际关系',
    icon: '💬',
    gradient: 'from-blue-50 to-indigo-50'
  },
  vibrant_life_sage: {
    name: '有劲AI生活教练',
    route: '/coach/vibrant_life_sage',
    description: '24小时智能陪伴，随时倾听',
    icon: '❤️',
    gradient: 'from-rose-50 to-red-50'
  },
  story: {
    name: '故事教练',
    route: '/story-coach',
    description: '用故事疗愈心灵，发现内在智慧',
    icon: '📖',
    gradient: 'from-amber-50 to-orange-50'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 验证用户
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { transcript, duration_minutes, coach_type, scenario } = await req.json();

    if (!transcript || transcript.length < 50) {
      return new Response(JSON.stringify({ 
        error: 'Transcript too short',
        message: '对话内容太短，无法生成有意义的总结'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🛡️ 异步风险内容扫描（不阻塞简报生成）
    const riskScanPromise = (async () => {
      try {
        // 获取用户显示名
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        const scanResponse = await fetch(`${supabaseUrl}/functions/v1/scan-risk-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            content: transcript,
            user_id: user.id,
            user_display_name: profile?.display_name || null,
            content_source: 'ai_conversation',
            source_detail: `${coach_type || '有劲AI'}语音对话`,
            platform: 'web',
            page: `/coach/${coach_type || 'vibrant_life_sage'}`,
          }),
        });

        if (scanResponse.ok) {
          const scanResult = await scanResponse.json();
          if (scanResult.detected) {
            console.log(`[generate-life-briefing] 🚨 Risk detected in transcript: type=${scanResult.risk_type}, level=${scanResult.risk_level}`);
          }
        } else {
          const errText = await scanResponse.text();
          console.warn(`[generate-life-briefing] Risk scan failed: ${scanResponse.status} ${errText}`);
        }
      } catch (e) {
        console.warn('[generate-life-briefing] Risk scan error (non-blocking):', e);
      }
    })();

    // 调用 Lovable AI 生成结构化简报
    const systemPrompt = `你是有劲AI的对话分析师。请分析以下对话内容，生成结构化的简报。

有劲AI提供以下服务：
- emotion: 情绪教练 - 通过情绪四部曲深度梳理情绪
- parent: 亲子教练 - 改善亲子关系，理解孩子
- wealth: 财富觉醒训练营 - 发现并突破财富卡点
- gratitude: 感恩教练 - 记录感恩时刻，提升幸福感
- alive_check: 每日平安打卡 - 每日生命签到，唤醒生活热情
- emotion_button: 情绪按钮 - 288条认知提醒，即时情绪疗愈
- communication: 沟通教练 - 提升沟通技巧，改善人际关系
- story: 故事教练 - 用故事疗愈心灵

请根据对话内容返回以下JSON格式（只返回JSON，不要其他内容）：
{
  "user_issue_summary": "用1-2句话概括用户的主要问题或话题（30-60字）",
  "summary": "用3-5句话总结整个对话的要点，包括用户分享的内容、AI的回应重点（80-150字）",
  "insight": "从对话中发现的1-2个关键洞察或发现，帮助用户更好地理解自己（50-100字）",
  "action": "基于对话给出的1-2个具体、可执行的行动建议（50-100字）",
  "recommended_coach_type": "推荐的服务类型key（从上述服务中选择最匹配的一个）",
  "reasoning": "推荐这个服务的理由，说明为什么这个服务可以进一步帮助用户（30-60字）"
}`;

    const userPrompt = `以下是用户与有劲AI的对话内容（时长约${duration_minutes || '未知'}分钟）：

${transcript}

请分析这段对话并生成结构化简报。`;

    console.log(`[generate-life-briefing] 🚀 Calling AI API with transcript length: ${transcript.length}`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',  // 🔧 修复：使用稳定可用的模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log(`[generate-life-briefing] 📡 AI API response status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => 'unknown');
      console.error(`[generate-life-briefing] ❌ AI API error: status=${aiResponse.status}, body=${errorText.slice(0, 500)}`);
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText.slice(0, 100)}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    console.log(`[generate-life-briefing] ✅ AI response received, content length: ${content.length}`);
    
    // 解析 AI 返回的 JSON
    let briefingData;
    let parseFailureReason: string | null = null;
    try {
      // 清理可能的 markdown 格式
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      briefingData = JSON.parse(cleanedContent);
      console.log(`[generate-life-briefing] ✅ JSON parsed successfully`);
    } catch (parseError) {
      parseFailureReason = parseError instanceof Error ? parseError.message : 'JSON parse error';
      console.error(`[generate-life-briefing] ⚠️ Failed to parse AI response: ${parseFailureReason}`, content.slice(0, 300));
      // 降级处理：使用简单的摘要，但记录失败原因
      briefingData = {
        user_issue_summary: '语音对话记录',
        summary: `通过语音与有劲AI进行了 ${duration_minutes || '若干'} 分钟的对话`,
        insight: null,
        action: null,
        recommended_coach_type: 'vibrant_life_sage',
        reasoning: `[解析失败: ${parseFailureReason}] 继续使用有劲AI生活教练进行深入对话`
      };
    }

    // 确保推荐的教练类型有效
    const validCoachTypes = Object.keys(SERVICE_RECOMMENDATIONS);
    if (!validCoachTypes.includes(briefingData.recommended_coach_type)) {
      briefingData.recommended_coach_type = 'vibrant_life_sage';
    }

    // 保存到数据库
    const { data: insertedBriefing, error: insertError } = await supabaseClient
      .from('vibrant_life_sage_briefings')
      .insert({
        user_id: user.id,
        user_issue_summary: briefingData.user_issue_summary,
        summary: briefingData.summary,
        insight: briefingData.insight,
        action: briefingData.action,
        recommended_coach_type: briefingData.recommended_coach_type,
        reasoning: briefingData.reasoning
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save briefing');
    }

    // 获取推荐服务的详细信息
    const recommendedService = SERVICE_RECOMMENDATIONS[briefingData.recommended_coach_type] || SERVICE_RECOMMENDATIONS.vibrant_life_sage;

    // 等待风险扫描完成（最多3秒，超时不阻塞）
    await Promise.race([riskScanPromise, new Promise(resolve => setTimeout(resolve, 3000))]);

    return new Response(JSON.stringify({
      success: true,
      briefing_id: insertedBriefing.id,
      briefing: {
        ...briefingData,
        recommended_service: recommendedService
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in generate-life-briefing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
