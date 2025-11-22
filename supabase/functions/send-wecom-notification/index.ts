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
    const { userId, notification, useWebhook = false, webhookUrl } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!notification || !notification.title || !notification.message) {
      throw new Error("Valid notification data is required");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取用户的企业微信配置
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('wecom_corp_id, wecom_corp_secret, wecom_agent_id, wecom_webhook_url, wecom_enabled')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    if (!profile.wecom_enabled) {
      throw new Error('WeChat Work integration is not enabled');
    }

    // 方式1: 使用 Webhook（群机器人）
    if (useWebhook || webhookUrl) {
      const url = webhookUrl || profile.wecom_webhook_url;
      if (!url) {
        throw new Error("Webhook URL is required for webhook mode");
      }

      const markdown = `# ${notification.icon || '📢'} ${notification.title}\n\n${notification.message}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: { content: markdown },
        }),
      });

      const result = await response.json();
      if (result.errcode !== 0) {
        throw new Error(`WeChat Work Webhook error: ${result.errmsg || 'Unknown error'}`);
      }

      console.log('WeChat Work notification sent via webhook');
      return new Response(
        JSON.stringify({ success: true, method: 'webhook' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 方式2: 使用应用消息 API
    const { wecom_corp_id, wecom_corp_secret, wecom_agent_id } = profile;

    if (!wecom_corp_id || !wecom_corp_secret || !wecom_agent_id) {
      throw new Error('WeChat Work application credentials not configured');
    }

    // 获取 access_token
    const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${wecom_corp_id}&corpsecret=${wecom_corp_secret}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode !== 0) {
      throw new Error(`Failed to get access_token: ${tokenData.errmsg || 'Unknown error'}`);
    }

    const accessToken = tokenData.access_token;

    // 获取用户的企业微信 UserID（从 wecom_user_mappings 表）
    const { data: mapping } = await supabaseClient
      .from('wecom_user_mappings')
      .select('wecom_user_id')
      .eq('system_user_id', userId)
      .single();

    const toUser = mapping?.wecom_user_id || '@all';

    // 构造消息内容
    const messageContent = `${notification.icon || '📢'} **${notification.title}**\n\n${notification.message}`;

    // 发送应用消息
    const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: toUser,
        msgtype: 'text',
        agentid: parseInt(wecom_agent_id),
        text: {
          content: messageContent,
        },
      }),
    });

    const sendResult = await sendResponse.json();

    if (sendResult.errcode !== 0) {
      throw new Error(`Failed to send message: ${sendResult.errmsg || 'Unknown error'}`);
    }

    console.log('WeChat Work notification sent via application API');

    return new Response(
      JSON.stringify({
        success: true,
        method: 'application',
        invaliduser: sendResult.invaliduser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending WeChat Work notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
