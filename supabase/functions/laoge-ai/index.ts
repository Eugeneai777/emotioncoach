import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `你是"老哥"，一个有丰富阅历的中年男人AI参谋，年龄45岁，经历过创业、职场、家庭各种风浪。

## 你的性格
- 直接、冷静、务实、像大哥一样说话
- 有幽默感但不轻浮
- 说话简短有力，不啰嗦
- 给可执行的建议，不讲大道理

## 禁止
- 心理咨询腔（"我理解你的感受"这种话少说）
- 学术用语、专业术语堆砌
- 长篇大论、车轱辘话
- 模棱两可的建议

## 要求
- 每段建议简短有力，说人话
- 给具体可操作的下一步
- 必要时直接指出问题，不绕弯子
- 用"兄弟"、"老哥跟你说"等口语化表达`;

interface HistoryEntry {
  round: number;
  inputs: Record<string, string>;
  response: string;
}

function buildRound1Prompt(tool: string, inputs: Record<string, string>): string {
  switch (tool) {
    case 'opportunity':
      return `用户想找赚钱机会，他说自己的行业是"${inputs.industry || '未说明'}"。
请用3-5句话回复，像老大哥一样聊天：
1. 先对他的行业做一句简短点评
2. 说一个这个行业赚钱的关键点或常见误区
3. 末尾自然引出"在哪个城市、手上有什么资源"的话题，为下一轮提问做铺垫
不要给完整方案，只是先聊聊。`;

    case 'career':
      return `用户说自己在"${inputs.industry || '未说明'}"行业工作，觉得事业卡住了。
请用3-5句话回复，像老大哥一样聊天：
1. 先对他的行业做一句简短点评
2. 说一个这个行业常见的瓶颈或坑
3. 末尾自然引出"收入和最大的卡点"的话题，为下一轮提问做铺垫
不要给完整方案，只是先聊聊。`;

    case 'stress':
      return `用户说自己压力大。工作压力${inputs.work || '?'}/10，家庭责任${inputs.family || '?'}/10。
请用3-5句话回复，像老大哥一样聊天：
1. 根据分数简短评价他的压力状态
2. 说一句共情但不矫情的话
3. 末尾自然引出"睡眠和经济压力"的话题，为下一轮提问做铺垫
不要给完整分析，只是先聊聊。`;

    case 'health':
      return `用户想了解健康风险。年龄${inputs.age || '未说明'}，体重${inputs.weight || '未说明'}。
请用3-5句话回复，像老大哥一样聊天：
1. 根据年龄和体重简短评价
2. 说一个这个年龄段最容易忽视的健康问题
3. 末尾自然引出"睡眠和运动"的话题，为下一轮提问做铺垫
不要给完整分析，只是先聊聊。`;

    default:
      return inputs.message || '你好老哥';
  }
}

function buildRound2Prompt(tool: string, inputs: Record<string, string>, history: HistoryEntry[]): string {
  const r1 = history[0];
  switch (tool) {
    case 'opportunity':
      return `继续聊。用户之前说行业是"${r1?.inputs.industry || '未说明'}"。
现在他补充了：城市是"${inputs.city || '未说明'}"，手上资源是"${inputs.resources || '未说明'}"。
请用3-5句话回复：
1. 根据城市和资源做简短点评
2. 指出一个结合他城市和资源的潜在方向
3. 末尾自然引出"能投入多少时间和资金"的话题
不要给完整方案，继续铺垫。`;

    case 'career':
      return `继续聊。用户之前说行业是"${r1?.inputs.industry || '未说明'}"。
现在他补充了：收入是"${inputs.income || '未说明'}"，最大卡点是"${inputs.painPoint || '未说明'}"。
请用3-5句话回复：
1. 根据收入和卡点做简短分析
2. 点出这个卡点背后可能的真正原因
3. 末尾自然引出"持续多久了、试过什么方法"的话题
不要给完整方案，继续铺垫。`;

    case 'stress':
      return `继续聊。用户之前说工作压力${r1?.inputs.work || '?'}/10，家庭${r1?.inputs.family || '?'}/10。
现在补充了：睡眠质量差${inputs.sleep || '?'}/10，经济压力${inputs.money || '?'}/10。
请用3-5句话回复：
1. 综合四个维度简短评价
2. 指出他目前最需要关注的1个维度
3. 末尾引出"情绪释放和最想改变的事"
不要给完整分析，继续铺垫。`;

    case 'health':
      return `继续聊。用户之前说年龄${r1?.inputs.age || '未说明'}，体重${r1?.inputs.weight || '未说明'}。
现在补充了：睡眠${inputs.sleepHours || '未说明'}，运动频率${inputs.exercise || '未说明'}。
请用3-5句话回复：
1. 根据睡眠和运动做简短评价
2. 指出他当前生活方式最大的风险点
3. 末尾引出"最担心什么健康问题"
不要给完整分析，继续铺垫。`;

    default:
      return inputs.message || '继续';
  }
}

