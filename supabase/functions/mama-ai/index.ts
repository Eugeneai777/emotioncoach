import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `你是"姐姐"，一位温暖而有力量的女性AI教练，35岁，经历过职场、婚姻、育儿各种挑战，最终找到了内在力量。

## 你的性格
- 温暖但不软弱，像一个有智慧的好姐姐
- 能共情但也敢说真话
- 说话简短有力，不啰嗦
- 给可执行的建议，不讲大道理

## 禁止
- 说教式口吻（"你应该这样做"）
- 学术用语堆砌
- 长篇大论
- 否定对方的感受

## 要求
- 每段建议简短有力
- 给具体可操作的下一步
- 用"姐妹"、"亲爱的"等温暖但不过度的表达
- 适当使用emoji`;

interface HistoryEntry {
  round: number;
  inputs: Record<string, string>;
  response: string;
}

function buildRound1Prompt(tool: string, inputs: Record<string, string>): string {
  switch (tool) {
    case 'career':
      return `用户是一位女性，想聊职场发展。她目前的职业状态是："${inputs.status || '未说明'}"。
请用3-5句话回复，像好姐姐一样聊天：
1. 先对她的职业状态做一句温暖的回应
2. 说一个女性在职场中常遇到的隐形障碍
3. 末尾自然引出"最让你头疼的具体问题"的话题
不要给完整方案，先聊聊。`;

    case 'balance':
      return `用户是一位女性，感觉生活失衡。她目前最大的压力来源是："${inputs.pressure || '未说明'}"。
请用3-5句话回复，像好姐姐一样聊天：
1. 先共情她的压力
2. 说一句"其实很多姐妹都有这个感受"之类的话让她不孤单
3. 末尾自然引出"你的能量都花在哪些地方了"的话题
不要给完整分析，先聊聊。`;

    case 'emotion':
      return `用户是一位女性，想聊聊情绪。她目前的情绪状态是："${inputs.feeling || '未说明'}"。
请用3-5句话回复，像好姐姐一样聊天：
1. 先温暖地接住她的感受，让她觉得被看见
2. 轻轻说一句这种情绪背后可能的原因
3. 末尾自然引出"这种感觉持续多久了"的话题
不要给建议，先让她感到被理解。`;

    case 'growth':
      return `用户是一位女性，想要提升自己。她目前掌握的技能/资源是："${inputs.skills || '未说明'}"。
请用3-5句话回复，像好姐姐一样聊天：
1. 先肯定她想要成长的勇气
2. 说一个35+女性最被低估的优势
3. 末尾自然引出"你每周能投入多少时间"的话题
不要给完整规划，先聊聊。`;

    default:
      return inputs.message || '你好姐姐';
  }
}

function buildRound2Prompt(tool: string, inputs: Record<string, string>, history: HistoryEntry[]): string {
  const r1 = history[0];
  switch (tool) {
    case 'career':
      return `继续聊。用户之前说职业状态是"${r1?.inputs.status || '未说明'}"。
现在她补充了：最大的卡点是"${inputs.painPoint || '未说明'}"，期望的改变是"${inputs.goal || '未说明'}"。
请用3-5句话回复：
1. 根据她的卡点做简短分析
2. 点出这个卡点背后可能的真正原因（可能是自我设限、环境因素等）
3. 末尾自然引出"这种情况对你的生活影响有多大"的话题
不要给完整方案，继续铺垫。`;

    case 'balance':
      return `继续聊。用户之前说压力来源是"${r1?.inputs.pressure || '未说明'}"。
现在她补充了：能量分配是"${inputs.energy || '未说明'}"，最想改变的是"${inputs.wantChange || '未说明'}"。
请用3-5句话回复：
1. 根据她的能量分配做简短分析
2. 指出一个她可能忽略的"能量黑洞"
3. 末尾引出"你有没有只属于自己的时间"的话题
不要给完整分析，继续铺垫。`;

    case 'emotion':
      return `继续聊。用户之前说情绪状态是"${r1?.inputs.feeling || '未说明'}"。
现在她补充了：持续时间"${inputs.duration || '未说明'}"，有没有人可以倾诉"${inputs.support || '未说明'}"。
请用3-5句话回复：
1. 根据持续时间评估情绪状态
2. 温暖地指出长期压抑情绪的影响
3. 末尾引出"你平时怎么释放情绪"的话题
不要给完整分析，继续铺垫。`;

    case 'growth':
      return `继续聊。用户之前说技能/资源是"${r1?.inputs.skills || '未说明'}"。
现在她补充了：每周可投入时间"${inputs.time || '未说明'}"，最感兴趣的方向是"${inputs.interest || '未说明'}"。
请用3-5句话回复：
1. 根据时间和兴趣做简短分析
2. 指出一个她可以快速起步的切入点
3. 末尾引出"你最大的顾虑是什么"的话题
不要给完整规划，继续铺垫。`;

    default:
      return inputs.message || '继续';
  }
}

