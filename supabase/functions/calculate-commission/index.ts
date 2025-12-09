import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

// 判断产品线 - 与 wechat-pay-callback 中的 package_key 保持一致
function getProductLine(orderType: string): 'youjin' | 'bloom' {
  // 有劲产品线：基础会员、365会员、尝鲜会员
  const youjinProducts = ['basic', 'member365', 'trial', 'package_trial', 'package_365', 'ai_coach_upgrade'];
  // 绽放产品线：合伙人套餐
  const bloomProducts = ['partner', 'partner_package'];
  
  if (youjinProducts.includes(orderType)) return 'youjin';
  if (bloomProducts.includes(orderType)) return 'bloom';
  return 'youjin';
}

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
    confirmDate.setDate(confirmDate.getDate() + 21);

    const commissions = [];
    const productLine = getProductLine(order_type);

    // L1 推荐人
    const { data: l1Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 1)
      .single();

    if (l1Referral && l1Referral.partners) {
      const partner = l1Referral.partners as any;
      
      if (partner.partner_type === productLine) {
        let commissionRate = parseFloat(partner.commission_rate_l1);
        
        if (partner.partner_type === 'youjin') {
          const { data: levelRule } = await supabase
            .from('partner_level_rules')
            .select('commission_rate_l1')
            .eq('partner_type', 'youjin')
            .eq('level_name', partner.partner_level)
            .single();
          
          if (levelRule) commissionRate = parseFloat(levelRule.commission_rate_l1);
        }
        
        const commissionAmount = amount * commissionRate;

        const { data: commission, error: commError } = await supabase
          .from('partner_commissions')
          .insert({
            partner_id: partner.id,
            order_id,
            order_type,
            source_user_id: user_id,
            commission_level: 1,
            order_amount: amount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            status: 'pending',
            confirm_at: confirmDate.toISOString(),
            product_line: productLine
          })
          .select()
          .single();

        if (!commError && commission) {
          await supabase
            .from('partners')
            .update({ pending_balance: partner.pending_balance + commissionAmount })
            .eq('id', partner.id);
          commissions.push(commission);
        }
      }
    }

    // L2 推荐人
    const { data: l2Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 2)
      .single();

    if (l2Referral && l2Referral.partners) {
      const partner = l2Referral.partners as any;
      
      if (partner.partner_type === productLine) {
        let commissionRateL2 = parseFloat(partner.commission_rate_l2);
        
        if (partner.partner_type === 'youjin') {
          const { data: levelRule } = await supabase
            .from('partner_level_rules')
            .select('commission_rate_l2')
            .eq('partner_type', 'youjin')
            .eq('level_name', partner.partner_level)
            .single();
          
          if (levelRule) commissionRateL2 = parseFloat(levelRule.commission_rate_l2);
        }

        if (commissionRateL2 > 0) {
          const commissionAmount = amount * commissionRateL2;

          const { data: commission, error: commError } = await supabase
            .from('partner_commissions')
            .insert({
              partner_id: partner.id,
              order_id,
              order_type,
              source_user_id: user_id,
              commission_level: 2,
              order_amount: amount,
              commission_rate: commissionRateL2,
              commission_amount: commissionAmount,
              status: 'pending',
              confirm_at: confirmDate.toISOString(),
              product_line: productLine
            })
            .select()
            .single();

          if (!commError && commission) {
            await supabase
              .from('partners')
              .update({ pending_balance: partner.pending_balance + commissionAmount })
              .eq('id', partner.id);
            commissions.push(commission);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, commissions, message: `Created ${commissions.length} commission records` }),
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