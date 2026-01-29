import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface InitiateCallRequest {
  user_id: string;
  scenario: 'care' | 'reminder' | 'reactivation' | 'camp_followup' | 'emotion_check' | 'late_night_companion' | 'gratitude_reminder' | 'todo_morning' | 'todo_noon' | 'todo_evening' | 'course_recommendation';
  coach_type?: string;
  context?: Record<string, any>;
}

const SCENARIO_PROMPTS: Record<string, string> = {
  care: '生成一句温暖关心的开场白，询问用户最近的状态，体现真诚关怀。',
  reminder: '生成一句友好的提醒开场白，提醒用户有重要事项需要关注。',
  reactivation: '生成一句亲切的问候开场白，表达对好久不见的用户的想念。',
  camp_followup: '生成一句温柔鼓励的开场白，提醒用户训练营任务还没完成。',
  emotion_check: '生成一句体贴的开场白，表达对用户近期情绪波动的关心。',
  late_night_companion: '生成一句温柔体贴的深夜问候开场白，像老朋友一样关心用户这么晚还没睡，语气要轻柔不打扰，带着陪伴和理解。',
  gratitude_reminder: '生成一句温暖的感恩提醒开场白，邀请用户一起发现生活中值得感恩的事物，语气亲切温暖。',
  todo_morning: '生成一句温暖的早晨开场白，邀请用户规划今天的待办事项，语气积极向上，充满活力。',
  todo_noon: '生成一句轻松的午间问候，询问用户上午的待办进展如何，鼓励继续加油。',
  todo_evening: '生成一句温柔的晚间问候，帮助用户回顾今日待办完成情况，关心未完成项目的原因。',
  course_recommendation: '生成一句热情的开场白，告诉用户根据他的学习情况，发现了特别适合他的成长课程想推荐给他，语气积极期待。',
};

async function generateOpeningMessage(
  scenario: string,
  context: Record<string, any>,
  userName?: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, using default message');
    return getDefaultMessage(scenario, context, userName);
  }

  try {
    // 感恩提醒场景需要根据时段调整提示词
    let scenarioPrompt = SCENARIO_PROMPTS[scenario] || SCENARIO_PROMPTS.care;
    if (scenario === 'gratitude_reminder' && context?.time_slot) {
      const slotHints: Record<string, string> = {
        morning: '鼓励用户开启充满感恩的一天，问候时提到"新的一天"或"早安"',
        noon: '邀请用户暂停片刻，回顾上午的小确幸，语气轻松愉快',
        evening: '温柔地引导用户回顾今天值得感恩的时刻，帮助用户带着感恩的心入眠',
      };
      scenarioPrompt = `生成一句温暖的感恩提醒开场白。${slotHints[context.time_slot] || slotHints.morning}`;
    }

    const prompt = `你是有劲AI生命教练。${scenarioPrompt}
用户名称：${userName || '朋友'}
${context?.recent_emotion ? `用户最近情绪：${context.recent_emotion}` : ''}
${context?.days_inactive ? `用户已${context.days_inactive}天未活跃` : ''}

要求：
- 用口语化的中文
- 简短亲切，不超过30字
- 不要用"您"，用"你"
- 直接输出开场白，不要任何解释`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error('AI generation failed:', response.status);
      return getDefaultMessage(scenario, context, userName);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    return message || getDefaultMessage(scenario, context, userName);
  } catch (error) {
    console.error('Generate opening message error:', error);
    return getDefaultMessage(scenario, context, userName);
  }
}

