import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 查询订单状态
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

    // 如果数据库显示已支付，直接返回
    if (order.status === 'paid') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'paid',
          paidAt: order.paid_at,
          packageKey: order.package_key,
          packageName: order.package_name,
          amount: order.amount,
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
