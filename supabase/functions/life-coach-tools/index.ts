import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '身份验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tool, params } = await req.json();
    console.log(`Executing tool: ${tool} for user: ${user.id}`);

    let result: any;

    switch (tool) {
      // ========== 读取工具 ==========
      case 'get_user_overview':
        result = await getUserOverview(supabase, user.id);
        break;

      case 'get_emotion_timeline':
        result = await getEmotionTimeline(supabase, user.id, params?.days || 14);
        break;

      case 'get_gratitude_entries':
        result = await getGratitudeEntries(supabase, user.id, params?.limit || 10);
        break;

      case 'get_energy_assessment':
        result = await getEnergyAssessment(supabase, user.id);
        break;

      case 'get_coach_history':
        result = await getCoachHistory(supabase, user.id, params?.coach_key);
        break;

      case 'get_training_camps':
        result = await getTrainingCamps(supabase, user.id);
        break;

      // ========== 写入工具 ==========
      case 'create_gratitude_entry':
        result = await createGratitudeEntry(supabase, user.id, params?.content, params?.category);
        break;

      case 'create_emotion_entry':
        result = await createEmotionEntry(supabase, user.id, params?.intensity, params?.note);
        break;

      case 'create_todo_item':
        result = await createTodoItem(supabase, user.id, params?.title, params?.description);
        break;

      case 'update_declaration_card':
        result = await updateDeclarationCard(supabase, user.id, params?.declaration, params?.theme);
        break;

      case 'log_training_camp_progress':
        result = await logTrainingCampProgress(supabase, user.id, params?.camp_id, params?.action);
        break;

      // ========== 专科教练 ==========
      case 'call_specialist_coach':
        result = await callSpecialistCoach(supabase, user.id, params?.coach_type, params?.message, authHeader);
        break;

      // ========== 推荐工具 ==========
      case 'recommend_tool':
        result = await recommendTool(supabase, user.id, params?.tool_type);
        break;

      case 'recommend_course':
        result = await recommendCourse(supabase, user.id, params?.topic);
        break;

      case 'recommend_training_camp':
        result = await recommendTrainingCamp(supabase, user.id, params?.goal);
        break;

      default:
        result = { error: `Unknown tool: ${tool}` };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error executing tool:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ========== 读取工具实现 ==========

async function getUserOverview(supabase: any, userId: string) {
  // 获取用户基本信息
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 获取账户信息
  const { data: account } = await supabase
    .from('user_accounts')
    .select('remaining_quota, package_key')
    .eq('user_id', userId)
    .single();

  // 获取最近7天的情绪记录数
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: emotionCount } = await supabase
    .from('emotion_quick_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  // 获取最近的感恩记录数
  const { count: gratitudeCount } = await supabase
    .from('gratitude_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  // 获取活跃训练营
  const { data: activeCamps } = await supabase
    .from('training_camps')
    .select('id, camp_name, current_day, duration_days, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  return {
    profile: {
      name: profile?.name || '朋友',
      timezone: profile?.timezone || 'Asia/Shanghai',
    },
    account: {
      remaining_quota: account?.remaining_quota || 0,
      package_key: account?.package_key || 'free',
    },
    recent_activity: {
      emotion_logs_7d: emotionCount || 0,
      gratitude_entries_7d: gratitudeCount || 0,
    },
    active_camps: activeCamps || [],
  };
}

async function getEmotionTimeline(supabase: any, userId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 获取情绪快速记录
  const { data: quickLogs } = await supabase
    .from('emotion_quick_logs')
    .select('emotion_intensity, note, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  // 获取情绪日记简报
  const { data: briefings } = await supabase
    .from('briefings')
    .select('emotion_theme, emotion_intensity, insight, action, created_at')
    .eq('conversation_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  // 计算情绪模式
  const intensities = quickLogs?.map((l: any) => l.emotion_intensity) || [];
  const avgIntensity = intensities.length > 0 
    ? intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length 
    : null;

  // 提取常见情绪主题
  const themes = briefings?.map((b: any) => b.emotion_theme).filter(Boolean) || [];
  const themeCounts: Record<string, number> = {};
  themes.forEach((t: string) => {
    themeCounts[t] = (themeCounts[t] || 0) + 1;
  });
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  return {
    period_days: days,
    quick_logs: quickLogs?.slice(0, 10) || [],
    briefings: briefings?.slice(0, 5) || [],
    patterns: {
      average_intensity: avgIntensity ? Math.round(avgIntensity * 10) / 10 : null,
      top_themes: topThemes,
      total_logs: quickLogs?.length || 0,
    },
  };
}

async function getGratitudeEntries(supabase: any, userId: string, limit: number) {
  const { data: entries } = await supabase
    .from('gratitude_entries')
    .select('content, category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // 统计类别
  const categories: Record<string, number> = {};
  entries?.forEach((e: any) => {
    const cat = e.category || '其他';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return {
    entries: entries || [],
    total_count: entries?.length || 0,
    category_stats: categories,
  };
}

async function getEnergyAssessment(supabase: any, userId: string) {
  const { data: logs } = await supabase
    .from('energy_logs')
    .select('physical_energy, emotional_energy, mental_energy, notes, logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) {
    return {
      has_data: false,
      message: '暂无能量评估记录',
    };
  }

  const latest = logs[0];
  const avgPhysical = logs.reduce((a: number, l: any) => a + (l.physical_energy || 0), 0) / logs.length;
  const avgEmotional = logs.reduce((a: number, l: any) => a + (l.emotional_energy || 0), 0) / logs.length;
  const avgMental = logs.reduce((a: number, l: any) => a + (l.mental_energy || 0), 0) / logs.length;

  return {
    has_data: true,
    latest: {
      physical: latest.physical_energy,
      emotional: latest.emotional_energy,
      mental: latest.mental_energy,
      notes: latest.notes,
      logged_at: latest.logged_at,
    },
    averages: {
      physical: Math.round(avgPhysical * 10) / 10,
      emotional: Math.round(avgEmotional * 10) / 10,
      mental: Math.round(avgMental * 10) / 10,
    },
    trend: logs.length >= 3 ? calculateTrend(logs) : 'insufficient_data',
  };
}

function calculateTrend(logs: any[]) {
  const recent = logs.slice(0, 3);
  const older = logs.slice(-3);
  
  const recentAvg = recent.reduce((a, l) => a + (l.physical_energy + l.emotional_energy + l.mental_energy) / 3, 0) / recent.length;
  const olderAvg = older.reduce((a, l) => a + (l.physical_energy + l.emotional_energy + l.mental_energy) / 3, 0) / older.length;
  
  if (recentAvg > olderAvg + 0.5) return 'improving';
  if (recentAvg < olderAvg - 0.5) return 'declining';
  return 'stable';
}

async function getCoachHistory(supabase: any, userId: string, coachKey?: string) {
  let query = supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10);

  const { data: conversations } = await query;

  // 获取最近的简报
  const { data: recentBriefings } = await supabase
    .from('briefings')
    .select('emotion_theme, insight, action, created_at')
    .in('conversation_id', conversations?.map((c: any) => c.id) || [])
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    recent_conversations: conversations?.length || 0,
    recent_briefings: recentBriefings || [],
    last_activity: conversations?.[0]?.updated_at || null,
  };
}

async function getTrainingCamps(supabase: any, userId: string) {
  const { data: camps } = await supabase
    .from('training_camps')
    .select(`
      id, camp_name, camp_type, current_day, duration_days, 
      status, started_at, completed_at,
      camp_daily_progress!inner(
        progress_date, is_checked_in, reflection_completed
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(5);

  return {
    camps: camps?.map((camp: any) => ({
      id: camp.id,
      name: camp.camp_name,
      type: camp.camp_type,
      current_day: camp.current_day,
      total_days: camp.duration_days,
      status: camp.status,
      progress_rate: Math.round((camp.current_day / camp.duration_days) * 100),
      recent_checkins: camp.camp_daily_progress?.slice(0, 7) || [],
    })) || [],
  };
}

// ========== 写入工具实现 ==========

async function createGratitudeEntry(supabase: any, userId: string, content: string, category?: string) {
  if (!content) {
    return { success: false, error: '内容不能为空' };
  }

  const { data, error } = await supabase
    .from('gratitude_entries')
    .insert({
      user_id: userId,
      content,
      category: category || '日常',
    })
    .select()
    .single();

  if (error) {
    console.error('Create gratitude entry error:', error);
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    message: '感恩已记录',
    entry: data,
  };
}

async function createEmotionEntry(supabase: any, userId: string, intensity: number, note?: string) {
  if (!intensity || intensity < 1 || intensity > 10) {
    return { success: false, error: '情绪强度应在1-10之间' };
  }

  const { data, error } = await supabase
    .from('emotion_quick_logs')
    .insert({
      user_id: userId,
      emotion_intensity: intensity,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create emotion entry error:', error);
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    message: '情绪已记录',
    entry: data,
  };
}

async function createTodoItem(supabase: any, userId: string, title: string, description?: string) {
  if (!title) {
    return { success: false, error: '标题不能为空' };
  }

  const { data, error } = await supabase
    .from('camp_daily_tasks')
    .insert({
      user_id: userId,
      task_title: title,
      task_description: description || null,
      camp_id: null, // 独立任务
      progress_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('Create todo error:', error);
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    message: '行动已添加到待办',
    task: data,
  };
}

async function updateDeclarationCard(supabase: any, userId: string, declaration: string, theme?: string) {
  if (!declaration) {
    return { success: false, error: '宣言内容不能为空' };
  }

  // 检查是否已有收藏
  const { data: existing } = await supabase
    .from('declaration_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('declaration', declaration)
    .single();

  if (existing) {
    return { success: true, message: '这条宣言已经保存过了' };
  }

  const { data, error } = await supabase
    .from('declaration_favorites')
    .insert({
      user_id: userId,
      declaration,
      theme: theme || 'default',
    })
    .select()
    .single();

  if (error) {
    console.error('Update declaration error:', error);
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    message: '宣言已保存',
    declaration: data,
  };
}

async function logTrainingCampProgress(supabase: any, userId: string, campId: string, action: string) {
  if (!campId) {
    return { success: false, error: '训练营ID不能为空' };
  }

  const today = new Date().toISOString().split('T')[0];

  // 获取或创建今日进度
  const { data: existing } = await supabase
    .from('camp_daily_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('camp_id', campId)
    .eq('progress_date', today)
    .single();

  const updates: any = {};
  if (action === 'checkin') {
    updates.is_checked_in = true;
    updates.checked_in_at = new Date().toISOString();
  } else if (action === 'reflection') {
    updates.reflection_completed = true;
    updates.reflection_completed_at = new Date().toISOString();
  }

  if (existing) {
    const { error } = await supabase
      .from('camp_daily_progress')
      .update(updates)
      .eq('id', existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('camp_daily_progress')
      .insert({
        user_id: userId,
        camp_id: campId,
        progress_date: today,
        ...updates,
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { 
    success: true, 
    message: action === 'checkin' ? '打卡成功' : '反思已记录',
  };
}

// ========== 专科教练调用 ==========

async function callSpecialistCoach(
  supabase: any, 
  userId: string, 
  coachType: string, 
  message: string,
  authHeader: string
) {
  const coachEndpoints: Record<string, string> = {
    emotion: 'emotion-coach',
    parent: 'parent-emotion-coach',
    communication: 'carnegie-coach',
    story: 'generate-story-coach',
  };

  const endpoint = coachEndpoints[coachType];
  if (!endpoint) {
    return { error: `未知的教练类型: ${coachType}` };
  }

  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messages: [{ role: 'user', content: message }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Specialist coach error (${coachType}):`, errorText);
      return { error: '专科教练暂时无法响应' };
    }

    // 处理流式响应
    const text = await response.text();
    
    // 尝试解析为 JSON
    try {
      const data = JSON.parse(text);
      return {
        coach_type: coachType,
        response: data.response || data.message || text,
      };
    } catch {
      // 如果是流式文本，直接返回
      return {
        coach_type: coachType,
        response: text,
      };
    }
  } catch (error) {
    console.error('Call specialist coach error:', error);
    return { error: '调用专科教练失败' };
  }
}

// ========== 推荐工具 ==========

async function recommendTool(supabase: any, userId: string, toolType?: string) {
  const { data: tools } = await supabase
    .from('energy_studio_tools')
    .select('tool_id, title, description, icon_name, category')
    .eq('is_available', true)
    .order('display_order');

  if (toolType) {
    const filtered = tools?.filter((t: any) => 
      t.category === toolType || t.tool_id.includes(toolType)
    );
    return { recommended_tools: filtered || [] };
  }

  return { available_tools: tools || [] };
}

async function recommendCourse(supabase: any, userId: string, topic?: string) {
  let query = supabase
    .from('video_courses')
    .select('id, title, description, duration_minutes, category, thumbnail_url')
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(5);

  if (topic) {
    query = query.or(`title.ilike.%${topic}%,description.ilike.%${topic}%,category.ilike.%${topic}%`);
  }

  const { data: courses } = await query;

  return { recommended_courses: courses || [] };
}

async function recommendTrainingCamp(supabase: any, userId: string, goal?: string) {
  const { data: templates } = await supabase
    .from('camp_templates')
    .select('id, camp_name, camp_subtitle, description, duration_days, icon, benefits')
    .eq('is_active', true)
    .order('display_order');

  // 检查用户已参加的训练营
  const { data: userCamps } = await supabase
    .from('training_camps')
    .select('camp_type')
    .eq('user_id', userId);

  const joinedTypes = new Set(userCamps?.map((c: any) => c.camp_type) || []);

  const recommendations = templates?.map((t: any) => ({
    ...t,
    already_joined: joinedTypes.has(t.id),
  })) || [];

  if (goal) {
    // 根据目标筛选
    const filtered = recommendations.filter((r: any) => 
      r.camp_name.includes(goal) || 
      r.description?.includes(goal) ||
      r.camp_subtitle?.includes(goal)
    );
    return { recommended_camps: filtered.length > 0 ? filtered : recommendations.slice(0, 3) };
  }

  return { recommended_camps: recommendations.slice(0, 3) };
}
