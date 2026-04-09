import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { logAuthEvent, extractClientInfo } from '../_shared/authEventLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientInfo = extractClientInfo(req);

  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 使用系统级微信配置
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ error: 'WeChat not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 通过 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    
    console.log('Fetching access token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      console.error('WeChat token error:', tokenData);
      return new Response(
        JSON.stringify({ error: `WeChat error: ${tokenData.errmsg || 'Unknown error'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    console.log('Got user info:', userInfo.nickname);

    // 检查是否已存在该 openid 的映射（一个微信只能绑定一个账号）
    const { data: existingMapping } = await supabaseClient
      .from('wechat_user_mappings')
      .select('system_user_id')
      .eq('openid', tokenData.openid)
      .maybeSingle();

    let finalUserId: string | null = null;
    let isNewUser = false;
    
    // 解析 state：支持 'register', 'register_订单号', 'bind_用户ID' 格式
    const isBind = state.startsWith('bind_');
    const isRegister = state === 'register' || state.startsWith('register_');
    const bindUserId = isBind ? state.replace('bind_', '') : null;

    // 如果 state 是 'register' 或 'register_xxx'，表示是注册流程
    if (isRegister) {
      if (existingMapping?.system_user_id) {
        // 微信已绑定用户，直接当作登录处理
        finalUserId = existingMapping.system_user_id;
        isNewUser = false;
        console.log('User already registered, logging in:', finalUserId);
      } else {
        // 创建新用户
        const email = `wechat_${tokenData.openid}@temp.youjin365.com`;
        const password = crypto.randomUUID();
        
        const { data: newUser, error: signUpError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nickname: userInfo.nickname,
            avatar_url: userInfo.headimgurl,
            wechat_openid: tokenData.openid
          }
        });

        if (signUpError) {
          // 如果是邮箱已存在错误，尝试获取现有用户并登录
          if (signUpError.code === 'email_exists') {
            console.log('Email exists, fetching existing user by email...');
            const { data: existingUserData, error: getUserError } = await supabaseClient.auth.admin.getUserByEmail(email);
            
            if (!getUserError && existingUserData?.user) {
              finalUserId = existingUserData.user.id;
              isNewUser = false;
              console.log('Found existing user by email:', finalUserId);
              
              // 确保映射存在（基于 openid 唯一约束）
              await supabaseClient
                .from('wechat_user_mappings')
                .upsert({
                  system_user_id: finalUserId,
                  openid: tokenData.openid,
                  unionid: tokenData.unionid,
                  nickname: userInfo.nickname,
                  avatar_url: userInfo.headimgurl,
                  subscribe_status: true,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'openid' });
            } else {
              console.error('Sign up error:', signUpError);
              return new Response(
                JSON.stringify({ error: signUpError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            console.error('Sign up error:', signUpError);
            return new Response(
              JSON.stringify({ error: signUpError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (!newUser?.user) {
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          finalUserId = newUser.user.id;
          isNewUser = true;
          console.log('Created new user:', finalUserId);
        }
      }
    } else if (isBind && bindUserId) {
      // 绑定流程 - 从 state 中获取用户ID（因为从微信跳回来时session可能丢失）
      console.log('Binding WeChat to user:', bindUserId);
      
      // 验证用户是否存在
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(bindUserId);
      
      if (userError || !userData?.user) {
        console.error('User not found:', bindUserId, userError);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 检查该微信是否已绑定其他用户（一个微信只能绑定一个账号）
      if (existingMapping?.system_user_id) {
        if (existingMapping.system_user_id === bindUserId) {
          // 当前用户已绑定此微信，返回成功
          console.log('User already bound to this WeChat:', bindUserId);
          return new Response(
            JSON.stringify({ success: true, isNewUser: false, alreadyBound: true, bindSuccess: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // 检查已绑定的是否为临时微信账号（wechat_*@temp.youjin365.com）
          const { data: boundAuthUser } = await supabaseClient.auth.admin.getUserById(existingMapping.system_user_id);
          const boundEmail = boundAuthUser?.user?.email || '';
          const isTempAccount = boundEmail.startsWith('wechat_') && boundEmail.endsWith('@temp.youjin365.com');
          
          if (isTempAccount) {
            // 临时账号：自动迁移映射到当前正式账号
            console.log('Existing mapping is a temp account, migrating from', existingMapping.system_user_id, 'to', bindUserId);
            
            const tempUserId = existingMapping.system_user_id;
            
            // 1. 将 wechat_user_mappings 的 system_user_id 更新为当前用户
            const { error: migrateError } = await supabaseClient
              .from('wechat_user_mappings')
              .update({ 
                system_user_id: bindUserId,
                updated_at: new Date().toISOString()
              })
              .eq('openid', tokenData.openid);
            
            if (migrateError) {
              console.error('Failed to migrate mapping:', migrateError);
              return new Response(
                JSON.stringify({ error: 'Failed to migrate WeChat binding' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            // 2. 迁移临时账号的业务数据到当前账号
            const migrationTables = [
              'orders',
              'store_orders:buyer_id',
              'user_camp_purchases',
              'training_camps',
              'conversations',
              'emotion_health_assessments',
              'scl90_assessments',
              'smart_notifications',
              'community_posts',
              'camp_daily_progress',
              'awakening_entries',
              'breathing_sessions',
              'alive_check_logs',
              'alive_check_settings',
              'coaching_appointments:client_id',
            ];
            
            for (const tableSpec of migrationTables) {
              const [table, column] = tableSpec.includes(':') 
                ? tableSpec.split(':') 
                : [tableSpec, 'user_id'];
              try {
                const { data: rows, error: checkErr } = await supabaseClient
                  .from(table)
                  .select('id')
                  .eq(column, tempUserId)
                  .limit(1);
                
                if (!checkErr && rows && rows.length > 0) {
                  const { error: updateErr } = await supabaseClient
                    .from(table)
                    .update({ [column]: bindUserId })
                    .eq(column, tempUserId);
                  
                  if (updateErr) {
                    console.error(`Failed to migrate ${table}:`, updateErr);
                  } else {
                    console.log(`Migrated ${table} records from temp to target`);
                  }
                }
              } catch (e) {
                console.error(`Error migrating ${table}:`, e);
              }
            }
            
            // 3. 合并 AI 额度（user_accounts）
            try {
              const { data: tempAccount } = await supabaseClient
                .from('user_accounts')
                .select('total_quota, used_quota')
                .eq('user_id', tempUserId)
                .maybeSingle();
              
              if (tempAccount && tempAccount.total_quota > 0) {
                const remainingQuota = Math.max(0, tempAccount.total_quota - tempAccount.used_quota);
                if (remainingQuota > 0) {
                  const { data: targetAccount } = await supabaseClient
                    .from('user_accounts')
                    .select('total_quota')
                    .eq('user_id', bindUserId)
                    .maybeSingle();
                  
                  if (targetAccount) {
                    await supabaseClient
                      .from('user_accounts')
                      .update({ total_quota: targetAccount.total_quota + remainingQuota })
                      .eq('user_id', bindUserId);
                    console.log(`Merged ${remainingQuota} quota to target account`);
                  }
                }
              }
            } catch (e) {
              console.error('Error merging quota:', e);
            }
            
            // 4. 合并预充值余额（coaching_prepaid_balance）
            try {
              const { data: tempBalance } = await supabaseClient
                .from('coaching_prepaid_balance')
                .select('balance, paid_balance, bonus_balance')
                .eq('user_id', tempUserId)
                .maybeSingle();
              
              if (tempBalance && tempBalance.balance > 0) {
                const { data: targetBalance } = await supabaseClient
                  .from('coaching_prepaid_balance')
                  .select('balance, paid_balance, bonus_balance')
                  .eq('user_id', bindUserId)
                  .maybeSingle();
                
                if (targetBalance) {
                  await supabaseClient
                    .from('coaching_prepaid_balance')
                    .update({
                      balance: targetBalance.balance + tempBalance.balance,
                      paid_balance: targetBalance.paid_balance + tempBalance.paid_balance,
                      bonus_balance: targetBalance.bonus_balance + tempBalance.bonus_balance,
                    })
                    .eq('user_id', bindUserId);
                } else {
                  await supabaseClient
                    .from('coaching_prepaid_balance')
                    .update({ user_id: bindUserId })
                    .eq('user_id', tempUserId);
                }
                console.log('Merged prepaid balance to target account');
              }
            } catch (e) {
              console.error('Error merging prepaid balance:', e);
            }
            
            // 5. 软删除临时账号的 profile
            await supabaseClient
              .from('profiles')
              .update({ 
                deleted_at: new Date().toISOString(),
                phone: null
              })
              .eq('id', tempUserId);
            
            // 3. 禁用临时 Auth 用户
            try {
              await supabaseClient.auth.admin.updateUserById(tempUserId, { 
                ban_duration: '876600h' // ~100 years
              });
              console.log('Temp account disabled:', tempUserId);
            } catch (disableErr) {
              console.error('Failed to disable temp account:', disableErr);
            }
            
            console.log('Migration complete, binding to:', bindUserId);
            finalUserId = bindUserId;
            // 继续走正常绑定流程（下方会发送通知等）
          } else {
            // 正式账号：拒绝绑定，返回已绑定信息
            console.log('WeChat already bound to another user:', existingMapping.system_user_id);
            
            // 查询已绑定账号的脱敏名称
            let boundAccountName = '未知账号';
            try {
              const { data: boundProfile } = await supabaseClient
                .from('profiles')
                .select('display_name, phone')
                .eq('id', existingMapping.system_user_id)
                .maybeSingle();
              
              if (boundProfile?.phone) {
                const p = boundProfile.phone;
                boundAccountName = p.length >= 7 
                  ? p.substring(0, 3) + '****' + p.substring(p.length - 4)
                  : p;
              } else if (boundProfile?.display_name) {
                boundAccountName = boundProfile.display_name;
              }
            } catch (e) {
              console.error('Failed to fetch bound account info:', e);
            }
            
            return new Response(
              JSON.stringify({ error: 'already_bound', message: '该微信已绑定其他账号', bound_account_name: boundAccountName }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      finalUserId = bindUserId;
      console.log('Binding to existing user:', finalUserId);
      
      // 绑定成功，发送欢迎通知
      try {
        await supabaseClient.functions.invoke('send-wechat-template-message', {
          body: {
            userId: bindUserId,
            scenario: 'wechat_bind_success',
            notification: {
              id: crypto.randomUUID(),
              title: '绑定成功',
              message: '恭喜！您已成功绑定微信账号，现在可以接收智能消息推送啦 🎉',
              remark: '如需帮助请回复任意消息'
            }
          }
        });
        console.log('Bind success notification sent');
      } catch (notifyError) {
        console.log('Failed to send bind success notification:', notifyError);
        // 不阻止绑定流程
      }
    } else if (existingMapping) {
      // 登录流程且已有映射
      finalUserId = existingMapping.system_user_id;
    } else {
      // 登录流程但没有映射
      return new Response(
        JSON.stringify({ error: 'not_registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 保存或更新用户映射（一个微信只能绑定一个账号，冲突检测基于 openid）
    const { error: upsertError } = await supabaseClient
      .from('wechat_user_mappings')
      .upsert({
        system_user_id: finalUserId,
        openid: tokenData.openid,
        unionid: tokenData.unionid,
        nickname: userInfo.nickname,
        avatar_url: userInfo.headimgurl,
        subscribe_status: true,
        subscribe_time: new Date().toISOString(),
        is_registered: true,
        registered_at: isNewUser ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'openid'
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User mapping saved for:', tokenData.openid);

    // 更新 profiles 表的 auth_provider、display_name、avatar_url
    // 只有首次注册的微信用户才默认启用公众号推送，已有用户登录不覆盖其设置
    const profileUpdateData: Record<string, unknown> = { 
      auth_provider: 'wechat',
      display_name: userInfo.nickname,
      avatar_url: userInfo.headimgurl
    };
    
    if (isNewUser) {
      profileUpdateData.smart_notification_enabled = true;  // 首次注册微信用户默认启用公众号推送
    }
    
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', finalUserId);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      // 不阻止登录流程，只记录错误
    } else {
      console.log('Profile auth_provider updated to wechat for:', finalUserId);
    }

    // 对于绑定流程，直接返回成功（不生成 magic link）
    if (isBind) {
      return new Response(
        JSON.stringify({ success: true, isNewUser: false, bindSuccess: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查用户是否已注销（banned），如果是则自动恢复账号
    if (finalUserId) {
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(finalUserId);
      if (authUser?.user?.banned_until && new Date(authUser.user.banned_until) > new Date()) {
        console.log('用户已注销，正在恢复账号:', finalUserId);
        // 解除封禁
        await supabaseClient.auth.admin.updateUserById(finalUserId, { ban_duration: 'none' });
        // 恢复 profile
        await supabaseClient
          .from('profiles')
          .update({
            deleted_at: null,
            display_name: userInfo.nickname || '微信用户',
            avatar_url: userInfo.headimgurl || null,
          })
          .eq('id', finalUserId);
        console.log('账号已恢复:', finalUserId);
      }
    }

    // 生成登录令牌（必须使用 finalUserId 对应的邮箱，否则会登录到错误账号）
    if (!finalUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing finalUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: finalAuthUser, error: finalAuthUserError } = await supabaseClient.auth.admin.getUserById(finalUserId);
    if (finalAuthUserError || !finalAuthUser?.user?.email) {
      console.error('Failed to resolve user email for magiclink:', finalUserId, finalAuthUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to resolve user email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const loginEmail = finalAuthUser.user.email;
    const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: loginEmail,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: sessionError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 发送登录成功通知（异步，不阻塞登录流程）
    try {
      const now = new Date();
      const loginTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      supabaseClient.functions.invoke('send-wechat-template-message', {
        body: {
          userId: finalUserId,
          scenario: 'login_success',
          notification: {
            id: crypto.randomUUID(),
            title: '登录成功',
            message: `您已于 ${loginTime} 成功登录有劲365`
          }
        }
      }).then(result => {
        if (result.error) {
          console.log('Login notification send failed:', result.error);
        } else {
          console.log('Login notification sent:', result.data);
        }
      }).catch(err => {
        console.log('Login notification error:', err);
      });
    } catch (notifyError) {
      console.log('Failed to send login notification:', notifyError);
      // 不阻止登录流程
    }

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: true,
        tokenHash: session.properties.hashed_token,
        isNewUser,
        userId: finalUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in WeChat OAuth process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
