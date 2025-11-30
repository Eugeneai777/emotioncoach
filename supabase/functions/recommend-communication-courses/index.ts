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
      throw new Error('Communication briefing data is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching video courses for communication briefing...');

    // Get all video courses
    const { data: courses, error: coursesError } = await supabaseClient
      .from('video_courses')
      .select('*');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      throw coursesError;
    }

    console.log(`Found ${courses?.length || 0} courses`);

    // Get camp templates for recommendations
    const { data: camps, error: campsError } = await supabaseClient
      .from('camp_templates')
      .select('*')
      .eq('is_active', true);

    if (campsError) {
      console.error('Error fetching camps:', campsError);
    }

    console.log(`Found ${camps?.length || 0} active camps`);

    if (!courses || courses.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], campRecommendations: [] }),
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

    // Helper function to format camps
    const formatCamps = (camps: any[]): string => {
      return camps.map((c, i) => 
        `${i}. ${c.camp_name} (${c.duration_days}天) - ${c.description?.substring(0, 100) || ''}`
      ).join('\n');
    };

    // Use Lovable AI to match courses and camps with communication briefing
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `
你是一个沟通课程推荐专家。根据用户的沟通简报，从视频课程库和训练营中推荐最相关的内容。

用户沟通简报：
- 沟通主题：${briefing.communication_theme || ''}
- 场景类型：${briefing.scenario_type || ''}
- 对象类型：${briefing.target_type || ''}
- 沟通难度：${briefing.communication_difficulty || ''}
- 难度关键词：${briefing.difficulty_keywords?.join('、') || ''}
- 洞察：${briefing.growth_insight || ''}
- 微行动：${briefing.micro_action || ''}

可用课程（按分类整理，共${courses.length}个）：
${groupCoursesByCategory(courses)}

可用训练营（共${camps?.length || 0}个）：
${camps ? formatCamps(camps) : '暂无'}

请分析用户的沟通需求，推荐：
1. 2-3个最相关的视频课程（从人际关系、沟通技巧等相关分类中选择）
2. 1个最匹配的训练营

返回JSON格式：
{
  "courseRecommendations": [
    {
      "course_index": 课程编号(0-based),
      "reason": "推荐理由，说明为什么推荐这门课程",
      "match_score": 匹配度(0-100)
    }
  ],
  "campRecommendations": [
    {
      "camp_index": 训练营编号(0-based),
      "reason": "推荐理由，说明为什么推荐这个训练营",
      "match_score": 匹配度(0-100)
    }
  ]
}

推荐逻辑：
- family场景 → 推荐亲子关系、家庭沟通相关课程和"21天青少年问题家庭训练营"
- work场景 → 推荐职场沟通课程和"身份绽放训练营"
- romantic场景 → 推荐情感关系课程和"情感绽放训练营"
- 高难度(≥7) → 优先推荐情绪管理课程和"21天情绪日记训练营"

只返回JSON，不要其他文字。
`;

    console.log('Calling Lovable AI for communication recommendations...');

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
        JSON.stringify({ recommendations: [], campRecommendations: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiRecommendations = JSON.parse(jsonMatch[0]);
    
    // Build final course recommendations with full course data
    const courseRecommendations = (aiRecommendations.courseRecommendations || [])
      .map((rec: any) => {
        const course = courses[rec.course_index];
        if (!course) return null;
        
        const sourceText = course.source === '绽放公开课' ? '绽放公开课' : '有劲365课程';
        let reason = rec.reason;
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

    // Build camp recommendations
    const campRecommendations = camps && (aiRecommendations.campRecommendations || [])
      .map((rec: any) => {
        const camp = camps[rec.camp_index];
        if (!camp) return null;
        
        return {
          id: camp.id,
          camp_name: camp.camp_name,
          camp_subtitle: camp.camp_subtitle,
          duration_days: camp.duration_days,
          description: camp.description,
          reason: rec.reason,
          match_score: rec.match_score,
          gradient: camp.gradient,
          icon: camp.icon,
          price: camp.price,
        };
      })
      .filter((rec: any) => rec !== null)
      .slice(0, 1) || [];

    console.log(`Returning ${courseRecommendations.length} course and ${campRecommendations.length} camp recommendations`);

    return new Response(
      JSON.stringify({ 
        recommendations: courseRecommendations,
        campRecommendations: campRecommendations 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Communication recommendation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, recommendations: [], campRecommendations: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
