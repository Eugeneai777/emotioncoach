import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[admin-recharge] invoked', new Date().toISOString());

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '认证已过期，请刷新页面后重试' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {
      console.error('[admin-recharge] auth failed', authError);
      return jsonResponse({ error: '认证失败，请刷新页面后重试' }, 401);
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('[admin-recharge] role check error', roleError);
      return jsonResponse({ error: '权限校验失败，请稍后重试' }, 500);
    }
    if (!roleData) {
      return jsonResponse({ error: '需要管理员权限' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'apply';

    // ========== status 查询 ==========
    if (action === 'status') {
      const requestId = body?.requestId;
      if (!requestId || typeof requestId !== 'string') {
        return jsonResponse({ error: '缺少 requestId' }, 400);
      }
      const { data, error } = await supabaseAdmin.rpc('admin_get_quota_recharge_status', {
        p_request_id: requestId,
      });
      if (error) {
        console.error('[admin-recharge] status rpc error', error);
        return jsonResponse({ error: `查询失败：${error.message}` }, 500);
      }
      const row = Array.isArray(data) ? data[0] : data;
      return jsonResponse({
        success: true,
        requestId,
        found: !!row?.found,
        status: row?.status ?? null,
        newTotalQuota: row?.new_total_quota ?? null,
        newRemainingQuota: row?.new_remaining_quota ?? null,
        errorMessage: row?.error_message ?? null,
      });
    }

    // ========== apply 充值 ==========
    if (action !== 'apply') {
      return jsonResponse({ error: `不支持的操作：${action}` }, 400);
    }

    const { requestId, userId, quantity, packageType, notes, expiryDays } = body;

    if (!requestId || typeof requestId !== 'string') {
      return jsonResponse({ error: '缺少 requestId' }, 400);
    }
    if (!userId || typeof userId !== 'string') {
      return jsonResponse({ error: '缺少目标用户 ID' }, 400);
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return jsonResponse({ error: '充值数量必须为正整数' }, 400);
    }

    console.log('[admin-recharge] apply', { requestId, userId, qty, packageType });

    const { data, error } = await supabaseAdmin.rpc('admin_apply_quota_recharge', {
      p_request_id: requestId,
      p_admin_user_id: user.id,
      p_target_user_id: userId,
      p_quantity: qty,
      p_package_type: packageType || 'custom',
      p_notes: notes || null,
      p_expiry_days: expiryDays ?? null,
    });

    if (error) {
      console.error('[admin-recharge] apply rpc error', error);
      return jsonResponse({ error: `充值失败：${error.message}` }, 500);
    }

    const row = Array.isArray(data) ? data[0] : data;
    const status = row?.status ?? 'failed';
    const alreadyProcessed = !!row?.already_processed;

    if (status === 'failed') {
      return jsonResponse({
        success: false,
        requestId,
        status,
        alreadyProcessed,
        error: row?.error_message || '充值失败',
      }, 400);
    }

    return jsonResponse({
      success: true,
      requestId,
      status,
      alreadyProcessed,
      newTotalQuota: row?.new_total_quota ?? null,
      newRemainingQuota: row?.new_remaining_quota ?? null,
    });
  } catch (error: any) {
    console.error('[admin-recharge] uncaught error', error);
    return jsonResponse({ error: error?.message || '服务器内部错误' }, 500);
  }
});
