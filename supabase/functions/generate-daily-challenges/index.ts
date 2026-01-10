import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 挑战类型配置
const challengeTypes = {
  giving: { name: '给予行动', icon: '🎁', color: 'text-rose-500' },
  awareness: { name: '觉察练习', icon: '🧘', color: 'text-amber-500' },
  share: { name: '分享邀请', icon: '🌟', color: 'text-purple-500' },
  gratitude: { name: '感恩表达', icon: '💝', color: 'text-pink-500' },
  abundance: { name: '富足思维', icon: '✨', color: 'text-emerald-500' },
};

// 四穷类型映射
type PoorType = 'mouth' | 'hand' | 'eye' | 'heart';
type Difficulty = 'easy' | 'medium' | 'hard';

interface ChallengeTemplate {
  title: string;
  description: string;
  points: number;
  targetPoor: PoorType;
  baseDifficulty?: Difficulty; // 基础难度
}

interface FourPoorProgress {
  baselineScores: Record<PoorType, number>;
  awarenessCount: Record<PoorType, number>;
  transformationRates: Record<PoorType, number>;
}

interface PriorityWeight {
  type: PoorType;
  score: number;
  reason: string;
}

// 根据难度调整积分
const difficultyPointMultiplier: Record<Difficulty, number> = {
  easy: 0.7,
  medium: 1.0,
  hard: 1.5,
};

