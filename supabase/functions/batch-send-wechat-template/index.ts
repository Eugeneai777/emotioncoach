import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/auth.ts';

const BATCH_SIZE = 40; // Process 40 per invocation to stay under wall-clock limit

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

  try {
    const body = await req.json();

    // ========== Mode 1: Process a chunk of an existing job ==========
    if (body.job_id && body.process_chunk) {
      // Only service_role can trigger chunk processing
      if (token !== serviceRoleKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await processChunk(adminClient, supabaseUrl, serviceRoleKey, body.job_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== Mode 2: Create a new broadcast job ==========
    // Authenticate: service_role or admin user
    let callerUserId: string | null = null;
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

    const { user_ids, openids, scenario, custom_title, custom_message, custom_url } = body;

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

    // Check for duplicate running jobs using SELECT ... FOR UPDATE to prevent race conditions
    const { data: lockCheck, error: lockError } = await adminClient.rpc('check_and_lock_broadcast', {});
    
    if (lockError) {
      console.error('[batch-send] 锁检查失败:', lockError);
      // Fallback to simple check
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
    } else if (lockCheck === false) {
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
        status: 'running',
        scenario,
        custom_title: custom_title || null,
        custom_message: custom_message || null,
        custom_url: custom_url || null,
        target_mode: mode,
        target_openids: mode === 'openid' ? targets : [],
        target_user_ids: mode === 'userId' ? targets : [],
        total_count: targets.length,
        started_at: new Date().toISOString(),
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

    // Trigger first chunk processing (fire-and-forget)
    triggerNextChunk(supabaseUrl, serviceRoleKey, job.id);

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

/** Fire-and-forget: trigger chunk processing */
function triggerNextChunk(supabaseUrl: string, serviceRoleKey: string, jobId: string) {
  fetch(`${supabaseUrl}/functions/v1/batch-send-wechat-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ job_id: jobId, process_chunk: true }),
  }).catch(err => console.error('[batch-send] 触发下一批失败:', err.message));
}

/** Process one chunk of a broadcast job */
async function processChunk(
  adminClient: any,
  supabaseUrl: string,
  serviceRoleKey: string,
  jobId: string,
) {
  // Fetch job with current progress
  const { data: job, error: fetchError } = await adminClient
    .from('wechat_broadcast_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    console.error(`[batch-send] 任务不存在: ${jobId}`);
    return;
  }

  if (job.status !== 'running') {
    console.log(`[batch-send] 任务状态非 running，跳过: ${job.status}`);
    return;
  }

  const targets = job.target_mode === 'openid' ? job.target_openids : job.target_user_ids;
  const startIdx = job.processed_count;

  if (startIdx >= targets.length) {
    // Already done
    await adminClient
      .from('wechat_broadcast_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    console.log(`[batch-send] 任务已完成: ${jobId}`);
    return;
  }

  const endIdx = Math.min(startIdx + BATCH_SIZE, targets.length);
  const chunk = targets.slice(startIdx, endIdx);

  console.log(`[batch-send] 处理分片: jobId=${jobId}, ${startIdx}-${endIdx} of ${targets.length}`);

  let successCount = job.success_count;
  let failCount = job.fail_count;
  let lastError = job.last_error;

  for (const target of chunk) {
    try {
      const notification = {
        title: job.custom_title || '来自劲老师的消息',
        message: job.custom_message || '',
        id: `batch-${Date.now()}-${target.slice(0, 8)}`,
        custom_url: job.custom_url || undefined,
      };

      const reqBody = job.target_mode === 'openid'
        ? { openid: target, scenario: job.scenario, notification }
        : { userId: target, scenario: job.scenario, notification };

      const response = await fetch(`${supabaseUrl}/functions/v1/send-wechat-template-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(reqBody),
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
    }

    // 100ms throttle between sends
    await new Promise(r => setTimeout(r, 100));
  }

  // Update progress
  const processed = endIdx;
  const isComplete = processed >= targets.length;

  await adminClient
    .from('wechat_broadcast_jobs')
    .update({
      processed_count: processed,
      success_count: successCount,
      fail_count: failCount,
      last_error: lastError,
      status: isComplete ? (failCount === targets.length ? 'failed' : 'completed') : 'running',
      completed_at: isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  console.log(`[batch-send] 分片完成: processed=${processed}/${targets.length}, success=${successCount}, fail=${failCount}`);

  // If not done, trigger next chunk
  if (!isComplete) {
    triggerNextChunk(supabaseUrl, serviceRoleKey, jobId);
  }
}
