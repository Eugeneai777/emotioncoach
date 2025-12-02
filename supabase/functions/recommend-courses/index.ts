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
    const { briefing, coachType = 'emotion' } = await req.json();
    
    if (!briefing) {
      throw new Error('Briefing data is required');
    }

    console.log('Processing recommendation for coach type:', coachType);

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

    // Helper function to group courses by category
    const groupCoursesByCategory = (courses: any[]): string => {
      const groups: Record<string, any[]> = {};
      courses.forEach((c, i) => {
        const cat = c.category || "其他";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ ...c, index: i });
      });
      
      return Object.entries(groups)
        .map(([cat, items]) => 
          `【${cat}】\n${items.map(c => `${c.index}. ${c.title} - ${c.description?.substring(0, 80) || ''}`).join('\n')}`
        )
        .join('\n\n');
    };

    // Use Lovable AI to match courses with briefing
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build prompt based on coach type
    const buildPromptForCoachType = (type: string) => {
      const basePrompt = `你是一个课程推荐专家。根据用户的${getCoachLabel(type)}简报，从视频课程库中推荐2-3个最相关的课程。`;
      
      let briefingInfo = '';
      switch(type) {
        case 'emotion':
          briefingInfo = `
用户简报：
- 情绪主题：${briefing.emotion_theme || ''}
- 情绪强度：${briefing.emotion_intensity || ''}
- 洞察：${briefing.insight || ''}
- 行动计划：${briefing.action || ''}`;
          break;
        case 'communication':
          briefingInfo = `
用户简报：
- 沟通主题：${briefing.emotion_theme || ''}
- 沟通难度：${briefing.emotion_intensity || ''}
- 成长洞察：${briefing.insight || ''}
- 微行动：${briefing.action || ''}`;
          break;
        case 'parent':
          briefingInfo = `
用户简报：
- 亲子主题：${briefing.emotion_theme || ''}
- 微行动：${briefing.action || ''}`;
          break;
        case 'vibrant_life':
          briefingInfo = `
用户简报：
- 问题摘要：${briefing.emotion_theme || ''}
- 分析推理：${briefing.insight || ''}`;
          break;
      }

      return `${basePrompt}

${briefingInfo}

可用课程（按分类整理，共${courses.length}个）：
${groupCoursesByCategory(courses)}

请分析用户的情况和成长需求，从最相关的分类中选择2-3个最匹配的课程。返回JSON格式：
{
  "recommendations": [
    {
      "course_index": 课程编号(0-based),
      "reason": "推荐理由，说明为什么推荐这门课程（来源会自动添加）",
      "match_score": 匹配度(0-100)
    }
  ]
}

要求：
1. 从与用户需求最相关的分类中选择课程
2. 推荐理由要具体且有帮助性，专注于说明课程如何帮助用户
3. 按匹配度从高到低排序
4. 只返回JSON，不要其他文字
`;
    };

    const getCoachLabel = (type: string): string => {
      const labels: Record<string, string> = {
        emotion: '情绪教练',
        communication: '沟通教练',
        parent: '亲子教练',
        vibrant_life: '有劲生活教练'
      };
      return labels[type] || '教练';
    };

    const prompt = buildPromptForCoachType(coachType);

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
        
        // 根据实际课程来源动态生成来源文字
        const sourceText = course.source === '绽放公开课' ? '绽放公开课' : '有劲365课程';
        let reason = rec.reason;
        // 替换可能错误的来源文字
        reason = reason.replace(/来源：[^。]+。/, `来源：${sourceText}。`);
        // 如果 AI 没有生成来源前缀，则添加
        if (!reason.includes('来源：')) {
          reason = `💡 来源：${sourceText}。${reason}`;
        }
        
        return {
          id: course.id,
          title: course.title,
          video_url: course.video_url,
          description: course.description,
          reason: reason,
          match_score: rec.match_score,
          category: course.category,
          source: course.source,
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