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
    // Get user from JWT
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

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: '用户验证失败' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { partner_id } = await req.json();

    if (!partner_id) {
      return new Response(
        JSON.stringify({ success: false, message: '缺少合伙人ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing free claim for user ${user.id} from partner ${partner_id}`);

    // Check if partner exists and get entry config
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, user_id, prepurchase_count, total_referrals, selected_experience_packages')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError);
      return new Response(
        JSON.stringify({ success: false, message: '合伙人不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-referral — return 200 so frontend can parse message
    if (partner.user_id === user.id) {
      return new Response(
        JSON.stringify({ success: false, message: '不能领取自己的推广福利' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if partner has enough prepurchase_count
    if (!partner.prepurchase_count || partner.prepurchase_count < 1) {
      return new Response(
        JSON.stringify({ success: false, message: '合伙人体验名额已用完' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already referred
    const { data: existingReferral } = await supabase
      .from('partner_referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .maybeSingle();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ success: false, message: '你已经领取过了' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read experience package items from database for default list
    const { data: experienceItems, error: itemsError } = await supabase
      .from('partner_experience_items')
      .select('item_key, package_key, name')
      .eq('is_active', true)
      .order('display_order');

    if (itemsError) {
      console.error('Failed to fetch experience items:', itemsError);
    }

    // Build default package keys from DB, fallback to hardcoded
    const defaultPackageKeys = experienceItems && experienceItems.length > 0
      ? experienceItems.map((i: any) => i.package_key)
      : ['basic', 'emotion_health_assessment', 'scl90_report', 'wealth_block_assessment'];

    // Get selected packages from partner config, default to all from DB
    const selectedPackages: string[] = partner.selected_experience_packages || defaultPackageKeys;

    console.log(`Partner ${partner_id} selected packages:`, selectedPackages);

    let quotaAmount = 0;
    let durationDays = 365;
    const grantedItems: string[] = [];

    // Only grant AI quota if 'basic' is selected
    if (selectedPackages.includes('basic')) {
      // Get basic package info
      const { data: basicPackage } = await supabase
        .from('packages')
        .select('id, package_name, ai_quota, duration_days')
        .eq('package_key', 'basic')
        .single();

      quotaAmount = basicPackage?.ai_quota || 50;
      durationDays = basicPackage?.duration_days || 365;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create subscription record for experience package
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
          combo_name: '体验套餐'
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

      grantedItems.push(`AI点数${quotaAmount}点`);
      console.log(`Granted ${quotaAmount} AI quota to user ${user.id}`);
    }

    // Deduct from partner's prepurchase_count
    await supabase
      .from('partners')
      .update({
        prepurchase_count: partner.prepurchase_count - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner_id);

    // Create referral record
    await supabase
      .from('partner_referrals')
      .insert({
        partner_id: partner_id,
        referred_user_id: user.id,
        level: 1,
        conversion_status: 'trial'
      });

    // Update partner referral count
    await supabase
      .from('partners')
      .update({
        total_referrals: partner.total_referrals ? partner.total_referrals + 1 : 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', partner_id);

    // Grant assessments based on selected packages (dynamically from DB)
    // Build assessment info from DB items, filtered by selectedPackages
    const assessmentItemsFromDB = experienceItems
      ? experienceItems.filter((i: any) => i.package_key !== 'basic' && selectedPackages.includes(i.package_key))
      : [
          { package_key: 'emotion_health_assessment', name: '情绪健康测评' },
          { package_key: 'scl90_report', name: 'SCL-90心理测评报告' },
          { package_key: 'wealth_block_assessment', name: '财富卡点测评' },
        ].filter(i => selectedPackages.includes(i.package_key));

    const grantedAssessments: string[] = [];

    for (const pkg of assessmentItemsFromDB) {
      // Check if user already has this assessment
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_key', pkg.package_key)
        .eq('status', 'paid')
        .maybeSingle();

      if (!existingOrder) {
        // Create gift order
        const orderNo = `YJ${Date.now()}GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            package_key: pkg.package_key,
            package_name: pkg.name,
            amount: 0,
            status: 'paid',
            paid_at: new Date().toISOString(),
            order_no: orderNo
          });

        if (!orderError) {
          grantedAssessments.push(pkg.package_key);
          grantedItems.push(pkg.name);
          console.log(`Granted ${pkg.package_key} to user ${user.id}`);
        } else {
          console.error(`Failed to grant ${pkg.package_key}:`, orderError);
        }
      }
    }

    console.log(`Successfully claimed experience package (items: ${grantedItems.join(', ')}) for user ${user.id}, deducted 1 from partner ${partner_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功领取体验套餐！`,
        granted_items: grantedItems,
        quota_amount: quotaAmount,
        duration_days: durationDays,
        included_assessments: grantedAssessments
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Claim error:', error);
    const message = error instanceof Error ? error.message : '领取失败';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
