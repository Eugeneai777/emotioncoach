import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, ...params } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "optimize_bio") {
      const { displayName, specialties, yearsExperience, bio } = params;
      systemPrompt = "你是一位专业的教练简介优化专家。你的任务是将教练的自我介绍优化为更专业、更有权威感和信任感的版本。要求：1) 保留原始信息的核心内容 2) 使用专业但不生硬的语言 3) 突出专业背景和独特优势 4) 控制在300字以内 5) 直接输出优化后的简介文本，不要添加任何解释或前缀。";
      userPrompt = `请优化以下教练简介：
姓名：${displayName}
擅长领域：${specialties?.join("、") || "未填写"}
从业年限：${yearsExperience || 0}年
原始简介：${bio}`;
    } else if (action === "generate_cert_description") {
      const { certType, certName, issuingAuthority } = params;
      systemPrompt = "你是一位专业资质描述撰写专家。根据证书信息生成一段简洁、专业的证书说明文字，突出该证书的权威性和持有者的专业能力。要求：1) 控制在100字以内 2) 直接输出描述文本，不要添加任何解释或前缀。";
      const certTypeMap: Record<string, string> = {
        psychological_counselor: "心理咨询师",
        marriage_counselor: "婚姻家庭咨询师",
        education: "学历证书",
        training: "培训证书",
        other: "其他资质",
      };
      userPrompt = `证书类型：${certTypeMap[certType] || certType}
证书名称：${certName}
颁发机构：${issuingAuthority || "未填写"}`;
    } else if (action === "recommend_badge") {
      const { basicInfo, certifications, services } = params;
      systemPrompt = `你是一位教练平台的资质评估专家。根据教练申请信息推荐一个初始勋章等级。
可选勋章：
- new：新人教练，刚入驻平台
- certified：认证教练，有基本资质认证
- preferred：优选教练，有丰富经验和多项认证
- gold：金牌教练，顶级资质和丰富经验

请用JSON格式返回（不要用markdown代码块包裹）：{"badge":"勋章类型","reason":"推荐理由（50字以内）"}`;
      userPrompt = `教练信息：
姓名：${basicInfo.displayName}
从业年限：${basicInfo.yearsExperience}年
擅长领域：${basicInfo.specialties?.join("、")}
简介：${basicInfo.bio}
资质证书数量：${certifications?.length || 0}
证书详情：${certifications?.map((c: any) => `${c.certName}(${c.issuingAuthority || "未知机构"})`).join("、") || "无"}
服务项目数量：${services?.length || 0}`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 服务额度不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks
    content = content.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach-application error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
