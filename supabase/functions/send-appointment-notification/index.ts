import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 通知场景类型 - 新增教练端和完成通知场景
type NotificationScenario = 
  | 'appointment_confirmed'         // 预约确认 (用户)
  | 'appointment_reminder'          // 预约开始提醒 (用户)
  | 'review_invitation'             // 评价邀请 (用户)
  | 'appointment_cancelled'         // 预约取消 (用户)
  | 'appointment_rescheduled'       // 预约改期 (用户)
  | 'appointment_completed'         // 咨询完成 (用户)
  | 'coach_new_appointment'         // 教练收到新预约
  | 'coach_appointment_reminder'    // 教练即将开始提醒
  | 'coach_appointment_cancelled';  // 教练收到取消通知

interface AppointmentNotificationRequest {
  userId?: string;           // 用户ID（用户端通知）
  coachId?: string;          // 教练ID（教练端通知）
  scenario: NotificationScenario;
  appointmentId: string;
  coachName?: string;
  appointmentDate?: string;
  startTime?: string;
  serviceName?: string;
  minutesBefore?: number;
  skipDuplicateCheck?: boolean;  // 跳过重复检查（用于特殊情况）
}

// 格式化日期时间
const formatDateTime = (date: string, time: string): string => {
  return `${date} ${time.substring(0, 5)}`;
};

