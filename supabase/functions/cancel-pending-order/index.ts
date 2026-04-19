import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, packageKey } = await req.json();

    if (!orderNo) {
      throw new Error('缺少订单号');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let requesterId: string | null = null;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: authData } = await userClient.auth.getUser();
      requesterId = authData.user?.id ?? null;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_no, user_id, package_key, status, created_at')
      .eq('order_no', orderNo)
      .maybeSingle();

    if (orderError) {
      throw new Error('查询订单失败');
    }

    if (!order) {
      throw new Error('订单不存在');
    }

    if (packageKey && order.package_key !== packageKey) {
      throw new Error('订单信息不匹配');
    }

    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: true, orderNo, status: order.status, message: '订单无需取消' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.user_id) {
      if (!requesterId || requesterId !== order.user_id) {
        return new Response(
          JSON.stringify({ success: false, error: '无权取消该订单' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const createdAt = new Date(order.created_at).getTime();
      const ageMs = Date.now() - createdAt;
      if (ageMs > 15 * 60 * 1000) {
        return new Response(
          JSON.stringify({ success: false, error: '订单已过期，请重新发起支付' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('order_no', orderNo)
      .eq('status', 'pending');

    if (updateError) {
      throw new Error('取消订单失败');
    }

    return new Response(
      JSON.stringify({ success: true, orderNo, status: 'cancelled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('cancel-pending-order error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || '取消订单失败' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});