// 基于用户画像的挑战库 - 按难度分类
const challengeLibrary: Record<PoorType, { giving: ChallengeTemplate[]; awareness: ChallengeTemplate[] }> = {
  // 眼穷 - 比较/自卑型
  eye: {
    giving: [
      { title: '真诚赞美1个人', description: '今天真诚地赞美1个人，观察对方的反应', points: 15, targetPoor: 'eye', baseDifficulty: 'easy' },
      { title: '真诚赞美3个人', description: '今天真诚地赞美3个不同的人，观察他们的反应', points: 20, targetPoor: 'eye', baseDifficulty: 'medium' },
      { title: '写一封感谢信', description: '给曾经帮助过你的人写一封感谢信', points: 30, targetPoor: 'eye', baseDifficulty: 'hard' },
      { title: '分享你的技能', description: '主动教别人一项你擅长的技能', points: 25, targetPoor: 'eye', baseDifficulty: 'medium' },
      { title: '公开肯定他人', description: '在群聊或社交平台公开肯定某人的优点', points: 35, targetPoor: 'eye', baseDifficulty: 'hard' },
    ],
    awareness: [
      { title: '觉察比较心理', description: '当发现自己在比较时，记录下来并转换视角', points: 15, targetPoor: 'eye', baseDifficulty: 'easy' },
      { title: '列出独特优势', description: '写下5个你独特的优势或天赋', points: 20, targetPoor: 'eye', baseDifficulty: 'medium' },
      { title: '欣赏他人成功', description: '真诚地为他人的成功感到高兴', points: 15, targetPoor: 'eye', baseDifficulty: 'easy' },
      { title: '自我价值确认', description: '列出10个证明你有价值的事实', points: 25, targetPoor: 'eye', baseDifficulty: 'medium' },
      { title: '深度自我接纳', description: '写下3个你不喜欢的特点，找出它们的积极面', points: 30, targetPoor: 'eye', baseDifficulty: 'hard' },
    ],
  },
  // 心穷 - 安全感缺失型
  heart: {
    giving: [
      { title: '微笑给予', description: '今天对3个陌生人微笑', points: 10, targetPoor: 'heart', baseDifficulty: 'easy' },
      { title: '无条件给予', description: '今天给予一次，不期待任何回报', points: 25, targetPoor: 'heart', baseDifficulty: 'medium' },
      { title: '倾听他人', description: '全神贯注地倾听某人说话10分钟', points: 20, targetPoor: 'heart', baseDifficulty: 'medium' },
      { title: '表达爱意', description: '向家人表达你的爱和感谢', points: 25, targetPoor: 'heart', baseDifficulty: 'medium' },
      { title: '深度陪伴', description: '放下手机，全心陪伴家人或朋友30分钟', points: 35, targetPoor: 'heart', baseDifficulty: 'hard' },
    ],
    awareness: [
      { title: '安全感小确幸', description: '记录今天1件让你感到安全的小事', points: 10, targetPoor: 'heart', baseDifficulty: 'easy' },
      { title: '安全感日记', description: '记录今天让你感到安全的3件小事', points: 15, targetPoor: 'heart', baseDifficulty: 'easy' },
      { title: '放下控制', description: '有意识地放下一件想要控制的事', points: 25, targetPoor: 'heart', baseDifficulty: 'medium' },
      { title: '信任练习', description: '今天选择相信一个人的善意', points: 20, targetPoor: 'heart', baseDifficulty: 'medium' },
      { title: '脆弱的力量', description: '向信任的人分享一个你的担忧或恐惧', points: 35, targetPoor: 'heart', baseDifficulty: 'hard' },
    ],
  },
  // 嘴穷 - 抱怨/负面表达型
  mouth: {
    giving: [
      { title: '说一句祝福', description: '今天对1个人说一句真诚的祝福', points: 10, targetPoor: 'mouth', baseDifficulty: 'easy' },
      { title: '今天只说祝福的话', description: '今天对3个人说祝福或鼓励的话', points: 20, targetPoor: 'mouth', baseDifficulty: 'medium' },
      { title: '替代抱怨', description: '每当想抱怨时，改说一句感恩的话', points: 30, targetPoor: 'mouth', baseDifficulty: 'hard' },
      { title: '语言慷慨', description: '主动夸奖或肯定他人5次', points: 25, targetPoor: 'mouth', baseDifficulty: 'medium' },
      { title: '一整天零抱怨', description: '今天完全不说任何抱怨的话', points: 40, targetPoor: 'mouth', baseDifficulty: 'hard' },
    ],
    awareness: [
      { title: '觉察一句负面话', description: '记录今天说的1句负面话语，尝试转换', points: 10, targetPoor: 'mouth', baseDifficulty: 'easy' },
      { title: '觉察负面语言', description: '记录今天说的负面话语，并尝试转换', points: 15, targetPoor: 'mouth', baseDifficulty: 'easy' },
      { title: '感恩语录', description: '写下10句感恩的话，大声朗读', points: 20, targetPoor: 'mouth', baseDifficulty: 'medium' },
      { title: '肯定句练习', description: '说10次"我值得拥有美好的生活"', points: 15, targetPoor: 'mouth', baseDifficulty: 'easy' },
      { title: '语言能量日记', description: '记录今天所有话语，分析正负能量比例', points: 30, targetPoor: 'mouth', baseDifficulty: 'hard' },
    ],
  },
  // 手穷 - 行动力缺失型
  hand: {
    giving: [
      { title: '5分钟行动', description: '立刻花5分钟帮助某人', points: 10, targetPoor: 'hand', baseDifficulty: 'easy' },
      { title: '帮助他人行动', description: '帮助某人完成一个他们拖延的任务', points: 30, targetPoor: 'hand', baseDifficulty: 'hard' },
      { title: '即刻行动', description: '想到什么好事立刻去做，不要拖延', points: 20, targetPoor: 'hand', baseDifficulty: 'medium' },
      { title: '创造价值', description: '今天创造一件对他人有价值的东西', points: 30, targetPoor: 'hand', baseDifficulty: 'hard' },
      { title: '主动出击', description: '主动联系一个你想联系但拖延的人', points: 25, targetPoor: 'hand', baseDifficulty: 'medium' },
    ],
    awareness: [
      { title: '完成1件小事', description: '完成1件一直拖延的小事', points: 10, targetPoor: 'hand', baseDifficulty: 'easy' },
      { title: '完成清单', description: '列出3件拖延的事，今天完成1件', points: 20, targetPoor: 'hand', baseDifficulty: 'medium' },
      { title: '行动日记', description: '记录今天每个"想但没做"的时刻', points: 15, targetPoor: 'hand', baseDifficulty: 'easy' },
      { title: '2分钟规则', description: '今天践行：能2分钟完成的事立刻做', points: 20, targetPoor: 'hand', baseDifficulty: 'medium' },
      { title: '挑战拖延症', description: '完成一件拖延超过1周的任务', points: 35, targetPoor: 'hand', baseDifficulty: 'hard' },
    ],
  },
};

