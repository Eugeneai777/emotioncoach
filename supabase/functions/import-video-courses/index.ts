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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting video course import...');

    // Read the markdown files
    const youjin365Content = await Deno.readTextFile('./视频知识库_有劲365.md');
    const zhanfangContent = await Deno.readTextFile('./绽放公开课.md');

    const courses: any[] = [];

    // Parse 视频知识库_有劲365.md
    const youjin365Lines = youjin365Content.split('\n');
    let currentCourse: any = null;

    for (let i = 0; i < youjin365Lines.length; i++) {
      const line = youjin365Lines[i].trim();
      
      // Match numbered titles like "1. 如何处理被批评后的情绪？"
      const titleMatch = line.match(/^\d+\.\s+(.+)$/);
      if (titleMatch) {
        if (currentCourse && currentCourse.video_url) {
          courses.push(currentCourse);
        }
        currentCourse = {
          title: titleMatch[1],
          source: 'youjin365',
          keywords: [],
          tags: [],
          description: ''
        };
      }
      
      // Match video URL
      const urlMatch = line.match(/https:\/\/[^\s]+/);
      if (urlMatch && currentCourse) {
        currentCourse.video_url = urlMatch[0];
      }
      
      // Collect description lines
      if (currentCourse && line && !titleMatch && !urlMatch && !line.startsWith('#')) {
        currentCourse.description += (currentCourse.description ? ' ' : '') + line;
      }
    }
    if (currentCourse && currentCourse.video_url) {
      courses.push(currentCourse);
    }

    // Parse 绽放公开课.md
    const zhanfangLines = zhanfangContent.split('\n');
    currentCourse = null;

    for (let i = 0; i < zhanfangLines.length; i++) {
      const line = zhanfangLines[i].trim();
      
      const titleMatch = line.match(/^\d+\.\s+(.+)$/);
      if (titleMatch) {
        if (currentCourse && currentCourse.video_url) {
          courses.push(currentCourse);
        }
        currentCourse = {
          title: titleMatch[1],
          source: 'zhanfang',
          keywords: [],
          tags: [],
          description: ''
        };
      }
      
      const urlMatch = line.match(/https:\/\/[^\s]+/);
      if (urlMatch && currentCourse) {
        currentCourse.video_url = urlMatch[0];
      }
      
      if (currentCourse && line && !titleMatch && !urlMatch && !line.startsWith('#')) {
        currentCourse.description += (currentCourse.description ? ' ' : '') + line;
      }
    }
    if (currentCourse && currentCourse.video_url) {
      courses.push(currentCourse);
    }

    console.log(`Parsed ${courses.length} courses`);

    // Extract keywords and tags from titles and descriptions
    for (const course of courses) {
      const text = `${course.title} ${course.description}`.toLowerCase();
      
      // Common emotion/growth keywords
      const keywordPatterns = [
        '焦虑', '压力', '情绪', '批评', '领导力', '成长', '诚实', '沟通',
        '关系', '自信', '目标', '价值观', '改变', '行动', '反馈', '冲突',
        '团队', '激励', '决策', '时间管理', '效率', '创新', '学习'
      ];
      
      course.keywords = keywordPatterns.filter(kw => text.includes(kw));
      
      // Categorize
      if (text.includes('领导') || text.includes('团队') || text.includes('管理')) {
        course.category = '领导力';
        course.tags.push('领导力');
      }
      if (text.includes('情绪') || text.includes('焦虑') || text.includes('压力')) {
        course.category = course.category || '情绪管理';
        course.tags.push('情绪管理');
      }
      if (text.includes('关系') || text.includes('沟通')) {
        course.category = course.category || '人际关系';
        course.tags.push('人际关系');
      }
      if (text.includes('成长') || text.includes('目标') || text.includes('价值')) {
        course.tags.push('个人成长');
      }
      
      if (!course.category) {
        course.category = '个人成长';
      }
    }

    // Insert into database
    const { data, error } = await supabaseClient
      .from('video_courses')
      .insert(courses)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log(`Successfully imported ${data?.length || 0} courses`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: data?.length || 0,
        message: `Successfully imported ${data?.length || 0} video courses`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});