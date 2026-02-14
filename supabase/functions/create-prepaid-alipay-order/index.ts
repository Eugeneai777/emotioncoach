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
  return `PRE${dateStr}${timeStr}${random}`;
}

// 获取当前时间戳（格式：yyyy-MM-dd HH:mm:ss）
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// RSA-SHA256签名
async function signWithRSA(content: string, privateKeyPem: string): Promise<string> {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { packageKey, returnUrl } = await req.json();

    if (!packageKey) {
      throw new Error('Missing packageKey');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get prepaid package details
    const { data: pkg, error: pkgError } = await supabase
      .from('coaching_prepaid_packages')
      .select('*')
      .eq('package_key', packageKey)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      throw new Error('Prepaid package not found or inactive');
    }

    // 获取支付宝配置
    const appId = Deno.env.get('ALIPAY_APP_ID');
    const privateKey = Deno.env.get('ALIPAY_PRIVATE_KEY');
    
    if (!appId || !privateKey) {
      throw new Error('支付宝配置不完整');
    }

    // Generate order number
    const orderNo = generateOrderNo();
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);

    // 构建支付宝H5支付请求参数
    const amountStr = pkg.price.toFixed(2);
    const timestamp = getTimestamp();
    
    // 回调地址
    const notifyUrl = `${supabaseUrl}/functions/v1/alipay-callback`;
    const finalReturnUrl = returnUrl || 'https://feel-name-transform-coach.lovable.app/packages?payment_success=1';
    
    // 业务参数
    const bizContent = JSON.stringify({
      out_trade_no: orderNo,
      total_amount: amountStr,
      subject: `教练预付卡充值: ${pkg.package_name}`,
      product_code: 'QUICK_WAP_WAY',
      quit_url: finalReturnUrl,
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

    // Create order record
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_key: packageKey,
        amount: pkg.price,
        status: 'pending',
        order_type: 'prepaid_recharge',
        package_name: pkg.package_name,
        pay_type: 'alipay_h5',
        expired_at: expiredAt.toISOString(),
      });

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('Prepaid Alipay order created successfully:', orderNo);

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        packageName: pkg.package_name,
        price: pkg.price,
        totalValue: pkg.total_value,
        payUrl,
        payType: 'alipay_h5',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-prepaid-alipay-order:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
