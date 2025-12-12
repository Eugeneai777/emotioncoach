import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "身份验证失败" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { scenario, context } = await req.json();

    // 后端去重检查：24小时内同场景不重复发送
    const { data: recentSameScenario } = await supabase
      .from('smart_notifications')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('scenario', scenario)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if ((recentSameScenario?.length ?? 0) > 0 && !context?.force && !context?.preview) {
      console.log(`24小时内已发送过 ${scenario} 场景通知，跳过`);
      return new Response(JSON.stringify({ 
        success: false,
        message: "24小时内已发送相同场景通知",
        duplicate: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // sustained_low_mood 特殊处理：3天内最多1次
    if (scenario === 'sustained_low_mood' && !context?.force && !context?.preview) {
      const { data: recentCare } = await supabase
        .from('smart_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario', 'sustained_low_mood')
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
        
      if ((recentCare?.length ?? 0) > 0) {
        console.log('3天内已发送过 sustained_low_mood 通知，跳过');
        return new Response(JSON.stringify({ 
          success: false,
          message: "3天内已发送过关怀通知",
          duplicate: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 获取用户偏好设置
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_encouragement_style, companion_type, display_name, notification_frequency, smart_notification_enabled, wecom_enabled, wecom_webhook_url')
      .eq('id', user.id)
      .single();

    // 检查用户是否启用了智能通知
    if (!context?.preview && profile?.smart_notification_enabled === false) {
      return new Response(JSON.stringify({ 
        success: false,
        message: "用户已关闭智能通知"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    type EncouragementStyle = 'gentle' | 'cheerful' | 'motivational';
    type CompanionType = 'jing_teacher' | 'friend' | 'coach';
    type NotificationFrequency = 'minimal' | 'balanced' | 'frequent';
    type Scenario = 'after_briefing' | 'after_story' | 'after_gratitude_analysis' | 'after_communication' | 'after_parent' | 'goal_milestone' | 'emotion_improvement' | 'consistent_checkin' | 'inactivity' | 'sustained_low_mood' | 'encouragement' | 'checkin_success' | 'checkin_streak_milestone' | 'checkin_reminder' | 'checkin_streak_break_warning' | 'camp_day_complete' | 'weekly_summary';

    const encouragementStyle = (context?.style || profile?.preferred_encouragement_style || 'gentle') as EncouragementStyle;
    const companionType = (profile?.companion_type || 'jing_teacher') as CompanionType;
    const displayName = profile?.display_name || '朋友';
    const notificationFrequency = (context?.frequency || profile?.notification_frequency || 'balanced') as NotificationFrequency;
    const scenarioTyped = scenario as Scenario;
    const isPreview = context?.preview === true;

    // 获取最近的对话历史
    const { data: recentConversations } = await supabase
      .from('conversations')
      .select('id, messages(content, role, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 获取最近的情绪记录
    const { data: recentBriefings } = await supabase
      .from('briefings')
      .select('emotion_theme, emotion_intensity, created_at')
      .eq('conversation_id', recentConversations?.[0]?.id || '')
      .order('created_at', { ascending: false })
      .limit(5);

    // 获取活跃目标
    const { data: activeGoals } = await supabase
      .from('emotion_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 根据场景定制AI提示词
    const scenarioPrompts: Record<Scenario, string> = {
      after_briefing: `用户刚完成了一次情绪对话。他们分享的情绪是"${context?.emotion_theme}"，强度${context?.emotion_intensity}/10。请给予温暖的肯定和鼓励。`,
      after_story: `用户刚刚创作并发布了一个成长故事"${context?.title}"${context?.emotionTag ? `，情绪标签是"${context.emotionTag}"` : ''}。请肯定他们把经历转化为故事的勇气，鼓励他们继续用英雄之旅的方法讲述自己的成长。`,
      after_gratitude_analysis: `用户完成了感恩日记的AI分析，发现了${context?.dimensions_count || 7}个幸福维度的分布。${context?.highlight_dimension ? `其中"${context.highlight_dimension}"是主要亮点。` : ''}请肯定他们坚持记录感恩的习惯，鼓励他们继续发现生活中的微光。`,
      after_communication: `用户刚完成了一次沟通技能对话，主题是"${context?.communication_theme}"${context?.communication_difficulty ? `，难度${context.communication_difficulty}/10` : ''}。请肯定他们愿意学习和练习沟通技巧的勇气，给予实用的鼓励。`,
      after_parent: `用户刚完成了一次亲子关系对话，主题是"${context?.parent_theme}"${context?.emotion_intensity ? `，情绪强度${context.emotion_intensity}/10` : ''}。请温暖地肯定他们作为家长愿意学习和成长的努力，给予支持性的鼓励。`,
      goal_milestone: `用户在目标"${context?.goal_description || '情绪记录目标'}"上取得了${context?.progress_percentage}%的里程碑进展${context?.is_final ? '，目标已完成！' : ''}。当前进度：${context?.actual_count || 0}/${context?.target_count || 0}。${context?.is_final ? '请热烈庆祝这个成就！' : '请为他们庆祝这个阶段性成功，鼓励继续加油。'}`,
      emotion_improvement: `用户的情绪趋势正在改善！最近的平均强度从${context?.baseline_intensity}降低到${context?.current_intensity}。请给予积极的反馈。`,
      consistent_checkin: `用户已经连续${context?.streak_days}天坚持记录情绪。这是很了不起的坚持！请给予认可和鼓励。`,
      inactivity: `用户已经${context?.days_inactive}天没有记录情绪了，但还有${context?.active_goals_count}个活跃目标。请用温柔的方式提醒他们。`,
      sustained_low_mood: `用户最近${context?.consecutive_days}天的情绪持续低落（平均强度${context?.avg_intensity}/10）${context?.dominant_emotions?.length ? `，主要情绪包括"${context.dominant_emotions.join('、')}"` : ''}。请用温暖、关怀的语气给予支持，提醒他们可以寻求帮助，但不要让他们感到被评判。`,
      encouragement: `这是一条常规的鼓励通知，展示你的陪伴风格。用户当前${activeGoals?.length || 0}个活跃目标${activeGoals?.length ? '正在进行中' : ''}。`,
      checkin_success: `用户刚刚完成今日情绪打卡！${context?.streak_days ? `已连续打卡${context.streak_days}天。` : ''}请给予即时的肯定和鼓励，让他们感受到坚持的价值。`,
      checkin_streak_milestone: `恭喜！用户达到了连续打卡${context?.milestone_days}天的里程碑！这是非常了不起的成就。请热烈庆祝这个特殊时刻，并鼓励继续坚持。`,
      checkin_reminder: `今天是新的一天，用户还没有完成情绪打卡。${context?.streak_days ? `当前已连续${context.streak_days}天。` : ''}请用温柔且不带压力的方式提醒他们记录今天的情绪。`,
      checkin_streak_break_warning: `用户已连续打卡${context?.streak_days}天，但今天还未打卡，连续记录即将中断！请用关心但不施压的语气提醒，强调坚持的不易和价值。`,
      camp_day_complete: `用户完成了训练营第${context?.camp_day}天的学习内容${context?.camp_name ? `（${context.camp_name}）` : ''}。请肯定他们今天的付出，鼓励明天继续坚持。`,
      weekly_summary: `这是用户的周度成长总结。本周他们记录了${context?.briefings_count || 0}次情绪简报${context?.checkins_count ? `，完成了${context.checkins_count}次打卡` : ''}${context?.stories_count ? `，创作了${context.stories_count}个故事` : ''}。请给予综合性的肯定和对下周的温柔期待。`
    };

    const styleDescriptions: Record<EncouragementStyle, string> = {
      gentle: '语气温柔、平和，像知心朋友般的关怀。使用"慢慢来"、"我陪着你"、"一步一步"等温暖词汇',
      cheerful: '语气活泼、积极，充满正能量。使用"太棒了"、"真厉害"、"继续加油"等欢快词汇，可以适当使用emoji',
      motivational: '语气激励、有力，激发行动力。使用"你能做到"、"坚持下去"、"突破自我"等激励词汇'
    };

    const frequencyDescriptions: Record<NotificationFrequency, string> = {
      minimal: '这位用户偏好最少打扰，只希望在关键时刻收到通知。你的消息要格外精准、重要和有价值。',
      balanced: '这位用户偏好适度关怀，希望在重要时刻得到提醒和鼓励。保持适度的关注频率。',
      frequent: '这位用户希望密切陪伴，喜欢频繁的关注和鼓励。你可以更主动地表达关心和庆祝小进步。'
    };

    const companionDescriptions: Record<CompanionType, string> = {
      jing_teacher: '像一位温和的心理咨询师',
      friend: '像一个贴心的好朋友',
      coach: '像一位专业的成长教练'
    };

    const promptText = `你是一位${companionDescriptions[companionType]}，正在为用户${displayName}生成个性化的通知消息。

场景：${scenarioPrompts[scenarioTyped] || scenarioPrompts.encouragement}

用户风格偏好：${styleDescriptions[encouragementStyle]}

用户通知频率偏好：${frequencyDescriptions[notificationFrequency]}

用户最近情绪：${recentBriefings?.map(b => `${b.emotion_theme}(${b.emotion_intensity}/10)`).join('、') || '暂无数据'}

用户活跃目标数：${activeGoals?.length || 0}

${isPreview ? '**这是预览模式**，请生成一条展示你陪伴风格的示例通知。' : ''}

请生成一条温暖、个性化的通知消息，以JSON格式返回：
{
  "title": "通知标题（8-15字，吸引注意但不夸张，**不要包含用户名称**）",
  "message": "通知正文（以温暖的称呼开头，根据风格调整长度：gentle 50-80字，cheerful 40-60字，motivational 35-55字）",
  "icon": "emoji图标（如🌸、✨、💪、🎉、🌿等，根据风格选择合适的）",
  "action_text": "行动按钮文字（4-8字，可选）",
  "action_type": "行动类型（navigate/open_dialog/dismiss）"
}

风格要求：
- **${encouragementStyle}风格**：${styleDescriptions[encouragementStyle]}
- **标题中不要包含用户名称**，保持标题简洁通用
- 正文开头使用温暖的称呼，从以下方式中随机选择一种（用户名称为"${displayName}"）：
  * "亲爱的${displayName}"
  * "${displayName}，亲爱的"
  * "嗨，${displayName}"
  * "最亲爱的${displayName}"
  * "${displayName}宝贝"（仅限cheerful风格）
  * "亲爱的${displayName}朋友"
- 称呼后加逗号或句号，然后开始正文内容
- 结合用户的实际情况，给出具体的肯定或建议
- 避免空洞的赞美，要真诚和有温度
- 保持积极但不过度乐观
- 如果是提醒类型，要温柔而不带责备
- 根据**${notificationFrequency}**频率偏好调整语气和内容密度

请确保返回纯JSON格式，不要包含任何markdown标记。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: promptText }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "API请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API配额不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI生成失败:", response.status);
      return new Response(JSON.stringify({ error: "通知生成服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const notificationText = aiResponse.choices[0].message.content;
    
    let notificationData;
    try {
      notificationData = JSON.parse(notificationText);
    } catch {
      const jsonMatch = notificationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        notificationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析AI返回的通知数据");
      }
    }

    // 确定通知类型和优先级（根据频率偏好调整优先级）
    const baseNotificationTypeMap: Record<Scenario, { type: string; priority: number }> = {
      after_briefing: { type: 'encouragement', priority: 2 },
      after_story: { type: 'celebration', priority: 3 },
      after_gratitude_analysis: { type: 'insight', priority: 2 },
      after_communication: { type: 'encouragement', priority: 2 },
      after_parent: { type: 'encouragement', priority: 2 },
      goal_milestone: { type: 'celebration', priority: 4 },
      emotion_improvement: { type: 'insight', priority: 3 },
      consistent_checkin: { type: 'encouragement', priority: 3 },
      inactivity: { type: 'reminder', priority: 2 },
      sustained_low_mood: { type: 'care', priority: 5 },
      encouragement: { type: 'encouragement', priority: 1 },
      checkin_success: { type: 'celebration', priority: 3 },
      checkin_streak_milestone: { type: 'celebration', priority: 5 },
      checkin_reminder: { type: 'reminder', priority: 2 },
      checkin_streak_break_warning: { type: 'reminder', priority: 4 },
      camp_day_complete: { type: 'encouragement', priority: 3 },
      weekly_summary: { type: 'insight', priority: 3 }
    };

    let { type, priority } = baseNotificationTypeMap[scenarioTyped] || { type: 'encouragement', priority: 1 };

    // 根据通知频率偏好调整优先级
    if (notificationFrequency === 'frequent') {
      priority = Math.min(priority + 1, 5); // 提高优先级，但不超过5
    } else if (notificationFrequency === 'minimal') {
      priority = Math.max(priority - 1, 1); // 降低优先级，但不低于1
    }

    // 如果是预览模式，不保存到数据库，直接返回
    if (isPreview) {
      return new Response(JSON.stringify({ 
        success: true,
        notification: {
          title: notificationData.title,
          message: notificationData.message,
          icon: notificationData.icon,
          action_text: notificationData.action_text,
          action_type: notificationData.action_type,
          notification_type: type,
          priority: priority
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 保存通知到数据库
    const { data: notification, error: insertError } = await supabase
      .from('smart_notifications')
      .insert({
        user_id: user.id,
        notification_type: type,
        scenario: scenario,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon,
        action_text: notificationData.action_text,
        action_type: notificationData.action_type,
        action_data: context || {},
        context: context,
        priority: priority
      })
      .select()
      .single();

    if (insertError) {
      console.error("保存通知失败:", insertError);
      throw insertError;
    }

    // 如果用户启用了企业微信推送，同时发送到企业微信
    if (profile?.wecom_enabled && profile?.wecom_webhook_url) {
      try {
        await supabase.functions.invoke('send-wecom-notification', {
          body: {
            webhookUrl: profile.wecom_webhook_url,
            notification: {
              title: notificationData.title,
              message: notificationData.message,
              icon: notificationData.icon,
            },
          },
        });
        console.log('通知已同步发送到企业微信');
      } catch (wecomError) {
        console.error('企业微信推送失败:', wecomError);
        // 企业微信推送失败不影响主流程，仅记录日志
      }
    }

    // 如果用户启用了微信公众号推送，同时发送模板消息
    const { data: wechatProfile } = await supabase
      .from('profiles')
      .select('wechat_enabled')
      .eq('id', user.id)
      .single();

    if (wechatProfile?.wechat_enabled) {
      try {
        await supabase.functions.invoke('send-wechat-template-message', {
          body: {
            userId: user.id,
            scenario: scenario,
            notification: {
              id: notification.id,
              title: notificationData.title,
              message: notificationData.message,
              scenario: scenario,
            },
          },
        });
        console.log('通知已同步发送到微信公众号');
      } catch (wechatError) {
        console.error('微信公众号推送失败:', wechatError);
        // 微信公众号推送失败不影响主流程，仅记录日志
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      notification
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("生成通知错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "生成通知过程出现错误，请稍后再试" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
