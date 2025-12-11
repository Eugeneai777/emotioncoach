import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per openid

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(openid: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(openid);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(openid, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

// Input validation
function validateInput(data: unknown): { valid: boolean; error?: string; parsed?: { message: string; openid: string; history: Array<{ role: string; content: string }> } } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '无效的请求格式' };
  }
  
  const { message, openid, history } = data as Record<string, unknown>;
  
  // Validate openid
  if (!openid || typeof openid !== 'string') {
    return { valid: false, error: '缺少必要参数: openid' };
  }
  if (openid.length < 10 || openid.length > 128) {
    return { valid: false, error: '无效的 openid 格式' };
  }
  // Basic openid format check (alphanumeric and some special chars)
  if (!/^[a-zA-Z0-9_-]+$/.test(openid)) {
    return { valid: false, error: '无效的 openid 格式' };
  }
  
  // Validate message
  if (!message || typeof message !== 'string') {
    return { valid: false, error: '缺少必要参数: message' };
  }
  if (message.length === 0) {
    return { valid: false, error: '消息不能为空' };
  }
  if (message.length > 2000) {
    return { valid: false, error: '消息长度不能超过2000字符' };
  }
  
  // Validate history (optional)
  let validatedHistory: Array<{ role: string; content: string }> = [];
  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return { valid: false, error: 'history 必须是数组' };
    }
    if (history.length > 20) {
      return { valid: false, error: '对话历史不能超过20条' };
    }
    
    for (const item of history) {
      if (!item || typeof item !== 'object') {
        return { valid: false, error: '无效的历史记录格式' };
      }
      const { role, content } = item as Record<string, unknown>;
      if (typeof role !== 'string' || !['user', 'assistant'].includes(role)) {
        return { valid: false, error: '无效的历史记录角色' };
      }
      if (typeof content !== 'string' || content.length > 2000) {
        return { valid: false, error: '无效的历史记录内容' };
      }
      validatedHistory.push({ role, content });
    }
  }
  
  return { 
    valid: true, 
    parsed: { 
      message: message.trim(), 
      openid: openid.trim(), 
      history: validatedHistory 
    } 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: '无效的 JSON 格式' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const validation = validateInput(rawBody);
    if (!validation.valid || !validation.parsed) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { message, openid, history } = validation.parsed;
    
    // Check rate limit
    const rateLimit = checkRateLimit(openid);
    if (!rateLimit.allowed) {
      console.log(`[微信聊天] 用户 ${openid} 触发速率限制`);
      return new Response(
        JSON.stringify({ 
          reply: "您发送消息太频繁了，请稍后再试 😊",
          error: "rate_limit"
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
          } 
        }
      );
    }

    console.log(`[微信聊天] 用户 ${openid.substring(0, 8)}*** 发送消息 (剩余配额: ${rateLimit.remaining})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY 未配置");
    }

    // 构建对话历史
    const messages = [
      {
        role: "system",
        content: `你是一个友好的AI助手，通过微信与用户交流。
请遵循以下原则：
1. 回复简洁明了，适合微信短消息阅读
2. 语气亲切自然，像朋友聊天一样
3. 如果用户问题复杂，可以分步骤回答
4. 对于情感类问题，给予温暖的支持和建议
5. 回复控制在 200 字以内，避免过长`
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    // 调用 Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        stream: false,
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI Gateway 错误 [${aiResponse.status}]:`, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            reply: "抱歉，服务繁忙中，请稍后再试 😊",
            error: "rate_limit"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            reply: "服务暂时不可用，请稍后再试 🙏",
            error: "payment_required"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          reply: "抱歉，我遇到了一些问题，请稍后再试 😅",
          error: "ai_error"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "抱歉，我没有理解您的问题，能再说一遍吗？";

    console.log(`[微信聊天] AI 回复成功`);

    return new Response(
      JSON.stringify({ 
        reply: reply.trim(),
        success: true
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        } 
      }
    );

  } catch (error) {
    console.error('[微信聊天] 错误:', error);
    return new Response(
      JSON.stringify({ 
        reply: "抱歉，服务出现异常，请稍后再试 🙏",
        error: "internal_error"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