function buildRound3Prompt(tool: string, inputs: Record<string, string>, history: HistoryEntry[]): string {
  const allInputs: Record<string, string> = {};
  history.forEach(h => Object.assign(allInputs, h.inputs));
  Object.assign(allInputs, inputs);

  switch (tool) {
    case 'opportunity':
      return `用户的完整情况：
- 行业：${allInputs.industry || '未说明'}
- 城市：${allInputs.city || '未说明'}
- 资源：${allInputs.resources || '未说明'}
- 能投入的时间和资金：${allInputs.budget || '未说明'}

请给出完整的赚钱方向分析：
## 老哥给你找到三个方向

### 方向1：（名称）
为什么适合你：（结合他的行业、城市、资源分析）
第一步怎么做：（具体行动）
预计启动周期：（时间估算）

### 方向2：（名称）
（同上格式）

### 方向3：（名称）
（同上格式）

### 老哥多说一句：
（一句点睛的话，直击要害）`;

    case 'career':
      return `用户的完整情况：
- 行业：${allInputs.industry || '未说明'}
- 收入：${allInputs.income || '未说明'}
- 最大卡点：${allInputs.painPoint || '未说明'}
- 持续时间：${allInputs.duration || '未说明'}
- 试过的方法：${allInputs.tried || '未说明'}

请给出完整的事业突围诊断报告：
## 老哥的诊断报告

### 你的核心问题在：
（从业务增长、团队管理、时间结构、方向选择中分析，指出1-2个关键点）

### 3个突围建议：
1. （具体可操作的建议，不是大道理）
2. （具体可操作的建议）
3. （具体可操作的建议）

### 为什么你之前的方法没用：
（分析他试过的方法为什么效果不好）

### 老哥多说一句：
（一句点睛的话）`;

    case 'stress':
      return `用户的完整压力数据：
- 工作压力：${allInputs.work || '?'}/10
- 家庭责任：${allInputs.family || '?'}/10
- 睡眠质量差：${allInputs.sleep || '?'}/10
- 经济压力：${allInputs.money || '?'}/10
- 情绪释放缺失：${allInputs.emotion || '?'}/10
- 最想改变的：${allInputs.wantChange || '未说明'}

请给出完整压力诊断报告：
## 你的压力指数：XX%
（根据5项分数加权计算，满分100%）

### 压力类型：XX型男人
（给一个简短的标签，如"责任型"、"扛压型"、"内耗型"等）

### 你最该优先解决的问题：
（根据"最想改变的"和各项分数，给出优先级）

### 3个可执行的减压方案：
1. （简单可操作，明天就能开始）
2. （简单可操作）
3. （简单可操作）

### 老哥多说一句：
（一句点睛的话）`;

    case 'health':
      return `用户的完整健康信息：
- 年龄：${allInputs.age || '未说明'}
- 体重：${allInputs.weight || '未说明'}
- 睡眠：${allInputs.sleepHours || '未说明'}
- 运动：${allInputs.exercise || '未说明'}
- 最担心的：${allInputs.concern || '未说明'}

请给出完整健康风险分析：
## 老哥提醒你注意三个健康风险

### 风险1：（名称）
原因：（结合他的具体情况分析）
建议：（具体可操作）

### 风险2：（名称）
原因：（结合他的具体情况分析）
建议：（具体可操作）

### 风险3：（名称）
原因：（结合他的具体情况分析）
建议：（具体可操作）

### 关于你最担心的"${allInputs.concern || '健康问题'}"：
（针对性分析和建议）

**免责声明：以上仅为生活方式建议，不构成医学诊断。如有不适请就医。**`;

    default:
      return inputs.message || '你好老哥';
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
        return new Response(JSON.stringify({ error: '老哥太忙了，稍后再来问吧。' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI 额度用完了，请联系管理员充值。' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: '老哥暂时不在线，稍后再试。' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('laoge-ai error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : '未知错误' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
