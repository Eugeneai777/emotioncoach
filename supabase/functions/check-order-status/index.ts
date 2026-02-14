import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// RSA-SHA256签名
async function signWithRSA(message: string, privateKeyPem: string): Promise<string> {
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(message)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 生成随机字符串
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 获取当前时间戳（秒）
function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// 主动查询微信订单状态
async function queryWechatOrderStatus(orderNo: string): Promise<{
  success: boolean;
  trade_state?: string;
  transaction_id?: string;
  payer_openid?: string;
  error?: string;
}> {
  const mchId = Deno.env.get('WECHAT_MCH_ID');
  const certSerialNo = Deno.env.get('WECHAT_CERT_SERIAL_NO');
  const privateKey = Deno.env.get('WECHAT_PRIVATE_KEY');
  const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
  const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

  if (!mchId || !certSerialNo || !privateKey || !proxyUrl || !proxyToken) {
    console.log('[CheckOrder] Missing WeChat config, skipping direct query');
    return { success: false, error: 'Missing WeChat config' };
  }

  try {
    // 微信查询订单接口
    const apiPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${mchId}`;
    const apiUrl = `https://api.mch.weixin.qq.com${apiPath}`;

    // 签名
    const timestamp = getTimestamp();
    const nonceStr = generateNonceStr();
    const signMessage = `GET\n${apiPath}\n${timestamp}\n${nonceStr}\n\n`;
    const signature = await signWithRSA(signMessage, privateKey);
    
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${certSerialNo}",signature="${signature}"`;

    console.log('[CheckOrder] Querying WeChat order:', orderNo);

    const proxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proxyToken}`,
      },
      body: JSON.stringify({
        target_url: apiUrl,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': authorization,
        },
      }),
    });

    const proxyResult = await proxyResponse.json();
    console.log('[CheckOrder] WeChat query response:', JSON.stringify(proxyResult));

    const wechatData = proxyResult.data || proxyResult;
    
    if (wechatData.trade_state) {
      return {
        success: true,
        trade_state: wechatData.trade_state,
        transaction_id: wechatData.transaction_id,
        payer_openid: wechatData.payer?.openid,
      };
    }

    return { success: false, error: wechatData.message || 'Unknown response' };
  } catch (error) {
    console.error('[CheckOrder] WeChat query error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Query failed' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, forceWechatQuery } = await req.json();
    
    if (!orderNo) {
      throw new Error('缺少订单号');
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询订单状态（orders 表没有 openid 字段，需要从 wechat_user_mappings 获取）
    const { data: order, error } = await supabase
      .from('orders')
      .select('status, paid_at, package_key, package_name, amount, user_id')
      .eq('order_no', orderNo)
      .single();

    if (error) {
      console.error('Query order error:', error);
      throw new Error('订单查询失败');
    }

    if (!order) {
      throw new Error('订单不存在');
    }

    console.log('[CheckOrder] DB status:', orderNo, order.status);

    // 尝试获取用户的 openId（用于前端支付后注册流程）
    let userOpenId: string | null = null;
    if (order.user_id) {
      const { data: mapping } = await supabase
        .from('wechat_user_mappings')
        .select('openid')
        .eq('system_user_id', order.user_id)
        .maybeSingle();
      userOpenId = mapping?.openid || null;
    }

    // 如果数据库显示已支付，直接返回（但先检查 subscription 完整性）
    if (order.status === 'paid') {
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
              console.log('[CheckOrder] Repaired missing subscription:', order.user_id);
            }
          }
        } catch (repairErr) {
          console.error('[CheckOrder] Subscription repair error:', repairErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'paid',
          paidAt: order.paid_at,
          packageKey: order.package_key,
          packageName: order.package_name,
          amount: order.amount,
          openId: userOpenId,
          source: 'db',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 如果订单仍为 pending，且需要主动查询微信
    if (order.status === 'pending' && forceWechatQuery) {
      console.log('[CheckOrder] DB pending, querying WeChat directly...');
      
      const wechatResult = await queryWechatOrderStatus(orderNo);
      
      if (wechatResult.success && wechatResult.trade_state === 'SUCCESS') {
        console.log('[CheckOrder] WeChat confirms paid! Updating DB...');
        
        // 更新数据库状态
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            trade_no: wechatResult.transaction_id,
          })
          .eq('order_no', orderNo);

        if (updateError) {
          console.error('[CheckOrder] Failed to update order:', updateError);
        } else {
          console.log('[CheckOrder] Order updated to paid');

          // === 新增：完整权益发放逻辑 ===
          try {
            // 查询完整订单信息
            const { data: fullOrder } = await supabase
              .from('orders')
              .select('*')
              .eq('order_no', orderNo)
              .single();

            if (fullOrder && fullOrder.user_id) {
              const pkgKey = fullOrder.package_key;

              if (pkgKey.startsWith('camp-')) {
                // 训练营处理
                const campType = pkgKey.replace('camp-', '');
                const { data: campTemplate } = await supabase
                  .from('camp_templates')
                  .select('camp_name')
                  .eq('camp_type', campType)
                  .maybeSingle();

                await supabase.from('user_camp_purchases').insert({
                  user_id: fullOrder.user_id,
                  camp_type: campType,
                  camp_name: campTemplate?.camp_name || fullOrder.product_name || '训练营',
                  purchase_price: fullOrder.amount,
                  payment_method: 'wechat',
                  payment_status: 'completed',
                  transaction_id: wechatResult.transaction_id,
                  purchased_at: new Date().toISOString(),
                  expires_at: null,
                });
                console.log('[CheckOrder] Camp purchase recorded:', campType);
              } else {
                // 非训练营：更新配额
                const quotaMap: Record<string, number> = { basic: 50, member365: 1000, partner: 9999999 };
                const quota = quotaMap[pkgKey] || 0;
                if (quota > 0) {
                  const { data: ua } = await supabase
                    .from('user_accounts')
                    .select('total_quota')
                    .eq('user_id', fullOrder.user_id)
                    .single();
                  if (ua) {
                    await supabase.from('user_accounts').update({
                      total_quota: (ua.total_quota || 0) + quota,
                      updated_at: new Date().toISOString(),
                    }).eq('user_id', fullOrder.user_id);
                    console.log('[CheckOrder] Quota updated:', fullOrder.user_id, '+', quota);
                  }
                }

                // 写入 subscriptions
                const { data: subPkg } = await supabase
                  .from('packages')
                  .select('id, duration_days, package_name')
                  .eq('package_key', pkgKey)
                  .maybeSingle();
                if (subPkg) {
                  const startDate = new Date();
                  const endDate = new Date();
                  endDate.setDate(endDate.getDate() + (subPkg.duration_days || 365));
                  await supabase.from('subscriptions').upsert({
                    user_id: fullOrder.user_id,
                    package_id: subPkg.id,
                    subscription_type: pkgKey,
                    status: 'active',
                    combo_name: subPkg.package_name,
                    combo_amount: fullOrder.amount,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                  }, { onConflict: 'user_id' });
                  console.log('[CheckOrder] Subscription upserted:', fullOrder.user_id);
                }
              }

              // 合伙人佣金处理
              const { data: referral } = await supabase
                .from('partner_referrals')
                .select('id, partner_id')
                .eq('referred_user_id', fullOrder.user_id)
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
                    body: { order_id: fullOrder.id, user_id: fullOrder.user_id, order_amount: fullOrder.amount, order_type: pkgKey },
                  });
                } catch (e) { console.error('[CheckOrder] Commission error:', e); }
              }
            }
          } catch (benefitError) {
            console.error('[CheckOrder] Benefit granting error:', benefitError);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: 'paid',
            paidAt: new Date().toISOString(),
            packageKey: order.package_key,
            packageName: order.package_name,
            amount: order.amount,
            openId: wechatResult.payer_openid,
            source: 'wechat',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 微信返回其他状态
      if (wechatResult.success) {
        console.log('[CheckOrder] WeChat trade_state:', wechatResult.trade_state);
      }
    }

    // 返回当前状态（pending）
    return new Response(
      JSON.stringify({
        success: true,
        status: order.status,
        paidAt: order.paid_at,
        packageKey: order.package_key,
        packageName: order.package_name,
        amount: order.amount,
        openId: userOpenId,
        source: 'db',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check order status error:', error);
    const errorMessage = error instanceof Error ? error.message : '查询订单失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
