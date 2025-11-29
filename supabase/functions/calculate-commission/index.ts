import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, user_id, order_amount, order_type } = await req.json();

    if (!order_id || !user_id || !order_amount || !order_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const amount = parseFloat(order_amount);
    const confirmDate = new Date();
    confirmDate.setDate(confirmDate.getDate() + 21); // 21天后确认

    const commissions = [];

    // 1. 查找用户的一级推荐人
    const { data: l1Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 1)
      .single();

    if (l1Referral && l1Referral.partners) {
      const partner = l1Referral.partners as any;
      const commissionAmount = amount * parseFloat(partner.commission_rate_l1);

      // 创建一级佣金记录
      const { data: commission, error: commError } = await supabase
        .from('partner_commissions')
        .insert({
          partner_id: partner.id,
          order_id,
          order_type,
          source_user_id: user_id,
          commission_level: 1,
          order_amount: amount,
          commission_rate: partner.commission_rate_l1,
          commission_amount: commissionAmount,
          status: 'pending',
          confirm_at: confirmDate.toISOString()
        })
        .select()
        .single();

      if (!commError && commission) {
        // 更新合伙人待确认余额
        await supabase
          .from('partners')
          .update({
            pending_balance: partner.pending_balance + commissionAmount
          })
          .eq('id', partner.id);

        commissions.push(commission);
      }
    }

    // 2. 查找用户的二级推荐人
    const { data: l2Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 2)
      .single();

    if (l2Referral && l2Referral.partners) {
      const partner = l2Referral.partners as any;
      const commissionAmount = amount * parseFloat(partner.commission_rate_l2);

      // 创建二级佣金记录
      const { data: commission, error: commError } = await supabase
        .from('partner_commissions')
        .insert({
          partner_id: partner.id,
          order_id,
          order_type,
          source_user_id: user_id,
          commission_level: 2,
          order_amount: amount,
          commission_rate: partner.commission_rate_l2,
          commission_amount: commissionAmount,
          status: 'pending',
          confirm_at: confirmDate.toISOString()
        })
        .select()
        .single();

      if (!commError && commission) {
        // 更新合伙人待确认余额
        await supabase
          .from('partners')
          .update({
            pending_balance: partner.pending_balance + commissionAmount
          })
          .eq('id', partner.id);

        commissions.push(commission);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        commissions,
        message: `Created ${commissions.length} commission records`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-commission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
