import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ greeting: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ greeting: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 获取用户名称
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '';

    // 获取最近3条感恩日记
    const { data: gratitudeEntries } = await supabaseClient
      .from('gratitude_entries')
      .select('content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 获取最近1条情绪简报
    const { data: conversations } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    let latestBriefing = null;
    if (conversations && conversations.length > 0) {
      const { data: briefing } = await supabaseClient
        .from('briefings')
        .select('emotion_theme, insight')
        .eq('conversation_id', conversations[0].id)
        .single();
      latestBriefing = briefing;
    }

    // 获取最近的社区帖子
    const { data: recentPosts } = await supabaseClient
      .from('community_posts')
      .select('content, emotion_theme, insight')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2);

    // 构建上下文
    const contextParts: string[] = [];
    
    if (userName) {
      contextParts.push(`用户名: ${userName}`);
    }

    if (gratitudeEntries && gratitudeEntries.length > 0) {
      const gratitudeTexts = gratitudeEntries.map(e => e.content).join('; ');
      contextParts.push(`最近的感恩日记: ${gratitudeTexts}`);
    }

    if (latestBriefing) {
      contextParts.push(`最近情绪: ${latestBriefing.emotion_theme || ''}, 洞察: ${latestBriefing.insight || ''}`);
    }

    if (recentPosts && recentPosts.length > 0) {
      const postTexts = recentPosts.map(p => p.content || p.insight || p.emotion_theme).filter(Boolean).join('; ');
      if (postTexts) {
        contextParts.push(`最近分享: ${postTexts}`);
      }
    }

    // 如果没有任何数据，返回 null 让前端使用默认欢迎语
    if (contextParts.length === 0 || (contextParts.length === 1 && userName)) {
      return new Response(JSON.stringify({ greeting: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userContext = contextParts.join('\n');

    // 调用 Lovable AI 生成个性化欢迎语
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ greeting: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `你是一个温暖、关心用户的AI助手。根据用户最近的日记、情绪和分享内容，生成一句简短的个性化欢迎语。

要求：
1. 15-30个字以内
2. 温柔、关怀、有连结感
3. 可以提及用户最近关注的事物或情绪
4. 不要使用"您"，用"你"
5. 如果有用户名，可以亲切地称呼
6. 语气自然，像老朋友问候
7. 只输出欢迎语本身，不要任何解释

示例风格：
- "嗨小红，最近的阳光好像照进了你心里呢"
- "看到你记录的那些美好，今天也要好好的哦"
- "最近在思考很多呢，累了就歇歇吧"`;

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
          { role: "user", content: `用户信息:\n${userContext}\n\n请生成一句温暖的个性化欢迎语:` }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status, await response.text());
      return new Response(JSON.stringify({ greeting: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const greeting = data.choices?.[0]?.message?.content?.trim();

    console.log("Generated greeting:", greeting);

    return new Response(JSON.stringify({ greeting: greeting || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-greeting:", error);
    return new Response(JSON.stringify({ greeting: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
