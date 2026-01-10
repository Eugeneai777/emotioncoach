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

interface ChallengeTemplate {
  title: string;
  description: string;
  points: number;
  targetPoor: PoorType; // 每个挑战关联的四穷维度
}

// 基于用户画像的挑战库 - 添加 targetPoor 标签
const challengeLibrary: Record<string, { giving: ChallengeTemplate[]; awareness: ChallengeTemplate[] }> = {
  // 眼穷 - 比较/自卑型
  eye: {
    giving: [
      { title: '真诚赞美3个人', description: '今天真诚地赞美3个不同的人，观察他们的反应', points: 20, targetPoor: 'eye' },
      { title: '写一封感谢信', description: '给曾经帮助过你的人写一封感谢信', points: 25, targetPoor: 'eye' },
      { title: '分享你的技能', description: '主动教别人一项你擅长的技能', points: 20, targetPoor: 'eye' },
    ],
    awareness: [
      { title: '觉察比较心理', description: '当发现自己在比较时，记录下来并转换视角', points: 15, targetPoor: 'eye' },
      { title: '列出独特优势', description: '写下5个你独特的优势或天赋', points: 20, targetPoor: 'eye' },
      { title: '欣赏他人成功', description: '真诚地为他人的成功感到高兴', points: 15, targetPoor: 'eye' },
    ],
  },
  // 心穷 - 安全感缺失型
  heart: {
    giving: [
      { title: '无条件给予', description: '今天给予一次，不期待任何回报', points: 25, targetPoor: 'heart' },
      { title: '倾听他人', description: '全神贯注地倾听某人说话10分钟', points: 20, targetPoor: 'heart' },
      { title: '表达爱意', description: '向家人表达你的爱和感谢', points: 20, targetPoor: 'heart' },
    ],
    awareness: [
      { title: '安全感日记', description: '记录今天让你感到安全的3件小事', points: 15, targetPoor: 'heart' },
      { title: '放下控制', description: '有意识地放下一件想要控制的事', points: 20, targetPoor: 'heart' },
      { title: '信任练习', description: '今天选择相信一个人的善意', points: 15, targetPoor: 'heart' },
    ],
  },
  // 嘴穷 - 抱怨/负面表达型
  mouth: {
    giving: [
      { title: '今天只说祝福的话', description: '今天对3个人说祝福或鼓励的话', points: 20, targetPoor: 'mouth' },
      { title: '替代抱怨', description: '每当想抱怨时，改说一句感恩的话', points: 25, targetPoor: 'mouth' },
      { title: '语言慷慨', description: '主动夸奖或肯定他人5次', points: 20, targetPoor: 'mouth' },
    ],
    awareness: [
      { title: '觉察负面语言', description: '记录今天说的负面话语，并尝试转换', points: 15, targetPoor: 'mouth' },
      { title: '感恩语录', description: '写下10句感恩的话，大声朗读', points: 15, targetPoor: 'mouth' },
      { title: '肯定句练习', description: '说10次"我值得拥有美好的生活"', points: 10, targetPoor: 'mouth' },
    ],
  },
  // 手穷 - 行动力缺失型
  hand: {
    giving: [
      { title: '帮助他人行动', description: '帮助某人完成一个他们拖延的任务', points: 25, targetPoor: 'hand' },
      { title: '即刻行动', description: '想到什么好事立刻去做，不要拖延', points: 20, targetPoor: 'hand' },
      { title: '创造价值', description: '今天创造一件对他人有价值的东西', points: 25, targetPoor: 'hand' },
    ],
    awareness: [
      { title: '完成清单', description: '列出3件拖延的事，今天完成1件', points: 20, targetPoor: 'hand' },
      { title: '行动日记', description: '记录今天每个"想但没做"的时刻', points: 15, targetPoor: 'hand' },
      { title: '2分钟规则', description: '今天践行：能2分钟完成的事立刻做', points: 15, targetPoor: 'hand' },
    ],
  },
  // 脑穷 - 限制性信念型 (映射到 eye)
  brain: {
    giving: [
      { title: '分享新知识', description: '学习一个新知识并分享给他人', points: 20, targetPoor: 'eye' },
      { title: '打破常规', description: '今天用不同的方式做一件习惯的事', points: 20, targetPoor: 'eye' },
      { title: '鼓励他人冒险', description: '鼓励某人尝试新事物', points: 20, targetPoor: 'eye' },
    ],
    awareness: [
      { title: '挑战限制信念', description: '找出一个限制性信念并找到反证', points: 25, targetPoor: 'eye' },
      { title: '可能性清单', description: '写下10个"如果没有限制，我会..."', points: 20, targetPoor: 'eye' },
      { title: '成长型思维', description: '把"我不能"改成"我正在学习"', points: 15, targetPoor: 'eye' },
    ],
  },
};

