import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting coach settlements confirmation process...');

    // 1. 查找所有到期的待确认结算记录
    const now = new Date().toISOString();
    const { data: pendingSettlements, error: fetchError } = await supabase
      .from('coach_settlements')
      .select('*')
      .eq('status', 'pending')
      .lte('confirm_at', now);

    if (fetchError) {
      console.error('Failed to fetch pending settlements:', fetchError);
      throw new Error('Failed to fetch pending settlements');
    }

    if (!pendingSettlements || pendingSettlements.length === 0) {
      console.log('No pending settlements to confirm');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending settlements to confirm',
        confirmed_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingSettlements.length} settlements to confirm`);

    let confirmedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // 2. 逐个处理结算记录
    for (const settlement of pendingSettlements) {
      try {
        // 更新结算状态为已确认
        const { error: updateError } = await supabase
          .from('coach_settlements')
          .update({
            status: 'confirmed',
            confirmed_at: now,
          })
          .eq('id', settlement.id);

        if (updateError) {
          throw updateError;
        }

        // 将金额从待结算转到可提现
        const { error: balanceError } = await supabase.rpc('confirm_coach_settlement', {
          p_coach_id: settlement.coach_id,
          p_amount: Number(settlement.settlement_amount),
        });

        if (balanceError) {
          throw balanceError;
        }

        confirmedCount++;
        console.log(`Confirmed settlement ${settlement.id} for coach ${settlement.coach_id}, amount: ${settlement.settlement_amount}`);

      } catch (error: unknown) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorMsg = `Failed to confirm settlement ${settlement.id}: ${errorMessage}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Confirmation complete: ${confirmedCount} confirmed, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${pendingSettlements.length} settlements`,
      confirmed_count: confirmedCount,
      failed_count: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in confirm-coach-settlements:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
