import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 生成随机字符串
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成商户订单号
function generateOrderNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `YJ${dateStr}${timeStr}${random}`;
}

// 获取当前时间戳（秒）
function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// RSA-SHA256签名
async function signWithRSA(message: string, privateKeyPem: string): Promise<string> {
  // 清理私钥格式
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

// 构建签名字符串
function buildSignMessage(method: string, url: string, timestamp: number, nonceStr: string, body: string): string {
  return `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageKey, packageName, amount, userId = 'guest', payType = 'h5' } = await req.json();
    
    console.log('Creating order:', { packageKey, packageName, amount, userId, payType });

    // 验证参数 - userId 可选（支持游客订单）
    if (!packageKey || !packageName || !amount) {
      throw new Error('缺少必要参数');
    }

    // 获取微信支付配置
    const mchId = Deno.env.get('WECHAT_MCH_ID');
    const apiV3Key = Deno.env.get('WECHAT_API_V3_KEY');
    const certSerialNo = Deno.env.get('WECHAT_CERT_SERIAL_NO');
    const privateKey = Deno.env.get('WECHAT_PRIVATE_KEY');
    const appId = Deno.env.get('WECHAT_APP_ID');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    if (!mchId || !apiV3Key || !certSerialNo || !privateKey || !appId) {
      throw new Error('微信支付配置不完整');
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 生成订单号
    const orderNo = generateOrderNo();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 构建微信支付请求体
    const amountInFen = Math.round(amount * 100); // 转换为分
    const notifyUrl = `${supabaseUrl}/functions/v1/wechat-pay-callback`;
    
    // 根据支付类型选择不同的API和请求体
    const isH5 = payType === 'h5';
    const apiPath = isH5 ? '/v3/pay/transactions/h5' : '/v3/pay/transactions/native';
    const apiUrl = `https://api.mch.weixin.qq.com${apiPath}`;
    
    const requestBody: Record<string, unknown> = {
      appid: appId,
      mchid: mchId,
      description: packageName,
      out_trade_no: orderNo,
      time_expire: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
      notify_url: notifyUrl,
      amount: {
        total: amountInFen,
        currency: 'CNY'
      }
    };

    // H5支付需要额外的scene_info
    if (isH5) {
      requestBody.scene_info = {
        payer_client_ip: '127.0.0.1', // 实际项目中应从请求头获取
        h5_info: {
          type: 'Wap',
          wap_url: 'https://eugeneai.me',
          wap_name: '有劲AI'
        }
      };
    }

    console.log('WeChat pay request:', requestBody);

    // 签名
    const timestamp = getTimestamp();
    const nonceStr = generateNonceStr();
    const bodyStr = JSON.stringify(requestBody);
    const signMessage = buildSignMessage('POST', apiPath, timestamp, nonceStr, bodyStr);
    const signature = await signWithRSA(signMessage, privateKey);
    
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${certSerialNo}",signature="${signature}"`;

    let wechatResult: Record<string, unknown>;
    let actualPayType = payType; // 实际使用的支付类型（可能降级）
    let fallbackReason: string | undefined;
    
    // 使用代理服务器调用微信API
    if (proxyUrl && proxyToken) {
      console.log('Using proxy server:', proxyUrl);
      const proxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proxyToken}`,
        },
        body: JSON.stringify({
          target_url: apiUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authorization,
          },
          body: requestBody
        }),
      });

      const proxyResult = await proxyResponse.json();
      console.log('Proxy response:', proxyResult);
      
      // 检查是否需要降级到 Native 支付
      if (isH5 && (proxyResult.code === 'PARAM_ERROR' || proxyResult.code === 'NO_AUTH' || !proxyResult.h5_url)) {
        console.log('H5 payment failed, falling back to Native QR code payment');
        fallbackReason = proxyResult.message || 'H5支付不可用，已自动切换为扫码支付';
        
        // 重新构建 Native 支付请求
        const nativeApiPath = '/v3/pay/transactions/native';
        const nativeApiUrl = `https://api.mch.weixin.qq.com${nativeApiPath}`;
        const nativeRequestBody: Record<string, unknown> = {
          appid: appId,
          mchid: mchId,
          description: packageName,
          out_trade_no: orderNo,
          time_expire: new Date(Date.now() + 5 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+08:00'),
          notify_url: notifyUrl,
          amount: {
            total: amountInFen,
            currency: 'CNY'
          }
        };
        
        // 重新签名
        const nativeTimestamp = getTimestamp();
        const nativeNonceStr = generateNonceStr();
        const nativeBodyStr = JSON.stringify(nativeRequestBody);
        const nativeSignMessage = buildSignMessage('POST', nativeApiPath, nativeTimestamp, nativeNonceStr, nativeBodyStr);
        const nativeSignature = await signWithRSA(nativeSignMessage, privateKey);
        const nativeAuthorization = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nativeNonceStr}",timestamp="${nativeTimestamp}",serial_no="${certSerialNo}",signature="${nativeSignature}"`;
        
        console.log('Retrying with Native payment:', nativeRequestBody);
        
        const nativeProxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${proxyToken}`,
          },
          body: JSON.stringify({
            target_url: nativeApiUrl,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': nativeAuthorization,
            },
            body: nativeRequestBody
          }),
        });
        
        const nativeProxyResult = await nativeProxyResponse.json();
        console.log('Native proxy response:', nativeProxyResult);
        
        if (nativeProxyResult.error) {
          throw new Error(nativeProxyResult.error);
        }
        wechatResult = nativeProxyResult.data || nativeProxyResult;
        actualPayType = 'native'; // 已降级到 native
      } else if (proxyResult.error) {
        throw new Error(proxyResult.error);
      } else {
        wechatResult = proxyResult.data || proxyResult;
      }
    } else {
      // 直接调用微信API（可能会遇到IP白名单问题）
      console.log('Direct API call to WeChat');
      const wechatResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authorization,
        },
        body: bodyStr,
      });

      wechatResult = await wechatResponse.json();
      console.log('WeChat response:', wechatResult);

      if (!wechatResponse.ok) {
        throw new Error((wechatResult as { message?: string }).message || '微信支付接口调用失败');
      }
    }

    // 获取支付URL - 使用实际的支付类型
    const actualIsH5 = actualPayType === 'h5';
    let payUrl: string;
    if (actualIsH5) {
      // H5支付返回 h5_url
      payUrl = wechatResult.h5_url as string;
      if (!payUrl) {
        throw new Error('未获取到H5支付链接');
      }
    } else {
      // Native支付返回 code_url
      payUrl = wechatResult.code_url as string;
      if (!payUrl) {
        throw new Error('未获取到支付二维码');
      }
    }

    // 保存订单到数据库
    const { error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        package_key: packageKey,
        package_name: packageName,
        amount: amount,
        order_no: orderNo,
        status: 'pending',
        qr_code_url: payUrl, // 存储支付URL（H5或Native）
        expired_at: expiredAt.toISOString(),
      });

    if (insertError) {
      console.error('Insert order error:', insertError);
      throw new Error('订单创建失败');
    }

    console.log('Order created successfully:', orderNo, 'payType:', actualPayType, fallbackReason ? `(fallback: ${fallbackReason})` : '');

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        payUrl, // 统一返回payUrl
        qrCodeUrl: actualIsH5 ? undefined : payUrl, // 兼容旧版本
        h5Url: actualIsH5 ? payUrl : undefined, // H5支付专用
        payType: actualPayType, // 返回实际使用的支付类型
        fallbackReason, // 如果发生了降级，告知原因
        expiredAt: expiredAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create order error:', error);
    const errorMessage = error instanceof Error ? error.message : '创建订单失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
