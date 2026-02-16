import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 套餐配额映射（复用 wechat-pay-callback 的逻辑）
const packageQuotaMap: Record<string, number> = {
  'basic': 50,
  'member365': 1000,
  'partner': 9999999,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo } = await req.json();

    if (!orderNo) {
      throw new Error('缺少订单号');
    }

    // 验证用户身份
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '未授权' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 用 anon key + 用户 token 验证身份
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: '身份验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('[ClaimGuestOrder] User:', userId, 'claiming order:', orderNo);

    // 使用 service role 操作数据库
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询订单
    const { data: order, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();

    if (queryError || !order) {
      console.error('[ClaimGuestOrder] Order not found:', orderNo);
      return new Response(
        JSON.stringify({ success: false, error: '订单不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 安全校验
    if (order.status !== 'paid') {
      return new Response(
        JSON.stringify({ success: false, error: '订单未支付' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.user_id !== null) {
      // 订单已被认领
      if (order.user_id === userId) {
        console.log('[ClaimGuestOrder] Order already belongs to this user');
        return new Response(
          JSON.stringify({ success: true, alreadyClaimed: true, message: '订单已是您的' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: '订单已被其他用户认领' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 绑定用户
    const { error: updateError } = await supabase
      .from('orders')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('order_no', orderNo)
      .is('user_id', null); // 双重保护：只更新 user_id 为 null 的

    if (updateError) {
      console.error('[ClaimGuestOrder] Update error:', updateError);
      throw new Error('订单认领失败');
    }

    console.log('[ClaimGuestOrder] Order claimed successfully:', orderNo, '-> user:', userId);

    // === 权益发放 ===
    const pkgKey = order.package_key;

    // 训练营购买
    if (pkgKey.startsWith('camp-')) {
      const campType = pkgKey.replace('camp-', '');
      const { data: campTemplate } = await supabase
        .from('camp_templates')
        .select('camp_name')
        .eq('camp_type', campType)
        .maybeSingle();

      const { error: purchaseError } = await supabase
        .from('user_camp_purchases')
        .insert({
          user_id: userId,
          camp_type: campType,
          camp_name: campTemplate?.camp_name || order.product_name || '训练营',
          purchase_price: order.amount,
          payment_method: order.pay_type || 'wechat',
          payment_status: 'completed',
          transaction_id: order.trade_no,
          purchased_at: order.paid_at || new Date().toISOString(),
          expires_at: null,
        });

      if (purchaseError) {
        console.error('[ClaimGuestOrder] Camp purchase error:', purchaseError);
      } else {
        console.log('[ClaimGuestOrder] Camp purchase recorded:', campType);
      }
    } else {
      // 非训练营：增加配额
      const quota = packageQuotaMap[pkgKey] || 0;
      if (quota > 0) {
        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('total_quota')
          .eq('user_id', userId)
          .single();

        if (userAccount) {
          await supabase
            .from('user_accounts')
            .update({
              total_quota: (userAccount.total_quota || 0) + quota,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
          console.log('[ClaimGuestOrder] Quota updated:', userId, '+', quota);
        }
      }

      // 写入 subscriptions
      const { data: subPkg } = await supabase
        .from('packages')
        .select('id, duration_days, package_name')
        .eq('package_key', pkgKey)
        .maybeSingle();

      if (subPkg) {
        const startDate = new Date(order.paid_at || new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (subPkg.duration_days || 365));

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          package_id: subPkg.id,
          subscription_type: pkgKey,
          status: 'active',
          combo_name: subPkg.package_name,
          combo_amount: order.amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }, { onConflict: 'user_id' });
        console.log('[ClaimGuestOrder] Subscription upserted:', userId);
      }
    }

    // 合伙人佣金处理
    try {
      const { data: referral } = await supabase
        .from('partner_referrals')
        .select('id, partner_id')
        .eq('referred_user_id', userId)
        .eq('level', 1)
        .maybeSingle();

      if (referral) {
        const convStatus = pkgKey === 'partner' ? 'became_partner' : 'purchased_365';
        await supabase.from('partner_referrals').update({
          conversion_status: convStatus,
          converted_at: new Date().toISOString(),
        }).eq('id', referral.id);

        try {
          await supabase.functions.invoke('calculate-commission', {
            body: {
              order_id: order.id,
              user_id: userId,
              order_amount: order.amount,
              order_type: pkgKey,
            },
          });
        } catch (e) {
          console.error('[ClaimGuestOrder] Commission error:', e);
        }
      }
    } catch (refErr) {
      console.error('[ClaimGuestOrder] Referral processing error:', refErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '订单认领成功，权益已发放',
        packageKey: pkgKey,
        packageName: order.package_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ClaimGuestOrder] Error:', error);
    const errorMessage = error instanceof Error ? error.message : '认领失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
