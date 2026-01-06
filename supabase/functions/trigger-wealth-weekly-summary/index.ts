import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[wealth-weekly-summary] 开始批量触发财富周报');

    // 获取本周有活跃训练记录的用户
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // 查找本周有财富日记记录的用户
    const { data: activeUsers, error: usersError } = await supabase
      .from('wealth_journal_entries')
      .select('user_id')
      .gte('created_at', weekStart.toISOString())
      .order('user_id');

    if (usersError) {
      console.error('[wealth-weekly-summary] 查询活跃用户失败:', usersError);
      throw usersError;
    }

    // 去重获取唯一用户
    const uniqueUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    console.log(`[wealth-weekly-summary] 找到 ${uniqueUserIds.length} 个活跃用户`);

    let successCount = 0;
    let failCount = 0;
    const results: { user_id: string; success: boolean; message: string }[] = [];

    // 批量触发通知
    for (const userId of uniqueUserIds) {
      try {
        // 检查用户是否开启了智能通知
        const { data: profile } = await supabase
          .from('profiles')
          .select('smart_notification_enabled')
          .eq('id', userId)
          .single();

        if (!profile?.smart_notification_enabled) {
          results.push({ 
            user_id: userId, 
            success: false, 
            message: '用户已关闭智能通知' 
          });
          continue;
        }

        // 调用 trigger-notifications 函数
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              trigger_type: 'wealth_weekly_summary',
              user_id: userId,
              context: {}
            })
          }
        );

        const result = await response.json();
        
        if (result.success) {
          successCount++;
          results.push({ 
            user_id: userId, 
            success: true, 
            message: '周报发送成功' 
          });
        } else {
          results.push({ 
            user_id: userId, 
            success: false, 
            message: result.message || '触发失败' 
          });
        }
      } catch (userError) {
        failCount++;
        console.error(`[wealth-weekly-summary] 用户 ${userId} 处理失败:`, userError);
        results.push({ 
          user_id: userId, 
          success: false, 
          message: userError instanceof Error ? userError.message : '未知错误' 
        });
      }
    }

    console.log(`[wealth-weekly-summary] 完成: 成功 ${successCount}, 失败 ${failCount}`);

    return new Response(JSON.stringify({ 
      success: true,
      total_users: uniqueUserIds.length,
      success_count: successCount,
      fail_count: failCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[wealth-weekly-summary] 错误:", e instanceof Error ? e.message : "unknown");
    return new Response(JSON.stringify({ 
      error: "批量触发周报失败",
      message: e instanceof Error ? e.message : "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
