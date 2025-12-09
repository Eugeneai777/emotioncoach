import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPartnerRequest {
  partnerId: string;
  eventType: 'new_referral' | 'joined_group' | 'milestone_reached' | 'purchased' | 'became_partner';
  referredUserId: string;
  packageKey?: string;
  amount?: number;
  milestone?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { partnerId, eventType, referredUserId, packageKey, amount, milestone } = await req.json() as NotifyPartnerRequest;

    console.log('Notify partner:', { partnerId, eventType, referredUserId });

    // 获取合伙人信息
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('user_id')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerId);
      return new Response(JSON.stringify({ error: 'Partner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取被推荐用户信息
    const { data: referredProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', referredUserId)
      .single();

    const referredName = referredProfile?.display_name || '新用户';

    // 构建通知内容
    let title = '';
    let message = '';
    let notificationType = '';

    switch (eventType) {
      case 'new_referral':
        title = '🎉 新学员加入';
        message = `${referredName} 通过你的邀请链接注册成功！`;
        notificationType = 'partner_new_referral';
        break;
      case 'joined_group':
        title = '👥 学员已入群';
        message = `${referredName} 已加入你的学员群，可以开始跟进了！`;
        notificationType = 'partner_joined_group';
        break;
      case 'milestone_reached':
        title = `🏆 里程碑达成`;
        message = `${referredName} 完成了第${milestone}天训练营，是转化的好时机！`;
        notificationType = 'partner_milestone';
        break;
      case 'purchased':
        title = '💰 学员购买成功';
        message = `恭喜！${referredName} 购买了${packageKey === 'member365' ? '365会员' : '套餐'}，佣金将自动结算！`;
        notificationType = 'partner_purchase';
        break;
      case 'became_partner':
        title = '🌟 新合伙人诞生';
        message = `太棒了！${referredName} 成为了有劲合伙人，你将获得二级佣金收益！`;
        notificationType = 'partner_new_partner';
        break;
    }

    // 创建站内通知
    const { error: notificationError } = await supabase
      .from('smart_notifications')
      .insert({
        user_id: partner.user_id,
        title,
        message,
        notification_type: notificationType,
        priority: eventType === 'purchased' || eventType === 'became_partner' ? 'high' : 'normal',
        metadata: {
          event_type: eventType,
          referred_user_id: referredUserId,
          referred_name: referredName,
          package_key: packageKey,
          amount,
          milestone
        }
      });

    if (notificationError) {
      console.error('Create notification error:', notificationError);
    }

    // 尝试发送微信模板消息（如果配置了）
    try {
      const { data: wechatMapping } = await supabase
        .from('wechat_user_mappings')
        .select('openid')
        .eq('user_id', partner.user_id)
        .single();

      if (wechatMapping?.openid) {
        await supabase.functions.invoke('send-wechat-template-message', {
          body: {
            openid: wechatMapping.openid,
            templateId: 'partner_notification',
            data: {
              first: { value: title },
              keyword1: { value: referredName },
              keyword2: { value: message },
              remark: { value: '点击查看详情' }
            }
          }
        });
      }
    } catch (wechatError) {
      console.log('WeChat notification skipped:', wechatError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notify partner error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});