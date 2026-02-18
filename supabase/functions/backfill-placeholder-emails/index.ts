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

    // Auth: require DATA_API_KEY in x-api-key header, or admin user
    const apiKey = req.headers.get('x-api-key');
    const dataApiKey = Deno.env.get('DATA_API_KEY');
    const authHeader = req.headers.get('Authorization');
    
    let isAuthorized = false;

    // Check DATA_API_KEY
    if (apiKey && dataApiKey && apiKey === dataApiKey) {
      isAuthorized = true;
    }

    // Check admin auth
    if (!isAuthorized && authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const adminClient2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await adminClient2
          .from('user_roles').select('role')
          .eq('user_id', user.id).eq('role', 'admin').limit(1);
        if (roleData && roleData.length > 0) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find profiles with phone
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, phone, phone_country_code')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: '没有需要处理的用户' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: { phone: string; status: string; reason?: string }[] = [];

    for (const profile of profiles) {
      try {
        const { data: { user: authUser }, error: getUserErr } = 
          await adminClient.auth.admin.getUserById(profile.id);
        
        if (getUserErr || !authUser) {
          results.push({ phone: profile.phone, status: 'skipped', reason: 'auth user not found' });
          continue;
        }

        if (authUser.email) {
          continue; // Already has email, skip silently
        }

        const countryCode = (profile.phone_country_code || '+86').replace('+', '');
        const placeholderEmail = `phone_${countryCode}${profile.phone}@youjin.app`;

        const { error: updateErr } = await adminClient.auth.admin.updateUserById(profile.id, {
          email: placeholderEmail,
          email_confirm: true,
        });

        if (updateErr) {
          results.push({ phone: profile.phone, status: 'failed', reason: updateErr.message });
        } else {
          results.push({ phone: profile.phone, status: 'success' });
          console.log(`Backfilled email for ${profile.phone}: ${placeholderEmail}`);
        }
      } catch (err) {
        results.push({ phone: profile.phone, status: 'failed', reason: err instanceof Error ? err.message : 'unknown' });
      }
    }

    const summary = {
      total: profiles.length,
      updated: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      details: results.filter(r => r.status !== 'skipped' || r.status === 'failed'),
    };

    return new Response(JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '系统错误' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
