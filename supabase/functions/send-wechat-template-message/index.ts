import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 获取用户配置的模板ID和代理设置
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('wechat_enabled, wechat_template_ids, wechat_proxy_enabled, wechat_proxy_url, wechat_proxy_auth_token')
      .eq('id', userId)
      .single();

    if (!profile?.wechat_enabled) {
      console.log('用户未启用微信公众号推送');
      return new Response(
        JSON.stringify({ success: false, reason: 'disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 根据场景获取模板ID
    const templateId = profile.wechat_template_ids?.[scenario] || profile.wechat_template_ids?.default;
    if (!templateId) {
      console.log(`场景 ${scenario} 未配置模板ID`);
      return new Response(
        JSON.stringify({ success: false, reason: 'no_template' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 access_token
    const tokenResponse = await supabaseClient.functions.invoke('get-wechat-access-token', {
      body: { userId }
    });

    if (tokenResponse.error || !tokenResponse.data?.access_token) {
      throw new Error('Failed to get access token');
    }

    const accessToken = tokenResponse.data.access_token;

    // 获取用户显示名称
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const displayName = userProfile?.display_name || '用户';

    // 场景中文映射
    const scenarioNames: Record<string, string> = {
      'daily_reminder': '每日情绪记录',
      'goal_milestone': '目标达成',
      'sustained_low_mood': '情绪关怀',
      'inactivity': '活跃度提醒',
      'weekly_report': '周报生成',
      'goal_at_risk': '目标提醒',
    };

    const scenarioName = scenarioNames[scenario] || '系统通知';

    // 构建适配"客户跟进提醒"模板的数据结构
    const messageData = {
      thing1: { 
        value: displayName.slice(0, 20), // thing类型限制20字
        color: "#173177" 
      },
      const12: { 
        value: notification.title.slice(0, 20), // 限制长度
        color: "#173177" 
      },
      const9: { 
        value: scenarioName,
        color: "#173177" 
      },
      const14: { 
        value: notification.message.slice(0, 20), // 限制长度
        color: "#00C853" 
      },
    };

    // 发送模板消息
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const appUrl = supabaseUrl.replace('.supabase.co', '.lovableproject.com');

    const messageBody = {
      touser: mapping.openid,
      template_id: templateId,
      url: `${appUrl}/?notification=${notification.id}`,
      data: messageData,
    };

    let sendResponse;
    let result;

    // Check if proxy is enabled
    if (profile.wechat_proxy_enabled && profile.wechat_proxy_url) {
      console.log('Using proxy server for WeChat API call');
      
      // Call through proxy
      const proxyUrl = `${profile.wechat_proxy_url}/wechat-proxy`;
      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (profile.wechat_proxy_auth_token) {
        proxyHeaders['Authorization'] = `Bearer ${profile.wechat_proxy_auth_token}`;
      }
      
      sendResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({
          target_url: sendUrl,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: messageBody,
        }),
      });
      
      result = await sendResponse.json();
    } else {
      // Direct call to WeChat API
      console.log('Direct call to WeChat API');
      sendResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageBody),
      });

      result = await sendResponse.json();
    }

    if (result.errcode !== 0) {
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
