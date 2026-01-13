import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting weekly course push...');

    // Get all active users with smart notifications enabled
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, display_name, smart_notification_enabled')
      .eq('smart_notification_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with notifications enabled`);

    let notificationsSent = 0;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    for (const profile of profiles || []) {
      try {
        // Get user's recent emotion data (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentBriefings, error: briefingsError } = await supabaseClient
          .from('briefings')
          .select(`
            emotion_theme,
            emotion_intensity,
            conversations!inner(user_id)
          `)
          .eq('conversations.user_id', profile.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (briefingsError) {
          console.error(`Error fetching briefings for user ${profile.id}:`, briefingsError);
          continue;
        }

        // Get user's watch history to avoid recommending watched videos
        const { data: watchHistory } = await supabaseClient
          .from('video_watch_history')
          .select('video_id')
          .eq('user_id', profile.id);

        const watchedVideoIds = new Set(watchHistory?.map(h => h.video_id) || []);

        // Analyze emotion patterns using AI
        const emotionThemes = recentBriefings?.map(b => b.emotion_theme).filter(Boolean) || [];
        const avgIntensity = recentBriefings?.length 
          ? recentBriefings.reduce((sum, b) => sum + (b.emotion_intensity || 5), 0) / recentBriefings.length 
          : 5;

        if (!LOVABLE_API_KEY) {
          console.warn('LOVABLE_API_KEY not configured, skipping AI analysis');
          continue;
        }

        // Get all video courses
        const { data: allCourses } = await supabaseClient
          .from('video_courses')
          .select('*');

        // Filter out watched videos
        const unwatchedCourses = allCourses?.filter(c => !watchedVideoIds.has(c.id)) || [];

        if (unwatchedCourses.length === 0) {
          console.log(`No unwatched courses for user ${profile.id}`);
          continue;
        }

        // Use AI to select best courses based on emotion patterns
        const prompt = `
你是一个课程推荐专家。根据用户过去一周的情绪模式，从视频课程库中推荐3个最有帮助的课程。

用户情绪模式：
- 近期情绪主题：${emotionThemes.join('、')}
- 平均情绪强度：${avgIntensity.toFixed(1)}/10
- 记录次数：${recentBriefings?.length || 0}

可选课程（共${unwatchedCourses.length}个未观看）：
${unwatchedCourses.slice(0, 50).map((c, i) => `${i}. ${c.title} - ${c.category || ''}`).join('\n')}

请分析用户的情绪趋势和成长需求，选择3个能帮助他们成长的课程。返回JSON：
{
  "recommendations": [
    {
      "course_index": 课程编号,
      "reason": "推荐理由（简短有力，40字内）",
      "priority": "high/medium/low"
    }
  ],
  "summary": "一句话总结用户的成长方向（30字内）"
}
`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error for user ${profile.id}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          console.error(`Failed to parse AI response for user ${profile.id}`);
          continue;
        }

        const recommendation = JSON.parse(jsonMatch[0]);
        const recommendedCourses = recommendation.recommendations
          .map((rec: any) => unwatchedCourses[rec.course_index])
          .filter((c: any) => c)
          .slice(0, 3);

        if (recommendedCourses.length === 0) {
          continue;
        }

        // Create smart notification
        const coursesList = recommendedCourses
          .map((c: any, i: number) => `${i + 1}. ${c.title}`)
          .join('\n');

        const { error: notificationError } = await supabaseClient
          .from('smart_notifications')
          .insert({
            user_id: profile.id,
            scenario: 'weekly_course_push',
            notification_type: 'recommendation',
            title: '📚 本周为你精选的成长课程',
            message: `${recommendation.summary}\n\n推荐课程：\n${coursesList}`,
            icon: '🎓',
            action_type: 'navigate',
            action_text: '查看推荐',
            action_data: { 
              path: '/profile',
              tab: 'learning'
            },
            context: {
              course_ids: recommendedCourses.map((c: any) => c.id),
              emotion_summary: recommendation.summary
            },
            priority: 2
          });

        if (notificationError) {
          console.error(`Error creating notification for user ${profile.id}:`, notificationError);
        } else {
          notificationsSent++;
          console.log(`Sent weekly course notification to user ${profile.id}`);
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notifications_sent: notificationsSent,
        users_processed: profiles?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Weekly course push error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});