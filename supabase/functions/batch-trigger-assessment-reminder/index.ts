import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

// 去重时间窗口：3天内不重复发送
const DEDUP_DAYS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('开始批量检查已购买但未完成测评的用户...');

    // 1. 查询已购买财富卡点测评的用户
    const { data: paidOrders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, paid_at')
      .eq('package_key', 'wealth_block_assessment')
      .eq('status', 'paid');

    if (ordersError) {
      console.error('查询已付款订单失败:', ordersError);
      throw ordersError;
    }

    if (!paidOrders || paidOrders.length === 0) {
      console.log('没有已付款的测评订单');
      return new Response(JSON.stringify({ success: true, total_checked: 0, notified_users: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 去重用户（取最早购买时间）
    const userPurchaseMap = new Map<string, string>();
    paidOrders.forEach(order => {
      if (!userPurchaseMap.has(order.user_id) || order.paid_at < userPurchaseMap.get(order.user_id)!) {
        userPurchaseMap.set(order.user_id, order.paid_at);
      }
    });

    const paidUserIds = Array.from(userPurchaseMap.keys());
    console.log(`共 ${paidUserIds.length} 位用户已购买测评`);

    // 2. 查询已完成测评的用户
    const { data: completedAssessments, error: assessError } = await supabase
      .from('wealth_block_assessments')
      .select('user_id')
      .in('user_id', paidUserIds);

    if (assessError) {
      console.error('查询已完成测评失败:', assessError);
      throw assessError;
    }

    const completedUserIds = new Set((completedAssessments || []).map(a => a.user_id));
    const incompleteUserIds = paidUserIds.filter(id => !completedUserIds.has(id));

    console.log(`其中 ${completedUserIds.size} 位已完成，${incompleteUserIds.length} 位未完成`);

    if (incompleteUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, total_checked: 0, notified_users: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. 去重：检查3天内是否已发送过此类提醒
    const dedupCutoff = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentNotifications } = await supabase
      .from('smart_notifications')
      .select('user_id')
      .eq('scenario', 'assessment_incomplete_reminder')
      .gte('created_at', dedupCutoff)
      .in('user_id', incompleteUserIds);

    const recentlyNotifiedIds = new Set((recentNotifications || []).map(n => n.user_id));
    const usersToNotify = incompleteUserIds.filter(id => !recentlyNotifiedIds.has(id));

    console.log(`去重后 ${usersToNotify.length} 位用户需要提醒`);

    const results: Array<{ user_id: string; triggered: boolean; message?: string }> = [];

    for (const userId of usersToNotify) {
      try {
        const purchaseDate = userPurchaseMap.get(userId);
        
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-smart-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              scenario: 'assessment_incomplete_reminder',
              context: {
                user_id: userId,
                purchase_date: purchaseDate,
                days_since_purchase: purchaseDate 
                  ? Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
                  : null,
                action_path: '/wealth-block',
                coach_type: 'wealth'
              }
            })
          }
        );

        const result = await response.json();
        console.log(`用户 ${userId} 通知结果:`, result.success ? '成功' : '失败');

        results.push({
          user_id: userId,
          triggered: !!result.success,
          message: result.success ? '通知已发送' : (result.error || '发送失败')
        });
      } catch (fetchError) {
        console.error(`用户 ${userId} 通知失败:`, fetchError);
        results.push({ user_id: userId, triggered: false, message: '调用通知函数失败' });
      }
    }

    const triggeredCount = results.filter(r => r.triggered).length;
    console.log(`批量测评提醒完成: ${triggeredCount}/${results.length} 成功`);

    return new Response(JSON.stringify({
      success: true,
      total_checked: incompleteUserIds.length,
      notified_users: triggeredCount,
      skipped_dedup: recentlyNotifiedIds.size,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("批量触发测评提醒错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "批量触发过程出现错误",
      details: e instanceof Error ? e.message : "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
