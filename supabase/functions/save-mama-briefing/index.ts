import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '身份验证失败' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages, chatType } = await req.json();
    const type = chatType === 'gratitude' ? 'gratitude' : 'emotion';
    
    if (!messages || messages.length < 2) {
      return new Response(JSON.stringify({ error: '对话太短，无需保存' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use AI to extract emotion summary from conversation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const conversationText = messages
      .map((m: any) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`)
      .join('\n');

    const extractionPrompt = type === 'gratitude'
      ? `请从以下宝妈AI教练对话中提取感恩日记摘要信息。

对话内容：
${conversationText}

请用以下JSON格式返回（不要包含markdown代码块标记）：
{
  "emotion_theme": "用一句简短的话概括用户感恩的核心内容（10-20字）",
  "emotion_intensity": 1到5的整数，表示感恩的深度（1=日常小事，5=深刻感悟），
  "insight": "从对话中提炼的一个关于感恩的洞察（30-60字）",
  "action": "一个具体可行的感恩行动建议（20-40字）"
}`
      : `请从以下宝妈AI教练对话中提取情绪摘要信息。

对话内容：
${conversationText}

请用以下JSON格式返回（不要包含markdown代码块标记）：
{
  "emotion_theme": "用一句简短的话概括用户的核心情绪或话题（10-20字）",
  "emotion_intensity": 1到5的整数，表示情绪强度（1=轻微，5=强烈），
  "insight": "从对话中提炼的一个关键洞察（30-60字）",
  "action": "一个具体可行的行动建议（20-40字）"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: '你是一个情绪分析助手，擅长从对话中提取情绪主题和洞察。只返回JSON，不要其他内容。' },
          { role: 'user', content: extractionPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI extraction failed:', aiResponse.status);
      throw new Error('AI提取失败');
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON, strip possible markdown code fences
    const jsonStr = rawContent.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    let extracted: any;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', rawContent);
      extracted = {
        emotion_theme: '宝妈日常聊天',
        emotion_intensity: 2,
        insight: null,
        action: null,
      };
    }

    const theme = extracted.emotion_theme || '宝妈日常聊天';

    // Create conversation record
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: `[宝妈AI] ${theme}`
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      throw convError;
    }

    // Create briefing record
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .insert({
        conversation_id: conversation.id,
        emotion_theme: theme,
        emotion_intensity: extracted.emotion_intensity || null,
        insight: extracted.insight || null,
        action: extracted.action || null,
      })
      .select()
      .single();

    if (briefingError) {
      console.error('Error creating briefing:', briefingError);
      throw briefingError;
    }

    // Tag with "宝妈AI" tag
    let { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', '宝妈AI')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingTag) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name: '宝妈AI', user_id: user.id, color: '#F4845F' })
        .select('id')
        .single();
      existingTag = newTag;
    }

    if (existingTag) {
      await supabase
        .from('briefing_tags')
        .insert({ briefing_id: briefing.id, tag_id: existingTag.id });
    }

    console.log('Saved mama briefing:', briefing.id, 'for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, briefing_id: briefing.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error saving mama briefing:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
