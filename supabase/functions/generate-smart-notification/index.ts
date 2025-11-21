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
      .select('preferred_encouragement_style, companion_type, display_name')
      .eq('id', user.id)
      .single();

    type EncouragementStyle = 'gentle' | 'cheerful' | 'motivational';
    type CompanionType = 'jing_teacher' | 'friend' | 'coach';
    type Scenario = 'after_briefing' | 'goal_milestone' | 'emotion_improvement' | 'consistent_checkin' | 'inactivity' | 'sustained_low_mood';

    const encouragementStyle = (profile?.preferred_encouragement_style || 'gentle') as EncouragementStyle;
    const companionType = (profile?.companion_type || 'jing_teacher') as CompanionType;
    const displayName = profile?.display_name || '朋友';
    const scenarioTyped = scenario as Scenario;

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
      sustained_low_mood: `用户最近${context?.consecutive_days}天的情绪强度持续较高（平均${context?.avg_intensity}/10）。请给予关怀和支持建议。`
    };

    const styleDescriptions: Record<EncouragementStyle, string> = {
      gentle: '语气温柔、平和，像知心朋友般的关怀',
      cheerful: '语气活泼、积极，充满正能量',
      motivational: '语气激励、有力，激发行动力'
    };

    const companionDescriptions: Record<CompanionType, string> = {
      jing_teacher: '像一位温和的心理咨询师',
      friend: '像一个贴心的好朋友',
      coach: '像一位专业的成长教练'
    };

    const promptText = `你是一位${companionDescriptions[companionType]}，正在为用户${displayName}生成个性化的通知消息。

场景：${scenarioPrompts[scenarioTyped] || '常规鼓励'}

用户风格偏好：${styleDescriptions[encouragementStyle]}

用户最近情绪：${recentBriefings?.map(b => `${b.emotion_theme}(${b.emotion_intensity}/10)`).join('、') || '暂无数据'}

用户活跃目标数：${activeGoals?.length || 0}

请生成一条温暖、个性化的通知消息，以JSON格式返回：
{
  "title": "通知标题（8-15字，吸引注意但不夸张）",
  "message": "通知正文（40-80字，温暖、具体、可操作）",
  "icon": "lucide图标名称（如Heart、Star、Sparkles、Trophy等）",
  "action_text": "行动按钮文字（4-8字）",
  "action_type": "行动类型（navigate/open_dialog/dismiss）"
}

要求：
- 称呼用户为"${displayName}"（如果有的话）
- 语气符合${encouragementStyle}风格
- 结合用户的实际情况，给出具体的肯定或建议
- 避免空洞的赞美，要真诚和有温度
- 保持积极但不过度乐观
- 如果是提醒类型，要温柔而不带责备

请确保返回纯JSON格式。`;

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

    // 确定通知类型和优先级
    const notificationTypeMap: Record<Scenario, { type: string; priority: number }> = {
      after_briefing: { type: 'encouragement', priority: 2 },
      goal_milestone: { type: 'celebration', priority: 4 },
      emotion_improvement: { type: 'insight', priority: 3 },
      consistent_checkin: { type: 'encouragement', priority: 3 },
      inactivity: { type: 'reminder', priority: 2 },
      sustained_low_mood: { type: 'care', priority: 5 }
    };

    const { type, priority } = notificationTypeMap[scenarioTyped] || { type: 'encouragement', priority: 1 };

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
