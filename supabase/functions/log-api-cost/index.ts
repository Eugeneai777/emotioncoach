import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 模型成本配置（每1K tokens，美元）
// OpenAI Realtime API 定价: gpt-4o-realtime $40/M input, $80/M output; mini $10/M input, $20/M output
const MODEL_COSTS: Record<string, { input?: number; output?: number; image?: number; minute?: number }> = {
  'google/gemini-2.5-flash': { input: 0.0001, output: 0.0003 },
  'google/gemini-2.5-flash-lite': { input: 0.00005, output: 0.00015 },
  'google/gemini-2.5-pro': { input: 0.00025, output: 0.0005 },
  'google/gemini-3-pro-preview': { input: 0.0003, output: 0.0006 },
  'google/gemini-3-pro-image-preview': { image: 0.03 },
  // OpenAI Realtime API (audio tokens): $40/M input, $80/M output → per 1K: $0.04 input, $0.08 output
  'gpt-4o-realtime-preview-2024-12-17': { input: 0.04, output: 0.08 },
  // OpenAI Realtime Mini API (audio tokens): $10/M input, $20/M output → per 1K: $0.01 input, $0.02 output
  'gpt-4o-mini-realtime-preview-2024-12-17': { input: 0.01, output: 0.02 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
};

const USD_TO_CNY = 7.2;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract user_id from JWT token instead of request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user's token to verify and extract user info
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    const user_id = user.id;

    const { 
      function_name, 
      feature_key, 
      model, 
      input_tokens = 0, 
      output_tokens = 0,
      fixed_cost_usd,
      metadata 
    } = await req.json();

    // 计算成本
    let estimated_cost_usd = 0;
    
    if (fixed_cost_usd !== undefined) {
      estimated_cost_usd = fixed_cost_usd;
    } else {
      const costs = MODEL_COSTS[model];
      if (costs?.input && costs?.output) {
        estimated_cost_usd = (input_tokens * costs.input + output_tokens * costs.output) / 1000;
      } else if (costs?.image) {
        estimated_cost_usd = costs.image;
      } else if (costs?.minute) {
        estimated_cost_usd = costs.minute * (metadata?.minutes || 1);
      }
    }

    const estimated_cost_cny = estimated_cost_usd * USD_TO_CNY;

    // 插入成本日志
    const { data, error } = await supabaseAdmin
      .from('api_cost_logs')
      .insert({
        user_id,
        function_name,
        feature_key,
        model,
        input_tokens,
        output_tokens,
        estimated_cost_usd,
        estimated_cost_cny,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting cost log:', error);
      throw error;
    }

    // 检查单次调用阈值
    const { data: settings } = await supabaseAdmin
      .from('cost_alert_settings')
      .select('*')
      .eq('alert_type', 'single_call')
      .eq('is_active', true)
      .single();

    if (settings && estimated_cost_cny >= settings.threshold_cny) {
      // 触发单次调用预警
      await supabaseAdmin.from('cost_alerts').insert({
        alert_type: 'single_call',
        user_id,
        threshold_cny: settings.threshold_cny,
        actual_cost_cny: estimated_cost_cny,
        alert_message: `单次调用成本预警: ${function_name} 花费 ¥${estimated_cost_cny.toFixed(4)}`
      });

      console.log(`COST ALERT: Single call ${function_name} cost ¥${estimated_cost_cny.toFixed(4)} exceeded threshold ¥${settings.threshold_cny}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cost_log_id: data.id,
      estimated_cost_cny 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in log-api-cost:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
