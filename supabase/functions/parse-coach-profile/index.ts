import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // 🔒 admin-only
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: user.id, _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "仅管理员可使用" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "请粘贴教练资料文本" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY 未配置");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "你是结构化信息抽取助手。从中文教练资料文本中抽取字段，调用工具 extract_coach 返回结果。未识别的字段返回空串/0/空数组。手机号只保留 11 位数字（去掉 +86 和空格）。experience_years 是整数。specialties 是 3-8 个简短中文标签，例如「亲子关系」「情绪管理」「职场压力」。bio 是清洗后的简介段落，去掉姓名/手机号等敏感原文重复。",
          },
          { role: "user", content: text.slice(0, 4000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_coach",
            description: "返回提取出的教练结构化信息",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                title: { type: "string" },
                experience_years: { type: "integer" },
                specialties: { type: "array", items: { type: "string" } },
                bio: { type: "string" },
              },
              required: ["name", "phone", "title", "experience_years", "specialties", "bio"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_coach" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("[parse-coach-profile] AI gateway error:", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "AI 调用频率过高，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用尽，请在工作区充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI 解析失败");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) throw new Error("AI 未返回结构化数据");
    const parsed = JSON.parse(argsStr);

    // 清洗
    const cleanPhone = String(parsed.phone || "").replace(/\D/g, "").slice(0, 11);
    const data = {
      name: String(parsed.name || "").trim(),
      phone: cleanPhone,
      title: String(parsed.title || "").trim(),
      experience_years: Number.isFinite(Number(parsed.experience_years))
        ? Math.max(0, Math.min(80, Math.floor(Number(parsed.experience_years))))
        : 0,
      specialties: Array.isArray(parsed.specialties)
        ? parsed.specialties.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 12)
        : [],
      bio: String(parsed.bio || "").trim(),
    };

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[parse-coach-profile] error:", e);
    return new Response(JSON.stringify({ error: e?.message || "解析失败" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
