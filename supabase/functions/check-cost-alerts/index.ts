import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alerts: Array<{
      alert_type: string;
      user_id?: string;
      threshold_cny: number;
      actual_cost_cny: number;
      alert_message: string;
    }> = [];

    // 获取所有激活的预警设置
    const { data: settings } = await supabase
      .from('cost_alert_settings')
      .select('*')
      .eq('is_active', true);

    if (!settings) {
      return new Response(JSON.stringify({ success: true, alerts: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString();

    // 检查每日总成本
    const dailySetting = settings.find(s => s.alert_type === 'daily_total');
    if (dailySetting) {
      const { data: dailyCosts } = await supabase
        .from('api_cost_logs')
        .select('estimated_cost_cny')
        .gte('created_at', todayStr);

      const dailyTotal = dailyCosts?.reduce((sum, log) => sum + Number(log.estimated_cost_cny || 0), 0) || 0;

      if (dailyTotal >= dailySetting.threshold_cny) {
        // 检查今天是否已经发过这个预警
        const { data: existingAlert } = await supabase
          .from('cost_alerts')
          .select('id')
          .eq('alert_type', 'daily_total')
          .gte('created_at', todayStr)
          .limit(1);

        if (!existingAlert?.length) {
          alerts.push({
            alert_type: 'daily_total',
            threshold_cny: dailySetting.threshold_cny,
            actual_cost_cny: dailyTotal,
            alert_message: `今日总成本预警: ¥${dailyTotal.toFixed(2)} 已超过阈值 ¥${dailySetting.threshold_cny}`
          });
        }
      }
    }

    // 检查月度总成本
    const monthlySetting = settings.find(s => s.alert_type === 'monthly_total');
    if (monthlySetting) {
      const { data: monthlyCosts } = await supabase
        .from('api_cost_logs')
        .select('estimated_cost_cny')
        .gte('created_at', monthStartStr);

      const monthlyTotal = monthlyCosts?.reduce((sum, log) => sum + Number(log.estimated_cost_cny || 0), 0) || 0;

      if (monthlyTotal >= monthlySetting.threshold_cny) {
        // 检查本月是否已经发过这个预警
        const { data: existingAlert } = await supabase
          .from('cost_alerts')
          .select('id')
          .eq('alert_type', 'monthly_total')
          .gte('created_at', monthStartStr)
          .limit(1);

        if (!existingAlert?.length) {
          alerts.push({
            alert_type: 'monthly_total',
            threshold_cny: monthlySetting.threshold_cny,
            actual_cost_cny: monthlyTotal,
            alert_message: `本月总成本预警: ¥${monthlyTotal.toFixed(2)} 已超过阈值 ¥${monthlySetting.threshold_cny}`
          });
        }
      }
    }

    // 检查单用户每日成本
    const userDailySetting = settings.find(s => s.alert_type === 'single_user_daily');
    if (userDailySetting) {
      const { data: userCosts } = await supabase
        .from('api_cost_logs')
        .select('user_id, estimated_cost_cny')
        .gte('created_at', todayStr)
        .not('user_id', 'is', null);

      // 按用户汇总
      const userTotals: Record<string, number> = {};
      userCosts?.forEach(log => {
        if (log.user_id) {
          userTotals[log.user_id] = (userTotals[log.user_id] || 0) + Number(log.estimated_cost_cny || 0);
        }
      });

      for (const [userId, total] of Object.entries(userTotals)) {
        if (total >= userDailySetting.threshold_cny) {
          // 检查今天是否已经发过这个用户的预警
          const { data: existingAlert } = await supabase
            .from('cost_alerts')
            .select('id')
            .eq('alert_type', 'single_user_daily')
            .eq('user_id', userId)
            .gte('created_at', todayStr)
            .limit(1);

          if (!existingAlert?.length) {
            alerts.push({
              alert_type: 'single_user_daily',
              user_id: userId,
              threshold_cny: userDailySetting.threshold_cny,
              actual_cost_cny: total,
              alert_message: `单用户每日成本预警: 用户 ${userId.slice(0, 8)}... 今日花费 ¥${total.toFixed(2)}`
            });
          }
        }
      }
    }

    // 插入预警记录
    if (alerts.length > 0) {
      const { error } = await supabase.from('cost_alerts').insert(alerts);
      if (error) {
        console.error('Error inserting alerts:', error);
      }

      // 发送企业微信通知
      for (const alert of alerts) {
        const setting = settings.find(s => s.alert_type === alert.alert_type);
        if (setting?.notify_wecom) {
          try {
            await supabase.functions.invoke('send-wecom-notification', {
              body: {
                message: `⚠️ 成本预警\n\n${alert.alert_message}\n\n请及时关注API成本情况。`
              }
            });
          } catch (e) {
            console.error('Failed to send WeCom notification:', e);
          }
        }
      }
    }

    console.log(`Cost alert check completed. ${alerts.length} new alerts generated.`);

    return new Response(JSON.stringify({ 
      success: true, 
      alerts_count: alerts.length,
      alerts 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-cost-alerts:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
