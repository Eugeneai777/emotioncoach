import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

      // 查询合伙人当前余额
      const { data: partner } = await supabase
        .from('partners')
        .select('pending_balance, available_balance, total_earnings')
        .eq('id', commission.partner_id)
        .single();

      if (partner) {
        // 从待确认转到可提现，并更新总收益
        const { error: balanceError } = await supabase
          .from('partners')
          .update({
            pending_balance: Math.max(0, partner.pending_balance - commission.commission_amount),
            available_balance: partner.available_balance + commission.commission_amount,
            total_earnings: partner.total_earnings + commission.commission_amount
          })
          .eq('id', commission.partner_id);

        if (balanceError) {
          console.error(`Error updating partner balance ${commission.partner_id}:`, balanceError);
        } else {
          confirmed.push(commission.id);
        }
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
