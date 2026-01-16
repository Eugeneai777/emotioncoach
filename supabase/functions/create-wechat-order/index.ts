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
    const { packageKey, packageName, amount, userId = 'guest', payType = 'h5', openId, isMiniProgram = false } = await req.json();
    
    console.log('Creating order:', { packageKey, packageName, amount, userId, payType, openId, isMiniProgram });

    // 验证参数 - userId 可选（支持游客订单）
    if (!packageKey || !packageName || !amount) {
      throw new Error('缺少必要参数');
    }

    // JSAPI 支付需要 openId（小程序原生支付除外，由小程序端获取 openId）
    if (payType === 'jsapi' && !openId && !isMiniProgram) {
      throw new Error('JSAPI支付需要openId');
    }

    // 获取微信支付配置
    const mchId = Deno.env.get('WECHAT_MCH_ID');
    const apiV3Key = Deno.env.get('WECHAT_API_V3_KEY');
    const certSerialNo = Deno.env.get('WECHAT_CERT_SERIAL_NO');
    const privateKey = Deno.env.get('WECHAT_PRIVATE_KEY');

    // ⚠️ 重要：当前 H5/微信浏览器/小程序 WebView 场景都使用公众号 appId 发起支付。
    // 如果未来要做“小程序原生页支付（wx.requestPayment）”，需要商户号绑定小程序 appId 后再启用。
    const appId = Deno.env.get('WECHAT_APP_ID');

    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    console.log('Using appId:', appId, 'isMiniProgram:', isMiniProgram);

    if (!mchId || !apiV3Key || !certSerialNo || !privateKey || !appId) {
      throw new Error('微信支付配置不完整');
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔑 关键修复：如果有 openId，先查询是否已绑定用户
    let finalUserId = userId;
    if (openId) {
      const { data: mapping } = await supabase
        .from('wechat_user_mappings')
        .select('system_user_id')
        .eq('openid', openId)
        .maybeSingle();
      
      if (mapping?.system_user_id) {
        finalUserId = mapping.system_user_id;
        console.log('Found bound user for openId:', openId, '-> userId:', finalUserId);
      } else {
        console.log('No bound user found for openId:', openId, ', using:', userId);
      }
    }

    // 生成订单号
    const orderNo = generateOrderNo();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 构建微信支付请求体
    const amountInFen = Math.round(amount * 100); // 转换为分
    // 使用 wechatpay.eugenewe.net 域名作为回调地址，由代理转发到 Edge Function
    const notifyUrl = 'https://wechatpay.eugenewe.net/wechat-pay-callback';
    
    // 根据支付类型选择不同的API和请求体
    // 小程序环境：使用 native 下单，返回 prepay_id 供小程序原生调用 wx.requestPayment
    const isH5 = payType === 'h5';
    const isJsapi = payType === 'jsapi' && !isMiniProgram; // 小程序不走 JSAPI
    const isMiniProgramPay = isMiniProgram; // 小程序原生支付
    let apiPath: string;
    if (isJsapi) {
      apiPath = '/v3/pay/transactions/jsapi';
    } else if (isH5) {
      apiPath = '/v3/pay/transactions/h5';
    } else {
      // Native 和小程序都用 native 接口（小程序需要 prepay_id）
      apiPath = '/v3/pay/transactions/native';
    }
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
          wap_url: 'https://wechat.eugenewe.net',
          wap_name: '有劲AI'
        }
      };
    }

    // JSAPI支付需要payer信息
    if (isJsapi) {
      requestBody.payer = {
        openid: openId
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
      
      // 检查是否需要降级到 Native 支付（仅对H5支付降级，JSAPI不降级）
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

    // 获取支付URL或prepay_id - 使用实际的支付类型
    const actualIsH5 = actualPayType === 'h5';
    const actualIsJsapi = actualPayType === 'jsapi' && !isMiniProgram;
    const actualIsMiniProgram = isMiniProgram;
    let payUrl: string = '';
    let jsapiPayParams: Record<string, string> | undefined;
    let miniprogramPayParams: Record<string, string> | undefined;
    
    if (actualIsMiniProgram) {
      // 小程序原生支付：Native 接口也返回 prepay_id（在 code_url 之外）
      // 但 Native 接口实际只返回 code_url，需要改用 JSAPI 接口获取 prepay_id
      // 这里先用 code_url 作为备用，同时生成小程序需要的签名参数
      payUrl = (wechatResult.code_url as string) || '';
      
      // 注意：Native 接口不返回 prepay_id，小程序需要用 JSAPI 接口
      // 但 JSAPI 需要 openId，而小程序端获取 openId 后再调用
      // 因此这里返回订单信息，让小程序端自己调用支付
      console.log('MiniProgram payment: returning order info for native payment');
      
      // 生成小程序支付所需的预签名参数（timeStamp、nonceStr）
      // 小程序端获取 openId 后需要重新请求 prepay_id，这里仅提供订单号
      miniprogramPayParams = {
        orderNo: orderNo,
        amount: amountInFen.toString(),
        description: packageName,
      };
    } else if (actualIsJsapi) {
      // JSAPI支付返回 prepay_id，需要生成前端调起支付的参数
      const prepayId = wechatResult.prepay_id as string;
      if (!prepayId) {
        throw new Error('未获取到prepay_id');
      }
      
      // 生成前端调起支付所需的签名参数
      const jsapiTimestamp = getTimestamp().toString();
      const jsapiNonceStr = generateNonceStr();
      const packageStr = `prepay_id=${prepayId}`;
      
      // 签名内容：appId、timeStamp、nonceStr、package
      const jsapiSignMessage = `${appId}\n${jsapiTimestamp}\n${jsapiNonceStr}\n${packageStr}\n`;
      const jsapiPaySign = await signWithRSA(jsapiSignMessage, privateKey);
      
      jsapiPayParams = {
        appId: appId,
        timeStamp: jsapiTimestamp,
        nonceStr: jsapiNonceStr,
        package: packageStr,
        signType: 'RSA',
        paySign: jsapiPaySign
      };
      
      console.log('JSAPI pay params generated:', { ...jsapiPayParams, paySign: '***' });
    } else if (actualIsH5) {
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

    // 保存订单到数据库 - 使用 finalUserId（已绑定用户或guest）
    const isGuest = finalUserId === 'guest' || !finalUserId;
    const { error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id: isGuest ? null : finalUserId,
        package_key: packageKey,
        package_name: packageName,
        amount: amount,
        order_no: orderNo,
        status: 'pending',
        qr_code_url: payUrl || null, // 存储支付URL（H5或Native），JSAPI为null
        expired_at: expiredAt.toISOString(),
      });

    if (insertError) {
      console.error('Insert order error:', insertError);
      throw new Error('订单创建失败');
    }

    console.log('Order created successfully:', orderNo, 'userId:', isGuest ? 'guest' : finalUserId, 'payType:', actualPayType, fallbackReason ? `(fallback: ${fallbackReason})` : '');

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        payUrl: payUrl || undefined, // 统一返回payUrl
        qrCodeUrl: !actualIsH5 && !actualIsJsapi && !actualIsMiniProgram ? payUrl : undefined, // 兼容旧版本
        h5Url: actualIsH5 ? payUrl : undefined, // H5支付专用
        jsapiPayParams, // JSAPI支付专用参数
        miniprogramPayParams, // 小程序原生支付参数
        payType: actualIsMiniProgram ? 'miniprogram' : actualPayType, // 返回实际使用的支付类型
        fallbackReason, // 如果发生了降级，告知原因
        expiredAt: expiredAt.toISOString(),
        isMiniProgram: actualIsMiniProgram, // 标识是否为小程序支付
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
