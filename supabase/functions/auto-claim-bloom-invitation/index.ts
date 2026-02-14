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
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already a partner (idempotent)
    const { data: existingPartner } = await adminClient
      .from('partners')
      .select('id, partner_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPartner) {
      return new Response(
        JSON.stringify({ matched: false, already_partner: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user phone from profiles
    const { data: profile } = await adminClient
      .from('profiles')
      .select('phone, phone_country_code, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.phone) {
      return new Response(
        JSON.stringify({ matched: false, reason: 'no_phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone: extract last 11 digits
    const normalizePhone = (p: string): string => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 11 ? digits.slice(-11) : digits;
    };

    const userPhoneNorm = normalizePhone(profile.phone);

    // Find matching pending bloom invitation
    const { data: invitations } = await adminClient
      .from('partner_invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('partner_type', 'bloom');

    if (!invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ matched: false, reason: 'no_pending_invitations' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match by normalized phone
    const matchedInvitation = invitations.find(inv => {
      if (!inv.invitee_phone) return false;
      return normalizePhone(inv.invitee_phone) === userPhoneNorm;
    });

    if (!matchedInvitation) {
      return new Response(
        JSON.stringify({ matched: false, reason: 'no_match' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === Execute claim logic (same as claim-partner-invitation) ===

    // Check expiry
    if (matchedInvitation.expires_at && new Date(matchedInvitation.expires_at) < new Date()) {
      await adminClient
        .from('partner_invitations')
        .update({ status: 'expired' })
        .eq('id', matchedInvitation.id);
      return new Response(
        JSON.stringify({ matched: false, reason: 'invitation_expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerCode = `BP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create partner record
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

    // Create bloom_partner_orders record
    const { error: orderError } = await adminClient
      .from('bloom_partner_orders')
      .insert({
        user_id: userId,
        partner_id: partner.id,
        order_amount: matchedInvitation.order_amount || 19800,
        delivery_status: 'pending',
        emotion_status: 'pending',
        identity_status: 'pending',
        life_status: 'pending',
      });

    if (orderError) {
      console.error('Failed to create bloom order:', orderError);
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
      .eq('id', matchedInvitation.id);

    // Grant wealth block assessment benefit
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

    console.log(`Auto-claimed bloom invitation for user ${userId}, phone match: ${userPhoneNorm}, invitation: ${matchedInvitation.invite_code}`);

    return new Response(
      JSON.stringify({
        matched: true,
        success: true,
        message: '恭喜您成为绽放合伙人！',
        partner_id: partner.id,
        partner_code: partnerCode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-claim error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '系统错误' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
