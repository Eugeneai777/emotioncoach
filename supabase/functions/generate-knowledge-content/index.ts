import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { docType, docTypeLabel, coachKey, coachName, campType, packageKey, partnerLevel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context description
    let contextDesc = "";
    let productType = "";
    
    if (packageKey) {
      productType = "会员套餐";
      contextDesc = `套餐类型: ${packageKey === 'basic' ? '尝鲜会员(¥9.9, 50点数)' : '365会员(¥365, 1000点数)'}`;
    } else if (partnerLevel) {
      productType = "合伙人等级";
      const levelMap: Record<string, string> = {
        'bloom': '绽放计划(免费入门)',
        'L1': '初级合伙人(¥792, 20%佣金)',
        'L2': '高级合伙人(¥3217, 35%佣金)',
        'L3': '钻石合伙人(¥4950, 50%佣金+10%二级)'
      };
      contextDesc = `合伙人等级: ${levelMap[partnerLevel] || partnerLevel}`;
    } else if (campType) {
      productType = "训练营";
      contextDesc = `训练营类型: ${campType}`;
    } else if (coachKey) {
      productType = "AI教练";
      const coachMap: Record<string, string> = {
        'emotion': '情绪教练 - 基于情绪四部曲(觉察/理解/反应/转化)帮助用户梳理情绪',
        'parent': '亲子教练 - 帮助父母处理育儿过程中的情绪和沟通问题',
        'communication': '沟通教练 - 基于卡耐基方法帮助用户提升沟通技巧',
        'gratitude': '感恩教练 - 引导用户发现日常感恩,培养积极心态',
        'vibrant_life': '有劲生活教练 - 作为总入口,智能引导用户到合适的教练和工具'
      };
      contextDesc = coachMap[coachKey] || `教练类型: ${coachKey}`;
    }

    // Build doc type specific instructions
    const docTypeInstructions: Record<string, string> = {
      'intro': '生成产品/功能介绍文档,包括核心价值、主要功能、适用人群',
      'faq': '生成常见问题解答,包括5-8个用户最可能问的问题及详细回答',
      'usage_guide': '生成使用指南,包括入门步骤、核心功能使用方法、注意事项',
      'scenarios': '生成使用场景说明,描述3-5个典型使用场景和预期效果',
      'benefits': '生成权益/优势说明,详细列出用户能获得的具体价值',
      'pricing': '生成定价说明,解释价格构成、性价比、与其他选项的对比',
      'troubleshooting': '生成问题排查指南,列出常见问题及解决方案'
    };

    const systemPrompt = `你是有劲AI的知识库内容专家。你需要为AI客服系统生成专业、准确、有帮助的知识库文档。

产品背景:
- 有劲AI是一个情绪管理和心理成长平台
- 核心产品包括:情绪按钮(9种情绪×32条认知提醒)、AI教练(情绪/亲子/沟通/感恩)、训练营、会员套餐、合伙人计划
- 目标用户:需要情绪支持和心理疏导的人群
- 品牌调性:温暖、专业、陪伴、成长

生成要求:
1. 内容要准确反映产品实际功能和价值
2. 语气温暖专业,避免过度营销
3. 结构清晰,便于AI客服检索和回答用户问题
4. 包含具体的数据和细节(如价格、功能点数等)
5. 关键词要覆盖用户可能的搜索词`;

    const userPrompt = `请为以下产品生成${docTypeLabel}文档:

产品类型: ${productType}
${contextDesc}
产品/功能名称: ${coachName}

文档类型要求: ${docTypeInstructions[docType] || '生成详细的产品说明文档'}

请按以下格式输出:
---
标题: [简洁明了的文档标题]
关键词: [关键词1, 关键词2, 关键词3, ...] (5-10个)
内容:
[详细的文档内容,使用清晰的段落和列表组织]
---`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    // Parse the generated content
    let title = `${coachName} - ${docTypeLabel}`;
    let keywords: string[] = [];
    let content = generatedText;

    // Try to extract structured data
    const titleMatch = generatedText.match(/标题[:：]\s*(.+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    const keywordsMatch = generatedText.match(/关键词[:：]\s*\[?([^\]\n]+)\]?/);
    if (keywordsMatch) {
      keywords = keywordsMatch[1].split(/[,，]/).map((k: string) => k.trim()).filter(Boolean);
    }

    const contentMatch = generatedText.match(/内容[:：]\s*([\s\S]+?)(?:---|$)/);
    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // If no structured content found, use everything after keywords
      const afterKeywords = generatedText.replace(/标题[:：].+\n?/, '').replace(/关键词[:：].+\n?/, '');
      if (afterKeywords.trim()) {
        content = afterKeywords.trim();
      }
    }

    return new Response(
      JSON.stringify({ 
        title, 
        keywords, 
        content,
        raw: generatedText 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
