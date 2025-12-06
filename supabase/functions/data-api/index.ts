import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const userId = url.searchParams.get('user_id');
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('Authorization');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==================== 公开数据接口 (无需认证) ====================
    
    // 获取教练模板列表
    if (endpoint === 'coach_templates') {
      const { data, error } = await supabase
        .from('coach_templates')
        .select('id, coach_key, emoji, title, subtitle, description, gradient, primary_color, steps_title, steps_emoji, steps, is_active')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取训练营模板列表
    if (endpoint === 'camp_templates') {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('id, camp_type, camp_name, camp_subtitle, description, duration_days, price, original_price, theme_color, gradient, icon, category, benefits, target_audience, stages')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取视频课程列表
    if (endpoint === 'video_courses') {
      const category = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      
      let query = supabase
        .from('video_courses')
        .select('id, title, description, video_url, keywords, tags, category, source')
        .limit(limit);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取套餐列表
    if (endpoint === 'packages') {
      const { data, error } = await supabase
        .from('packages')
        .select('id, package_key, package_name, description, price, original_price, duration_days, ai_quota, product_line')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== 聚合统计接口 (无需认证) ====================
    
    if (endpoint === 'statistics') {
      // 获取各类数据的总数统计
      const [
        usersResult,
        briefingsResult,
        sessionsResult,
        postsResult,
        campsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('briefings').select('id', { count: 'exact', head: true }),
        supabase.from('panic_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }),
        supabase.from('training_camps').select('id', { count: 'exact', head: true })
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          total_users: usersResult.count || 0,
          total_briefings: briefingsResult.count || 0,
          total_panic_sessions: sessionsResult.count || 0,
          total_community_posts: postsResult.count || 0,
          total_training_camps: campsResult.count || 0,
          updated_at: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== 用户私有数据接口 (需要认证) ====================
    
    // 验证API密钥或JWT
    const expectedApiKey = Deno.env.get('DATA_API_KEY');
    const isApiKeyValid = apiKey && expectedApiKey && apiKey === expectedApiKey;
    const isJwtValid = authHeader?.startsWith('Bearer ');

    if (!isApiKeyValid && !isJwtValid) {
      // 对于需要认证的接口，返回错误
      if (['user_briefings', 'user_sessions', 'user_camps', 'user_account', 'user_achievements'].includes(endpoint || '')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: '请提供有效的 x-api-key 或 Authorization Bearer token'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取用户情绪简报
    if (endpoint === 'user_briefings') {
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing user_id parameter'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data, error, count } = await supabase
        .from('briefings')
        .select(`
          id, emotion_theme, emotion_intensity, insight, action, growth_story,
          stage_1_content, stage_2_content, stage_3_content, stage_4_content,
          intensity_keywords, intensity_reasoning, created_at,
          conversations!inner(user_id)
        `, { count: 'exact' })
        .eq('conversations.user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return new Response(JSON.stringify({
        success: true,
        data: data.map(item => ({
          ...item,
          conversations: undefined
        })),
        pagination: {
          total: count,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取用户情绪急救会话
    if (endpoint === 'user_sessions') {
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing user_id parameter'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const { data, error, count } = await supabase
        .from('panic_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return new Response(JSON.stringify({
        success: true,
        data,
        pagination: {
          total: count,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取用户训练营数据
    if (endpoint === 'user_camps') {
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing user_id parameter'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取用户账户信息
    if (endpoint === 'user_account') {
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing user_id parameter'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const [accountResult, profileResult, subscriptionResult] = await Promise.all([
        supabase.from('user_accounts').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle()
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          account: accountResult.data,
          profile: profileResult.data,
          active_subscription: subscriptionResult.data
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取用户成就
    if (endpoint === 'user_achievements') {
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing user_id parameter'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 默认返回API信息
    return new Response(JSON.stringify({
      success: true,
      api_version: '1.0.0',
      message: '劲老师数据API',
      endpoints: {
        public: [
          'coach_templates - 教练模板列表',
          'camp_templates - 训练营模板列表',
          'video_courses - 视频课程列表',
          'packages - 套餐列表',
          'statistics - 聚合统计数据'
        ],
        authenticated: [
          'user_briefings - 用户情绪简报 (需要user_id)',
          'user_sessions - 用户情绪急救会话 (需要user_id)',
          'user_camps - 用户训练营数据 (需要user_id)',
          'user_account - 用户账户信息 (需要user_id)',
          'user_achievements - 用户成就 (需要user_id)'
        ]
      },
      documentation: 'https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/data-api?endpoint=help'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Data API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
