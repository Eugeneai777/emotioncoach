import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { reviewType, startDate, endDate } = await req.json();

    console.log('Generating review:', { reviewType, startDate, endDate, userId: user.id });

    // 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || '朋友';

    // 获取时间范围内的所有简报
    const { data: briefings, error: briefingsError } = await supabase
      .from('briefings')
      .select(`
        *,
        conversations!inner(id, user_id, created_at)
      `)
      .eq('conversations.user_id', user.id)
      .gte('conversations.created_at', startDate)
      .lte('conversations.created_at', endDate)
      .order('created_at', { ascending: true, foreignTable: 'conversations' });

    if (briefingsError) {
      console.error('Error fetching briefings:', briefingsError);
      throw briefingsError;
    }

    console.log(`Found ${briefings?.length || 0} briefings for review`);

    if (!briefings || briefings.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'no_data',
          message: '该时间段内没有情绪记录' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取所有标签
    const briefingIds = briefings.map(b => b.id);
    const { data: briefingTags } = await supabase
      .from('briefing_tags')
      .select(`
        briefing_id,
        tags!inner(name, color)
      `)
      .in('briefing_id', briefingIds);

    // 整理数据
    const briefingsWithTags = briefings.map(b => ({
      ...b,
      tags: briefingTags
        ?.filter(bt => bt.briefing_id === b.id)
        .map(bt => {
          const tag = bt.tags as any;
          return Array.isArray(tag) ? tag[0]?.name : tag?.name || '';
        })
        .filter(Boolean) || []
    }));

    // 构建 AI 提示词
    const timeRangeText = reviewType === 'weekly' ? '本周' : '本月';
    const prompt = `请根据以下情绪梳理记录，生成一份温暖且有洞察力的${timeRangeText}情绪复盘报告。

情绪记录数据：
${briefingsWithTags.map((b, idx) => `
【记录 ${idx + 1}】
日期：${new Date(b.conversations.created_at).toLocaleDateString('zh-CN')}
主题情绪：${b.emotion_theme}
情绪强度：${b.emotion_intensity || '未记录'}/10
标签：${b.tags.join('、') || '无'}
洞察：${b.insight || '未记录'}
行动：${b.action || '未记录'}
`).join('\n')}

请生成包含以下部分的复盘报告（使用emoji装饰，语气温暖）：

重要格式要求：
- 不要使用任何markdown格式符号（**、*、###等）
- 直接使用文字和emoji来组织内容
- 称呼用户为"亲爱的${userName}"

1. 📊 整体情绪概览（30-50字）
   - 总结${timeRangeText}的情绪变化趋势和主要特征

2. 🌟 成长亮点（3-5个要点）
   - 识别用户在情绪管理上的进步
   - 突出具体的成长表现

3. 💎 核心洞察（2-3个深度洞察）
   - 发现情绪模式背后的深层原因
   - 提供有价值的自我认知

4. 🎯 下阶段建议（2-3条具体建议）
   - 基于数据给出可执行的建议
   - 帮助用户继续成长

5. 💬 劲老师寄语（1段话）
   - 温暖鼓励的话语
   - 肯定用户的努力和成长
   - 以"亲爱的${userName}"开头

保持劲老师的温柔、陪伴式风格，强调成长与自我接纳。`;

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: '你是劲老师，一位温柔的情绪梳理教练。你的语气温暖、有共情力，善于发现用户的成长和进步。' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('AI服务请求过于频繁，请稍后再试');
      } else if (aiResponse.status === 402) {
        throw new Error('AI服务额度不足，请联系管理员');
      }
      
      throw new Error('AI服务暂时不可用');
    }

    const aiData = await aiResponse.json();
    const reviewContent = aiData.choices[0].message.content;

    console.log('Review generated successfully');

    return new Response(
      JSON.stringify({ 
        review: reviewContent,
        briefingsCount: briefings.length,
        dateRange: { startDate, endDate }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-emotion-review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
