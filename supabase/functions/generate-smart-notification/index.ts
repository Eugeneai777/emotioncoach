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
    type Scenario = 'after_briefing' | 'goal_milestone' | 'emotion_improvement' | 'consistent_checkin' | 'inactivity' | 'sustained_low_mood' | 'encouragement';

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
      goal_milestone: `用户在目标"${context?.goal_description}"上取得了里程碑进展（${context?.progress_percentage}%完成）。请为他们庆祝这个成就。`,
      emotion_improvement: `用户的情绪趋势正在改善！最近的平均强度从${context?.baseline_intensity}降低到${context?.current_intensity}。请给予积极的反馈。`,
      consistent_checkin: `用户已经连续${context?.streak_days}天坚持记录情绪。这是很了不起的坚持！请给予认可和鼓励。`,
      inactivity: `用户已经${context?.days_inactive}天没有记录情绪了，但还有${context?.active_goals_count}个活跃目标。请用温柔的方式提醒他们。`,
      sustained_low_mood: `用户最近${context?.consecutive_days}天的情绪强度持续较高（平均${context?.avg_intensity}/10）。请给予关怀和支持建议。`,
      encouragement: `这是一条常规的鼓励通知，展示你的陪伴风格。用户当前${activeGoals?.length || 0}个活跃目标${activeGoals?.length ? '正在进行中' : ''}。`
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
  "title": "通知标题（8-15字，吸引注意但不夸张）",
  "message": "通知正文（根据风格调整长度：gentle 50-80字，cheerful 40-60字，motivational 35-55字）",
  "icon": "emoji图标（如🌸、✨、💪、🎉、🌿等，根据风格选择合适的）",
  "action_text": "行动按钮文字（4-8字，可选）",
  "action_type": "行动类型（navigate/open_dialog/dismiss）"
}

风格要求：
- **${encouragementStyle}风格**：${styleDescriptions[encouragementStyle]}
- 称呼用户为"${displayName}"（如果不是"朋友"的话）
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
      goal_milestone: { type: 'celebration', priority: 4 },
      emotion_improvement: { type: 'insight', priority: 3 },
      consistent_checkin: { type: 'encouragement', priority: 3 },
      inactivity: { type: 'reminder', priority: 2 },
      sustained_low_mood: { type: 'care', priority: 5 },
      encouragement: { type: 'encouragement', priority: 1 }
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