// 通用挑战 - 按难度分类
const genericChallenges: Record<string, ChallengeTemplate[]> = {
  share: [
    { title: '点赞鼓励', description: '在社区给3个人点赞或评论鼓励', points: 10, targetPoor: 'mouth', baseDifficulty: 'easy' },
    { title: '分享今日觉察', description: '把今天的觉察分享到社区或朋友圈', points: 25, targetPoor: 'mouth', baseDifficulty: 'medium' },
    { title: '邀请好友', description: '邀请一位朋友加入财富觉醒之旅', points: 50, targetPoor: 'hand', baseDifficulty: 'hard' },
    { title: '分享成长故事', description: '分享你的一个成长故事激励他人', points: 30, targetPoor: 'mouth', baseDifficulty: 'medium' },
  ],
  gratitude: [
    { title: '感恩1件事', description: '写下今天最感恩的1件事', points: 8, targetPoor: 'heart', baseDifficulty: 'easy' },
    { title: '感恩5件事', description: '今天睡前写下5件感恩的事', points: 15, targetPoor: 'heart', baseDifficulty: 'easy' },
    { title: '表达感谢', description: '当面感谢一个平时忽略的人', points: 25, targetPoor: 'mouth', baseDifficulty: 'medium' },
    { title: '感恩富足', description: '列出生活中已经拥有的10个富足', points: 25, targetPoor: 'eye', baseDifficulty: 'medium' },
    { title: '感恩信', description: '给一个你从未感谢过的人写感恩信', points: 35, targetPoor: 'heart', baseDifficulty: 'hard' },
  ],
  abundance: [
    { title: '富足肯定句', description: '今天重复10次"我值得拥有美好"', points: 10, targetPoor: 'mouth', baseDifficulty: 'easy' },
    { title: '慷慨一次', description: '今天比平时更慷慨地给予一次', points: 25, targetPoor: 'hand', baseDifficulty: 'medium' },
    { title: '庆祝小成功', description: '庆祝今天的一个小成功，无论多小', points: 15, targetPoor: 'heart', baseDifficulty: 'easy' },
    { title: '富足思维转换', description: '把3个"我没有"改成"我可以"', points: 20, targetPoor: 'eye', baseDifficulty: 'medium' },
    { title: '付出不求回报', description: '做一件善事，完全不让对方知道', points: 35, targetPoor: 'heart', baseDifficulty: 'hard' },
  ],
};

// 四穷类型中文名称
const poorTypeNames: Record<PoorType, string> = {
  mouth: '嘴穷',
  hand: '手穷',
  eye: '眼穷',
  heart: '心穷',
};

// ============= 智能推荐核心算法 =============

/**
 * 获取用户四穷进度数据
 */
