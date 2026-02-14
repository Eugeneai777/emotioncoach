import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: '用户验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing self-redeem for user ${user.id}`);

    // Check if user is an active partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, user_id, status, prepurchase_count')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError);
      return new Response(
        JSON.stringify({ success: false, message: '你还不是合伙人' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (partner.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, message: '合伙人状态未激活' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!partner.prepurchase_count || partner.prepurchase_count < 1) {
      return new Response(
        JSON.stringify({ success: false, message: '体验包名额不足' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read experience package items from database
    const { data: experienceItems, error: itemsError } = await supabase
      .from('partner_experience_items')
      .select('item_key, package_key, name')
      .eq('is_active', true)
      .order('display_order');

    if (itemsError) {
      console.error('Failed to fetch experience items:', itemsError);
      return new Response(
        JSON.stringify({ success: false, message: '获取体验包配置失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Separate basic (subscription) from assessment items (orders)
    const basicItem = experienceItems.find((i: any) => i.package_key === 'basic');
    const assessmentItems = experienceItems.filter((i: any) => i.package_key !== 'basic');
    const assessmentKeys = assessmentItems.map((i: any) => i.package_key);

    console.log(`Experience items from DB: basic=${!!basicItem}, assessments=${assessmentKeys.join(',')}`);

    // Check if user already has all products
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('subscription_type', 'basic')
      .eq('status', 'active')
      .maybeSingle();

    const { data: existingOrders } = await supabase
      .from('orders')
      .select('package_key')
      .eq('user_id', user.id)
      .in('package_key', assessmentKeys)
      .eq('status', 'paid');

    const existingAssessmentKeys = (existingOrders || []).map((o: any) => o.package_key);
    const hasAllAssessments = assessmentKeys.every((k: string) => existingAssessmentKeys.includes(k));

    if (existingSubscription && hasAllAssessments) {
      return new Response(
        JSON.stringify({ success: false, message: '你已经拥有全部体验包产品了' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const grantedItems: string[] = [];

    // 1. Grant AI quota (basic subscription) if not already owned
    if (basicItem && !existingSubscription) {
      const { data: basicPackage } = await supabase
        .from('packages')
        .select('id, package_name, ai_quota, duration_days')
        .eq('package_key', 'basic')
        .single();

      const quotaAmount = basicPackage?.ai_quota || 50;
      const durationDays = basicPackage?.duration_days || 365;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          package_id: basicPackage?.id,
          subscription_type: 'basic',
          status: 'active',
          total_quota: quotaAmount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          combo_name: '体验套餐（自用兑换）'
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
      }

      // Add quota to user account
      const { data: userAccount, error: accountError } = await supabase
        .from('user_accounts')
        .select('id, total_quota')
        .eq('user_id', user.id)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError;
      }

      if (userAccount) {
        await supabase
          .from('user_accounts')
          .update({
            total_quota: userAccount.total_quota + quotaAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_accounts')
          .insert({
            user_id: user.id,
            total_quota: quotaAmount,
            used_quota: 0
          });
      }

      grantedItems.push(`尝鲜会员（${quotaAmount}点）`);
      console.log(`Granted ${quotaAmount} AI quota to user ${user.id}`);
    }

    // 2. Grant assessments if not already owned (dynamically from DB)
    for (const item of assessmentItems) {
      if (existingAssessmentKeys.includes(item.package_key)) {
        console.log(`Skipping ${item.package_key} - user already owns it`);
        continue;
      }

      const orderNo = `SELF${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          package_key: item.package_key,
          package_name: item.name,
          amount: 0,
          status: 'paid',
          paid_at: new Date().toISOString(),
          order_no: orderNo
        });

      if (!orderError) {
        grantedItems.push(item.name);
        console.log(`Granted ${item.package_key} to user ${user.id}`);
      } else {
        console.error(`Failed to grant ${item.package_key}:`, orderError);
      }
    }

    // 3. Deduct prepurchase_count
    await supabase
      .from('partners')
      .update({
        prepurchase_count: partner.prepurchase_count - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner.id);

    console.log(`Self-redeem completed for user ${user.id}. Granted: ${grantedItems.join(', ')}. Deducted 1 from partner ${partner.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '兑换成功！',
        granted_items: grantedItems
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Self-redeem error:', error);
    const message = error instanceof Error ? error.message : '兑换失败';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
