import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefing } = await req.json();
    
    if (!briefing) {
      throw new Error('Briefing data is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching video courses...');

    // Get all video courses
    const { data: courses, error: coursesError } = await supabaseClient
      .from('video_courses')
      .select('*');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      throw coursesError;
    }

    console.log(`Found ${courses?.length || 0} courses`);

    if (!courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to match courses with briefing
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `
你是一个课程推荐专家。根据用户的情绪简报，从视频课程库中推荐2-3个最相关的课程。

用户简报：
- 情绪主题：${briefing.emotion_theme || ''}
- 情绪标签：${briefing.emotion_tags?.join('、') || ''}
- 洞察：${briefing.insight || ''}
- 行动计划：${briefing.action || ''}

可用课程（共${courses.length}个）：
${courses.map((c, i) => `${i + 1}. ${c.title} - ${c.description?.substring(0, 100) || ''}`).join('\n')}

请分析用户的情绪状态和成长需求，选择2-3个最匹配的课程。返回JSON格式：
{
  "recommendations": [
    {
      "course_index": 课程编号(0-based),
      "reason": "为什么推荐这个课程（30字以内）",
      "match_score": 匹配度(0-100)
    }
  ]
}

要求：
1. 选择与用户情绪主题和标签最相关的课程
2. 推荐理由要具体且有帮助性
3. 按匹配度从高到低排序
4. 只返回JSON，不要其他文字
`;

    console.log('Calling Lovable AI for recommendations...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI response:', aiContent);

    // Parse AI response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response');
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiRecommendations = JSON.parse(jsonMatch[0]);
    
    // Build final recommendations with full course data
    const recommendations = aiRecommendations.recommendations
      .map((rec: any) => {
        const course = courses[rec.course_index];
        if (!course) return null;
        
        return {
          id: course.id,
          title: course.title,
          video_url: course.video_url,
          description: course.description,
          reason: rec.reason,
          match_score: rec.match_score,
          category: course.category,
          tags: course.tags
        };
      })
      .filter((rec: any) => rec !== null)
      .slice(0, 3);

    console.log(`Returning ${recommendations.length} recommendations`);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recommendation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, recommendations: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});