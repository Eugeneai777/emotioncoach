import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 生成商户订单号
function generateOrderNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ALI${dateStr}${timeStr}${random}`;
}

// 获取当前时间戳（格式：yyyy-MM-dd HH:mm:ss）
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// RSA-SHA256签名
async function signWithRSA(content: string, privateKeyPem: string): Promise<string> {
  // 清理私钥格式
  const pemContents = privateKeyPem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/, '')
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
    encoder.encode(content)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 构建待签名字符串
function buildSignContent(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${key}=${value}`);
    }
  }
  return parts.join('&');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageKey, packageName, amount, userId = 'guest', returnUrl } = await req.json();
    
    console.log('[AlipayOrder] Creating order:', { packageKey, packageName, amount, userId });

    // 验证参数
    if (!packageKey || !packageName || !amount) {
      throw new Error('缺少必要参数');
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 限购套餐检查
    const limitedPurchasePackages = ['basic', 'wealth_block_assessment'];
    const isLimitedPackage = limitedPurchasePackages.includes(packageKey);
    
    if (isLimitedPackage && userId && userId !== 'guest') {
      const { data: paidOrder } = await supabase
        .from('orders')
        .select('id, order_no')
        .eq('user_id', userId)
        .eq('package_key', packageKey)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();

      if (paidOrder) {
        console.log('[AlipayOrder] User already has paid order for this LIMITED package:', paidOrder.order_no);
        return new Response(
          JSON.stringify({
            success: true,
            alreadyPaid: true,
            orderNo: paidOrder.order_no,
            message: '您已购买过此产品',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 获取支付宝配置
    const appId = Deno.env.get('ALIPAY_APP_ID');
    const privateKey = Deno.env.get('ALIPAY_PRIVATE_KEY');
    
    if (!appId || !privateKey) {
      throw new Error('支付宝配置不完整');
    }

    // 生成订单号
    const orderNo = generateOrderNo();
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

    // 构建支付宝H5支付请求参数
    const amountStr = amount.toFixed(2);
    const timestamp = getTimestamp();
    
    // 回调地址
    const notifyUrl = `${supabaseUrl}/functions/v1/alipay-callback`;
    // 支付成功后的前端跳转地址
    const finalReturnUrl = returnUrl || 'https://feel-name-transform-coach.lovable.app/packages?payment_success=1';
    
    // 业务参数
    const bizContent = JSON.stringify({
      out_trade_no: orderNo,
      total_amount: amountStr,
      subject: packageName,
      product_code: 'QUICK_WAP_WAY', // H5支付产品码
      quit_url: finalReturnUrl, // 用户取消支付后的跳转地址
    });

    // 公共请求参数
    const params: Record<string, string> = {
      app_id: appId,
      method: 'alipay.trade.wap.pay',
      format: 'JSON',
      return_url: finalReturnUrl,
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: timestamp,
      version: '1.0',
      notify_url: notifyUrl,
      biz_content: bizContent,
    };

    // 生成签名
    const signContent = buildSignContent(params);
    const sign = await signWithRSA(signContent, privateKey);
    params.sign = sign;

    // 构建完整的支付链接
    const baseUrl = 'https://openapi.alipay.com/gateway.do';
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    const payUrl = `${baseUrl}?${queryParts.join('&')}`;

    console.log('[AlipayOrder] Generated pay URL for order:', orderNo);

    // 保存订单到数据库
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: userId === 'guest' ? null : userId,
        package_key: packageKey,
        package_name: packageName,
        amount: amount,
        status: 'pending',
        pay_type: 'alipay_h5',
        expired_at: expiredAt.toISOString(),
      });

    if (orderError) {
      console.error('[AlipayOrder] Error saving order:', orderError);
      throw new Error('保存订单失败');
    }

    console.log('[AlipayOrder] Order created successfully:', orderNo);

    return new Response(
      JSON.stringify({
        success: true,
        orderNo: orderNo,
        payUrl: payUrl,
        payType: 'alipay_h5',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AlipayOrder] Error:', error);
    const errorMessage = error instanceof Error ? error.message : '创建订单失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
