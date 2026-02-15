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

    // 从规则表动态获取有劲L1的预购名额
    const { data: l1Rule } = await adminClient
      .from('partner_level_rules')
      .select('min_prepurchase')
      .eq('partner_type', 'youjin')
      .eq('level_name', 'L1')
      .eq('is_active', true)
      .single();

    const l1PrepurchaseCount = l1Rule?.min_prepurchase ?? 100;

    // Check if already a partner (idempotent)
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
          JSON.stringify({ matched: false, already_partner: true }),
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
          prepurchase_count: l1PrepurchaseCount,
          source: 'manual',
        })
        .eq('id', existingPartner.id);
      existingPartnerId = existingPartner.id;
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

    // Normalize phone based on country code
    const normalizePhone = (p: string, countryCode: string = '+86'): string => {
      const digits = p.replace(/\D/g, '');
      if (countryCode === '+86') {
        return digits.length >= 11 ? digits.slice(-11) : digits;
      }
      return digits;
    };

    const userCountryCode = profile.phone_country_code || '+86';
    const userPhoneNorm = normalizePhone(profile.phone, userCountryCode);

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

    // Match by normalized phone + country code
    const matchedInvitation = invitations.find(inv => {
      if (!inv.invitee_phone) return false;
      const invCountryCode = inv.invitee_phone_country_code || '+86';
      // Only match if country codes are the same
      if (invCountryCode !== userCountryCode) return false;
      return normalizePhone(inv.invitee_phone, invCountryCode) === userPhoneNorm;
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

    let partnerId: string;
    let partnerCode: string;

    if (existingPartnerId) {
      partnerId = existingPartnerId;
      const { data: upgraded } = await adminClient
        .from('partners')
        .select('partner_code')
        .eq('id', existingPartnerId)
        .single();
      partnerCode = upgraded?.partner_code || '';
    } else {
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
          prepurchase_count: l1PrepurchaseCount,
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

    // Create bloom_partner_orders record
    const { error: orderError } = await adminClient
      .from('bloom_partner_orders')
      .insert({
        user_id: userId,
        partner_id: partnerId,
        order_amount: matchedInvitation.order_amount || 19800,
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

    console.log(`Auto-claimed bloom invitation for user ${userId}, phone match: ${userPhoneNorm}, invitation: ${matchedInvitation.invite_code}${existingPartnerId ? ' (upgraded from youjin)' : ''}`);

    return new Response(
      JSON.stringify({
        matched: true,
        success: true,
        message: existingPartnerId ? '恭喜您升级为绽放合伙人！' : '恭喜您成为绽放合伙人！',
        partner_id: partnerId,
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
