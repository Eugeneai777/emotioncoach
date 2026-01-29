import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TriggerResult {
  user_id: string;
  scenario: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 验证 CRON_SECRET 或 service role
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { scenario, limit = 10 } = await req.json().catch(() => ({}));

    const results: TriggerResult[] = [];
    const now = new Date();
    const hour = now.getHours();

    // 根据场景和时间选择目标用户
    let targetUsers: { user_id: string; context: Record<string, any> }[] = [];

    if (scenario === 'reactivation' || (!scenario && hour === 14)) {
      // 7天未活跃用户唤回（下午2点）
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: inactiveUsers } = await supabase
        .from('profiles')
        .select('id, display_name')
        .lt('last_seen_at', sevenDaysAgo)
        .limit(limit);

      if (inactiveUsers) {
        targetUsers = inactiveUsers.map((u) => ({
          user_id: u.id,
          context: {
            days_inactive: Math.floor((now.getTime() - new Date(sevenDaysAgo).getTime()) / (24 * 60 * 60 * 1000)),
          },
        }));
      }

      for (const target of targetUsers) {
        try {
          const { error } = await supabase.functions.invoke('initiate-ai-call', {
            body: {
              user_id: target.user_id,
              scenario: 'reactivation',
              coach_type: 'vibrant_life',
              context: target.context,
            },
          });

          results.push({
            user_id: target.user_id,
            scenario: 'reactivation',
            success: !error,
            error: error?.message,
          });
        } catch (e) {
          results.push({
            user_id: target.user_id,
            scenario: 'reactivation',
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    }

    if (scenario === 'emotion_check' || (!scenario && hour === 10)) {
      // 情绪低落用户关怀（上午10点）
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      // 查找最近3天情绪强度持续较高（低落/焦虑）的用户
      const { data: emotionUsers } = await supabase
        .from('briefings')
        .select(`
          conversation:conversations!inner(user_id),
          emotion_intensity,
          emotion_theme
        `)
        .gte('created_at', threeDaysAgo)
        .gte('emotion_intensity', 7)
        .limit(limit);

      if (emotionUsers) {
        // 按用户聚合
        const userMap = new Map<string, { count: number; avgIntensity: number; themes: string[] }>();
        
        emotionUsers.forEach((b: any) => {
          const userId = b.conversation?.user_id;
          if (!userId) return;
          
          const existing = userMap.get(userId) || { count: 0, avgIntensity: 0, themes: [] };
          existing.count++;
          existing.avgIntensity = (existing.avgIntensity * (existing.count - 1) + (b.emotion_intensity || 0)) / existing.count;
          if (b.emotion_theme) existing.themes.push(b.emotion_theme);
          userMap.set(userId, existing);
        });

        // 筛选连续情绪波动的用户
        for (const [userId, stats] of userMap) {
          if (stats.count >= 2 && stats.avgIntensity >= 6) {
            try {
              const { error } = await supabase.functions.invoke('initiate-ai-call', {
                body: {
                  user_id: userId,
                  scenario: 'emotion_check',
                  coach_type: 'emotion',
                  context: {
                    recent_emotion: stats.themes.slice(-1)[0],
                    avg_intensity: stats.avgIntensity,
                  },
                },
              });

              results.push({
                user_id: userId,
                scenario: 'emotion_check',
                success: !error,
                error: error?.message,
              });
            } catch (e) {
              results.push({
                user_id: userId,
                scenario: 'emotion_check',
                success: false,
                error: e instanceof Error ? e.message : 'Unknown error',
              });
            }
          }
        }
      }
    }

    if (scenario === 'camp_followup' || (!scenario && hour === 20)) {
      // 训练营未完成任务提醒（晚上8点）
      const today = now.toISOString().split('T')[0];

      const { data: incompleteTasks } = await supabase
        .from('camp_daily_progress')
        .select('user_id, camp_id, camp:training_camps(camp_type)')
        .eq('progress_date', today)
        .eq('is_checked_in', false)
        .limit(limit);

      if (incompleteTasks) {
        for (const task of incompleteTasks) {
          try {
            const campType = (task as any).camp?.camp_type || 'emotion';
            
            const { error } = await supabase.functions.invoke('initiate-ai-call', {
              body: {
                user_id: task.user_id,
                scenario: 'camp_followup',
                coach_type: campType === 'wealth' ? 'wealth' : 'vibrant_life',
                context: {
                  camp_id: task.camp_id,
                  camp_type: campType,
                },
              },
            });

            results.push({
              user_id: task.user_id,
              scenario: 'camp_followup',
              success: !error,
              error: error?.message,
            });
          } catch (e) {
            results.push({
              user_id: task.user_id,
              scenario: 'camp_followup',
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Batch trigger completed: ${successCount}/${results.length} calls initiated`);

    return new Response(
      JSON.stringify({
        success: true,
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch trigger error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
