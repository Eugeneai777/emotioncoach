import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, openId, phone, verifyCode, nickname } = await req.json();

    if (!orderNo) {
      throw new Error('缺少订单号');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. 验证订单
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();

    if (orderError || !order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'paid') {
      throw new Error('订单未支付');
    }

    // 2. 检查是否已绑定用户
    if (order.user_id && order.user_id !== 'guest') {
      // 订单已绑定用户，直接返回
      return new Response(JSON.stringify({
        success: true,
        userId: order.user_id,
        message: '订单已绑定用户'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let userId: string;
    let session: any = null;

    // 3. 创建或绑定用户
    if (openId) {
      // 微信用户 - 检查是否已存在
      const { data: existingMapping } = await supabaseAdmin
        .from('wechat_user_mappings')
        .select('system_user_id')
        .eq('openid', openId)
        .limit(1)
        .maybeSingle();

      if (existingMapping?.system_user_id) {
        // 已有账号，直接绑定
        userId = existingMapping.system_user_id;
      } else {
        // 创建新账号
        const email = `wx_${openId.slice(0, 16)}@youjin.app`;
        const password = `wx_${crypto.randomUUID()}`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            wechat_openid: openId,
            display_name: nickname || '有劲用户'
          }
        });

        if (authError) throw authError;
        userId = authData.user.id;

        // 创建微信映射
        await supabaseAdmin.from('wechat_user_mappings').insert({
          openid: openId,
          system_user_id: userId,
          unionid: null
        });

        // 更新 profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          display_name: nickname || '有劲用户'
        });

        // 生成登录session
        const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });
        
        // 实际场景中需要更好的session处理
        console.log('User created:', userId);
      }
    } else if (phone && verifyCode) {
      // 手机号注册 - 验证验证码
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('sms_verification_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', verifyCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!codeData) {
        throw new Error('验证码无效或已过期');
      }

      // 标记验证码已使用
      await supabaseAdmin
        .from('sms_verification_codes')
        .update({ is_used: true })
        .eq('id', codeData.id);

      // 检查手机号是否已注册
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // 创建新账号
        const email = `phone_${phone}@youjin.app`;
        const password = `phone_${crypto.randomUUID()}`;

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            phone,
            display_name: nickname || '有劲用户'
          }
        });

        if (authError) throw authError;
        userId = authData.user.id;

        // 更新 profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          phone,
          display_name: nickname || '有劲用户'
        });
      }
    } else {
      throw new Error('请提供微信或手机号信息');
    }

    // 4. 更新订单绑定用户
    await supabaseAdmin
      .from('orders')
      .update({ user_id: userId })
      .eq('id', order.id);

    // 5. 获取套餐信息
    const { data: packageData } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('package_key', order.package_key)
      .single();

    if (packageData) {
      // 6. 创建订阅记录
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (packageData.duration_days || 365));

      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        package_id: packageData.id,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_amount: order.amount
      });

      // 7. 更新用户额度
      const { data: existingAccount } = await supabaseAdmin
        .from('user_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingAccount) {
        await supabaseAdmin
          .from('user_accounts')
          .update({
            total_quota: existingAccount.total_quota + (packageData.ai_quota || 0),
            quota_expires_at: endDate.toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabaseAdmin.from('user_accounts').insert({
          user_id: userId,
          total_quota: packageData.ai_quota || 50,
          used_quota: 0,
          quota_expires_at: endDate.toISOString()
        });
      }
    }

    // 8. 处理合伙人分润
    if (order.partner_id) {
      try {
        const commission = order.amount * 0.2; // 20% 佣金
        await supabaseAdmin.rpc('add_partner_pending_balance', {
          p_partner_id: order.partner_id,
          p_amount: commission
        });

        // 记录推荐
        await supabaseAdmin.from('partner_referrals').insert({
          partner_id: order.partner_id,
          referred_user_id: userId,
          referral_type: 'purchase',
          order_id: order.id
        });
      } catch (e) {
        console.error('Partner commission error:', e);
      }
    }

    console.log('User created/bound successfully:', userId);

    return new Response(JSON.stringify({
      success: true,
      userId,
      session,
      message: '账号创建成功'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('create-user-from-payment error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || '创建失败'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
