import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { conversation, session_id, coach_type = 'wealth' } = await req.json();

    if (!conversation || !Array.isArray(conversation)) {
      return new Response(JSON.stringify({ error: 'Conversation array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🧠 extract-coach-memory: coach_type=${coach_type}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build conversation text for analysis
    const conversationText = conversation
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => `${m.role === 'user' ? '用户' : '教练'}: ${m.content}`)
      .join('\n');

    const coachLabels: Record<string, string> = {
      wealth: '财富教练',
      emotion: '情绪教练',
      parent: '亲子教练',
      vibrant_life: '生活教练',
      vibrant_life_sage: '生活教练',
      teen: '青少年教练',
      communication: '沟通/婚姻教练',
      gratitude: '感恩教练',
    };

    const systemPrompt = `你是一个专门提取对话中重要长期记忆的分析师。
    
你的任务是从${coachLabels[coach_type] || 'AI教练'}语音/文字对话中提取用户的重要信息和觉察，这些内容会在未来同类教练对话中使用。

提取标准：
1. 用户刚刚明确分享的事件、困扰、关系对象、工作/家庭背景
2. 用户自己表达出的"原来是这样"的顿悟
3. 用户识别出的具体行为/情绪/信念模式
4. 用户承诺要做的改变或行动
5. 反复出现的卡点或模式

不要提取：
- 教练说的话（除非用户明确认同）
- 泛泛的陈述
- 问候语或客套话

请返回JSON格式：
{
  "memories": [
    {
      "content": "具体、可在下次对话中自然引用的记忆，使用用户原话或简洁改写，40字以内",
      "memory_type": "insight/pattern/milestone/sticking_point/awakening",
      "layer": "behavior/emotion/belief",
      "importance_score": 5-10的评分
    }
  ]
}

memory_type说明：
- insight: 用户的顿悟或理解
- pattern: 用户识别出的行为/思维模式
- milestone: 重要的突破或成就
- sticking_point: 用户反复出现的卡点
- awakening: 觉醒时刻

至少提取1条可用于下次续聊的基础记忆，除非整段对话只有问候/噪声/无意义内容。最多返回3条最重要的记忆。`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请分析以下对话并提取重要觉察：\n\n${conversationText}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ memories: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON from response
    let parsedContent;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ memories: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const memories = parsedContent.memories || [];
    
    console.log(`🔄 extract-coach-memory: user=${user.id}, session=${session_id}, 提取到 ${memories.length} 条`);
    
    if (memories.length === 0) {
      return new Response(JSON.stringify({ memories: [], saved: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save memories to database using service role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 查询现有记忆进行去重（按教练类型）
    const { data: existingMemories } = await serviceClient
      .from('user_coach_memory')
      .select('content')
      .eq('user_id', user.id)
      .eq('coach_type', coach_type);
    
    // 过滤已存在的相似记忆（简单文本匹配）
    const uniqueMemories = memories.filter((m: any) => {
      const newContentPrefix = m.content.slice(0, 20);
      const isDuplicate = existingMemories?.some((e: any) => 
        e.content.includes(newContentPrefix) || 
        m.content.includes(e.content.slice(0, 20))
      );
      if (isDuplicate) {
        console.log(`⏭️ 跳过重复记忆: ${m.content.slice(0, 30)}...`);
      }
      return !isDuplicate;
    });
    
    if (uniqueMemories.length === 0) {
      console.log('ℹ️ 所有记忆已存在，无需保存');
      return new Response(JSON.stringify({ memories: [], saved: 0, skipped: memories.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const memoriesToInsert = uniqueMemories.slice(0, 3).map((m: any) => ({
      user_id: user.id,
      content: m.content,
      memory_type: m.memory_type || 'insight',
      layer: m.layer || null,
      source_session_id: session_id || null,
      importance_score: Math.min(10, Math.max(1, m.importance_score || 5)),
      coach_type: coach_type,
    }));

    const { data: savedMemories, error: insertError } = await serviceClient
      .from('user_coach_memory')
      .insert(memoriesToInsert)
      .select();

    if (insertError) {
      console.error('Failed to save memories:', insertError);
      throw insertError;
    }

    console.log(`✅ 保存了 ${savedMemories?.length || 0} 条教练记忆`);

    return new Response(JSON.stringify({
      memories: savedMemories,
      saved: savedMemories?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting coach memory:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
