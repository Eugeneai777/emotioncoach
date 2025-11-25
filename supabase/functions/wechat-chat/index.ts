import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, openid, history = [] } = await req.json();
    
    if (!message || !openid) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数: message 和 openid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[微信聊天] 用户 ${openid} 发送消息: ${message}`);

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
5. 回复控制在 200 字以内，避免过长

当前对话用户的微信 OpenID: ${openid}`
      },
      ...history.map((msg: any) => ({
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

    console.log(`[微信聊天] AI 回复: ${reply.substring(0, 100)}...`);

    return new Response(
      JSON.stringify({ 
        reply: reply.trim(),
        success: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[微信聊天] 错误:', error);
    return new Response(
      JSON.stringify({ 
        reply: "抱歉，服务出现异常，请稍后再试 🙏",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