// 生成通知内容 - 用户端
const generateUserNotificationContent = (
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
    
    case 'appointment_completed':
      return {
        thing1: `${displayName}，咨询已结束`,
        thing19: `与${coachName}的${serviceName}`,
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

// 生成通知内容 - 教练端
const generateCoachNotificationContent = (
  scenario: NotificationScenario,
  data: {
    coachName: string;
    userName: string;
    appointmentDate: string;
    startTime: string;
    serviceName: string;
    minutesBefore?: number;
  }
): { thing1: string; thing19: string; time21: string } => {
  const { coachName, userName, appointmentDate, startTime, serviceName, minutesBefore } = data;
  const dateTimeStr = formatDateTime(appointmentDate, startTime);
  
  switch (scenario) {
    case 'coach_new_appointment':
      return {
        thing1: `${coachName}老师，您有新预约`,
        thing19: `学员：${userName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    case 'coach_appointment_reminder':
      const reminderText = minutesBefore && minutesBefore <= 60 
        ? `${minutesBefore}分钟后开始` 
        : minutesBefore && minutesBefore > 60 
          ? `${Math.floor(minutesBefore / 60)}小时后开始`
          : '即将开始';
      return {
        thing1: `${coachName}老师，咨询${reminderText}`,
        thing19: `学员：${userName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    case 'coach_appointment_cancelled':
      return {
        thing1: `${coachName}老师，预约已取消`,
        thing19: `学员：${userName} - ${serviceName}`,
        time21: dateTimeStr,
      };
    
    default:
      return {
        thing1: `${coachName}老师，您有新的咨询通知`,
        thing19: `学员：${userName}`,
        time21: dateTimeStr,
      };
  }
};

// 生成备注 - 用户端
const generateUserRemark = (scenario: NotificationScenario): string => {
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
    case 'appointment_completed':
      return '感谢您的信任，期待下次相见 ✨';
    default:
      return '点击查看详情';
  }
};

// 生成备注 - 教练端
const generateCoachRemark = (scenario: NotificationScenario): string => {
  switch (scenario) {
    case 'coach_new_appointment':
      return '请准时准备，点击查看预约详情 📋';
    case 'coach_appointment_reminder':
      return '请做好准备，准时开始咨询 ⏰';
    case 'coach_appointment_cancelled':
      return '时间段已自动释放 📅';
    default:
      return '点击查看详情';
  }
};

// 判断是否为教练端场景
const isCoachScenario = (scenario: NotificationScenario): boolean => {
  return scenario.startsWith('coach_');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AppointmentNotificationRequest = await req.json();
    const { userId, coachId, scenario, appointmentId, minutesBefore, skipDuplicateCheck } = request;

    // 验证必要参数
    const isCoach = isCoachScenario(scenario);
    const recipientId = isCoach ? coachId : userId;
    
    if (!recipientId || !scenario || !appointmentId) {
      throw new Error(`Missing required parameters: ${isCoach ? 'coachId' : 'userId'}, scenario, appointmentId`);
    }

    console.log(`发送预约通知 - ${isCoach ? '教练' : '用户'}: ${recipientId}, 场景: ${scenario}, 预约ID: ${appointmentId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 防重复发送检查
    if (!skipDuplicateCheck) {
      const { data: existingLog, error: logError } = await supabaseClient
        .from('appointment_notification_logs')
        .select('id')
        .eq('appointment_id', appointmentId)
        .eq('scenario', scenario)
        .eq('recipient_id', recipientId)
        .maybeSingle();

      if (logError) {
        console.warn('检查重复日志失败:', logError);
      }

      if (existingLog) {
        console.log('该通知已发送过，跳过:', scenario, appointmentId);
        return new Response(
          JSON.stringify({ success: false, reason: 'already_sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 获取预约详情
    const { data: appointment, error: appError } = await supabaseClient
      .from('coaching_appointments')
      .select(`
        *,
        human_coaches (
          id,
          name,
          avatar_url,
          user_id
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appError || !appointment) {
      console.error('获取预约信息失败:', appError);
      throw new Error('Appointment not found');
    }

    // 根据场景确定通知目标
    let targetUserId: string;
    let openId: string | null = null;
    let displayName: string = '用户';
    let coachName: string = (appointment.human_coaches as any)?.name || '教练';
    let userName: string = '学员';

    if (isCoach) {
      // 教练端通知 - 需要教练的 user_id
      const coachUserId = (appointment.human_coaches as any)?.user_id;
      if (!coachUserId) {
        console.log('教练未绑定系统用户');
        return new Response(
          JSON.stringify({ success: false, reason: 'coach_not_linked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = coachUserId;

      // 获取用户名称用于教练通知内容
      const { data: userProfile } = await supabaseClient
        .from('profiles')
        .select('display_name')
        .eq('id', appointment.user_id)
        .single();
      userName = userProfile?.display_name || '学员';
    } else {
      // 用户端通知
      targetUserId = userId!;
    }

    // 获取目标用户的 OpenID 和配置
    const { data: mapping, error: mappingError } = await supabaseClient
      .from('wechat_user_mappings')
      .select('openid, subscribe_status')
      .eq('system_user_id', targetUserId)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.log('目标用户尚未绑定微信公众号');
      return new Response(
        JSON.stringify({ success: false, reason: 'not_bound' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mapping.subscribe_status) {
      console.log('目标用户已取消关注公众号');
      return new Response(
        JSON.stringify({ success: false, reason: 'unsubscribed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    openId = mapping.openid;

    // 获取用户配置
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wechat_enabled, display_name')
      .eq('id', targetUserId)
      .single();

    if (!profile?.wechat_enabled) {
      console.log('目标用户未启用微信公众号推送');
      return new Response(
        JSON.stringify({ success: false, reason: 'disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    displayName = profile?.display_name || '用户';

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

    // 生成通知内容
    let content: { thing1: string; thing19: string; time21: string };
    let remark: string;

    if (isCoach) {
      content = generateCoachNotificationContent(scenario, {
        coachName,
        userName,
        appointmentDate: appointment.appointment_date,
        startTime: appointment.start_time,
        serviceName: appointment.service_name || '咨询服务',
        minutesBefore,
      });
      remark = generateCoachRemark(scenario);
    } else {
      content = generateUserNotificationContent(scenario, {
        displayName,
        coachName,
        appointmentDate: appointment.appointment_date,
        startTime: appointment.start_time,
        serviceName: appointment.service_name || '咨询服务',
        minutesBefore,
      });
      remark = generateUserRemark(scenario);
    }

    // 构建跳转URL
    const productionUrl = Deno.env.get('VITE_PRODUCTION_URL') || 'https://wechat.eugenewe.net';
    let redirectUrl = `${productionUrl}/my-appointments`;
    if (scenario === 'review_invitation') {
      redirectUrl = `${productionUrl}/coach/${appointment.coach_id}?review=${appointmentId}`;
    } else if (isCoach) {
      // 教练端跳转到教练后台（如果有的话）
      redirectUrl = `${productionUrl}/my-appointments`;
    }

    // 发送模板消息
    const templateMessage = {
      touser: openId,
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

    // 记录发送日志（防重复）- 使用 upsert 替代 onConflict
    const { error: logInsertError } = await supabaseClient
      .from('appointment_notification_logs')
      .upsert({
        appointment_id: appointmentId,
        scenario,
        recipient_type: isCoach ? 'coach' : 'user',
        recipient_id: recipientId,
      }, { 
        onConflict: 'appointment_id,scenario,recipient_id',
        ignoreDuplicates: true 
      });

    if (logInsertError) {
      console.warn('记录通知日志失败:', logInsertError);
    }

    // 同时创建应用内通知（仅用户端）
    if (!isCoach) {
      const notificationTitle: Record<string, string> = {
        appointment_confirmed: '预约确认',
        appointment_reminder: '预约提醒',
        review_invitation: '评价邀请',
        appointment_cancelled: '预约取消',
        appointment_rescheduled: '预约改期',
        appointment_completed: '咨询完成',
        coach_new_appointment: '新预约通知',
        coach_appointment_reminder: '预约提醒',
        coach_appointment_cancelled: '预约取消',
      };

      await supabaseClient
        .from('smart_notifications')
        .insert({
          user_id: userId,
          notification_type: 'appointment',
          scenario,
          title: notificationTitle[scenario] || '预约通知',
          message: `${content.thing19} - ${content.time21}`,
          icon: '📅',
          action_type: 'navigate',
          action_data: { url: scenario === 'review_invitation' ? `/coach/${appointment.coach_id}?review=${appointmentId}` : '/my-appointments' },
          priority: scenario === 'appointment_reminder' ? 10 : 5,
          coach_type: 'human_coach',
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        msgid: sendResult.msgid,
        scenario,
        appointmentId,
        recipientType: isCoach ? 'coach' : 'user',
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
