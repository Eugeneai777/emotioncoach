import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SettlementRequest {
  review_id: string;
}

interface SettlementRules {
  base_commission_rate: number;
  rating_5_multiplier: number;
  rating_4_multiplier: number;
  rating_3_multiplier: number;
  rating_2_threshold: number;
  confirm_days: number;
}

function getRatingMultiplier(rating: number, rules: SettlementRules): number {
  if (rating < rules.rating_2_threshold) {
    return 0;
  }
  if (rating >= 5) {
    return rules.rating_5_multiplier;
  }
  if (rating >= 4) {
    return rules.rating_4_multiplier;
  }
  if (rating >= 3) {
    return rules.rating_3_multiplier;
  }
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { review_id } = await req.json() as SettlementRequest;

    if (!review_id) {
      throw new Error('review_id is required');
    }

    console.log(`Processing settlement for review: ${review_id}`);

    // 1. 获取评价信息
    const { data: review, error: reviewError } = await supabase
      .from('appointment_reviews')
      .select(`
        id,
        appointment_id,
        coach_id,
        rating_overall,
        user_id
      `)
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      console.error('Review not found:', reviewError);
      throw new Error('Review not found');
    }

    // 2. 检查是否已存在结算记录
    const { data: existingSettlement } = await supabase
      .from('coach_settlements')
      .select('id')
      .eq('review_id', review_id)
      .single();

    if (existingSettlement) {
      console.log('Settlement already exists for this review');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Settlement already exists',
        settlement_id: existingSettlement.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. 获取预约信息
    const { data: appointment, error: appointmentError } = await supabase
      .from('coaching_appointments')
      .select('id, coach_id, amount_paid')
      .eq('id', review.appointment_id)
      .single();

    if (appointmentError || !appointment) {
      console.error('Appointment not found:', appointmentError);
      throw new Error('Appointment not found');
    }

    // 4. 获取结算规则
    const { data: rules, error: rulesError } = await supabase
      .from('coach_settlement_rules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (rulesError || !rules) {
      console.error('Settlement rules not found:', rulesError);
      throw new Error('Settlement rules not configured');
    }

    const settlementRules: SettlementRules = {
      base_commission_rate: Number(rules.base_commission_rate),
      rating_5_multiplier: Number(rules.rating_5_multiplier),
      rating_4_multiplier: Number(rules.rating_4_multiplier),
      rating_3_multiplier: Number(rules.rating_3_multiplier),
      rating_2_threshold: Number(rules.rating_2_threshold),
      confirm_days: Number(rules.confirm_days),
    };

    // 5. 计算结算金额
    const orderAmount = Number(appointment.amount_paid || 0);
    const rating = review.rating_overall;
    const ratingMultiplier = getRatingMultiplier(rating, settlementRules);
    const finalRate = settlementRules.base_commission_rate * ratingMultiplier;
    const settlementAmount = orderAmount * finalRate;

    console.log(`Settlement calculation: order=${orderAmount}, rating=${rating}, multiplier=${ratingMultiplier}, rate=${finalRate}, amount=${settlementAmount}`);

    // 6. 计算确认时间
    const confirmAt = new Date();
    confirmAt.setDate(confirmAt.getDate() + settlementRules.confirm_days);

    // 7. 创建结算记录
    const { data: settlement, error: settlementError } = await supabase
      .from('coach_settlements')
      .insert({
        coach_id: review.coach_id,
        appointment_id: review.appointment_id,
        review_id: review.id,
        order_amount: orderAmount,
        base_rate: settlementRules.base_commission_rate,
        rating_multiplier: ratingMultiplier,
        final_rate: finalRate,
        settlement_amount: settlementAmount,
        rating_at_settlement: rating,
        status: ratingMultiplier === 0 ? 'cancelled' : 'pending',
        confirm_at: confirmAt.toISOString(),
        cancel_reason: ratingMultiplier === 0 ? `评分 ${rating} 低于阈值 ${settlementRules.rating_2_threshold}，不予结算` : null,
      })
      .select()
      .single();

    if (settlementError) {
      console.error('Failed to create settlement:', settlementError);
      throw new Error('Failed to create settlement record');
    }

    // 8. 如果需要结算，更新教练待结算余额
    if (ratingMultiplier > 0 && settlementAmount > 0) {
      const { error: balanceError } = await supabase.rpc('add_coach_pending_balance', {
        p_coach_id: review.coach_id,
        p_amount: settlementAmount,
      });

      if (balanceError) {
        console.error('Failed to update coach balance:', balanceError);
        // 不抛出错误，结算记录已创建
      }
    }

    console.log(`Settlement created successfully: ${settlement.id}, amount: ${settlementAmount}`);

    return new Response(JSON.stringify({
      success: true,
      settlement: {
        id: settlement.id,
        settlement_amount: settlementAmount,
        rating: rating,
        final_rate: finalRate,
        status: settlement.status,
        confirm_at: settlement.confirm_at,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calculate-coach-settlement:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
