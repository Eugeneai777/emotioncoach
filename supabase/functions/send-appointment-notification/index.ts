import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 通知场景类型
type NotificationScenario = 
  | 'appointment_confirmed'      // 预约确认
  | 'appointment_reminder'       // 预约开始提醒
  | 'review_invitation'          // 评价邀请
  | 'appointment_cancelled'      // 预约取消
  | 'appointment_rescheduled';   // 预约改期

interface AppointmentNotificationRequest {
  userId: string;
  scenario: NotificationScenario;
  appointmentId: string;
  coachName?: string;
  appointmentDate?: string;
  startTime?: string;
  serviceName?: string;
  minutesBefore?: number;
}

// 格式化日期时间
const formatDateTime = (date: string, time: string): string => {
  return `${date} ${time.substring(0, 5)}`;
};

// 生成通知内容
const generateNotificationContent = (
  scenario: NotificationScenario,
  data: {
    displayName: string;
    coachName: string;
    appointmentDate: string;
    startTime: string;
    serviceName: string;
    minutesBefore?: number;
  }
): { thing1: string; thing19: string; time21: string } => {
  const { displayName, coachName, appointmentDate, startTime, serviceName, minutesBefore } = data;
  const dateTimeStr = formatDateTime(appointmentDate, startTime);
  
  switch (scenario) {
    case 'appointment_confirmed':
      return {
        thing1: `您好${displayName}，预约已确认`,
        thing19: `${coachName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    case 'appointment_reminder':
      const reminderText = minutesBefore && minutesBefore <= 60 
        ? `距离开始还有${minutesBefore}分钟` 
        : minutesBefore && minutesBefore > 60 
          ? `距离开始还有${Math.floor(minutesBefore / 60)}小时`
          : '即将开始';
      return {
        thing1: `${displayName}，您的咨询${reminderText}`,
        thing19: `${coachName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    case 'review_invitation':
      return {
        thing1: `${displayName}，感谢您的信任`,
        thing19: `与${coachName}的咨询已结束`,
        time21: dateTimeStr,
      };
    
    case 'appointment_cancelled':
      return {
        thing1: `${displayName}，预约已取消`,
        thing19: `${coachName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    case 'appointment_rescheduled':
      return {
        thing1: `${displayName}，预约时间已更改`,
        thing19: `${coachName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    default:
      return {
        thing1: `${displayName}，您有新的咨询通知`,
        thing19: `${coachName}`,
        time21: dateTimeStr,
      };
  }
};

// 生成备注
const generateRemark = (scenario: NotificationScenario): string => {
  switch (scenario) {
    case 'appointment_confirmed':
      return '请准时参加，如需改期请提前联系 📅';
    case 'appointment_reminder':
      return '请做好准备，点击查看会议链接 🔔';
    case 'review_invitation':
      return '您的评价对我们很重要，点击留下反馈 ⭐';
    case 'appointment_cancelled':
      return '如有疑问请联系客服 💬';
    case 'appointment_rescheduled':
      return '请确认新的时间安排 📆';
    default:
      return '点击查看详情';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AppointmentNotificationRequest = await req.json();
    const { userId, scenario, appointmentId, minutesBefore } = request;

    if (!userId || !scenario || !appointmentId) {
      throw new Error('Missing required parameters: userId, scenario, appointmentId');
    }

    console.log(`发送预约通知 - 用户: ${userId}, 场景: ${scenario}, 预约ID: ${appointmentId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取预约详情
    const { data: appointment, error: appError } = await supabaseClient
      .from('coaching_appointments')
      .select(`
        *,
        human_coaches (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appError || !appointment) {
      console.error('获取预约信息失败:', appError);
      throw new Error('Appointment not found');
    }

    // 获取用户的 OpenID 和配置
    const { data: mapping, error: mappingError } = await supabaseClient
      .from('wechat_user_mappings')
      .select('openid, subscribe_status')
      .eq('system_user_id', userId)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.log('用户尚未绑定微信公众号');
      return new Response(
        JSON.stringify({ success: false, reason: 'not_bound' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mapping.subscribe_status) {
      console.log('用户已取消关注公众号');
      return new Response(
        JSON.stringify({ success: false, reason: 'unsubscribed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户配置
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wechat_enabled, display_name')
      .eq('id', userId)
      .single();

    if (!profile?.wechat_enabled) {
      console.log('用户未启用微信公众号推送');
      return new Response(
        JSON.stringify({ success: false, reason: 'disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取模板ID
    const templateId = Deno.env.get('WECHAT_TEMPLATE_APPOINTMENT') || Deno.env.get('WECHAT_TEMPLATE_DEFAULT');
    if (!templateId) {
      console.log('未配置预约模板ID');
      return new Response(
        JSON.stringify({ success: false, reason: 'no_template' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 access_token
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    if (!appId || !appSecret) {
      throw new Error('WeChat AppID or AppSecret not configured');
    }

    // API调用辅助函数
    const fetchWechatApi = async (url: string, options?: { method?: string; body?: string }) => {
      if (proxyUrl) {
        console.log('Using proxy server for WeChat API call');
        const proxyHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (proxyToken) {
          proxyHeaders['Authorization'] = `Bearer ${proxyToken}`;
        }
        
        const proxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
          method: 'POST',
          headers: proxyHeaders,
          body: JSON.stringify({
            target_url: url,
            method: options?.method || 'GET',
            headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options?.body ? JSON.parse(options.body) : undefined,
          }),
        });
        
        const proxyData = await proxyResponse.json();
        return proxyData.data || proxyData;
      } else {
        const response = await fetch(url, {
          method: options?.method || 'GET',
          headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
          body: options?.body,
        });
        return response.json();
      }
    };

    // 获取access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenData = await fetchWechatApi(tokenUrl);

    if (tokenData.errcode) {
      throw new Error(`Failed to get access token: ${tokenData.errmsg}`);
    }

    const accessToken = tokenData.access_token;
    const displayName = profile?.display_name || '用户';
    const coachName = (appointment.human_coaches as any)?.name || '教练';

    // 生成通知内容
    const content = generateNotificationContent(scenario, {
      displayName,
      coachName,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      serviceName: appointment.service_name || '咨询服务',
      minutesBefore,
    });

    const remark = generateRemark(scenario);

    // 构建跳转URL
    const productionUrl = Deno.env.get('VITE_PRODUCTION_URL') || 'https://wechat.eugenewe.net';
    let redirectUrl = `${productionUrl}/my-appointments`;
    if (scenario === 'review_invitation') {
      redirectUrl = `${productionUrl}/coach/${appointment.coach_id}?review=${appointmentId}`;
    }

    // 发送模板消息
    const templateMessage = {
      touser: mapping.openid,
      template_id: templateId,
      url: redirectUrl,
      data: {
        thing1: { value: content.thing1.substring(0, 20) },
        thing19: { value: content.thing19.substring(0, 20) },
        time21: { value: content.time21 },
      },
    };

    console.log('发送模板消息:', JSON.stringify(templateMessage));

    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    const sendResult = await fetchWechatApi(sendUrl, {
      method: 'POST',
      body: JSON.stringify(templateMessage),
    });

    if (sendResult.errcode && sendResult.errcode !== 0) {
      console.error('发送模板消息失败:', sendResult);
      throw new Error(`Failed to send template message: ${sendResult.errmsg}`);
    }

    console.log('模板消息发送成功:', sendResult);

    // 同时创建应用内通知
    const notificationTitle = {
      appointment_confirmed: '预约确认',
      appointment_reminder: '预约提醒',
      review_invitation: '评价邀请',
      appointment_cancelled: '预约取消',
      appointment_rescheduled: '预约改期',
    }[scenario] || '预约通知';

    await supabaseClient
      .from('smart_notifications')
      .insert({
        user_id: userId,
        notification_type: 'appointment',
        scenario,
        title: notificationTitle,
        message: `${content.thing19} - ${content.time21}`,
        icon: '📅',
        action_type: 'navigate',
        action_data: { url: scenario === 'review_invitation' ? `/coach/${appointment.coach_id}?review=${appointmentId}` : '/my-appointments' },
        priority: scenario === 'appointment_reminder' ? 10 : 5,
        coach_type: 'human_coach',
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        msgid: sendResult.msgid,
        scenario,
        appointmentId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('预约通知发送失败:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
