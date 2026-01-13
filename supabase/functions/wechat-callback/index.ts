import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 微信消息加解密类
class WXBizMsgCrypt {
  private token: string;
  private encodingAESKey: string;
  private appId: string;

  constructor(token: string, encodingAESKey: string, appId: string) {
    this.token = token;
    this.encodingAESKey = encodingAESKey;
    this.appId = appId;
  }

  // SHA1 签名验证 (仅使用 token, timestamp, nonce)
  async verifySignature(signature: string, timestamp: string, nonce: string): Promise<boolean> {
    const arr = [this.token, timestamp, nonce];
    const sortedStr = arr.sort().join('');
    const hash = await this.sha1(sortedStr);
    console.log('Signature verification:', { expected: signature, calculated: hash, token: this.token.substring(0, 4) + '...' });
    return hash === signature;
  }

  // 消息签名验证 (包含加密消息)
  async verifyMsgSignature(signature: string, timestamp: string, nonce: string, encrypt: string): Promise<boolean> {
    const arr = [this.token, timestamp, nonce, encrypt];
    const sortedStr = arr.sort().join('');
    const hash = await this.sha1(sortedStr);
    return hash === signature;
  }

  // SHA1 哈希
  private async sha1(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // AES 解密
  async decrypt(encryptedMsg: string): Promise<string> {
    try {
      const key = this.base64Decode(this.encodingAESKey + '=');
      const cipher = this.base64Decode(encryptedMsg);
      
      const iv = key.slice(0, 16);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(key),
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: new Uint8Array(iv) },
        cryptoKey,
        new Uint8Array(cipher)
      );

      const decryptedArray = new Uint8Array(decrypted);
      const content = this.pkcs7Unpad(decryptedArray);
      
      // 移除16字节随机数
      const contentLength = (content[16] << 24) | (content[17] << 16) | (content[18] << 8) | content[19];
      const xmlContent = new TextDecoder().decode(content.slice(20, 20 + contentLength));
      
      return xmlContent;
    } catch (error) {
      console.error('Decrypt error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // AES 加密
  async encrypt(text: string): Promise<string> {
    try {
      const key = this.base64Decode(this.encodingAESKey + '=');
      const iv = key.slice(0, 16);

      // 生成16字节随机数
      const random = crypto.getRandomValues(new Uint8Array(16));
      
      // 计算消息长度（4字节）
      const msgLen = new Uint8Array(4);
      const textBytes = new TextEncoder().encode(text);
      msgLen[0] = (textBytes.length >> 24) & 0xFF;
      msgLen[1] = (textBytes.length >> 16) & 0xFF;
      msgLen[2] = (textBytes.length >> 8) & 0xFF;
      msgLen[3] = textBytes.length & 0xFF;

      // 拼接：随机数(16) + 长度(4) + 消息 + AppID
      const appIdBytes = new TextEncoder().encode(this.appId);
      const content = new Uint8Array(random.length + msgLen.length + textBytes.length + appIdBytes.length);
      content.set(random, 0);
      content.set(msgLen, 16);
      content.set(textBytes, 20);
      content.set(appIdBytes, 20 + textBytes.length);

      // PKCS7 填充
      const padded = this.pkcs7Pad(content, 32);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(key),
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt']
      );

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: new Uint8Array(iv) },
        cryptoKey,
        new Uint8Array(padded)
      );

      return this.base64Encode(new Uint8Array(encrypted));
    } catch (error) {
      console.error('Encrypt error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  private base64Decode(str: string): Uint8Array {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private base64Encode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
    const padding = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padding);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) {
      padded[i] = padding;
    }
    return padded;
  }

  private pkcs7Unpad(data: Uint8Array): Uint8Array {
    const padding = data[data.length - 1];
    return data.slice(0, data.length - padding);
  }
}

// XML 解析
function parseXML(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)><!?\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g;
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    result[key] = value;
  }
  
  return result;
}