async function getUserFourPoorProgress(
  supabaseClient: any,
  userId: string
): Promise<FourPoorProgress> {
  // 1. 获取用户 baseline (从 wealth_block_assessments)
  const { data: assessment } = await supabaseClient
    .from('wealth_block_assessments')
    .select('mouth_score, hand_score, eye_score, heart_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. 获取日记觉察次数 (按 behavior_type)
  const { data: journalEntries } = await supabaseClient
    .from('wealth_journal_entries')
    .select('behavior_type')
    .eq('user_id', userId);

  // 3. 获取已完成挑战的觉察次数 (按 target_poor_type)
  const { data: completedChallenges } = await supabaseClient
    .from('daily_challenges')
    .select('target_poor_type')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .not('target_poor_type', 'is', null);

  // 计算 baseline 分数 (默认值10)
  const baselineScores: Record<PoorType, number> = {
    mouth: assessment?.mouth_score ?? 10,
    hand: assessment?.hand_score ?? 10,
    eye: assessment?.eye_score ?? 10,
    heart: assessment?.heart_score ?? 10,
  };

  // 计算觉察次数 (日记 + 挑战)
  const awarenessCount: Record<PoorType, number> = { mouth: 0, hand: 0, eye: 0, heart: 0 };
  
  // 统计日记觉察
  journalEntries?.forEach((entry: any) => {
    const type = entry.behavior_type as PoorType;
    if (type && awarenessCount[type] !== undefined) {
      awarenessCount[type]++;
    }
  });
  
  // 统计挑战觉察
  completedChallenges?.forEach((challenge: any) => {
    const type = challenge.target_poor_type as PoorType;
    if (type && awarenessCount[type] !== undefined) {
      awarenessCount[type]++;
    }
  });

  // 计算转化率 (觉察次数 * 5，最大100)
  const transformationRates: Record<PoorType, number> = {
    mouth: Math.min(awarenessCount.mouth * 5, 100),
    hand: Math.min(awarenessCount.hand * 5, 100),
    eye: Math.min(awarenessCount.eye * 5, 100),
    heart: Math.min(awarenessCount.heart * 5, 100),
  };

  return { baselineScores, awarenessCount, transformationRates };
}

/**
 * 计算挑战推荐优先级权重
 * 公式: 基线分×0.4 + (100-转化率)×0.3 + 觉察惩罚×0.3
 */
function calculatePriorityWeights(progress: FourPoorProgress): PriorityWeight[] {
  const weights: PriorityWeight[] = [];
  const poorTypes: PoorType[] = ['mouth', 'hand', 'eye', 'heart'];

  poorTypes.forEach(type => {
    const baseline = progress.baselineScores[type] || 10;
    const rate = progress.transformationRates[type] || 0;
    const count = progress.awarenessCount[type] || 0;

    // 觉察惩罚：觉察越少，权重越高（最多额外30分）
    const awarenessPenalty = Math.max(0, 30 - count * 3);

    const score = (baseline * 0.4) + ((100 - rate) * 0.3) + (awarenessPenalty * 0.3);

    // 生成推荐理由
    let reason = '';
    if (count === 0) {
      reason = `${poorTypeNames[type]}尚未练习，需要开始突破`;
    } else if (rate < 30) {
      reason = `${poorTypeNames[type]}转化率${rate}%，需要更多练习`;
    } else if (baseline >= 15) {
      reason = `${poorTypeNames[type]}基线卡点较深，持续关注`;
    } else {
      reason = `${poorTypeNames[type]}平衡发展`;
    }

    weights.push({ type, score, reason });
  });

  // 按分数降序排序
  return weights.sort((a, b) => b.score - a.score);
}

/**
 * 根据用户历史完成率动态调整难度
 */
async function getDynamicDifficulty(
  supabaseClient: any,
  userId: string
): Promise<{ primary: Difficulty; secondary: Difficulty }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: history } = await supabaseClient
    .from('daily_challenges')
    .select('is_completed')
    .eq('user_id', userId)
    .gte('target_date', sevenDaysAgo.toISOString().split('T')[0]);

  const total = history?.length || 0;
  const completed = history?.filter((h: any) => h.is_completed).length || 0;
  const rate = total > 0 ? completed / total : 0.5; // 默认50%完成率

  // 根据完成率调整难度
  if (rate >= 0.8) {
    return { primary: 'hard', secondary: 'medium' };
  }
  if (rate >= 0.5) {
    return { primary: 'medium', secondary: 'easy' };
  }
  return { primary: 'easy', secondary: 'easy' };
}

/**
 * 根据难度筛选挑战
 */
function filterChallengesByDifficulty(
  challenges: ChallengeTemplate[],
  targetDifficulty: Difficulty
): ChallengeTemplate[] {
  const filtered = challenges.filter(c => c.baseDifficulty === targetDifficulty);
  // 如果没有匹配的难度，返回所有挑战
  return filtered.length > 0 ? filtered : challenges;
}

/**
 * 调整挑战积分
 */
