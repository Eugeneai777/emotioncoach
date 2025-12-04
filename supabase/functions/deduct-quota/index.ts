import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Create client with anon key to verify user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Get authenticated user from JWT
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`🔐 Authenticated user: ${userId}`);

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { source, amount = 1, conversationId, metadata } = await req.json();

    const { data, error: deductError } = await supabase.rpc('deduct_user_quota', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (deductError) {
      console.error(`❌ 扣费失败: ${deductError.message}`);
      throw new Error(`扣费失败: ${deductError.message}`);
    }

    await supabase.from('usage_records').insert({
      user_id: userId,
      record_type: 'conversation',
      amount,
      source,
      conversation_id: conversationId,
      metadata,
    });

    console.log(`✅ 用户 ${userId} 扣费 ${amount} 次，剩余: ${data[0].remaining_quota}`);

    return new Response(
      JSON.stringify({
        success: true,
        remaining_quota: data[0].remaining_quota,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('deduct-quota error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
