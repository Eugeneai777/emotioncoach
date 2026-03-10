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

function buildToolPrompt(tool: string, inputs: Record<string, string>): string {
  switch (tool) {
    case 'decision':
      return `用户需要做一个决策，请帮他分析。

用户的情况：${inputs.situation || '未说明'}
A方案：${inputs.optionA || '未说明'}
B方案：${inputs.optionB || '未说明'}

请按以下格式回复：
## 老哥给你的建议

### 1. 两个方案的关键差别
（简要对比）

### 2. 最大风险
（每个方案最大的坑是什么）

### 3. 更推荐的选择
（明确说推荐哪个）

### 4. 为什么
（2-3句话说清楚理由）`;

    case 'opportunity':
      return `用户想找赚钱机会，请根据他的情况给出3个方向。

行业：${inputs.industry || '未说明'}
城市：${inputs.city || '未说明'}
现有资源：${inputs.resources || '未说明'}

请按以下格式回复：
## 老哥看到三个机会方向

### 机会1：（名称）
为什么值得关注：（1-2句）
第一步怎么做：（具体行动）

### 机会2：（名称）
为什么值得关注：（1-2句）
第一步怎么做：（具体行动）

### 机会3：（名称）
为什么值得关注：（1-2句）
第一步怎么做：（具体行动）`;

    case 'career':
      return `用户觉得事业遇到瓶颈，请帮他诊断。

行业：${inputs.industry || '未说明'}
收入区间：${inputs.income || '未说明'}
最大卡点：${inputs.painPoint || '未说明'}

请按以下格式回复：
## 老哥的判断

### 你的卡点可能在：
（从以下几个维度分析：业务增长、团队管理、时间结构、方向选择，指出最关键的1-2个）

### 3个改进建议：
1. （具体建议）
2. （具体建议）
3. （具体建议）

### 老哥多说一句：
（一句点睛的话）`;

    case 'stress':
      return `用户做了压力测试，请根据分数给出分析和建议。

工作压力：${inputs.work}/10
家庭责任：${inputs.family}/10
睡眠质量：${inputs.sleep}/10（10=很差）
经济压力：${inputs.money}/10
情绪释放：${inputs.emotion}/10（10=完全没有释放）

请按以下格式回复：
## 你的压力指数：XX%
（根据5项分数加权计算，满分100%）

### 压力类型：XX型男人
（给一个简短的标签，如"责任型"、"扛压型"、"内耗型"等）

### 老哥建议：
1. （简单可操作的减压方法）
2. （简单可操作的减压方法）
3. （简单可操作的减压方法）`;

    case 'health':
      return `用户想了解健康风险，请根据基本信息给出提醒。

年龄：${inputs.age}
睡眠时间：${inputs.sleepHours}小时
运动频率：${inputs.exercise}
体重情况：${inputs.weight}

请按以下格式回复：
## 老哥提醒你注意三个健康风险

### 风险1：（名称）
原因：（为什么你可能有这个风险）

### 风险2：（名称）
原因：（为什么你可能有这个风险）

### 风险3：（名称）
原因：（为什么你可能有这个风险）

### 老哥的生活建议：
（3条简单的生活方式调整建议）

**免责声明：以上仅为生活方式建议，不构成医学诊断。如有不适请就医。**`;

    case 'daily':
      return `用户回答了"今天最重要的一件事是什么？"

用户的回答：${inputs.answer || '未回答'}

请用2-3句话给一个简短、有力的回应。像老大哥一样鼓励或点醒他。不要太长。`;

    default:
      return inputs.message || '你好老哥';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, inputs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const userPrompt = buildToolPrompt(tool, inputs || {});

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
