import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, source, amount = 1, conversationId, metadata } = await req.json();

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
    console.error('deduct-quota error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
