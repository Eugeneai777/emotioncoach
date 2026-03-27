import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// 阿里云签名算法
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, '%2B')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

async function hmacSHA1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, countryCode = '+86' } = await req.json();

    if (!phone || !/^\d{11}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: '请输入有效的11位手机号' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 目前仅支持中国大陆手机号
    if (countryCode !== '+86') {
      return new Response(
        JSON.stringify({ error: '短信验证码仅支持中国大陆手机号' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessKeyId = Deno.env.get('ALIYUN_ACCESS_KEY_ID');
    const accessKeySecret = Deno.env.get('ALIYUN_ACCESS_KEY_SECRET');
    const signName = Deno.env.get('ALIYUN_SMS_SIGN_NAME');
    const templateCode = Deno.env.get('ALIYUN_SMS_TEMPLATE_CODE');

    if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
      console.error('Missing Aliyun SMS configuration');
      return new Response(
        JSON.stringify({ error: '短信服务配置错误' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用 service role 访问 sms_verification_codes 表
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 频率限制：同一手机号60秒内只能发一次
    const { data: recentCodes } = await adminClient
      .from('sms_verification_codes')
      .select('created_at')
      .eq('phone_number', phone)
      .eq('purpose', 'sms_login')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: '发送太频繁，请60秒后再试' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 每日限制：同一手机号每天最多10条
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: dailyCount } = await adminClient
      .from('sms_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phone)
      .eq('purpose', 'sms_login')
      .gte('created_at', todayStart.toISOString());

    if ((dailyCount ?? 0) >= 10) {
      return new Response(
        JSON.stringify({ error: '今日发送次数已达上限，请明天再试' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const code = generateCode();

    // 调用阿里云短信API
    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      PhoneNumbers: phone,
      RegionId: 'cn-hangzhou',
      SignName: signName,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: crypto.randomUUID(),
      SignatureVersion: '1.0',
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code }),
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      Version: '2017-05-25',
    };

    // 构造签名字符串
    const sortedKeys = Object.keys(params).sort();
    const canonicalQueryString = sortedKeys
      .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
      .join('&');
    
    const stringToSign = `POST&${percentEncode('/')}&${percentEncode(canonicalQueryString)}`;
    const signature = await hmacSHA1(accessKeySecret + '&', stringToSign);
    params['Signature'] = signature;

    // 发送请求
    const body = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await fetch('https://dysmsapi.aliyuncs.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = await response.json();
    console.log('Aliyun SMS response:', JSON.stringify(result));

    if (result.Code !== 'OK') {
      console.error('Aliyun SMS error:', result.Message);
      return new Response(
        JSON.stringify({ error: `短信发送失败: ${result.Message || '未知错误'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 存储验证码
    await adminClient.from('sms_verification_codes').insert({
      phone_number: phone,
      code,
      purpose: 'sms_login',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, message: '验证码已发送' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send SMS error:', error);
    return new Response(
      JSON.stringify({ error: '发送短信失败，请稍后重试' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
