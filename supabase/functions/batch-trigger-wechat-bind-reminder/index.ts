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

    console.log('开始批量检查手机注册但未绑定微信的用户...');

    // 1. 查找手机注册用户（email 以 phone_ 开头且包含 @youjin.app）
    const { data: phoneUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, display_name, smart_notification_enabled')
      .like('email', 'phone_%@youjin.app');

    if (queryError) {
      console.error('查询手机注册用户失败:', queryError);
      throw queryError;
    }

    console.log(`找到 ${phoneUsers?.length || 0} 位手机注册用户`);

    if (!phoneUsers || phoneUsers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        total_checked: 0,
        notified_users: 0,
        results: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. 查找已绑定微信的用户
    const userIds = phoneUsers.map(u => u.id);
    const { data: boundUsers } = await supabase
      .from('wechat_user_mappings')
      .select('system_user_id')
      .in('system_user_id', userIds);

    const boundUserIds = new Set((boundUsers || []).map(u => u.system_user_id));

    // 3. 过滤出未绑定微信且未关闭通知的用户
    const usersToNotify = phoneUsers.filter(user => {
      if (boundUserIds.has(user.id)) {
        return false;
      }
      if (user.smart_notification_enabled === false) {
        console.log(`用户 ${user.id} 已关闭智能通知，跳过`);
        return false;
      }
      return true;
    });

    console.log(`过滤后 ${usersToNotify.length} 位用户需要检查去重`);

    const results: Array<{
      user_id: string;
      triggered: boolean;
      message?: string;
    }> = [];

    // 计算去重时间点
    const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    for (const user of usersToNotify) {
      // 检查去重窗口内是否已发送过微信绑定提醒
      const { data: recentNotification } = await supabase
        .from('smart_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario', 'wechat_bind_reminder')
        .gte('created_at', dedupCutoff)
        .limit(1);

      if (recentNotification && recentNotification.length > 0) {
        console.log(`用户 ${user.id} 在 ${DEDUP_WINDOW_DAYS} 天内已发送过微信绑定提醒，跳过`);
        results.push({
          user_id: user.id,
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
              scenario: 'wechat_bind_reminder',
              user_id: user.id,
              context: {}
            })
          }
        );

        const result = await response.json();
        console.log(`用户 ${user.id} 触发结果:`, result);

        if (result.success) {
          results.push({
            user_id: user.id,
            triggered: true,
            message: '通知已生成'
          });
        } else {
          results.push({
            user_id: user.id,
            triggered: false,
            message: result.error || result.message || '生成失败'
          });
        }
      } catch (fetchError) {
        console.error(`调用 generate-smart-notification 失败:`, fetchError);
        results.push({
          user_id: user.id,
          triggered: false,
          message: '调用触发函数失败'
        });
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length;
    console.log(`批量微信绑定提醒完成: ${triggeredCount}/${results.length} 成功触发`);

    return new Response(JSON.stringify({
      success: true,
      total_checked: results.length,
      notified_users: triggeredCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("批量触发微信绑定提醒错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "批量触发过程出现错误",
      details: e instanceof Error ? e.message : "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