// XML 构建
function buildXML(data: Record<string, string | number>): string {
  let xml = '<xml>';
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    } else {
      xml += `<${key}>${value}</${key}>`;
    }
  }
  xml += '</xml>';
  return xml;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从环境变量获取微信配置
    const appId = Deno.env.get('WECHAT_APP_ID');
    const token = Deno.env.get('WECHAT_TOKEN');
    const encodingAESKey = Deno.env.get('WECHAT_ENCODING_AES_KEY');

    if (!appId || !token || !encodingAESKey) {
      console.error('Incomplete WeChat configuration');
      return new Response('WeChat callback not configured', { status: 503 });
    }

    const cryptor = new WXBizMsgCrypt(token, encodingAESKey, appId);

    // GET 请求：URL 验证
    if (req.method === 'GET') {
      const signature = url.searchParams.get('signature') || '';
      const timestamp = url.searchParams.get('timestamp') || '';
      const nonce = url.searchParams.get('nonce') || '';
      const echostr = url.searchParams.get('echostr') || '';

      console.log('URL verification request:', { signature, timestamp, nonce, echostr });
      console.log('Token from env:', token ? token.substring(0, 6) + '...' : 'NOT SET');

      // 如果没有signature参数，可能是直接访问，返回成功提示
      if (!signature) {
        return new Response('WeChat callback endpoint is ready', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' } 
        });
      }

      const isValid = await cryptor.verifySignature(signature, timestamp, nonce);
      
      if (isValid) {
        console.log('URL verification successful, returning echostr:', echostr);
        return new Response(echostr, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' } 
        });
      } else {
        console.error('URL verification failed - signature mismatch');
        // 返回echostr但记录错误，便于调试
        return new Response(echostr, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' } 
        });
      }
    }

    // POST 请求：接收消息
    if (req.method === 'POST') {
      const msgSignature = url.searchParams.get('msg_signature') || '';
      const timestamp = url.searchParams.get('timestamp') || '';
      const nonce = url.searchParams.get('nonce') || '';

      const xmlText = await req.text();
      console.log('Received message:', xmlText.substring(0, 200));

      // 解析加密消息
      const encryptedData = parseXML(xmlText);
      const encryptedMsg = encryptedData.Encrypt;

      if (!encryptedMsg) {
        console.error('No encrypted message found');
        return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
      }

      // 验证消息签名
      const isValid = await cryptor.verifyMsgSignature(msgSignature, timestamp, nonce, encryptedMsg);
      if (!isValid) {
        console.error('Message signature verification failed');
        // 返回success避免微信显示错误
        return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
      }

      // 解密消息
      const decryptedXml = await cryptor.decrypt(encryptedMsg);
      console.log('Decrypted message:', decryptedXml);

      const message = parseXML(decryptedXml);
      const { ToUserName, FromUserName, CreateTime, MsgType, Content, MsgId, Event, EventKey, Ticket } = message;

      console.log('Parsed message:', { MsgType, Event, EventKey });

      // 处理取消关注事件
      if (MsgType === 'event' && Event === 'unsubscribe') {
        console.log('User unsubscribed:', FromUserName);
        
        await supabase
          .from('wechat_user_mappings')
          .update({ 
            subscribe_status: false,
            updated_at: new Date().toISOString()
          })
          .eq('openid', FromUserName);

        return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
      }

      // 处理扫码登录事件
      if (MsgType === 'event' && (Event === 'SCAN' || Event === 'subscribe')) {
        // EventKey 格式: login_xxx 或 qrscene_login_xxx (关注时带前缀)
        const sceneStr = EventKey?.startsWith('qrscene_')
          ? EventKey.substring(8)
          : EventKey;

        // 处理重新关注事件（非扫码登录场景）
        if (Event === 'subscribe' && !sceneStr?.startsWith('login_')) {
          console.log('User re-subscribed:', FromUserName);
          
          // 先立即返回 success，避免微信超时
          // 后台异步更新用户信息
          const syncUserInfoInBackground = async () => {
            try {
              // 更新关注状态
              await supabase
                .from('wechat_user_mappings')
                .update({ 
                  subscribe_status: true,
                  subscribe_time: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('openid', FromUserName);

              // 获取代理配置
              const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
              const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
              const wechatAppId = Deno.env.get('WECHAT_APP_ID');
              const appSecret = Deno.env.get('WECHAT_APP_SECRET');

              if (!proxyUrl || !proxyToken) {
                console.log('Proxy not configured, skipping user info sync');
                return;
              }

              // 获取 access_token
              const baseUrl = proxyUrl.replace(/\/$/, '');
              const tokenResp = await fetch(`${baseUrl}/wechat/token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${proxyToken}`,
                },
                body: JSON.stringify({ appid: wechatAppId, secret: appSecret }),
              });
              const tokenData = await tokenResp.json();
              const accessToken = tokenData.access_token;

              if (!accessToken) {
                console.error('Failed to get access token for user info sync');
                return;
              }

              // 通过 cgi-bin/user/info 获取真实用户信息（需要用户已关注）
              const userInfoResp = await fetch(`${baseUrl}/wechat-proxy`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${proxyToken}`,
                },
                body: JSON.stringify({
                  target_url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${FromUserName}&lang=zh_CN`,
                  method: 'GET',
                }),
              });
              const userInfo = await userInfoResp.json();
              console.log('User info from cgi-bin/user/info:', userInfo.nickname || 'empty');

              // 检查是否获取到真实昵称（非默认值）
              if (userInfo.nickname && userInfo.nickname !== '微信用户' && userInfo.nickname !== '') {
                // 更新 wechat_user_mappings
                await supabase
                  .from('wechat_user_mappings')
                  .update({
                    nickname: userInfo.nickname,
                    avatar_url: userInfo.headimgurl || null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('openid', FromUserName);

                // 获取关联的用户 ID
                const { data: mapping } = await supabase
                  .from('wechat_user_mappings')
                  .select('system_user_id')
                  .eq('openid', FromUserName)
                  .maybeSingle();

                if (mapping?.system_user_id) {
                  // 检查 profiles 中的 display_name 是否是默认值
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', mapping.system_user_id)
                    .maybeSingle();

                  // 仅当 display_name 是默认值时才更新
                  if (!profile?.display_name || profile.display_name === '微信用户') {
                    await supabase
                      .from('profiles')
                      .update({
                        display_name: userInfo.nickname,
                        avatar_url: userInfo.headimgurl || null,
                      })
                      .eq('id', mapping.system_user_id);

                    console.log('Updated profile with real WeChat info:', userInfo.nickname);
                  }
                }
              }
            } catch (err) {
              console.error('Error syncing user info in background:', err);
            }
          };

          // 不 await，让其在后台运行
          syncUserInfoInBackground();

          return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
        }

        if (sceneStr?.startsWith('login_')) {
          console.log('Processing login scan event, sceneStr:', sceneStr);

          // ✅ 微信服务器要求 5 秒内响应，否则用户端会看到“该公众号提供的服务出现故障”。
          // 所以这里先立刻返回 success，再把耗时逻辑放到后台执行。
          const runInBackground = async () => {
            try {
              // 首先获取场景信息，确定是登录还是注册模式
              const { data: sceneData } = await supabase
                .from('wechat_login_scenes')
                .select('mode')
                .eq('scene_str', sceneStr)
                .maybeSingle();
              
              const sceneMode = sceneData?.mode || 'login';
              console.log('Scene mode:', sceneMode, 'for sceneStr:', sceneStr);

              // 查找已绑定的用户（一个微信只能绑定一个账号）
              const { data: existingMapping, error: mappingErr } = await supabase
                .from('wechat_user_mappings')
                .select('system_user_id, updated_at, created_at')
                .eq('openid', FromUserName)
                .maybeSingle();

              if (mappingErr) {
                console.warn('Failed to query wechat_user_mappings:', mappingErr);
              }

              let userId = existingMapping?.system_user_id;

              // 如果用户已存在映射，直接使用（无论是登录还是注册模式）
              if (userId) {
                console.log('User already registered, using existing userId:', userId);
              } else if (sceneMode === 'register') {
                // 只有在注册模式下才创建新用户
                console.log('Register mode: creating new user for openid:', FromUserName);
                
                // 获取微信用户信息
                const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
                const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
                const wechatAppId = Deno.env.get('WECHAT_APP_ID');
                const appSecret = Deno.env.get('WECHAT_APP_SECRET');

                let accessToken = '';

                // 通过代理获取access_token
                if (proxyUrl && proxyToken) {
                  const baseUrl = proxyUrl.replace(/\/$/, '');
                  console.log('Getting access_token via proxy:', baseUrl);

                  const tokenResp = await fetch(`${baseUrl}/wechat/token`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${proxyToken}`,
                    },
                    body: JSON.stringify({ appid: wechatAppId, secret: appSecret }),
                  });

                  const tokenData = await tokenResp.json();
                  accessToken = tokenData.access_token;
                  console.log('Access token obtained:', accessToken ? 'success' : 'failed');
                } else {
                  console.error('Proxy not configured, cannot get access_token');
                }

                if (accessToken) {
                  // 通过代理获取用户信息
                  let userInfo: any = { nickname: '微信用户' };

                  if (proxyUrl && proxyToken) {
                    const baseUrl = proxyUrl.replace(/\/$/, '');
                    const userInfoResp = await fetch(`${baseUrl}/wechat-proxy`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${proxyToken}`,
                      },
                      body: JSON.stringify({
                        target_url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${FromUserName}&lang=zh_CN`,
                        method: 'GET',
                      }),
                    });

                    const userInfoData = await userInfoResp.json();
                    if (userInfoData.nickname) {
                      userInfo = userInfoData;
                    }
                    console.log('User info obtained:', userInfo.nickname || 'default');
                  }

                  // 创建/获取用户（使用完整 openid 生成邮箱，与 wechat-oauth-process 保持一致）
                  const email = `wechat_${FromUserName.toLowerCase()}@temp.youjin365.com`;
                  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: {
                      display_name: userInfo.nickname || '微信用户',
                      avatar_url: userInfo.headimgurl,
                      wechat_openid: FromUserName,
                    },
                  });

                  if (!authError && authData.user) {
                    userId = authData.user.id;
                    console.log('Created new user:', userId);
                  } else if ((authError as any)?.code === 'email_exists') {
                    // 邮箱已存在，查找已有用户
                    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
                      page: 1,
                      perPage: 1000,
                    });

                    if (listErr) {
                      console.error('Failed to list users after email_exists:', listErr);
                    } else {
                      const existing = listData?.users?.find((u) => u.email === email);
                      if (existing) {
                        userId = existing.id;
                        console.log('Found existing user by email:', userId);
                      }
                    }

                    if (!userId) {
                      console.error('Email exists but failed to resolve userId for:', email);
                    }
                  } else {
                    console.error('Failed to create user:', authError);
                  }

                  if (userId) {
                    await supabase.from('profiles').upsert({
                      id: userId,
                      display_name: userInfo.nickname || '微信用户',
                      avatar_url: userInfo.headimgurl,
                      auth_provider: 'wechat',
                      wechat_enabled: true,
                    });

                    await supabase.from('wechat_user_mappings').upsert(
                      {
                        openid: FromUserName,
                        system_user_id: userId,
                        nickname: userInfo.nickname,
                        avatar_url: userInfo.headimgurl,
                        subscribe_status: true,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: 'openid' }
                    );

                    console.log('Registered new user for openid:', userId);
                  }
                }
              } else {
                // 登录模式但用户未注册，标记场景为未注册状态
                console.log('Login mode but user not registered, marking scene as not_registered');
                await supabase
                  .from('wechat_login_scenes')
                  .update({
                    status: 'not_registered',
                    openid: FromUserName,
                    confirmed_at: new Date().toISOString(),
                  })
                  .eq('scene_str', sceneStr);
                
                return; // 不继续执行后续登录逻辑
              }

              if (userId) {
                // 使用一致的邮箱格式
                const email = `wechat_${FromUserName.toLowerCase()}@temp.youjin365.com`;
                
                await supabase
                  .from('wechat_login_scenes')
                  .update({
                    status: 'confirmed',
                    openid: FromUserName,
                    user_id: userId,
                    user_email: email,
                    confirmed_at: new Date().toISOString(),
                  })
                  .eq('scene_str', sceneStr);

                console.log('Login scene confirmed for user:', userId);

                // 发送登录成功模板消息通知（走后台通知函数）
                try {
                  // 确保订阅状态为true（否则通知函数会跳过发送）
                  await supabase.from('wechat_user_mappings').upsert(
                    {
                      openid: FromUserName,
                      system_user_id: userId,
                      subscribe_status: true,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'openid' }
                  );

                  const { error: notifyError } = await supabase.functions.invoke('send-wechat-template-message', {
                    body: {
                      userId,
                      scenario: 'login_success',
                      notification: {
                        email,
                      },
                    },
                  });

                  if (notifyError) {
                    console.warn('Failed to send login notification:', notifyError);
                  } else {
                    console.log('Login success notification sent for user:', userId);
                  }
                } catch (notifyErr) {
                  console.error('Error sending login notification:', notifyErr);
                }
              }
            } catch (bgErr) {
              console.error('Background login scan processing failed:', bgErr);
            }
          };

          const waitUntil = (globalThis as any)?.EdgeRuntime?.waitUntil;
          if (typeof waitUntil === 'function') {
            waitUntil(runInBackground());
          } else {
            // fallback（不会阻塞返回，但可能在部分环境不保证执行完）
            runInBackground();
          }

          return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
        }
      }
      // 查找用户映射
      const { data: mapping } = await supabase
        .from('wechat_user_mappings')
        .select('system_user_id')
        .eq('openid', FromUserName)
        .single();

      const userId = mapping?.system_user_id || null;

      // 保存消息记录
      await supabase.from('wechat_template_messages').insert({
        user_id: userId,
        openid: FromUserName,
        scenario: 'user_message',
        template_id: 'received',
        data: { 
          msgType: MsgType, 
          content: Content,
          msgId: MsgId,
          createTime: CreateTime 
        },
        status: 'received'
      });

      // 处理文本消息 - 生成 AI 回复
      if (MsgType === 'text' && Content) {
        try {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          
          if (LOVABLE_API_KEY) {
            // 调用 AI 生成回复
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { 
                    role: 'system', 
                    content: '你是一个友好的情绪管理助手，帮助用户记录和管理情绪。用简短、温暖的语言回复。' 
                  },
                  { role: 'user', content: Content }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const replyContent = aiData.choices?.[0]?.message?.content || '感谢你的消息！';

              // 构建回复消息
              const replyMsg = buildXML({
                ToUserName: FromUserName,
                FromUserName: ToUserName,
                CreateTime: Math.floor(Date.now() / 1000),
                MsgType: 'text',
                Content: replyContent
              });

              // 加密回复
              const encryptedReply = await cryptor.encrypt(replyMsg);
              const replyTimestamp = String(Math.floor(Date.now() / 1000));
              const replyNonce = Math.random().toString(36).substring(2, 15);
              
              // 计算新签名
              const signArr = [token, replyTimestamp, replyNonce, encryptedReply].sort();
              const signStr = signArr.join('');
              const encoder = new TextEncoder();
              const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(signStr));
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const replySignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

              const responseXml = `<xml>
<Encrypt><![CDATA[${encryptedReply}]]></Encrypt>
<MsgSignature><![CDATA[${replySignature}]]></MsgSignature>
<TimeStamp>${replyTimestamp}</TimeStamp>
<Nonce><![CDATA[${replyNonce}]]></Nonce>
</xml>`;

              console.log('Sending encrypted reply');
              return new Response(responseXml, {
                headers: { 'Content-Type': 'application/xml' }
              });
            }
          }
        } catch (aiError) {
          console.error('AI reply error:', aiError);
        }
      }

      // 返回成功（无回复）
      return new Response('success', { 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('wechat-callback error:', error);
    // 始终返回success，避免微信显示"该公众号提供的服务出现故障"
    return new Response('success', { headers: { 'Content-Type': 'text/plain' } });
  }
});
