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
        JSON.stringify({ hasPending: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ hasPending: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Already a bloom partner? No need to prompt.
    const { data: existingPartner } = await adminClient
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('partner_type', 'bloom')
      .limit(1);

    if (existingPartner && existingPartner.length > 0) {
      return new Response(
        JSON.stringify({ hasPending: false, reason: 'already_partner' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's phone from profiles
    const { data: profile } = await adminClient
      .from('profiles')
      .select('phone, phone_country_code')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.phone) {
      return new Response(
        JSON.stringify({ hasPending: false, reason: 'no_phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizePhone = (p: string, countryCode: string = '+86'): string => {
      const digits = p.replace(/\D/g, '');
      if (countryCode === '+86') {
        return digits.length >= 11 ? digits.slice(-11) : digits;
      }
      return digits;
    };

    const userCountryCode = profile.phone_country_code || '+86';
    const userPhoneNorm = normalizePhone(profile.phone, userCountryCode);

    // Fetch pending bloom invitations and match by phone
    const { data: invitations } = await adminClient
      .from('partner_invitations')
      .select('invitee_phone, invitee_phone_country_code')
      .eq('status', 'pending')
      .eq('partner_type', 'bloom');

    const hasPending = (invitations ?? []).some(inv => {
      if (!inv.invitee_phone) return false;
      const invCountryCode = inv.invitee_phone_country_code || '+86';
      if (invCountryCode !== userCountryCode) return false;
      return normalizePhone(inv.invitee_phone, invCountryCode) === userPhoneNorm;
    });

    return new Response(
      JSON.stringify({ hasPending }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check pending bloom invite error:', error);
    return new Response(
      JSON.stringify({ hasPending: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
