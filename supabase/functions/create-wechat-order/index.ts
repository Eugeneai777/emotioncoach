import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const { packageKey, packageName, amount, userId = 'guest', payType = 'h5', openId, isMiniProgram = false, existingOrderNo, buyerName, buyerPhone, buyerAddress, idCardName, idCardNumber } = await req.json();
    
    console.log('Creating order:', { packageKey, packageName, amount, userId, payType, openId, isMiniProgram, existingOrderNo, hasBuyerInfo: !!(buyerName || buyerPhone), hasIdCard: !!(idCardName || idCardNumber), idCardName: idCardName ? '***' : null, idCardNumber: idCardNumber ? '***' : null });

    // 验证参数 - userId 可选（支持游客订单）
    if (!packageKey || !packageName || !amount) {
      throw new Error('缺少必要参数');
    }

    // 初始化Supabase（提前初始化用于幂等检查）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔑 幂等检查：如果传了 existingOrderNo，先检查该订单状态
    if (existingOrderNo) {
      console.log('[CreateOrder] Checking existing order:', existingOrderNo);
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('status, order_no, qr_code_url, package_key')
        .eq('order_no', existingOrderNo)
        .maybeSingle();

      if (existingOrder) {
        if (existingOrder.status === 'paid') {
          console.log('[CreateOrder] Existing order already paid');
          return new Response(
            JSON.stringify({
              success: true,
              alreadyPaid: true,
              orderNo: existingOrderNo,
              message: '订单已支付',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // 订单存在且未支付
        if (existingOrder.status === 'pending') {
          // 🔧 如果请求的是 native 支付但现有订单没有 QR 码（原订单可能是 jsapi 创建的），
          // 不要直接返回空的 QR URL，而是跳过幂等检查，让后续逻辑重新向微信请求 Native QR 码
          if (payType === 'native' && !existingOrder.qr_code_url) {
            console.log('[CreateOrder] Existing order has no QR URL, will regenerate native QR for:', existingOrderNo);
            // 不 return，继续往下走，使用同一个 orderNo 重新请求微信 Native API
          } else {
            console.log('[CreateOrder] Existing order still pending, returning existing info');
            return new Response(
              JSON.stringify({
                success: true,
                orderNo: existingOrderNo,
                payUrl: existingOrder.qr_code_url,
                qrCodeUrl: existingOrder.qr_code_url,
                payType: 'native',
                existingOrder: true,
                message: '使用已有订单',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // 🔑 防止重复支付：仅对限购套餐检查用户是否已有同 package_key 的已支付订单
    // 限购套餐列表（只能购买一次的产品）
    const limitedPurchasePackages = ['basic', 'wealth_block_assessment'];
    const isLimitedPackage = limitedPurchasePackages.includes(packageKey);
    
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
      }
    }

    // 🆕 后端去重：复用同用户同套餐 5 分钟内的 pending 订单（与微信 time_expire 对齐）
    // ⚠️ 关键：必须按 pay_type 严格匹配复用，否则微信会报 INVALID_REQUEST"请求重入时参数不一致"
    // （同一 out_trade_no 在微信侧已绑定首次的 trade_type，不能跨通道复用）
    const ORDER_TTL_MS = 5 * 60 * 1000; // 5 分钟支付窗口
    const ttlCutoff = new Date(Date.now() - ORDER_TTL_MS).toISOString();

    // 🧹 自动取消该用户该套餐所有超过 5 分钟仍 pending 的旧订单
    // 防止用户被卡在已过期的订单上，再次发起支付时可创建全新订单
    if (finalUserId && finalUserId !== 'guest') {
      const { data: expired, error: expireErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('user_id', finalUserId)
        .eq('package_key', packageKey)
        .eq('status', 'pending')
        .lt('created_at', ttlCutoff)
        .select('order_no');
      if (expired && expired.length > 0) {
        console.log('[CreateOrder] Auto-cancelled expired pending orders:', expired.map(o => o.order_no).join(','));
      }
      if (expireErr) console.warn('[CreateOrder] Auto-cancel error:', expireErr.message);
    }

    let reusedMiniProgramOrderNo: string | undefined;
    if (finalUserId && finalUserId !== 'guest' && !existingOrderNo) {
      const { data: recentPending } = await supabase
        .from('orders')
        .select('order_no, qr_code_url, pay_type, created_at')
        .eq('user_id', finalUserId)
        .eq('package_key', packageKey)
        .eq('status', 'pending')
        .eq('pay_type', payType) // 🔒 仅复用相同 pay_type 的订单，防止跨通道重入
        .gte('created_at', ttlCutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentPending) {
        console.log('[CreateOrder] Reusing recent pending order:', recentPending.order_no, 'pay_type:', recentPending.pay_type, 'requested payType:', payType, 'created at:', recentPending.created_at);
        
        // 小程序请求：不管旧订单是什么类型，只要有 openId 就用旧订单号重新获取 prepay_id
        if (payType === 'miniprogram') {
          if (!openId) {
            return new Response(
              JSON.stringify({
                success: true,
                orderNo: recentPending.order_no,
                payType: 'miniprogram',
                needsNativePayment: true,
                existingOrder: true,
                message: '使用已有订单',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          // 有 openId：标记复用该 orderNo，继续往下调微信 API 获取 prepay_id
          console.log('[CreateOrder] MiniProgram has openId, will call WeChat API with existing order:', recentPending.order_no);
          reusedMiniProgramOrderNo = recentPending.order_no;
        }
        
        // Native 支付且有 QR：仅当请求方也是 native 时才复用 QR 码
        if (!reusedMiniProgramOrderNo && recentPending.qr_code_url && payType === 'native') {
          return new Response(
            JSON.stringify({
              success: true,
              orderNo: recentPending.order_no,
              payUrl: recentPending.qr_code_url,
              qrCodeUrl: recentPending.qr_code_url,
              payType: 'native',
              existingOrder: true,
              message: '使用已有订单',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // JSAPI 请求复用旧订单：用旧订单号重新获取 prepay_id
        if (!reusedMiniProgramOrderNo && payType === 'jsapi' && openId) {
          console.log('[CreateOrder] JSAPI has openId, will call WeChat API with existing order:', recentPending.order_no);
          reusedMiniProgramOrderNo = recentPending.order_no;
        }
        
        // 其他情况（如 H5 pending 订单、payType 不匹配）：不复用，继续创建新订单
        if (!reusedMiniProgramOrderNo && payType !== 'native') {
          console.log('[CreateOrder] payType mismatch or unsupported reuse, skipping reuse. old pay_type:', recentPending.pay_type, 'requested:', payType);
        }
      }
    }

    // 仅对限购套餐检查是否已购买
    if (isLimitedPackage && finalUserId && finalUserId !== 'guest') {
      const { data: paidOrder } = await supabase
        .from('orders')
        .select('id, order_no')
        .eq('user_id', finalUserId)
        .eq('package_key', packageKey)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();

      if (paidOrder) {
        console.log('[CreateOrder] User already has paid order for this LIMITED package:', paidOrder.order_no);
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

    // 有劲合伙人续费：允许选择任意等级（含降级），不再限制
    // （旧逻辑：禁止降级购买，已移除）

    // JSAPI 支付强制要求 openId；小程序允许缺失（由原生端获取后再发起支付）
    if (payType === 'jsapi' && !openId) {
      throw new Error('JSAPI 支付需要 openId');
    }
    
    // 小程序支付：需要返回 prepay_id，由原生端获取 openId 后调用 wx.requestPayment
    const isMiniProgramPay = payType === 'miniprogram';

    // 获取微信支付配置
    const mchId = Deno.env.get('WECHAT_MCH_ID');
    const apiV3Key = Deno.env.get('WECHAT_API_V3_KEY');
    const certSerialNo = Deno.env.get('WECHAT_CERT_SERIAL_NO');
    const privateKey = Deno.env.get('WECHAT_PRIVATE_KEY');

    // 公众号 appId（用于 H5、微信浏览器 JSAPI 支付）
    const publicAppId = Deno.env.get('WECHAT_APP_ID');
    // 小程序 appId（用于小程序原生支付）
    const miniProgramAppId = Deno.env.get('WECHAT_MINI_PROGRAM_APP_ID');

    // ⚠️ 关键：小程序支付必须使用小程序的 appId，否则会报 "appid和openid不匹配"
    const appId = isMiniProgramPay ? miniProgramAppId : publicAppId;

    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

    console.log('Using appId:', appId, 'isMiniProgramPay:', isMiniProgramPay, 'publicAppId:', publicAppId, 'miniProgramAppId:', miniProgramAppId);

    if (!mchId || !apiV3Key || !certSerialNo || !privateKey) {
      throw new Error('微信支付配置不完整');
    }
    
    // 小程序支付必须有小程序 appId
    if (isMiniProgramPay && !miniProgramAppId) {
      throw new Error('小程序支付需要配置 WECHAT_MINI_PROGRAM_APP_ID');
    }
    
    // 非小程序支付需要公众号 appId
    if (!isMiniProgramPay && !publicAppId) {
      throw new Error('支付需要配置 WECHAT_APP_ID');
    }

    // 继续使用之前初始化的 supabase 和 finalUserId
    // （已在幂等检查阶段初始化）

    // 生成订单号（或复用已有的待付款订单号）
    const reuseExistingOrder = !!existingOrderNo && payType === 'native';
    const orderNo = reuseExistingOrder ? existingOrderNo : (reusedMiniProgramOrderNo || generateOrderNo());
    const shouldSkipInsert = !!reusedMiniProgramOrderNo; // 订单已在数据库中，无需重新 insert
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 构建微信支付请求体
    const amountInFen = Math.round(amount * 100); // 转换为分
    // 使用 wechatpay.eugenewe.net 域名作为回调地址，由代理转发到 Edge Function
    const notifyUrl = 'https://wechatpay.eugenewe.net/wechat-pay-callback';
    
    // 根据支付类型选择不同的API和请求体
    const isH5 = payType === 'h5';
    const isJsapi = payType === 'jsapi';
    let apiPath: string;
    if (isJsapi || isMiniProgramPay) {
      // 小程序支付也使用 JSAPI 接口获取 prepay_id
      apiPath = '/v3/pay/transactions/jsapi';
    } else if (isH5) {
      apiPath = '/v3/pay/transactions/h5';
    } else {
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

    // H5支付需要额外的scene_info（V3 API 仅需 type，不支持 wap_name/wap_url）
    if (isH5) {
      // 尝试从请求头获取真实客户端 IP
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || '127.0.0.1';
      requestBody.scene_info = {
        payer_client_ip: clientIp,
        h5_info: {
          type: 'Wap',
        }
      };
    }

    // JSAPI支付需要payer信息
    if (isJsapi && !isMiniProgramPay) {
      requestBody.payer = {
        openid: openId
      };
    }
    
    // 小程序支付：需要 openId 来使用 JSAPI
    if (isMiniProgramPay) {
      if (openId) {
        // 有 openId：使用 JSAPI（appId 已在上面设置为小程序 appId）
        requestBody.payer = { openid: openId };
        console.log('MiniProgram pay with openId, using JSAPI with miniProgramAppId:', appId);
      } else {
        // 🆕 无 openId：跳过微信支付 API，仅创建本地订单
        // 由小程序原生端获取 openId 后再调用微信支付
        console.log('[CreateOrder] MiniProgram without openId: creating local order only, skipping WeChat API');
        
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
            pay_type: 'miniprogram',
            qr_code_url: null,
            expired_at: expiredAt.toISOString(),
            buyer_name: buyerName || null,
            buyer_phone: buyerPhone || null,
            buyer_address: buyerAddress || null,
            shipping_status: (buyerName || buyerPhone) ? 'pending' : null,
            id_card_name: idCardName || null,
            id_card_number: idCardNumber || null,
          });

        if (insertError) {
          console.error('Insert order error:', insertError);
          throw new Error('订单创建失败');
        }

        console.log('[CreateOrder] Local order created for miniprogram native pay:', orderNo, 'userId:', isGuest ? 'guest' : finalUserId);

        return new Response(
          JSON.stringify({
            success: true,
            orderNo,
            payType: 'miniprogram',
            needsNativePayment: true,
            expiredAt: expiredAt.toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
    
    // 使用代理服务器调用微信API（带重试机制，防止代理服务器偶发超时）
    if (proxyUrl && proxyToken) {
      console.log('Using proxy server:', proxyUrl);
      const MAX_RETRIES = 2;
      let proxyResponse: Response | null = null;
      let lastProxyError: Error | null = null;
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[CreateOrder] Retry attempt ${attempt}/${MAX_RETRIES} for proxy call`);
          }
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s 超时
          proxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
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
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          lastProxyError = null;
          break; // 成功，跳出重试循环
        } catch (fetchErr: any) {
          lastProxyError = fetchErr;
          console.warn(`[CreateOrder] Proxy call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, fetchErr.message || fetchErr.code);
          if (attempt < MAX_RETRIES) {
            // 等待 1s 后重试
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      
      if (lastProxyError || !proxyResponse) {
        throw new Error(`代理服务器连接失败（已重试${MAX_RETRIES}次）: ${lastProxyError?.message || 'unknown'}`);
      }

      const proxyResult = await proxyResponse.json();
      console.log('Proxy response:', proxyResult);
      
      // 检查是否需要降级到 Native 支付（仅对H5支付降级，JSAPI不降级）
      if (isH5 && (proxyResult.code === 'PARAM_ERROR' || proxyResult.code === 'NO_AUTH' || !proxyResult.h5_url)) {
        console.log('H5 payment failed, falling back to Native QR code payment');
        fallbackReason = proxyResult.message || 'H5支付不可用，已自动切换为扫码支付';
        
        // 重新构建 Native 支付请求（使用公众号 appId）
        const nativeApiPath = '/v3/pay/transactions/native';
        const nativeApiUrl = `https://api.mch.weixin.qq.com${nativeApiPath}`;
        const nativeRequestBody: Record<string, unknown> = {
          appid: publicAppId,
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
    const actualIsJsapi = actualPayType === 'jsapi';
    const actualIsMiniProgram = actualPayType === 'miniprogram';
    let payUrl: string = '';
    let jsapiPayParams: Record<string, string> | undefined;
    let miniprogramPayParams: Record<string, string> | undefined;
    
    if (actualIsJsapi || actualIsMiniProgram) {
      // JSAPI/小程序支付返回 prepay_id，需要生成前端调起支付的参数
      const prepayId = wechatResult.prepay_id as string | undefined;
      if (!prepayId) {
        console.error('WeChat response missing prepay_id:', wechatResult);
        const code = (wechatResult as any)?.code as string | undefined;
        const msg = (wechatResult as any)?.message as string | undefined;
        if (code || msg) {
          throw new Error(`微信下单失败：${[code, msg].filter(Boolean).join(' ')}`);
        }
        throw new Error('未获取到 prepay_id');
      }
      
      // 生成前端调起支付所需的签名参数
      const jsapiTimestamp = getTimestamp().toString();
      const jsapiNonceStr = generateNonceStr();
      const packageStr = `prepay_id=${prepayId}`;
      
      // 小程序支付使用小程序 appId 签名，JSAPI 使用公众号 appId
      const signAppId = actualIsMiniProgram ? miniProgramAppId : publicAppId;
      
      // 签名内容：appId、timeStamp、nonceStr、package
      const jsapiSignMessage = `${signAppId}\n${jsapiTimestamp}\n${jsapiNonceStr}\n${packageStr}\n`;
      const jsapiPaySign = await signWithRSA(jsapiSignMessage, privateKey);
      
      const payParams = {
        appId: signAppId!,
        timeStamp: jsapiTimestamp,
        nonceStr: jsapiNonceStr,
        package: packageStr,
        signType: 'RSA',
        paySign: jsapiPaySign
      };
      
      if (actualIsMiniProgram) {
        miniprogramPayParams = payParams;
        console.log('MiniProgram pay params generated:', { ...miniprogramPayParams, paySign: '***' });
      } else {
        jsapiPayParams = payParams;
        console.log('JSAPI pay params generated:', { ...jsapiPayParams, paySign: '***' });
      }
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
    
    if (reuseExistingOrder || shouldSkipInsert) {
      // 🔧 复用已有订单：仅更新支付类型和过期时间（订单已在数据库中）
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pay_type: actualPayType || null,
          qr_code_url: payUrl || null,
          expired_at: expiredAt.toISOString(),
        })
        .eq('order_no', orderNo);
      
      if (updateError) {
        console.error('Update order error:', updateError);
        throw new Error('订单更新失败');
      }
      console.log('Order updated (reuse):', orderNo, 'payType:', actualPayType, 'skipInsert:', shouldSkipInsert);
    } else {
      // ⚠️ 不再无条件取消同用户同 package 的所有 pending 订单。
      // 真正的过期订单（>5 分钟）已在前面 162-177 行批量取消。
      // 5 分钟内的 pending 订单应保留，让用户在窗口期内继续支付（同时本次会创建一笔不同 pay_type 的新订单）。
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          user_id: isGuest ? null : finalUserId,
          package_key: packageKey,
          package_name: packageName,
          amount: amount,
          order_no: orderNo,
          status: 'pending',
          pay_type: actualPayType || null,
          qr_code_url: payUrl || null,
          expired_at: expiredAt.toISOString(),
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null,
          buyer_address: buyerAddress || null,
          shipping_status: (buyerName || buyerPhone) ? 'pending' : null,
          id_card_name: idCardName || null,
          id_card_number: idCardNumber || null,
        });

      if (insertError) {
        console.error('Insert order error:', insertError);
        throw new Error('订单创建失败');
      }
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
        miniprogramPayParams, // 小程序支付专用参数
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