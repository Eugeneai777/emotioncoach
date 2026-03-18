import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { corsHeaders, validateServiceRole } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 仅允许 service role 调用
  const authError = validateServiceRole(req);
  if (authError) return authError;

  try {
    const { user_ids, scenario, custom_title, custom_message } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: '请提供至少一个用户ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scenario) {
      return new Response(
        JSON.stringify({ error: '请选择发送场景' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log(`[batch-send] 开始批量发送: ${user_ids.length} 个用户, 场景: ${scenario}`);

    const results: Array<{ user_id: string; success: boolean; reason?: string }> = [];

    // 逐个调用 send-wechat-template-message
    for (const userId of user_ids) {
      try {
        const notification = {
          title: custom_title || '来自劲老师的消息',
          message: custom_message || '',
          id: `batch-${Date.now()}-${userId.slice(0, 8)}`,
        };

        const response = await fetch(`${supabaseUrl}/functions/v1/send-wechat-template-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ userId, scenario, notification }),
        });

        const data = await response.json();
        results.push({
          user_id: userId,
          success: data.success === true,
          reason: data.reason || (data.success ? undefined : 'unknown'),
        });
      } catch (err) {
        console.error(`[batch-send] 发送失败 userId=${userId}:`, err.message);
        results.push({ user_id: userId, success: false, reason: err.message });
      }

      // 每次发送间隔 100ms，避免触发微信频率限制
      await new Promise(r => setTimeout(r, 100));
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    console.log(`[batch-send] 完成: 成功=${successCount}, 失败=${failCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: results.length, 
        success_count: successCount, 
        fail_count: failCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[batch-send] 错误:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
