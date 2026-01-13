import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders, validateCronSecret } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled batch operations
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // 1. 查找所有待确认且已到期的佣金
    const { data: pendingCommissions, error: fetchError } = await supabase
      .from('partner_commissions')
      .select('*')
      .eq('status', 'pending')
      .lte('confirm_at', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingCommissions || pendingCommissions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No commissions to confirm', confirmed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingCommissions.length} commissions to confirm`);

    const confirmed = [];

    // 2. 确认每笔佣金
    for (const commission of pendingCommissions) {
      // 更新佣金状态
      const { error: updateError } = await supabase
        .from('partner_commissions')
        .update({
          status: 'confirmed',
          confirmed_at: now
        })
        .eq('id', commission.id);

      if (updateError) {
        console.error(`Error confirming commission ${commission.id}:`, updateError);
        continue;
      }

      // 使用原子化函数确认佣金，防止竞态条件
      const { error: balanceError } = await supabase.rpc('confirm_partner_commission', {
        p_partner_id: commission.partner_id,
        p_amount: commission.commission_amount
      });

      if (balanceError) {
        console.error(`Error confirming commission ${commission.partner_id}:`, balanceError);
      } else {
        confirmed.push(commission.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Confirmed ${confirmed.length} out of ${pendingCommissions.length} commissions`,
        confirmed_count: confirmed.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirm-commissions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});