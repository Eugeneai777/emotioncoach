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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Admin access required');
    }

    const { userId, quantity, packageType, notes, expiryDays } = await req.json();

    if (!userId || !quantity || quantity <= 0) {
      throw new Error('Invalid parameters');
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update user_accounts
    const { data: account, error: accountError } = await supabaseAdmin
      .from('user_accounts')
      .select('total_quota, remaining_quota')
      .eq('user_id', userId)
      .single();

    if (accountError) throw accountError;

    const newTotalQuota = account.total_quota + quantity;
    const newRemainingQuota = (account.remaining_quota || 0) + quantity;

    const updateData: any = {
      total_quota: newTotalQuota,
      remaining_quota: newRemainingQuota,
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

    // Create subscription record for tracking
    const subscriptionData: any = {
      user_id: userId,
      subscription_type: packageType,
      total_quota: quantity,
      combo_name: `管理员充值 - ${packageType}`,
      status: 'active',
      start_date: new Date().toISOString(),
    };

    if (expiryDays) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + expiryDays);
      subscriptionData.end_date = endDate.toISOString();
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData);

    if (subscriptionError) {
      console.error('Subscription record error:', subscriptionError);
      // Don't fail the whole operation if subscription tracking fails
    }

    console.log(`Admin ${user.id} recharged ${quantity} for user ${userId}. Notes: ${notes || 'none'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newTotalQuota,
        newRemainingQuota 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Recharge error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
