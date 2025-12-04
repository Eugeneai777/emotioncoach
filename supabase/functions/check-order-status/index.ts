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
    const { orderNo } = await req.json();
    
    if (!orderNo) {
      throw new Error('缺少订单号');
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询订单状态
    const { data: order, error } = await supabase
      .from('orders')
      .select('status, paid_at, package_key, package_name, amount')
      .eq('order_no', orderNo)
      .single();

    if (error) {
      console.error('Query order error:', error);
      throw new Error('订单查询失败');
    }

    if (!order) {
      throw new Error('订单不存在');
    }

    console.log('Order status:', orderNo, order.status);

    return new Response(
      JSON.stringify({
        success: true,
        status: order.status,
        paidAt: order.paid_at,
        packageKey: order.package_key,
        packageName: order.package_name,
        amount: order.amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check order status error:', error);
    const errorMessage = error instanceof Error ? error.message : '查询订单失败';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
