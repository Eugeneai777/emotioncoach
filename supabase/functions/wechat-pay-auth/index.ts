import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 微信支付前置认证（仅微信浏览器使用）
 * 
 * 功能：
 * 1. 生成静默授权 URL（snsapi_base，用户无感知）
 * 2. 用 code 换取 openId + 自动识别老用户/新用户 + 返回登录令牌
 * 
 * 这样前端在回调后可以：
 * - 直接用 tokenHash 自动登录（无弹窗）
 * - 直接用 openId 拉起 JSAPI 支付
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { redirectUri, code, flow, openId: directOpenId, unionId: directUnionId, source } = body;

    // 模式3：小程序直接使用 openId 注册/登录（无需 OAuth 跳转）
    if (directOpenId && source === 'miniprogram') {
      console.log('[WechatPayAuth] Direct openId registration from miniprogram');
      return await ensureUserFromOpenId(directOpenId, directUnionId);
    }

    // 模式2：用 code 换取 openId + 自动登录/注册
    if (code) {
      return await exchangeCodeAndEnsureUser(code);
    }

    // 模式1：生成授权 URL
    if (redirectUri) {
      return generateAuthUrl(redirectUri, flow);
    }

    return new Response(
      JSON.stringify({ error: 'redirectUri or code is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WechatPayAuth] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * 生成微信静默授权 URL
 * 固定回调到 /pay-entry，由 pay-entry 中转处理
 */
function generateAuthUrl(redirectUri: string, flow?: string): Response {
  const appId = Deno.env.get('WECHAT_APP_ID');
  if (!appId) {
    return new Response(
      JSON.stringify({ error: 'WeChat not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const wechatBaseUrl = 'https://wechat.eugenewe.net';
  
  // 统一回调到 /pay-entry
  const callbackUrl = new URL('/pay-entry', wechatBaseUrl);
  callbackUrl.searchParams.set('payment_auth_callback', '1');
  callbackUrl.searchParams.set('payment_redirect', redirectUri);
  if (flow) {
    callbackUrl.searchParams.set('pay_flow', flow);
  }

  // state 用于防止 CSRF
  const state = `payauth_${Date.now()}`;

  // 使用 snsapi_base 静默授权（用户无感知）
  const wechatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(callbackUrl.toString())}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;

  console.log('[WechatPayAuth] Generated silent auth URL for flow:', flow);

  return new Response(
    JSON.stringify({ 
      success: true,
      authUrl: wechatAuthUrl,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * 直接使用 openId 确保用户存在（小程序专用）
 * 小程序环境无法使用公众号 OAuth，所以直接传入 openId
 * 
 * 重要：使用 unionId 来识别同一个微信用户，避免公众号和小程序 openId 不同导致重复注册
 */
async function ensureUserFromOpenId(openId: string, unionId?: string): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[WechatPayAuth] Supabase credentials not configured');
    return new Response(
      JSON.stringify({ error: 'Server not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('[WechatPayAuth] ensureUserFromOpenId, openId prefix:', openId.substring(0, 10), 'unionId:', unionId ? unionId.substring(0, 10) + '...' : 'none');

  // 创建 Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. 先按 openId 查找（小程序的 openId）
  let existingMapping = null;
  const { data: openIdMapping, error: mappingError } = await supabase
    .from('wechat_user_mappings')
    .select('system_user_id, openid')
    .eq('openid', openId)
    .maybeSingle();

  if (mappingError) {
    console.error('[WechatPayAuth] Error checking openId mapping:', mappingError);
  }

  existingMapping = openIdMapping;

  // 2. 如果按 openId 找不到，但有 unionId，则按 unionId 查找（可能是之前通过公众号注册的用户）
  if (!existingMapping?.system_user_id && unionId) {
    console.log('[WechatPayAuth] No mapping by openId, trying unionId...');
    const { data: unionIdMapping, error: unionError } = await supabase
      .from('wechat_user_mappings')
      .select('system_user_id, openid')
      .eq('unionid', unionId)
      .maybeSingle();

    if (unionError) {
      console.error('[WechatPayAuth] Error checking unionId mapping:', unionError);
    }

    if (unionIdMapping?.system_user_id) {
      console.log('[WechatPayAuth] Found existing user by unionId:', unionIdMapping.system_user_id);
      existingMapping = unionIdMapping;
      
      // 为这个用户添加小程序的 openId 映射（方便下次直接用 openId 查找）
      const { error: insertError } = await supabase
        .from('wechat_user_mappings')
        .insert({
          openid: openId,
          system_user_id: unionIdMapping.system_user_id,
          unionid: unionId,
        });
      
      if (insertError) {
        // 可能是 openid 唯一约束冲突，忽略
        console.log('[WechatPayAuth] Could not insert miniprogram openId mapping:', insertError.message);
      } else {
        console.log('[WechatPayAuth] Added miniprogram openId mapping for existing user');
      }
    }
  }

  let userId: string;
  let isNewUser = false;

  if (existingMapping?.system_user_id) {
    // 老用户：直接使用已绑定的用户ID
    userId = existingMapping.system_user_id;
    console.log('[WechatPayAuth] Found existing user for miniprogram:', userId);
  } else {
    // 新用户：静默创建账号
    console.log('[WechatPayAuth] No existing user for miniprogram, creating new one...');
    
    // 使用微信 openId 生成唯一邮箱（与现有系统保持一致）
    // 注意：小程序 openId 与公众号 openId 不同，但格式一致
    const tempEmail = `wechat_${openId.toLowerCase()}@temp.youjin365.com`;
    const tempPassword = `wechat_${openId}_${Date.now()}`;

    // 创建用户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        auth_provider: 'wechat_miniprogram',
        wechat_openid: openId,
      },
    });

    if (authError) {
      console.error('[WechatPayAuth] Error creating miniprogram user:', authError);
      
      // 尝试通过邮箱查找用户
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === tempEmail);
      
      if (existingUser) {
        userId = existingUser.id;
        console.log('[WechatPayAuth] Found existing user by email:', userId);
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      userId = authData.user.id;
      isNewUser = true;
      console.log('[WechatPayAuth] Created new miniprogram user:', userId);
    }

    // 创建/更新微信用户映射
    const { error: insertMappingError } = await supabase
      .from('wechat_user_mappings')
      .upsert({
        openid: openId,
        system_user_id: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'openid',
      });

    if (insertMappingError) {
      console.error('[WechatPayAuth] Error creating mapping:', insertMappingError);
    }

    // 如果是新用户，更新 profiles 表
    if (isNewUser) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          auth_provider: 'wechat_miniprogram',
          smart_notification_enabled: true,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[WechatPayAuth] Error updating profile:', profileError);
      }
    }
  }

  // 为用户生成 magic link token
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: `wechat_${openId.toLowerCase()}@temp.youjin365.com`,
  });

  if (linkError) {
    console.error('[WechatPayAuth] Error generating magic link for miniprogram:', linkError);
    return new Response(
      JSON.stringify({ 
        success: true,
        openId,
        userId,
        isNewUser,
        tokenHash: null,
        warning: 'Failed to generate login token',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const linkUrl = new URL(linkData.properties.action_link);
  const tokenHash = linkUrl.searchParams.get('token_hash') || linkUrl.hash?.replace('#', '');

  console.log('[WechatPayAuth] Successfully processed miniprogram user:', userId);

  return new Response(
    JSON.stringify({ 
      success: true,
      openId,
      userId,
      isNewUser,
      tokenHash,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * 尝试通过 cgi-bin/user/info 获取已关注用户的信息
 * 此接口仅对已关注公众号的用户返回真实昵称头像
 */
async function tryGetUserInfo(openId: string): Promise<{ nickname?: string; avatar_url?: string }> {
  try {
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
    
    if (!appId || !appSecret) {
      console.log('[WechatPayAuth] tryGetUserInfo: WeChat credentials not configured');
      return {};
    }

    // 1. 获取 access_token（通过代理服务器）
    let accessToken: string | null = null;
    
    if (proxyUrl && proxyToken) {
      // 使用代理服务器获取 access_token
      const tokenProxyUrl = `${proxyUrl}/proxy/wechat/token?appid=${appId}&secret=${appSecret}`;
      const tokenResponse = await fetch(tokenProxyUrl, {
        headers: { 'Authorization': `Bearer ${proxyToken}` }
      });
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        console.log('[WechatPayAuth] Got access_token from proxy');
      }
    } else {
      // 直接请求微信 API（可能被 IP 白名单限制）
      const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        accessToken = tokenData.access_token;
        console.log('[WechatPayAuth] Got access_token directly');
      }
    }

    if (!accessToken) {
      console.log('[WechatPayAuth] tryGetUserInfo: Failed to get access_token');
      return {};
    }

    // 2. 调用 cgi-bin/user/info 获取用户信息（仅对已关注用户有效）
    let userInfoUrl: string;
    let userInfoResponse: Response;
    
    if (proxyUrl && proxyToken) {
      // 使用代理服务器
      userInfoUrl = `${proxyUrl}/proxy/wechat/user/info?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
      userInfoResponse = await fetch(userInfoUrl, {
        headers: { 'Authorization': `Bearer ${proxyToken}` }
      });
    } else {
      userInfoUrl = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
      userInfoResponse = await fetch(userInfoUrl);
    }
    
    const userInfo = await userInfoResponse.json();
    
    console.log('[WechatPayAuth] User info response:', JSON.stringify({
      subscribe: userInfo.subscribe,
      nickname: userInfo.nickname ? '***' : null,
      errcode: userInfo.errcode,
    }));

    // 检查是否已关注并且有昵称
    if (userInfo.subscribe === 1 && userInfo.nickname && userInfo.nickname !== '微信用户') {
      return {
        nickname: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
      };
    }
    
    return {};
  } catch (e) {
    console.error('[WechatPayAuth] tryGetUserInfo error:', e);
    return {};
  }
}

/**
 * 用 code 换取 openId，并自动识别/创建用户，返回登录令牌
 */
async function exchangeCodeAndEnsureUser(code: string): Promise<Response> {
  const appId = Deno.env.get('WECHAT_APP_ID');
  const appSecret = Deno.env.get('WECHAT_APP_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!appId || !appSecret) {
    console.error('[WechatPayAuth] WeChat credentials not configured');
    return new Response(
      JSON.stringify({ error: 'WeChat not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[WechatPayAuth] Supabase credentials not configured');
    return new Response(
      JSON.stringify({ error: 'Server not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. 用 code 换取 access_token 和 openid
  const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
  
  const tokenResponse = await fetch(tokenUrl);
  const tokenData = await tokenResponse.json();

  if (tokenData.errcode) {
    console.error('[WechatPayAuth] Failed to get access token:', tokenData);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get openId', 
        errcode: tokenData.errcode,
        errmsg: tokenData.errmsg 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const openId = tokenData.openid;
  if (!openId) {
    console.error('[WechatPayAuth] No openid in response');
    return new Response(
      JSON.stringify({ error: 'No openId in response' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('[WechatPayAuth] Got openId, checking user mapping...');

  // 2. 创建 Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 3. 查找是否已有用户绑定
  const { data: existingMapping, error: mappingError } = await supabase
    .from('wechat_user_mappings')
    .select('system_user_id')
    .eq('openid', openId)
    .maybeSingle();

  if (mappingError) {
    console.error('[WechatPayAuth] Error checking mapping:', mappingError);
  }

  let userId: string;
  let isNewUser = false;

  if (existingMapping?.system_user_id) {
    // 老用户：直接使用已绑定的用户ID
    userId = existingMapping.system_user_id;
    console.log('[WechatPayAuth] Found existing user:', userId);
    
    // 老用户登录时，异步尝试更新资料（如果缺失）
    const tryUpdateExistingUserInfo = async () => {
      try {
        // 检查当前用户是否缺少资料
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        const needsUpdate = !profile?.display_name || 
                           profile.display_name === '微信用户' || 
                           !profile?.avatar_url;

        if (!needsUpdate) {
          console.log('[WechatPayAuth] Existing user has complete profile, skipping sync');
          return;
        }

        // 尝试获取微信用户信息
        const userInfo = await tryGetUserInfo(openId);
        
        if (userInfo.nickname || userInfo.avatar_url) {
          // 更新 wechat_user_mappings
          const mappingUpdate: Record<string, unknown> = { 
            updated_at: new Date().toISOString() 
          };
          if (userInfo.nickname) mappingUpdate.nickname = userInfo.nickname;
          if (userInfo.avatar_url) mappingUpdate.avatar_url = userInfo.avatar_url;
          
          await supabase
            .from('wechat_user_mappings')
            .update(mappingUpdate)
            .eq('openid', openId);

          // 更新 profiles
          const profileUpdate: Record<string, unknown> = {};
          if (userInfo.nickname && (!profile?.display_name || profile.display_name === '微信用户')) {
            profileUpdate.display_name = userInfo.nickname;
          }
          if (userInfo.avatar_url && !profile?.avatar_url) {
            profileUpdate.avatar_url = userInfo.avatar_url;
          }

          if (Object.keys(profileUpdate).length > 0) {
            await supabase
              .from('profiles')
              .update(profileUpdate)
              .eq('id', userId);
            
            console.log('[WechatPayAuth] Updated existing user profile:', userId);
          }
        }
      } catch (e) {
        console.error('[WechatPayAuth] Error updating existing user info:', e);
      }
    };

    // 使用 waitUntil 或 fire-and-forget
    const waitUntil = (globalThis as any)?.EdgeRuntime?.waitUntil;
    if (typeof waitUntil === 'function') {
      waitUntil(tryUpdateExistingUserInfo());
    } else {
      tryUpdateExistingUserInfo();
    }
  } else {
    // 新用户：静默创建账号
    console.log('[WechatPayAuth] No existing user, creating new one...');
    
    // 使用微信 openId 生成唯一邮箱（与现有系统保持一致）
    const tempEmail = `wechat_${openId.toLowerCase()}@temp.youjin365.com`;
    const tempPassword = `wechat_${openId}_${Date.now()}`;

    // 创建用户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        auth_provider: 'wechat_pay_silent',
        wechat_openid: openId,
      },
    });

    if (authError) {
      // 如果用户已存在（可能之前通过其他方式创建），尝试获取用户
      console.error('[WechatPayAuth] Error creating user:', authError);
      
      // 尝试通过邮箱查找用户
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === tempEmail);
      
      if (existingUser) {
        userId = existingUser.id;
        console.log('[WechatPayAuth] Found existing user by email:', userId);
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      userId = authData.user.id;
      isNewUser = true;
      console.log('[WechatPayAuth] Created new user:', userId);
    }

    // 创建/更新微信用户映射
    const { error: insertMappingError } = await supabase
      .from('wechat_user_mappings')
      .upsert({
        openid: openId,
        system_user_id: userId,
        unionid: tokenData.unionid || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'openid',
      });

    if (insertMappingError) {
      console.error('[WechatPayAuth] Error creating mapping:', insertMappingError);
      // 不阻塞流程，继续
    }

    // 如果是新用户，尝试获取用户信息并更新 profiles 表
    if (isNewUser) {
      // 尝试获取微信用户信息（仅对已关注公众号的用户有效）
      const userInfo = await tryGetUserInfo(openId);
      
      const profileUpdateData: Record<string, unknown> = {
        auth_provider: 'wechat',
        smart_notification_enabled: true, // 首次微信注册默认开启
      };
      
      if (userInfo.nickname) {
        profileUpdateData.display_name = userInfo.nickname;
        console.log('[WechatPayAuth] Setting nickname for new user:', userInfo.nickname);
      }
      if (userInfo.avatar_url) {
        profileUpdateData.avatar_url = userInfo.avatar_url;
        console.log('[WechatPayAuth] Setting avatar for new user');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.error('[WechatPayAuth] Error updating profile:', profileError);
        // 不阻塞流程
      }
      
      // 同时更新 wechat_user_mappings 中的昵称和头像
      if (userInfo.nickname || userInfo.avatar_url) {
        const mappingUpdateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (userInfo.nickname) mappingUpdateData.nickname = userInfo.nickname;
        if (userInfo.avatar_url) mappingUpdateData.avatar_url = userInfo.avatar_url;
        
        await supabase
          .from('wechat_user_mappings')
          .update(mappingUpdateData)
          .eq('openid', openId);
      }
    }
  }

  // 4. 为用户生成 magic link token（用于前端无感登录）
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: `wechat_${openId.toLowerCase()}@temp.youjin365.com`,
  });

  if (linkError) {
    console.error('[WechatPayAuth] Error generating magic link:', linkError);
    // 即使生成链接失败，也返回 openId，让前端可以继续支付（只是不会自动登录）
    return new Response(
      JSON.stringify({ 
        success: true,
        openId,
        userId,
        isNewUser,
        tokenHash: null,
        warning: 'Failed to generate login token',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 从 magic link URL 中提取 token_hash
  const linkUrl = new URL(linkData.properties.action_link);
  const tokenHash = linkUrl.searchParams.get('token_hash') || linkUrl.hash?.replace('#', '');

  console.log('[WechatPayAuth] Successfully generated token for user:', userId);

  return new Response(
    JSON.stringify({ 
      success: true,
      openId,
      userId,
      isNewUser,
      tokenHash,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
