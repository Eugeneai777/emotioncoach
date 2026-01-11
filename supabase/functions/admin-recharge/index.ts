import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Authorization header exists
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Authentication failed: Auth session missing!');
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated by extracting JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user) {
      console.error('No user found in request');
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
      throw new Error(`Failed to verify admin role: ${roleError.message}`);
    }
    
    if (!roleData) {
      console.error('User is not an admin:', user.id);
      throw new Error('Admin access required');
    }

    console.log('Admin verified:', user.id);

    const { userId, quantity, packageType, notes, expiryDays } = await req.json();

    if (!userId || !quantity || quantity <= 0) {
      throw new Error('Invalid parameters');
    }

    // Update user_accounts (using already created supabaseAdmin)
    const { data: account, error: accountError } = await supabaseAdmin
      .from('user_accounts')
      .select('total_quota, used_quota')
      .eq('user_id', userId)
      .single();

    if (accountError) throw accountError;

    const newTotalQuota = account.total_quota + quantity;
    // remaining_quota is a generated column (total_quota - used_quota), don't update it directly

    const updateData: any = {
      total_quota: newTotalQuota,
      updated_at: new Date().toISOString()
    };

    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      updateData.quota_expires_at = expiryDate.toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_accounts')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // 获取 custom 套餐的 package_id
    const { data: customPackage } = await supabaseAdmin
      .from('packages')
      .select('id')
      .eq('package_key', 'custom')
      .single();

    // Create subscription record for tracking
    const subscriptionData: any = {
      user_id: userId,
      subscription_type: packageType,
      package_id: packageType === 'custom' ? customPackage?.id : null,
      total_quota: quantity,
      combo_amount: quantity, // 确保金额字段有值
      combo_name: `管理员充值 - ${packageType}`,
      status: 'active',
      start_date: new Date().toISOString(),
    };

    if (expiryDays) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + expiryDays);
      subscriptionData.end_date = endDate.toISOString();
    }

    let subscriptionWarning = null;
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData);

    if (subscriptionError) {
      console.error('Subscription record error:', subscriptionError);
      subscriptionWarning = `订阅记录创建失败: ${subscriptionError.message}`;
    }

    console.log(`Admin ${user.id} recharged ${quantity} for user ${userId}. Notes: ${notes || 'none'}`);

    // Calculate remaining quota (generated column formula: total_quota - used_quota)
    const newRemainingQuota = newTotalQuota - account.used_quota;

    return new Response(
      JSON.stringify({ 
        success: true, 
        newTotalQuota,
        newRemainingQuota,
        warning: subscriptionWarning
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Recharge error:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    const isAuthError = errorMessage.includes('Authentication failed') || 
                       errorMessage.includes('User not authenticated') ||
                       errorMessage.includes('Admin access required');
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: isAuthError ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
