import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 批量同步微信用户资料
 * 
 * 功能：
 * 1. 查询所有已关注但缺少昵称/头像的用户
 * 2. 批量调用微信 cgi-bin/user/info API 获取资料
 * 3. 同时更新 wechat_user_mappings 和 profiles 表
 * 
 * 触发方式：
 * - CRON 定时任务
 * - 手动调用（需要 service_role 权限）
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 验证权限 - 仅允许 CRON 或 service_role 调用
    const cronSecret = Deno.env.get('CRON_SECRET');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');
    
    const isCron = authHeader === `Bearer ${cronSecret}`;
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    
    if (!isCron && !isServiceRole) {
      // 也允许通过 anon key 调用（用于 admin 手动触发）
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey!);
      
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // 检查是否为管理员
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userData.user.id)
          .maybeSingle();
        
        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey!);

    // 获取微信配置
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!proxyUrl || !proxyToken || !appId || !appSecret) {
      return new Response(
        JSON.stringify({ error: 'WeChat configuration incomplete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 access_token
    const baseUrl = proxyUrl.replace(/\/$/, '');
    const tokenResp = await fetch(`${baseUrl}/wechat/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proxyToken}`,
      },
      body: JSON.stringify({ appid: appId, secret: appSecret }),
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to get access token', details: tokenData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 查询需要同步资料的用户
    // 条件：已关注 + (昵称为空 OR 昵称为默认值 OR 头像为空)
    const { data: usersToSync, error: queryError } = await supabase
      .from('wechat_user_mappings')
      .select('openid, system_user_id, nickname, avatar_url')
      .eq('subscribe_status', true)
      .or('nickname.is.null,nickname.eq.微信用户,nickname.eq.,avatar_url.is.null')
      .limit(100); // 每次最多处理 100 个

    if (queryError) {
      console.error('Error querying users:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to query users', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BatchSync] Found ${usersToSync?.length || 0} users to sync`);

    const results = {
      total: usersToSync?.length || 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{ openid: string; status: string; nickname?: string }>,
    };

    for (const user of usersToSync || []) {
      try {
        // 调用微信 API 获取用户信息
        const userInfoResp = await fetch(`${baseUrl}/wechat-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${proxyToken}`,
          },
          body: JSON.stringify({
            target_url: `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${user.openid}&lang=zh_CN`,
            method: 'GET',
          }),
        });

        const userInfo = await userInfoResp.json();

        // 检查是否获取到有效信息
        if (userInfo.errcode) {
          console.log(`[BatchSync] WeChat API error for ${user.openid}:`, userInfo.errmsg);
          results.failed++;
          results.details.push({ openid: user.openid, status: 'api_error' });
          continue;
        }

        if (!userInfo.nickname || userInfo.nickname === '微信用户' || userInfo.nickname === '') {
          // 未能获取真实昵称（可能是隐私限制）
          results.skipped++;
          results.details.push({ openid: user.openid, status: 'no_valid_data' });
          continue;
        }

        // 更新 wechat_user_mappings
        const { error: mappingError } = await supabase
          .from('wechat_user_mappings')
          .update({
            nickname: userInfo.nickname,
            avatar_url: userInfo.headimgurl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('openid', user.openid);

        if (mappingError) {
          console.error(`[BatchSync] Error updating mapping for ${user.openid}:`, mappingError);
        }

        // 更新 profiles 表
        if (user.system_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.system_user_id)
            .maybeSingle();

          // 仅当 profile 中没有有效信息时才更新
          const updateData: Record<string, unknown> = {};
          
          if (!profile?.display_name || profile.display_name === '微信用户') {
            updateData.display_name = userInfo.nickname;
          }
          if (!profile?.avatar_url) {
            updateData.avatar_url = userInfo.headimgurl;
          }

          if (Object.keys(updateData).length > 0) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', user.system_user_id);

            if (profileError) {
              console.error(`[BatchSync] Error updating profile for ${user.system_user_id}:`, profileError);
            }
          }
        }

        results.success++;
        results.details.push({ 
          openid: user.openid, 
          status: 'success', 
          nickname: userInfo.nickname 
        });

        console.log(`[BatchSync] Successfully synced ${user.openid}: ${userInfo.nickname}`);
      } catch (error) {
        console.error(`[BatchSync] Error processing ${user.openid}:`, error);
        results.failed++;
        results.details.push({ openid: user.openid, status: 'error' });
      }
    }

    console.log(`[BatchSync] Completed: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${results.success} users`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[BatchSync] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
