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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body with error handling
    let tagIds: string[] | undefined;
    try {
      const body = await req.text();
      if (body && body.trim().length > 0) {
        const parsed = JSON.parse(body);
        tagIds = parsed.tagIds;
      }
    } catch (parseError) {
      console.log('No valid JSON body provided, will process all unclassified tags');
    }

    console.log(`Classifying sentiment for ${tagIds?.length || 0} tags`);

    // 如果没有指定标签，则处理所有未分类的标签
    let tagsToClassify;
    if (tagIds && tagIds.length > 0) {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);
      
      if (error) throw error;
      tagsToClassify = data;
    } else {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .is('sentiment', null);
      
      if (error) throw error;
      tagsToClassify = data;
    }

    if (!tagsToClassify || tagsToClassify.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tags to classify', classified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // 批量分类标签
    for (const tag of tagsToClassify) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `你是情绪标签分类专家。分析标签的情感倾向，返回JSON格式：
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.95,
  "reasoning": "简短理由"
}

分类标准：
- negative: 焦虑、压力、无力、伤心、自责、不安、担心、恐惧、失落、内疚、痛苦、困惑、疲惫等负面情绪
- positive: 成长、发现、明白、尝试、理解、反思、感动、喜悦、平静、感恩、希望、勇气等正面情绪
- neutral: 观察、记录、日常、思考、普通描述等中性词汇`
              },
              {
                role: 'user',
                content: `分析标签情感：${tag.name}`
              }
            ],
          }),
        });

        if (!response.ok) {
          console.error(`AI API error for tag ${tag.name}:`, response.status);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          const parsed = JSON.parse(content);
          
          // 更新标签情感分类
          const { error: updateError } = await supabase
            .from('tags')
            .update({
              sentiment: parsed.sentiment,
              sentiment_confidence: parsed.confidence,
              last_sentiment_check: new Date().toISOString(),
            })
            .eq('id', tag.id);

          if (updateError) {
            console.error(`Failed to update tag ${tag.id}:`, updateError);
          } else {
            results.push({
              tagId: tag.id,
              tagName: tag.name,
              sentiment: parsed.sentiment,
              confidence: parsed.confidence,
              reasoning: parsed.reasoning,
            });
          }
        }
      } catch (error) {
        console.error(`Error classifying tag ${tag.name}:`, error);
      }
    }

    console.log(`Successfully classified ${results.length} tags`);

    return new Response(
      JSON.stringify({
        success: true,
        classified: results.length,
        results: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-tag-sentiment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