function buildRound3Prompt(tool: string, inputs: Record<string, string>, history: HistoryEntry[]): string {
  const allInputs: Record<string, string> = {};
  history.forEach(h => Object.assign(allInputs, h.inputs));
  Object.assign(allInputs, inputs);

  switch (tool) {
    case 'career':
      return `用户的完整情况：
- 职业状态：${allInputs.status || '未说明'}
- 最大卡点：${allInputs.painPoint || '未说明'}
- 期望改变：${allInputs.goal || '未说明'}
- 对生活的影响：${allInputs.impact || '未说明'}

请给出完整的职场突围诊断报告：
## 姐姐帮你看清了三个关键点

### 你的核心卡点在：
（分析她真正被卡住的地方，可能是能力、心态、环境等）

### 3个可以马上行动的建议：
1. （具体可操作，这周就能开始）
2. （具体可操作）
3. （具体可操作）

### 姐姐想对你说：
（一句温暖有力的话，让她感到被支持）`;

    case 'balance':
      return `用户的完整情况：
- 最大压力源：${allInputs.pressure || '未说明'}
- 能量分配：${allInputs.energy || '未说明'}
- 最想改变的：${allInputs.wantChange || '未说明'}
- 属于自己的时间：${allInputs.meTime || '未说明'}

请给出完整的生活能量诊断报告：
## 你的能量诊断

### 能量状态：XX型女性
（给一个标签，如"付出型"、"超负荷型"、"内耗型"等）

### 你的能量黑洞在：
（指出最消耗她能量的1-2件事）

### 3个重建能量的行动：
1. （简单可操作，明天就能开始）
2. （简单可操作）
3. （简单可操作）

### 姐姐想对你说：
（一句温暖有力的话）`;

    case 'emotion':
      return `用户的完整情况：
- 情绪状态：${allInputs.feeling || '未说明'}
- 持续时间：${allInputs.duration || '未说明'}
- 倾诉对象：${allInputs.support || '未说明'}
- 释放方式：${allInputs.release || '未说明'}

请给出完整的情绪健康诊断报告：
## 你的情绪画像

### 情绪类型：XX型
（给一个标签，如"隐忍型"、"过度承担型"、"敏感细腻型"等）

### 你需要关注的：
（根据情绪状态和持续时间，指出需要注意的地方）

### 3个温柔的自我疗愈方法：
1. （简单可操作，今晚就能做）
2. （简单可操作）
3. （简单可操作）

### 姐姐想对你说：
（一句温暖的话，让她知道不需要一个人扛）`;

    case 'growth':
      return `用户的完整情况：
- 技能/资源：${allInputs.skills || '未说明'}
- 可投入时间：${allInputs.time || '未说明'}
- 感兴趣方向：${allInputs.interest || '未说明'}
- 最大顾虑：${allInputs.concern || '未说明'}

请给出完整的成长路径规划：
## 姐姐帮你规划了三条路

### 路径1：（名称）
为什么适合你：（结合她的技能和兴趣分析）
第一步怎么做：（具体行动）
预计见效时间：（给一个合理预期）

### 路径2：（名称）
（同上格式）

### 路径3：（名称）
（同上格式）

### 关于你的顾虑"${allInputs.concern || ''}"：
（针对性地化解她的顾虑）

### 姐姐想对你说：
（一句鼓励的话）`;

    default:
      return inputs.message || '你好姐姐';
  }
}

function buildToolPrompt(tool: string, inputs: Record<string, string>, round?: number, history?: HistoryEntry[]): string {
  const r = round || 3;
  const h = history || [];

  if (r === 1) return buildRound1Prompt(tool, inputs);
  if (r === 2) return buildRound2Prompt(tool, inputs, h);
  return buildRound3Prompt(tool, inputs, h);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, inputs, round, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const userPrompt = buildToolPrompt(tool, inputs || {}, round, history);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: '姐姐太忙了，稍后再来聊吧 💛' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: '服务暂时不可用，请稍后再试' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: '姐姐暂时不在线，稍后再试 💛' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('mama-ai error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : '未知错误' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
