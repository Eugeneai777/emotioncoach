import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 解析请求体获取用户本地时间
    let localHour: number | null = null;
    let timezone: string | null = null;
    try {
      const body = await req.json();
      localHour = typeof body.localHour === 'number' ? body.localHour : null;
      timezone = typeof body.timezone === 'string' ? body.timezone : null;
    } catch {
      // body 解析失败，使用 fallback
    }

    // Fallback: 如果前端未传时间，使用 UTC+8
    if (localHour === null) {
      const now = new Date();
      localHour = (now.getUTCHours() + 8) % 24;
    }

    const timePeriod = localHour < 6 ? '深夜' : localHour < 12 ? '早上' : localHour < 18 ? '下午' : '晚上';

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

    // 获取最近2条用户发送的教练对话消息
    const { data: recentConversations } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2);

    let recentUserMessages: string[] = [];
    if (recentConversations && recentConversations.length > 0) {
      const convIds = recentConversations.map(c => c.id);
      const { data: msgs } = await supabaseClient
        .from('messages')
        .select('content')
        .in('conversation_id', convIds)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(3);
      if (msgs) {
        recentUserMessages = msgs.map(m => m.content).filter(Boolean);
      }
    }

    // 获取最近的呼吸练习记录
    const { data: breathingSessions } = await supabaseClient
      .from('breathing_sessions')
      .select('pattern_type, duration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    // 获取最近的训练营打卡进度
    const { data: campProgress } = await supabaseClient
      .from('camp_daily_progress')
      .select('progress_date, is_checked_in, emotion_logs_count, reflection_completed')
      .eq('user_id', user.id)
      .order('progress_date', { ascending: false })
      .limit(3);

    // 构建上下文
    const contextParts: string[] = [];

    // 时段信息（始终加入）
    contextParts.push(`用户当前本地时间: ${localHour}点 (${timePeriod})${timezone ? ` [${timezone}]` : ''}`);
    
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

    if (recentUserMessages.length > 0) {
      contextParts.push(`最近和教练说的话: ${recentUserMessages.join('; ')}`);
    }

    if (breathingSessions && breathingSessions.length > 0) {
      const s = breathingSessions[0];
      contextParts.push(`最近做了${Math.round(s.duration / 60)}分钟的呼吸练习`);
    }

    if (campProgress && campProgress.length > 0) {
      const checkedDays = campProgress.filter(p => p.is_checked_in).length;
      const emotionLogs = campProgress.reduce((sum, p) => sum + (p.emotion_logs_count || 0), 0);
      if (checkedDays > 0 || emotionLogs > 0) {
        contextParts.push(`最近${campProgress.length}天: 打卡${checkedDays}天, 情绪记录${emotionLogs}次`);
      }
    }

    // 如果没有任何有意义的数据（只有时段+用户名），返回 null 让前端使用默认欢迎语
    const meaningfulParts = contextParts.filter(p => !p.startsWith('用户当前本地时间') && !p.startsWith('用户名'));
    if (meaningfulParts.length === 0) {
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
