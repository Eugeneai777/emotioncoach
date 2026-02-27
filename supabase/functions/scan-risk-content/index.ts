import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 风险关键词库
const RISK_KEYWORDS: Record<string, { keywords: string[]; riskType: string; riskLevel: string }> = {
  self_harm: {
    keywords: ['不想活', '自杀', '自残', '割腕', '结束生命', '去死', '活不下去', '跳楼', '吃药自杀', '想死', '了结', '不想活了', '死了算了', '活着没意思'],
    riskType: 'self_harm',
    riskLevel: 'critical',
  },
  violence: {
    keywords: ['杀人', '打死', '砍死', '弄死', '报复', '炸掉'],
    riskType: 'violence',
    riskLevel: 'critical',
  },
  sensitive: {
    keywords: ['加我微信', '加微信', '联系方式', '私聊', '转账', '打钱', '汇款'],
    riskType: 'advertising',
    riskLevel: 'medium',
  },
  political: {
    keywords: ['翻墙', 'VPN', '法轮功', '六四'],
    riskType: 'political',
    riskLevel: 'high',
  },
};

interface ScanRequest {
  content: string;
  user_id: string;
  user_display_name?: string;
  content_source: string;    // ai_conversation, community_post, etc.
  source_detail?: string;    // e.g. "情绪教练语音对话"
  source_id?: string;
  platform?: string;
  page?: string;
}

interface RiskResult {
  detected: boolean;
  risk_type: string;
  risk_level: string;
  matched_keywords: string[];
  risk_score: number;
  ai_analysis?: string;
}

// 关键词扫描
function keywordScan(text: string): RiskResult | null {
  const normalizedText = text.toLowerCase();
  
  for (const [, config] of Object.entries(RISK_KEYWORDS)) {
    const matched = config.keywords.filter(kw => normalizedText.includes(kw));
    if (matched.length > 0) {
      // 计算风险评分：匹配越多分越高
      const score = Math.min(95, 60 + matched.length * 10);
      return {
        detected: true,
        risk_type: config.riskType,
        risk_level: config.riskLevel,
        matched_keywords: matched,
        risk_score: score,
      };
    }
  }
  return null;
}

// AI深度分析（仅对关键词命中的内容进一步分析，减少不必要的API调用）
async function aiAnalysis(text: string, keywordResult: RiskResult): Promise<RiskResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return keywordResult;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `你是一个内容安全审核专家。分析以下用户在AI情绪教练对话中的内容，判断是否存在真实风险。
注意区分：
1. 用户在倾诉情绪困扰 vs 真正有自伤意图
2. 用户随口说"想死""烦死了"等口语化表达 vs 具体的自伤计划
3. 用户在讨论话题 vs 用户本人有危险

关键词命中类型: ${keywordResult.risk_type}
关键词: ${keywordResult.matched_keywords.join(', ')}

请用JSON回复：
{
  "is_real_risk": true/false,
  "adjusted_level": "critical/high/medium/low",
  "reason": "简要说明判断依据",
  "risk_score": 0-100
}`
          },
          { role: "user", content: text.slice(0, 2000) }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`[scan-risk] AI analysis failed: ${response.status}`);
      return keywordResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleaned);
      
      return {
        ...keywordResult,
        risk_level: analysis.adjusted_level || keywordResult.risk_level,
        risk_score: analysis.risk_score ?? keywordResult.risk_score,
        ai_analysis: analysis.reason,
        detected: analysis.is_real_risk !== false, // 如果AI认为不是真实风险，标记为未检测
      };
    } catch {
      console.warn('[scan-risk] Failed to parse AI response, using keyword result');
      return keywordResult;
    }
  } catch (e) {
    console.error('[scan-risk] AI analysis error:', e);
    return keywordResult;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ScanRequest = await req.json();
    const { content, user_id, user_display_name, content_source, source_detail, source_id, platform, page } = body;

    if (!content || !user_id) {
      return new Response(JSON.stringify({ detected: false, error: "Missing content or user_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scan-risk] Scanning content for user ${user_id}, source: ${content_source}, length: ${content.length}`);

    // Step 1: 关键词扫描
    const keywordResult = keywordScan(content);
    
    if (!keywordResult) {
      console.log(`[scan-risk] No risk detected for user ${user_id}`);
      return new Response(JSON.stringify({ detected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scan-risk] ⚠️ Keyword hit: type=${keywordResult.risk_type}, level=${keywordResult.risk_level}, keywords=${keywordResult.matched_keywords.join(',')}`);

    // Step 2: AI二次分析（确认是否为真实风险）
    const finalResult = await aiAnalysis(content, keywordResult);

    if (!finalResult.detected) {
      console.log(`[scan-risk] AI determined no real risk (false positive) for user ${user_id}`);
      return new Response(JSON.stringify({ detected: false, reason: finalResult.ai_analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scan-risk] 🚨 Risk confirmed: type=${finalResult.risk_type}, level=${finalResult.risk_level}, score=${finalResult.risk_score}`);

    // Step 3: 写入 monitor_risk_content 表
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contentPreview = content.slice(0, 200) + (content.length > 200 ? '...' : '');

    const { error: insertError } = await supabase.from('monitor_risk_content').insert({
      user_id,
      user_display_name: user_display_name || null,
      content_text: content.slice(0, 5000),
      content_preview: contentPreview,
      content_source,
      source_detail: source_detail || content_source,
      source_id: source_id || `auto_${Date.now()}`,
      platform: platform || 'web',
      page: page || '',
      risk_type: finalResult.risk_type,
      risk_level: finalResult.risk_level,
      risk_score: finalResult.risk_score,
      risk_keywords: finalResult.matched_keywords,
      detection_method: 'ai',
      status: 'pending',
    });

    if (insertError) {
      console.error('[scan-risk] Failed to insert risk record:', insertError);
    } else {
      console.log(`[scan-risk] ✅ Risk record saved to monitor_risk_content`);
    }

    return new Response(JSON.stringify({
      detected: true,
      risk_type: finalResult.risk_type,
      risk_level: finalResult.risk_level,
      risk_score: finalResult.risk_score,
      matched_keywords: finalResult.matched_keywords,
      ai_analysis: finalResult.ai_analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[scan-risk] Error:", error);
    return new Response(
      JSON.stringify({ detected: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
