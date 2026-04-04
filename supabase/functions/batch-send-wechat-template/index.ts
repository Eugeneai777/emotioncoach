import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  let callerUserId: string | null = null;

  // Authenticate: service_role or admin user
  if (token !== serviceRoleKey) {
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    callerUserId = userData.user.id;
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'content_admin', 'partner_admin']);
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: '需要管理员权限' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const { user_ids, openids, scenario, custom_title, custom_message, custom_url, job_id } = await req.json();

    // If job_id is provided, this is a "process batch" call from ourselves
    if (job_id) {
      await processBroadcastJob(adminClient, supabaseUrl, serviceRoleKey, job_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, create a new job
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

    // Check for duplicate running jobs
    const { data: runningJobs } = await adminClient
      .from('wechat_broadcast_jobs')
      .select('id')
      .in('status', ['pending', 'running'])
      .limit(1);

    if (runningJobs && runningJobs.length > 0) {
      return new Response(
        JSON.stringify({ error: '已有群发任务正在执行中，请等待完成后再发送' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mode = hasOpenIds ? 'openid' : 'userId';
    const targets = hasOpenIds ? openids : user_ids;

    // Create job record
    const { data: job, error: jobError } = await adminClient
      .from('wechat_broadcast_jobs')
      .insert({
        created_by: callerUserId || '00000000-0000-0000-0000-000000000000',
        status: 'pending',
        scenario,
        custom_title: custom_title || null,
        custom_message: custom_message || null,
        custom_url: custom_url || null,
        target_mode: mode,
        target_openids: mode === 'openid' ? targets : [],
        target_user_ids: mode === 'userId' ? targets : [],
        total_count: targets.length,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error('[batch-send] 创建任务失败:', jobError);
      return new Response(
        JSON.stringify({ error: '创建群发任务失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[batch-send] 任务已创建: jobId=${job.id}, 目标数=${targets.length}`);

    // Fire-and-forget: trigger background processing
    // Use EdgeRuntime.waitUntil if available, otherwise fetch self
    try {
      fetch(`${supabaseUrl}/functions/v1/batch-send-wechat-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ job_id: job.id }),
      }).catch(err => console.error('[batch-send] 后台触发失败:', err.message));
    } catch (e) {
      console.error('[batch-send] 后台触发异常:', e);
    }

    // Return immediately with job ID
    return new Response(
      JSON.stringify({ success: true, job_id: job.id, total: targets.length }),
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

async function processBroadcastJob(
  adminClient: any,
  supabaseUrl: string,
  serviceRoleKey: string,
  jobId: string,
) {
  console.log(`[batch-send] 开始处理任务: ${jobId}`);

  // Fetch job
  const { data: job, error: fetchError } = await adminClient
    .from('wechat_broadcast_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    console.error(`[batch-send] 任务不存在: ${jobId}`, fetchError);
    return;
  }

  if (job.status !== 'pending') {
    console.log(`[batch-send] 任务状态非 pending，跳过: ${job.status}`);
    return;
  }

  // Mark as running
  await adminClient
    .from('wechat_broadcast_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const targets = job.target_mode === 'openid' ? job.target_openids : job.target_user_ids;
  let processed = 0;
  let successCount = 0;
  let failCount = 0;
  let lastError: string | null = null;

  const BATCH_SIZE = 50;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    try {
      const notification = {
        title: job.custom_title || '来自劲老师的消息',
        message: job.custom_message || '',
        id: `batch-${Date.now()}-${target.slice(0, 8)}`,
        custom_url: job.custom_url || undefined,
      };

      const body = job.target_mode === 'openid'
        ? { openid: target, scenario: job.scenario, notification }
        : { userId: target, scenario: job.scenario, notification };

      const response = await fetch(`${supabaseUrl}/functions/v1/send-wechat-template-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success === true) {
        successCount++;
      } else {
        failCount++;
        lastError = data.reason || data.error || 'unknown';
      }
    } catch (err) {
      failCount++;
      lastError = err.message;
      console.error(`[batch-send] 发送失败 target=${target}:`, err.message);
    }

    processed++;

    // Update progress every BATCH_SIZE or at the end
    if (processed % BATCH_SIZE === 0 || processed === targets.length) {
      await adminClient
        .from('wechat_broadcast_jobs')
        .update({
          processed_count: processed,
          success_count: successCount,
          fail_count: failCount,
          last_error: lastError,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    // Throttle 100ms between sends
    await new Promise(r => setTimeout(r, 100));
  }

  // Mark completed
  await adminClient
    .from('wechat_broadcast_jobs')
    .update({
      status: failCount === targets.length ? 'failed' : 'completed',
      processed_count: processed,
      success_count: successCount,
      fail_count: failCount,
      last_error: lastError,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  console.log(`[batch-send] 任务完成: jobId=${jobId}, 成功=${successCount}, 失败=${failCount}`);
}