function getDefaultMessage(scenario: string, context?: Record<string, any>, userName?: string): string {
  const name = userName || '朋友';
  
  // 感恩提醒场景根据时段返回不同消息
  if (scenario === 'gratitude_reminder') {
    const timeSlot = context?.time_slot || 'morning';
    const gratitudeDefaults: Record<string, string> = {
      morning: `早安${name}！新的一天，想和你一起发现值得感恩的事～`,
      noon: `${name}，午间小憩，来记录一下上午的小确幸？`,
      evening: `${name}，睡前想和你聊聊今天值得感恩的时刻～`,
    };
    return gratitudeDefaults[timeSlot] || gratitudeDefaults.morning;
  }
  
  const defaults: Record<string, string> = {
    care: `嗨${name}，最近怎么样？想和你聊聊～`,
    reminder: `${name}，有件事想提醒你一下～`,
    reactivation: `好久不见${name}！想你了，过来聊聊？`,
    camp_followup: `${name}，今天的训练营任务还没完成呢，一起加油？`,
    emotion_check: `${name}，感觉你最近心情有些起伏，想关心一下你～`,
    late_night_companion: `${name}，这么晚还没睡呀？想陪你聊聊～`,
    todo_morning: `早安${name}！新的一天，想帮你规划一下今天要做的事～`,
    todo_noon: `${name}，午间小憩时间，上午的事情进展如何？`,
    todo_evening: `${name}，今天辛苦了！我们一起回顾下今天的待办吧～`,
    course_recommendation: `${name}，根据你的学习进度，我发现了几门很适合你的课程～`,
  };
  return defaults[scenario] || defaults.care;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, scenario, coach_type = 'vibrant_life', context = {} } = await req.json() as InitiateCallRequest;

    if (!user_id || !scenario) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, scenario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user_id)
      .single();

    const userName = profile?.display_name || null;

    // 检查用户余额（AI来电也需要消耗点数）
    const { data: account } = await supabase
      .from('user_accounts')
      .select('remaining_quota')
      .eq('user_id', user_id)
      .single();

    if (!account || account.remaining_quota < 8) {
      console.log(`User ${user_id} has insufficient quota for AI call`);
      return new Response(
        JSON.stringify({ error: 'insufficient_quota', message: 'User has insufficient quota' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查是否有进行中的来电
    const { data: existingCall } = await supabase
      .from('ai_coach_calls')
      .select('id')
      .eq('user_id', user_id)
      .in('call_status', ['pending', 'ringing', 'connected'])
      .limit(1)
      .maybeSingle();

    if (existingCall) {
      console.log(`User ${user_id} already has an active AI call`);
      return new Response(
        JSON.stringify({ error: 'call_in_progress', message: 'User already has an active call' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 生成AI开场白
    const openingMessage = await generateOpeningMessage(scenario, context, userName || undefined);
    
    // 确定教练类型（感恩提醒场景使用 gratitude 教练）
    const finalCoachType = scenario === 'gratitude_reminder' ? 'gratitude' : coach_type;

    // 创建来电记录
    const { data: call, error: insertError } = await supabase
      .from('ai_coach_calls')
      .insert({
        user_id,
        scenario,
        coach_type: finalCoachType,
        opening_message: openingMessage,
        context,
        call_status: 'ringing',
        ring_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert call error:', insertError);
      throw insertError;
    }

    console.log(`AI call initiated for user ${user_id}:`, call.id);

    // 发送微信模板消息作为备用通知
    try {
      await supabase.functions.invoke('send-wechat-template-message', {
        body: {
          userId: user_id,
          scenario: 'ai_coach_calling',
          title: '有劲AI教练来电',
          content: openingMessage,
        },
      });
    } catch (wechatError) {
      console.warn('WeChat notification failed:', wechatError);
      // 不影响主流程
    }

    // 设置30秒超时自动标记为 missed（使用后台任务）
    const handleTimeout = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30000));
      
      // 检查通话状态
      const { data: currentCall } = await supabase
        .from('ai_coach_calls')
        .select('call_status')
        .eq('id', call.id)
        .single();

      if (currentCall?.call_status === 'ringing') {
        await supabase
          .from('ai_coach_calls')
          .update({
            call_status: 'missed',
            ended_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        console.log(`AI call ${call.id} marked as missed (timeout)`);
      }
    };

    // 启动后台超时处理（不阻塞响应）
    handleTimeout().catch(console.error);

    return new Response(
      JSON.stringify({
        success: true,
        call_id: call.id,
        opening_message: openingMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Initiate AI call error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
