import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 基于反应模式的行动策略库
const actionStrategies: Record<string, { easy: string[]; medium: string[]; challenge: string[] }> = {
  chase: {
    easy: [
      "今天做一件事时，故意放慢20%",
      "今天说一次'我不着急'",
      "今天主动休息10分钟，什么都不做"
    ],
    medium: [
      "今天只做1个'不给自己压力的价值给予'",
      "今天在一个决定上等待1小时再行动",
      "今天对一件事说'够了，可以了'"
    ],
    challenge: [
      "今天主动推迟一个'必须马上做'的事到明天",
      "今天问自己3次：'这真的紧急吗？'",
      "今天只完成3件事，其他的放下"
    ]
  },
  avoid: {
    easy: [
      "今天只写1句'我想要的是……'",
      "今天查看一次银行余额，不评判",
      "今天想象自己有100万会怎样，允许自己想"
    ],
    medium: [
      "今天主动问一次价格",
      "今天对1个人表达一次需求",
      "今天点一杯比平时贵5元的饮料"
    ],
    challenge: [
      "今天主动发起一次关于钱的对话",
      "今天买一样'不必要但想要'的小东西",
      "今天告诉一个人你的真实收入目标"
    ]
  },
  trauma: {
    easy: [
      "今天不谈钱，只做3次深呼吸",
      "今天给自己一个小礼物",
      "今天对镜子说3句肯定的话"
    ],
    medium: [
      "今天写下1件让你有安全感的事",
      "今天在舒适的地方待15分钟",
      "今天和信任的人说说最近的感受"
    ],
    challenge: [
      "今天回忆一次'钱的好经历'",
      "今天做一件过去因为钱而放弃的小事",
      "今天写一封信给过去的自己（不发送）"
    ]
  },
  harmony: {
    easy: [
      "今天分享一次你的喜悦",
      "今天对一个人表达感谢",
      "今天做一件让自己开心的小事"
    ],
    medium: [
      "今天主动帮助一个人",
      "今天邀请一个人共进午餐",
      "今天在朋友圈分享一个小成就"
    ],
    challenge: [
      "今天挑战一个小小的舒适区",
      "今天设定一个30天后的小目标",
      "今天教一个人你擅长的事"
    ]
  }
};

// 根据完成情况调整难度
const getDifficultyLevel = (completedCount: number, avgDifficulty: number): 'easy' | 'medium' | 'challenge' => {
  if (completedCount < 3) return 'easy';      // 新手期：简单任务
  if (avgDifficulty > 3.5) return 'easy';     // 觉得难：降低难度
  if (avgDifficulty > 2.5) return 'medium';   // 适中
  return 'challenge';                          // 容易适应：增加挑战
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { day_number, camp_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's wealth profile
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: wealthProfile } = await serviceClient
      .from('user_wealth_profile')
      .select('reaction_pattern, dominant_poor, dominant_emotion')
      .eq('user_id', user.id)
      .single();

    // Get recent journal entries with action completion data
    const { data: recentEntries } = await supabaseClient
      .from('wealth_journal_entries')
      .select('giving_action, action_completed_at, action_difficulty')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7);

    // Calculate completion stats
    const entriesWithAction = recentEntries?.filter(e => e.giving_action) || [];
    const completedActions = entriesWithAction.filter(e => e.action_completed_at);
    const completedCount = completedActions.length;
    const avgDifficulty = completedActions.length > 0
      ? completedActions.reduce((sum, e) => sum + (e.action_difficulty || 3), 0) / completedActions.length
      : 3;

    // Determine difficulty level
    const difficultyLevel = getDifficultyLevel(completedCount, avgDifficulty);

    // Get reaction pattern (default to harmony if unknown)
    const reactionPattern = wealthProfile?.reaction_pattern || 'harmony';
    const strategies = actionStrategies[reactionPattern] || actionStrategies.harmony;
    
    // Get available actions for difficulty level
    const availableActions = strategies[difficultyLevel];

    // Avoid recently used actions
    const recentActions = entriesWithAction.map(e => e.giving_action);
    const unusedActions = availableActions.filter(a => !recentActions.includes(a));
    
    // Select action (prefer unused, fallback to any)
    const actionPool = unusedActions.length > 0 ? unusedActions : availableActions;
    const selectedAction = actionPool[Math.floor(Math.random() * actionPool.length)];

    // Generate reason based on pattern
    const patternNames: Record<string, string> = {
      chase: '追逐型',
      avoid: '回避型', 
      trauma: '创伤型',
      harmony: '和谐型'
    };

    const difficultyNames: Record<string, string> = {
      easy: '入门',
      medium: '进阶',
      challenge: '挑战'
    };

    const reason = `基于你的${patternNames[reactionPattern] || ''}模式，第${day_number}天推荐${difficultyNames[difficultyLevel]}行动`;

    return new Response(JSON.stringify({
      action: selectedAction,
      reason,
      difficulty_level: difficultyLevel,
      reaction_pattern: reactionPattern,
      completion_stats: {
        completed_count: completedCount,
        total_count: entriesWithAction.length,
        avg_difficulty: avgDifficulty.toFixed(1)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-action:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
