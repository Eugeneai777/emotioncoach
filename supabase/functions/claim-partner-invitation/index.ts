import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

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

    // Track whether we're upgrading an existing partner
    let existingPartnerId: string | null = null;

    if (existingPartner) {
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
      // Upgrade: update existing partner to bloom type
      await adminClient
        .from('partners')
        .update({
          partner_type: 'bloom',
          partner_level: 'L0',
          commission_rate_l1: 0.30,
          commission_rate_l2: 0.10,
          source: 'manual',
        })
        .eq('id', existingPartner.id);
      existingPartnerId = existingPartner.id;
    }

    let partnerId: string;
    let partnerCode: string;

    if (existingPartnerId) {
      // Use existing partner (upgraded)
      partnerId = existingPartnerId;
      const { data: upgraded } = await adminClient
        .from('partners')
        .select('partner_code')
        .eq('id', existingPartnerId)
        .single();
      partnerCode = upgraded?.partner_code || '';
    } else {
      // Generate partner code and create new partner
      partnerCode = `BP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const { data: partner, error: partnerError } = await adminClient
        .from('partners')
        .insert({
          user_id: userId,
          partner_type: 'bloom',
          partner_level: 'L0',
          partner_code: partnerCode,
          commission_rate_l1: 0.30,
          commission_rate_l2: 0.10,
          status: 'active',
          source: 'manual',
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
      partnerId = partner.id;
    }

    // Create bloom_partner_orders record for delivery tracking
    const { error: orderError } = await adminClient
      .from('bloom_partner_orders')
      .insert({
        user_id: userId,
        partner_id: partnerId,
        order_amount: invitation.order_amount || 19800,
        delivery_status: 'pending',
        emotion_status: 'pending',
        identity_status: 'pending',
        life_status: 'pending',
      });

    if (orderError) {
      console.error('Failed to create bloom order:', orderError);
      if (!existingPartnerId) {
        await adminClient.from('partners').delete().eq('id', partnerId);
      }
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

    // Grant wealth block assessment benefit (free order)
    await adminClient.from('orders').insert({
      user_id: userId,
      package_key: 'wealth_block_assessment',
      package_name: '财富卡点测评',
      amount: 0,
      order_no: `BLOOM-WB-${Date.now()}`,
      status: 'paid',
      paid_at: new Date().toISOString(),
      order_type: 'partner_benefit',
      product_name: '财富卡点测评（绽放合伙人权益）',
    });

    // Grant 7-day wealth camp benefit
    await adminClient.from('user_camp_purchases').insert({
      user_id: userId,
      camp_type: 'wealth_block_7',
      camp_name: '7天财富突破训练营',
      purchase_price: 0,
      payment_method: 'partner_benefit',
      payment_status: 'completed',
    });

    console.log(`Partner invitation claimed: ${invite_code} by user ${userId}, benefits granted${existingPartnerId ? ' (upgraded from youjin)' : ''}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: existingPartnerId ? '恭喜您升级为绽放合伙人！' : '恭喜您成为绽放合伙人！',
        partner_id: partnerId,
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
