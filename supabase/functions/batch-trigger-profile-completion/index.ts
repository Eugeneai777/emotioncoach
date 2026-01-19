import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

// 去重时间窗口（天）
const DEDUP_WINDOW_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('开始批量检查资料未完善用户...');

    // 查找缺少昵称或头像的用户
    const { data: incompleteProfiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, smart_notification_enabled, wechat_enabled')
      .or('display_name.is.null,avatar_url.is.null,display_name.eq.,avatar_url.eq.');

    if (queryError) {
      console.error('查询用户资料失败:', queryError);
      throw queryError;
    }

    console.log(`找到 ${incompleteProfiles?.length || 0} 位资料未完善的用户`);

    // 过滤出真正需要提醒的用户
    const usersToNotify: Array<{
      id: string;
      missing_name: boolean;
      missing_avatar: boolean;
      smart_notification_enabled: boolean | null;
      wechat_enabled: boolean | null;
    }> = [];

    for (const profile of incompleteProfiles || []) {
      const missingName = !profile.display_name || profile.display_name.trim() === '';
      const missingAvatar = !profile.avatar_url || profile.avatar_url.trim() === '';

      // 只有真正缺少信息的用户才需要提醒
      if (!missingName && !missingAvatar) continue;

      // 检查用户是否启用了智能通知
      if (profile.smart_notification_enabled === false) {
        console.log(`用户 ${profile.id} 已关闭智能通知，跳过`);
        continue;
      }

      usersToNotify.push({
        id: profile.id,
        missing_name: missingName,
        missing_avatar: missingAvatar,
        smart_notification_enabled: profile.smart_notification_enabled,
        wechat_enabled: profile.wechat_enabled
      });
    }

    console.log(`过滤后 ${usersToNotify.length} 位用户需要检查去重`);

    const results: Array<{
      user_id: string;
      missing_name: boolean;
      missing_avatar: boolean;
      triggered: boolean;
      message?: string;
    }> = [];

    // 计算去重时间点
    const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    for (const user of usersToNotify) {
      // 检查去重窗口内是否已发送过资料完善提醒
      const { data: recentNotification } = await supabase
        .from('smart_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario', 'profile_completion')
        .gte('created_at', dedupCutoff)
        .limit(1);

      if (recentNotification && recentNotification.length > 0) {
        console.log(`用户 ${user.id} 在 ${DEDUP_WINDOW_DAYS} 天内已发送过资料完善提醒，跳过`);
        results.push({
          user_id: user.id,
          missing_name: user.missing_name,
          missing_avatar: user.missing_avatar,
          triggered: false,
          message: `${DEDUP_WINDOW_DAYS}天内已发送过提醒`
        });
        continue;
      }

      // 调用 generate-smart-notification 生成个性化提醒
      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-smart-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              scenario: 'profile_completion',
              user_id: user.id,
              context: {
                missing_name: user.missing_name,
                missing_avatar: user.missing_avatar
              }
            })
          }
        );

        const result = await response.json();
        console.log(`用户 ${user.id} 触发结果:`, result);

        if (result.success) {
          results.push({
            user_id: user.id,
            missing_name: user.missing_name,
            missing_avatar: user.missing_avatar,
            triggered: true,
            message: '通知已生成'
          });
        } else {
          results.push({
            user_id: user.id,
            missing_name: user.missing_name,
            missing_avatar: user.missing_avatar,
            triggered: false,
            message: result.error || '生成失败'
          });
        }
      } catch (fetchError) {
        console.error(`调用 generate-smart-notification 失败:`, fetchError);
        results.push({
          user_id: user.id,
          missing_name: user.missing_name,
          missing_avatar: user.missing_avatar,
          triggered: false,
          message: '调用触发函数失败'
        });
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length;
    console.log(`批量资料完善提醒完成: ${triggeredCount}/${results.length} 成功触发`);

    return new Response(JSON.stringify({
      success: true,
      total_checked: results.length,
      notified_users: triggeredCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("批量触发资料完善提醒错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "批量触发过程出现错误",
      details: e instanceof Error ? e.message : "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
