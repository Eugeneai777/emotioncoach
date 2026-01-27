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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { packageKey, payType = 'native', openId, isMiniProgram } = await req.json();

    if (!packageKey) {
      throw new Error('Missing packageKey');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get prepaid package details
    const { data: pkg, error: pkgError } = await supabase
      .from('coaching_prepaid_packages')
      .select('*')
      .eq('package_key', packageKey)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      throw new Error('Prepaid package not found or inactive');
    }

    // Generate order number
    const orderNo = `PRE${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order record
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_key: packageKey,
        amount: pkg.price,
        status: 'pending',
        order_type: 'prepaid_recharge',
        product_name: pkg.package_name,
      });

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    // Call WeChat Pay to get payment URL
    const wechatPayResponse = await fetch(`${supabaseUrl}/functions/v1/create-wechat-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orderNo,
        amount: pkg.price,
        description: `教练预付卡充值: ${pkg.package_name}`,
        payType,
        openId: payType === 'jsapi' || payType === 'miniprogram' ? openId : undefined,
        isMiniProgram,
      }),
    });

    const wechatPayData = await wechatPayResponse.json();

    if (!wechatPayData.success) {
      console.error('WeChat Pay error:', wechatPayData);
      throw new Error(wechatPayData.error || 'Failed to create payment');
    }

    console.log('Prepaid recharge order created successfully:', orderNo);

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        packageName: pkg.package_name,
        price: pkg.price,
        totalValue: pkg.total_value,
        codeUrl: wechatPayData.codeUrl,
        h5Url: wechatPayData.h5Url,
        jsapiPayParams: wechatPayData.jsapiPayParams,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-prepaid-recharge-order:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
