import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Parse request body
    const { invite_code } = await req.json();

    if (!invite_code) {
      return new Response(
        JSON.stringify({ error: '缺少邀请码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if invitation exists and is valid
    const { data: invitation, error: inviteError } = await adminClient
      .from('partner_invitations')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found:', inviteError);
      return new Response(
        JSON.stringify({ error: '邀请码无效或不存在' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.status === 'claimed') {
      return new Response(
        JSON.stringify({ error: '该邀请码已被使用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.status === 'expired') {
      return new Response(
        JSON.stringify({ error: '该邀请码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await adminClient
        .from('partner_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ error: '该邀请码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a partner
    const { data: existingPartner } = await adminClient
      .from('partners')
      .select('id, partner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPartner) {
      // If already a bloom partner, return success
      if (existingPartner.partner_type === 'bloom') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '您已经是绽放合伙人',
            already_partner: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // If youjin partner, could upgrade - for now just return error
      return new Response(
        JSON.stringify({ error: '您已是其他类型的合伙人' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for display name
    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    const displayName = profile?.display_name || invitation.invitee_name || '绽放合伙人';

    // Generate partner code
    const partnerCode = `BP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create partner record
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .insert({
        user_id: userId,
        partner_type: 'bloom',
        partner_level: 'L0',
        partner_name: displayName,
        partner_code: partnerCode,
        commission_rate_l1: 0.30,
        commission_rate_l2: 0.10,
        status: 'active',
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (partnerError) {
      console.error('Failed to create partner:', partnerError);
      return new Response(
        JSON.stringify({ error: '创建合伙人记录失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create bloom_partner_orders record for delivery tracking
    const { error: orderError } = await adminClient
      .from('bloom_partner_orders')
      .insert({
        user_id: userId,
        partner_id: partner.id,
        order_amount: invitation.order_amount || 19800,
        delivery_status: 'pending',
        emotion_status: 'pending',
        identity_status: 'pending',
        life_status: 'pending',
      });

    if (orderError) {
      console.error('Failed to create bloom order:', orderError);
      // Rollback partner creation
      await adminClient.from('partners').delete().eq('id', partner.id);
      return new Response(
        JSON.stringify({ error: '创建订单记录失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update invitation status
    await adminClient
      .from('partner_invitations')
      .update({
        status: 'claimed',
        claimed_by: userId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    console.log(`Partner invitation claimed: ${invite_code} by user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '恭喜您成为绽放合伙人！',
        partner_id: partner.id,
        partner_code: partnerCode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Claim invitation error:', error);
    const errorMessage = error instanceof Error ? error.message : '系统错误';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
