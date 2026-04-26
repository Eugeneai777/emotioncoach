import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type SourceType = 'mini-scenes' | 'daily-tools' | 'assessments' | 'conversion';
type Style = 'xiaohongshu' | 'douyin' | 'empathy' | 'assessment';

const SOURCE_LABELS: Record<SourceType, string> = {
  'mini-scenes': '/mini-app 场景',
  'daily-tools': '日常工具',
  assessments: '专业测评',
  conversion: '训练营/产品转化',
};

const STYLE_LABELS: Record<Style, string> = {
  xiaohongshu: '小红书种草',
  douyin: '抖音口播',
  empathy: '情绪共鸣',
  assessment: '测评转化',
};

const SYSTEM_PROMPT = `你是有劲AI增长内容总监，擅长把心理测评、AI教练、训练营、生活工具拆成适合短视频矩阵发布的选题。

你必须返回严格 JSON，不要 markdown，不要额外说明。结构：
{
  "items": [
    {
      "painPoint": "具体痛点，必须像用户真实自述，不超过36字",
      "value": "产品/工具能提供的核心价值，不超过42字",
      "matchedTool": "搭配测评/工具/训练营名称",
      "aiReportValue": "AI分析报告能额外看见什么，不超过50字",
      "viralTitle": "小红书爆款标题，18-32字，强钩子但不夸大",
      "hook": "短视频开场白，适合3秒内说完",
      "cta": "自然行动号召",
      "route": "推荐入口路径",
      "topicId": "可选主题ID",
      "productId": "可选转化产品ID"
    }
  ]
}

内容要求：
- 业务目标不是直接卖产品，而是通过“限时赠送”让用户愿意加企业微信/进入私域。
- 赠送内容必须从用户视角写，一眼就知道“我能得到什么”，不要写成内部功能名堆砌。
- 每条必须清楚表达三类可赠送价值：1）搭配测评/工具；2）AI分析报告附加价值；3）AI教练报告分析。
- matchedTool 不要只写“财富卡点测评”，要写成“免费领1份财富卡点测评，定位你存不下钱的核心信念”。
- aiReportValue 要写用户得到的结果，例如“报告会告诉你：你是哪种内耗型赚钱模式”。
- coachReportValue 要写进一步解释和行动建议，例如“AI教练会拆解你的卡点，并给3条接下来7天可执行动作”。
- cta 必须服务私域转化，例如“加企微回复‘测评’，领取你的AI报告”。
- 必须围绕用户提供的有劲AI功能和种子内容生成，不要编造不存在的产品名。
- 不做医疗诊断承诺，不说治愈、保证、立刻解决。
- 每条选题要能直接拍成一条短视频。
- 标题要有小红书风格：反常识、真实场景、强共鸣、可收藏。
- 如果是测评类，强调“看见模式/定位卡点/获得报告”，不要夸大成诊断。`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampCount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 10;
  return Math.max(5, Math.min(30, Math.round(n)));
}

function extractJson(content: string) {
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('AI返回格式异常');
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const audience = typeof body.audience === 'string' ? body.audience : '通用';
    const sourceType = (['mini-scenes', 'daily-tools', 'assessments', 'conversion'].includes(body.sourceType) ? body.sourceType : 'mini-scenes') as SourceType;
    const style = (['xiaohongshu', 'douyin', 'empathy', 'assessment'].includes(body.style) ? body.style : 'xiaohongshu') as Style;
    const count = clampCount(body.count);
    const seedItems = Array.isArray(body.seedItems) ? body.seedItems.slice(0, 60) : [];

    const userPrompt = `请生成 ${count} 条短视频选题库。

目标人群：${audience}
内容来源：${SOURCE_LABELS[sourceType]}
内容风格：${STYLE_LABELS[style]}

可用功能/产品种子：
${JSON.stringify(seedItems, null, 2)}

请严格返回 JSON。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "AI请求频率超限，请稍后重试" }, 429);
      if (response.status === 402) return jsonResponse({ error: "AI额度不足，请补充 Lovable AI 用量后重试" }, 402);
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return jsonResponse({ error: "AI服务异常，请稍后重试" }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);

    if (!Array.isArray(parsed.items)) return jsonResponse({ error: "AI返回缺少 items 列表" }, 500);

    return jsonResponse({
      items: parsed.items.slice(0, count).map((item: any, index: number) => ({
        painPoint: String(item.painPoint || '').slice(0, 120),
        value: String(item.value || '').slice(0, 140),
        matchedTool: String(item.matchedTool || '').slice(0, 80),
        aiReportValue: String(item.aiReportValue || '').slice(0, 180),
        coachReportValue: String(item.coachReportValue || item.coachReportAnalysis || '').slice(0, 180),
        viralTitle: String(item.viralTitle || '').slice(0, 80),
        hook: String(item.hook || '').slice(0, 120),
        cta: String(item.cta || '').slice(0, 80),
        route: typeof item.route === 'string' ? item.route : '',
        topicId: typeof item.topicId === 'string' ? item.topicId : '',
        productId: typeof item.productId === 'string' ? item.productId : '',
        id: `ai-${Date.now()}-${index}`,
      })),
    });
  } catch (e) {
    console.error("mini-app-content-ai error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "未知错误" }, 500);
  }
});
