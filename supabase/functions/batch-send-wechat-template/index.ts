import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateServiceRole } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 仅允许 service role 调用
  const authError = validateServiceRole(req);
  if (authError) return authError;

  try {
    const { user_ids, openids, scenario, custom_title, custom_message, custom_url } = await req.json();

    const hasUserIds = user_ids && Array.isArray(user_ids) && user_ids.length > 0;
    const hasOpenIds = openids && Array.isArray(openids) && openids.length > 0;

    if (!hasUserIds && !hasOpenIds) {
      return new Response(
        JSON.stringify({ error: '请提供至少一个用户ID或openid' }),
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

    const mode = hasOpenIds ? 'openid' : 'userId';
    const targets = hasOpenIds ? openids : user_ids;

    console.log(`[batch-send] 开始批量发送: ${targets.length} 个目标, 模式: ${mode}, 场景: ${scenario}`);

    const results: Array<{ id: string; success: boolean; reason?: string }> = [];

    for (const target of targets) {
      try {
        const notification = {
          title: custom_title || '来自劲老师的消息',
          message: custom_message || '',
          id: `batch-${Date.now()}-${target.slice(0, 8)}`,
          custom_url: custom_url || undefined,
        };

        // 根据模式构造请求体
        const body = hasOpenIds
          ? { openid: target, scenario, notification }
          : { userId: target, scenario, notification };

        const response = await fetch(`${supabaseUrl}/functions/v1/send-wechat-template-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        results.push({
          id: target,
          success: data.success === true,
          reason: data.reason || (data.success ? undefined : data.error || 'unknown'),
        });
      } catch (err) {
        console.error(`[batch-send] 发送失败 target=${target}:`, err.message);
        results.push({ id: target, success: false, reason: err.message });
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