// 通用挑战 - 添加 targetPoor 标签（混合或心穷为主）
const genericChallenges: Record<string, ChallengeTemplate[]> = {
  share: [
    { title: '分享今日觉察', description: '把今天的觉察分享到社区或朋友圈', points: 30, targetPoor: 'mouth' },
    { title: '邀请好友', description: '邀请一位朋友加入财富觉醒之旅', points: 50, targetPoor: 'hand' },
    { title: '分享成长故事', description: '分享你的一个成长故事激励他人', points: 25, targetPoor: 'mouth' },
  ],
  gratitude: [
    { title: '感恩5件事', description: '今天睡前写下5件感恩的事', points: 15, targetPoor: 'heart' },
    { title: '表达感谢', description: '当面感谢一个平时忽略的人', points: 20, targetPoor: 'mouth' },
    { title: '感恩富足', description: '列出生活中已经拥有的10个富足', points: 20, targetPoor: 'eye' },
  ],
  abundance: [
    { title: '富足肯定句', description: '今天重复10次"我值得拥有美好"', points: 10, targetPoor: 'mouth' },
    { title: '慷慨一次', description: '今天比平时更慷慨地给予一次', points: 25, targetPoor: 'hand' },
    { title: '庆祝小成功', description: '庆祝今天的一个小成功，无论多小', points: 15, targetPoor: 'heart' },
  ],
};

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

    // Get user's wealth profile
    const { data: profile } = await supabaseClient
      .from('user_wealth_profile')
      .select('dominant_poor, reaction_pattern')
      .eq('user_id', user.id)
      .maybeSingle();

    const dominantType = profile?.dominant_poor || 'eye';

    // Get recently completed challenges to avoid repetition
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentChallenges } = await supabaseClient
      .from('daily_challenges')
      .select('challenge_title')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .gte('completed_at', sevenDaysAgo.toISOString());

    const recentTitles = new Set(recentChallenges?.map(c => c.challenge_title) || []);

    // Select challenges based on user's dominant type
    const userChallenges = challengeLibrary[dominantType as keyof typeof challengeLibrary] || challengeLibrary.eye;
    
    const challengesToCreate: any[] = [];

    // Helper function to pick a random non-repeated challenge
    const pickChallenge = (challenges: ChallengeTemplate[], type: string) => {
      const available = challenges.filter(c => !recentTitles.has(c.title));
      const pool = available.length > 0 ? available : challenges;
      const challenge = pool[Math.floor(Math.random() * pool.length)];
      return {
        user_id: user.id,
        challenge_type: type,
        challenge_title: challenge.title,
        challenge_description: challenge.description,
        difficulty: challenge.points >= 25 ? 'hard' : challenge.points >= 20 ? 'medium' : 'easy',
        points_reward: challenge.points,
        target_date: dateStr,
        is_ai_generated: true,
        target_poor_type: challenge.targetPoor, // 关联四穷维度
      };
    };

    // Pick 1 giving action challenge
    challengesToCreate.push(pickChallenge(userChallenges.giving, 'giving'));

    // Pick 1 awareness challenge
    challengesToCreate.push(pickChallenge(userChallenges.awareness, 'awareness'));

    // Pick 1 random from share/gratitude/abundance
    const randomTypes = ['share', 'gratitude', 'abundance'];
    const randomType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    challengesToCreate.push(pickChallenge(genericChallenges[randomType as keyof typeof genericChallenges], randomType));

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
        count: inserted?.length || 0
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