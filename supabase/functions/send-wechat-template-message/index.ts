import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 系统级模板ID配置 - 从环境变量读取或使用默认值
const SYSTEM_TEMPLATE_IDS: Record<string, string> = {
  // 打卡相关场景使用打卡模板
  'checkin_success': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_streak_milestone': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_reminder': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_streak_break_warning': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  // 登录成功使用专用模板（用户名、账号、时间结构）
  'login_success': Deno.env.get('WECHAT_TEMPLATE_LOGIN') || '',
  // 智能跟进提醒场景使用答疑提醒模板 (first, keyword1, keyword2, keyword3, remark)
  'after_briefing': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'emotion_improvement': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'goal_milestone': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'sustained_low_mood': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'inactivity': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'consistent_checkin': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  'encouragement': Deno.env.get('WECHAT_TEMPLATE_FOLLOWUP') || '',
  // 其他场景使用通用模板
  'default': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, scenario, notification } = await req.json();

    if (!userId || !scenario || !notification) {
      throw new Error('Missing required parameters');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // 获取用户是否启用微信通知
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

    // 使用系统级模板ID配置
    const templateId = SYSTEM_TEMPLATE_IDS[scenario] || SYSTEM_TEMPLATE_IDS['default'];
    if (!templateId) {
      console.log(`场景 ${scenario} 未配置系统模板ID`);
      return new Response(
        JSON.stringify({ success: false, reason: 'no_template' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 access_token（使用系统级配置）
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
    
    if (!appId || !appSecret) {
      throw new Error('WeChat AppID or AppSecret not configured');
    }

    // 获取access_token的辅助函数
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
        console.log('Direct call to WeChat API');
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

    // 场景中文映射
    const scenarioNames: Record<string, string> = {
      'daily_reminder': '每日情绪记录',
      'goal_milestone': '目标达成',
      'sustained_low_mood': '情绪关怀',
      'inactivity': '活跃度提醒',
      'weekly_report': '周报生成',
      'goal_at_risk': '目标提醒',
      'checkin_success': '打卡成功',
      'checkin_streak_milestone': '连续打卡里程碑',
      'checkin_reminder': '每日打卡提醒',
      'checkin_streak_break_warning': '打卡即将中断',
      'login_success': '登录成功',
      'after_briefing': '简报生成',
      'emotion_improvement': '情绪改善',
      'consistent_checkin': '坚持打卡',
      'encouragement': '温暖鼓励',
    };

    const scenarioName = scenarioNames[scenario] || '系统通知';

    // 根据场景选择不同的模板数据结构
    let messageData;
    
    // 获取消息内容，支持 message 或 content 字段
    const messageContent = notification.message || notification.content || '欢迎使用';
    
    // 检测打卡相关场景 (thing10, thing4, time3结构)
    const isCheckinScenario = ['checkin_success', 'checkin_streak_milestone', 'checkin_reminder', 'checkin_streak_break_warning'].includes(scenario);
    
    // 检测智能跟进场景 (first, keyword1, keyword2, keyword3, remark结构)
    const isFollowupScenario = ['after_briefing', 'emotion_improvement', 'goal_milestone', 'sustained_low_mood', 'inactivity', 'consistent_checkin', 'encouragement'].includes(scenario);
    
    if (scenario === 'login_success') {
      // 登录成功模板结构：thing3(用户名)、character_string1(账号)、time2(登录时间)
      // 格式化当前时间
      const now = new Date();
      const loginTime = now.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      messageData = {
        thing3: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        character_string1: { 
          value: (notification.account || notification.email || '***').slice(0, 32),
          color: "#173177" 
        },
        time2: { 
          value: loginTime,
          color: "#173177" 
        },
      };
    } else if (isCheckinScenario) {
      // "打卡成功通知"模板结构 (thing10学生姓名, thing4打卡名称, time3时间)
      // 使用北京标准时间 (UTC+8)
      const now = new Date();
      const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      const timeStr = `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')} ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      messageData = {
        thing10: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        thing4: { 
          value: `恭喜！已连续打卡${notification.streakDays || 1}天`.slice(0, 20),
          color: "#173177" 
        },
        time3: { 
          value: timeStr,
          color: "#173177" 
        },
      };
    } else if (isFollowupScenario) {
      // "答疑提醒"模板结构 (first, keyword1, keyword2, keyword3, remark)
      // 使用北京标准时间 (UTC+8)
      const now = new Date();
      const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      const timeStr = `${beijingTime.getUTCFullYear()}年${beijingTime.getUTCMonth() + 1}月${beijingTime.getUTCDate()}日 ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      
      // 根据场景生成开头语、核心内容和结尾语
      const scenarioMessages: Record<string, { first: string; content: string; remark: string }> = {
        'after_briefing': {
          first: '您好，您的情绪简报已生成',
          content: notification.title || '今日情绪梳理已完成，记得查看成长洞察',
          remark: '每一次记录都是成长的印记 🌿'
        },
        'emotion_improvement': {
          first: '您好，劲老师发现您的情绪正在好转',
          content: notification.title || '情绪趋势持续改善，继续保持',
          remark: '您的每一步努力都被看见 ✨'
        },
        'goal_milestone': {
          first: '🎉 恭喜您达成目标里程碑',
          content: notification.title || '目标进度已更新，快来查看',
          remark: '每一个小目标都值得庆祝 💪'
        },
        'sustained_low_mood': {
          first: '您好，劲老师想关心一下您',
          content: notification.title || '发现您最近情绪有些波动',
          remark: '无论什么时候，我都在这里陪着您 💚'
        },
        'inactivity': {
          first: '您好，好久不见，想您了',
          content: notification.title || '有空来记录一下最近的心情吧',
          remark: '慢慢来，劲老师等着您 🌸'
        },
        'consistent_checkin': {
          first: '您好，坚持的力量真棒',
          content: notification.title || `已连续记录情绪，非常了不起`,
          remark: '持续的努力终将收获美好 🌟'
        },
        'encouragement': {
          first: '您好，这是来自劲老师的问候',
          content: notification.title || '今天也要好好照顾自己哦',
          remark: '您值得被温柔以待 💝'
        }
      };
      
      const msg = scenarioMessages[scenario] || scenarioMessages['encouragement'];
      
      messageData = {
        first: { 
          value: msg.first,
          color: "#173177" 
        },
        keyword1: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        keyword2: { 
          value: msg.content.slice(0, 20),
          color: "#173177" 
        },
        keyword3: { 
          value: timeStr,
          color: "#173177" 
        },
        remark: { 
          value: msg.remark,
          color: "#173177" 
        },
      };
    } else {
      // "客户跟进提醒"模板结构 (thing1, thing19, time21) - 其他默认场景
      // 使用北京标准时间 (UTC+8)
      const now = new Date();
      const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      const timeStr = `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')} ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      
      // 根据场景设置thing19字段内容
      const scenarioThing19Map: Record<string, string> = {
        'daily_reminder': '今日情绪记录提醒',
        'weekly_report': '本周情绪报告已生成',
        'goal_at_risk': '目标风险提醒',
      };
      
      const thing19Value = scenarioThing19Map[scenario] || notification.title || '情绪提醒';
      
      messageData = {
        thing1: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        thing19: { 
          value: thing19Value.slice(0, 20),
          color: "#173177" 
        },
        time21: { 
          value: timeStr,
          color: "#173177" 
        },
      };
    }

    // 发送模板消息
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    const productionUrl = Deno.env.get('VITE_PRODUCTION_URL') || 'https://eugeneai.me';

    const messageBody = {
      touser: mapping.openid,
      template_id: templateId,
      url: `${productionUrl}/?notification=${notification.id}`,
      data: messageData,
    };

    console.log('Sending template message:', JSON.stringify(messageBody, null, 2));

    const result = await fetchWechatApi(sendUrl, {
      method: 'POST',
      body: JSON.stringify(messageBody),
    });

    

    if (result.errcode !== 0) {
      console.error('WeChat API error:', result);
      throw new Error(`WeChat API error: ${result.errmsg || 'Unknown error'}`);
    }

    // 记录发送历史
    await supabaseClient
      .from('wechat_template_messages')
      .insert({
        user_id: userId,
        openid: mapping.openid,
        template_id: templateId,
        scenario: scenario,
        data: messageData,
        url: messageBody.url,
        status: 'sent',
        msgid: result.msgid?.toString(),
      });

    console.log('微信公众号模板消息发送成功:', result.msgid);

    return new Response(
      JSON.stringify({ success: true, msgid: result.msgid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending WeChat template message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
