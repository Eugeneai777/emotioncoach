import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { directPrompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!directPrompt?.trim()) throw new Error("请输入测评需求描述");

    const prompt = `你是一位专业的心理测评设计专家。请基于以下需求，生成一个完整的测评模板配置：

**用户需求：**
${directPrompt}

**请生成以下内容（必须返回有效的JSON格式）：**

1. **基础信息：**
   - assessment_key: 英文小写+下划线格式的唯一标识（如 workplace_burnout）
   - emoji: 一个合适的emoji表情
   - title: 简洁的中文标题（4-8字）
   - subtitle: 一句话描述（10-20字）
   - description: 详细描述（30-60字）
   - gradient: Tailwind渐变类名（如 'from-purple-500 to-pink-500'）

2. **维度定义（dimensions数组，3-6个维度）：**
每个维度包含：
   - key: 英文标识
   - label: 中文名称（2-4字）
   - emoji: emoji图标
   - description: 简要描述（10-20字）
   - maxScore: 该维度满分（通常为12-18）

3. **题目（questions数组，15-25题）：**
每道题包含：
   - id: 数字编号（从1开始）
   - dimension: 对应维度的key
   - text: 题目文本（15-40字）
   - positive: 布尔值，true表示正向计分
   - options: 选项数组，每个选项包含 { label: "选项文字", score: 分数(0-4) }

4. **结果模式（result_patterns数组，3-5个模式）：**
每个模式包含：
   - type: 英文标识
   - label: 中文名称（3-6字）
   - emoji: emoji表情
   - description: 描述（20-40字）
   - scoreRange: { min: 最低百分比, max: 最高百分比 }（如 {min: 0, max: 30}）
   - traits: 特征描述数组（2-3条）
   - tips: 建议数组（2-3条）

5. **AI分析提示词（ai_insight_prompt）：**
   - 一段200-300字的system prompt，用于AI根据用户答题结果生成个性化分析
   - 要求使用劲老师的温暖风格

6. **评分逻辑说明（scoring_logic）：**
   - 一段50-100字的文本，说明如何根据得分判断结果模式

**重要：必须返回严格的JSON格式，不要包含任何markdown标记或额外说明文字。**`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "你是专业的心理测评设计专家。请严格按照要求返回JSON格式的配置数据。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;
    if (!aiContent) throw new Error("No content in AI response");

    let cleanedContent = aiContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let templateConfig;
    try {
      templateConfig = JSON.parse(cleanedContent);
    } catch {
      console.error('JSON Parse Error, content:', cleanedContent);
      throw new Error('AI返回的内容格式不正确');
    }

    return new Response(
      JSON.stringify({ success: true, template: templateConfig }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