function adjustChallengePoints(challenge: ChallengeTemplate, targetDifficulty: Difficulty): number {
  const multiplier = difficultyPointMultiplier[targetDifficulty];
  return Math.round(challenge.points * multiplier);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { targetDate } = await req.json();
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // Check if challenges already exist for today
    const { data: existingChallenges } = await supabaseClient
      .from('daily_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_date', dateStr);

    if (existingChallenges && existingChallenges.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Challenges already exist', count: existingChallenges.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= 智能推荐算法开始 =============

    // 1. 获取用户四穷进度
    const progress = await getUserFourPoorProgress(supabaseClient, user.id);
    console.log('User four poor progress:', progress);

    // 2. 计算优先级权重
    const priorityList = calculatePriorityWeights(progress);
    console.log('Priority weights:', priorityList);

    // 3. 获取动态难度
    const difficulty = await getDynamicDifficulty(supabaseClient, user.id);
    console.log('Dynamic difficulty:', difficulty);

    // 4. 获取最近完成的挑战标题（避免重复）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentChallenges } = await supabaseClient
      .from('daily_challenges')
      .select('challenge_title')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('completed_at', sevenDaysAgo.toISOString());

    const recentTitles = new Set(recentChallenges?.map((c: any) => c.challenge_title) || []);

    // Helper function to pick a random non-repeated challenge
    const pickChallenge = (
      challenges: ChallengeTemplate[],
      type: string,
      targetDifficulty: Difficulty,
      recommendReason: string
    ) => {
      // 先按难度筛选
      const difficultyFiltered = filterChallengesByDifficulty(challenges, targetDifficulty);
      
      // 再排除最近完成的
      const available = difficultyFiltered.filter(c => !recentTitles.has(c.title));
      const pool = available.length > 0 ? available : difficultyFiltered;
      
      const challenge = pool[Math.floor(Math.random() * pool.length)];
      const adjustedPoints = adjustChallengePoints(challenge, targetDifficulty);

      return {
        user_id: user.id,
        challenge_type: type,
        challenge_title: challenge.title,
        challenge_description: challenge.description,
        difficulty: targetDifficulty,
        points_reward: adjustedPoints,
        target_date: dateStr,
        is_ai_generated: true,
        target_poor_type: challenge.targetPoor,
        recommendation_reason: recommendReason, // 推荐理由
      };
    };

    const challengesToCreate: any[] = [];

    // ============= 智能挑战组合策略 =============

    // 挑战1：重点突破挑战 (60%权重) - 从优先级最高的维度选择 giving
    const primaryType = priorityList[0].type;
    const primaryReason = priorityList[0].reason;
    const primaryChallenges = challengeLibrary[primaryType];
    challengesToCreate.push(
      pickChallenge(primaryChallenges.giving, 'giving', difficulty.primary, `🎯 重点突破: ${primaryReason}`)
    );

    // 挑战2：平衡发展挑战 (25%权重) - 从次优先维度选择 awareness
    const secondaryType = priorityList[1].type;
    const secondaryReason = priorityList[1].reason;
    const secondaryChallenges = challengeLibrary[secondaryType];
    challengesToCreate.push(
      pickChallenge(secondaryChallenges.awareness, 'awareness', difficulty.secondary, `⚖️ 平衡发展: ${secondaryReason}`)
    );

    // 挑战3：社交分享挑战 (15%权重) - 从 share/gratitude/abundance 中选择
    const randomTypes = ['share', 'gratitude', 'abundance'];
    const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    challengesToCreate.push(
      pickChallenge(
        genericChallenges[randomType],
        randomType,
        'medium', // 社交挑战固定中等难度
        '🌟 社交激励: 分享传递正能量'
      )
    );

    console.log('Challenges to create:', challengesToCreate);

    // Insert challenges
    const { data: inserted, error: insertError } = await supabaseClient
      .from('daily_challenges')
      .insert(challengesToCreate)
      .select();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        challenges: inserted,
        count: inserted?.length || 0,
        algorithm: {
          priorityList: priorityList.map(p => ({ type: p.type, score: Math.round(p.score) })),
          difficulty,
          progress: {
            awarenessCount: progress.awarenessCount,
            transformationRates: progress.transformationRates,
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating daily challenges:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
