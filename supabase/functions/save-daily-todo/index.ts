import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TodoItem {
  title: string;
  priority?: 'high' | 'medium' | 'low';
  estimated_time?: number;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // 验证用户身份
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { todos, call_id, date } = await req.json();

    if (!todos || !Array.isArray(todos) || todos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No todos provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const insertData = (todos as TodoItem[]).map(todo => ({
      user_id: user.id,
      date: targetDate,
      title: todo.title,
      description: todo.description || null,
      priority: todo.priority || 'medium',
      estimated_time: todo.estimated_time || null,
      source: 'ai_call' as const,
      call_id: call_id || null,
    }));

    const { data, error } = await supabase
      .from('daily_todos')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log(`[SaveDailyTodo] Saved ${data?.length || 0} todos for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        todos: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Save daily todo error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
