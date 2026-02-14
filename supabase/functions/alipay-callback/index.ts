import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// RSA-SHA256验签
async function verifySignature(params: Record<string, string>, publicKeyPem: string): Promise<boolean> {
  try {
    const sign = params.sign;
    const signType = params.sign_type;
    
    if (!sign || signType !== 'RSA2') {
      console.log('[AlipayCallback] Invalid sign or sign_type');
      return false;
    }

    // 构建待验签字符串（排除 sign 和 sign_type）
    const sortedKeys = Object.keys(params).filter(k => k !== 'sign' && k !== 'sign_type').sort();
    const parts: string[] = [];
    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        parts.push(`${key}=${value}`);
      }
    }
    const signContent = parts.join('&');

    // 清理公钥格式
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(sign), c => c.charCodeAt(0));
    const encoder = new TextEncoder();

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      encoder.encode(signContent)
    );

    return isValid;
  } catch (error) {
    console.error('[AlipayCallback] Verify signature error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 解析表单数据
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log('[AlipayCallback] Received callback:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      trade_status: params.trade_status,
      total_amount: params.total_amount,
    });

    // 验证签名
    const publicKey = Deno.env.get('ALIPAY_PUBLIC_KEY');
    if (!publicKey) {
      console.error('[AlipayCallback] ALIPAY_PUBLIC_KEY not configured');
      return new Response('fail', { headers: corsHeaders });
    }

    const isValid = await verifySignature(params, publicKey);
    if (!isValid) {
      console.error('[AlipayCallback] Signature verification failed');
      return new Response('fail', { headers: corsHeaders });
    }

    console.log('[AlipayCallback] Signature verified successfully');

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderNo = params.out_trade_no;
    const tradeNo = params.trade_no;
    const tradeStatus = params.trade_status;

    // 只处理支付成功的通知
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // 查询订单
      const { data: order, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_no', orderNo)
        .single();

      if (queryError || !order) {
        console.error('[AlipayCallback] Order not found:', orderNo);
        return new Response('fail', { headers: corsHeaders });
      }

      // 检查是否已处理
      if (order.status === 'paid') {
        console.log('[AlipayCallback] Order already paid:', orderNo);

        // 自愈逻辑：检查 subscription 是否存在，不存在则补建
        if (order.user_id && order.package_key && !order.package_key.startsWith('camp-')) {
          try {
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('user_id', order.user_id)
              .maybeSingle();

            if (!existingSub) {
              const { data: subPkg } = await supabase
                .from('packages')
                .select('id, duration_days, package_name')
                .eq('package_key', order.package_key)
                .maybeSingle();
              if (subPkg) {
                const startDate = new Date(order.paid_at || new Date());
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + (subPkg.duration_days || 365));
                await supabase.from('subscriptions').upsert({
                  user_id: order.user_id,
                  package_id: subPkg.id,
                  subscription_type: order.package_key,
                  status: 'active',
                  combo_name: subPkg.package_name,
                  combo_amount: order.amount,
                  start_date: startDate.toISOString(),
                  end_date: endDate.toISOString(),
                }, { onConflict: 'user_id' });
                console.log('[AlipayCallback] Repaired missing subscription:', order.user_id);
              }
            }
          } catch (repairErr) {
            console.error('[AlipayCallback] Subscription repair error:', repairErr);
          }
        }

        return new Response('success', { headers: corsHeaders });
      }

      // 更新订单状态
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          trade_no: tradeNo,
          paid_at: new Date().toISOString(),
        })
        .eq('order_no', orderNo);

      if (updateError) {
        console.error('[AlipayCallback] Failed to update order:', updateError);
        return new Response('fail', { headers: corsHeaders });
      }

      console.log('[AlipayCallback] Order updated successfully:', orderNo);

      // 处理订单后续逻辑（添加用户额度等）
      if (order.user_id) {
        try {
          // 查询套餐信息
          const { data: pkg } = await supabase
            .from('packages')
            .select('ai_quota, duration_days')
            .eq('package_key', order.package_key)
            .single();

          if (pkg) {
            // 更新用户额度
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 365));

            await supabase
              .from('user_accounts')
              .upsert({
                user_id: order.user_id,
                total_quota: pkg.ai_quota || 0,
                used_quota: 0,
                quota_expires_at: expiresAt.toISOString(),
              }, {
                onConflict: 'user_id',
              });

            console.log('[AlipayCallback] User quota updated for:', order.user_id);
          }
        } catch (quotaError) {
          console.error('[AlipayCallback] Error updating user quota:', quotaError);
        }

        // === 新增：写入 subscriptions 表 ===
        try {
          const { data: subPkg } = await supabase
            .from('packages')
            .select('id, duration_days, package_name')
            .eq('package_key', order.package_key)
            .maybeSingle();

          if (subPkg && !order.package_key.startsWith('camp-')) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (subPkg.duration_days || 365));

            const { error: subError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: order.user_id,
                package_id: subPkg.id,
                subscription_type: order.package_key,
                status: 'active',
                combo_name: subPkg.package_name,
                combo_amount: order.amount,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
              }, { onConflict: 'user_id' });

            if (subError) {
              console.error('[AlipayCallback] Upsert subscription error:', subError);
            } else {
              console.log('[AlipayCallback] Subscription upserted:', order.user_id);
            }
          }
        } catch (subErr) {
          console.error('[AlipayCallback] Subscription processing error:', subErr);
        }
      }
    }

    return new Response('success', { headers: corsHeaders });

  } catch (error) {
    console.error('[AlipayCallback] Error:', error);
    return new Response('fail', { headers: corsHeaders });
  }
});
