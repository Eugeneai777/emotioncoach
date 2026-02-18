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

    const { order_no, product_id, order_amount, buyer_id } = await req.json();

    if (!order_no || !product_id || !order_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product commission config
    const { data: product, error: productError } = await supabase
      .from('health_store_products')
      .select('youjin_commission_enabled, youjin_commission_rate, bloom_commission_enabled, bloom_commission_rate')
      .eq('id', product_id)
      .limit(1);

    if (productError || !product || product.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Product not found', detail: productError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const p = product[0];
    const results: { type: string; count: number; amount: number }[] = [];
    const confirmAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    // Process each partner type
    for (const config of [
      { enabled: p.youjin_commission_enabled, rate: p.youjin_commission_rate, type: 'youjin' },
      { enabled: p.bloom_commission_enabled, rate: p.bloom_commission_rate, type: 'bloom' },
    ]) {
      if (!config.enabled || !config.rate || config.rate <= 0) continue;

      const commissionAmount = Math.round(order_amount * config.rate * 100) / 100;
      if (commissionAmount <= 0) continue;

      // Get all active partners of this type
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('id')
        .eq('partner_type', config.type)
        .eq('is_active', true);

      if (partnersError || !partners || partners.length === 0) {
        console.log(`No active ${config.type} partners found`);
        continue;
      }

      let successCount = 0;

      for (const partner of partners) {
        try {
          // Skip if buyer is the partner themselves
          // Insert commission record
          const { error: insertError } = await supabase
            .from('partner_commissions')
            .insert({
              partner_id: partner.id,
              order_type: 'store_product',
              order_amount: order_amount,
              commission_rate: config.rate,
              commission_amount: commissionAmount,
              status: 'pending',
              confirm_at: confirmAt,
              referred_user_id: buyer_id,
            });

          if (insertError) {
            console.error(`Failed to create commission for partner ${partner.id}:`, insertError);
            continue;
          }

          // Update pending balance
          const { error: balanceError } = await supabase.rpc('add_partner_pending_balance', {
            p_partner_id: partner.id,
            p_amount: commissionAmount,
          });

          if (balanceError) {
            console.error(`Failed to update balance for partner ${partner.id}:`, balanceError);
          }

          successCount++;
        } catch (err) {
          console.error(`Error processing partner ${partner.id}:`, err);
        }
      }

      results.push({ type: config.type, count: successCount, amount: commissionAmount });
      console.log(`Settled ${config.type}: ${successCount}/${partners.length} partners, ¥${commissionAmount} each`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in settle-store-commission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
