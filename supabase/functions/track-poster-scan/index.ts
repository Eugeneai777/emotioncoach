import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { poster_id, partner_id, referrer } = await req.json();

    if (!poster_id || !partner_id) {
      return new Response(
        JSON.stringify({ error: 'poster_id and partner_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user agent and create IP hash (for deduplication, not storing actual IP)
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    
    // Simple hash of IP for deduplication (not storing actual IP for privacy)
    const ipHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(forwardedFor + new Date().toDateString())
    ).then(buf => 
      Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
    );

    // Insert scan log
    const { error: insertError } = await supabase
      .from('poster_scan_logs')
      .insert({
        poster_id,
        partner_id,
        user_agent: userAgent.slice(0, 500),
        ip_hash: ipHash,
        referrer: referrer?.slice(0, 500) || null,
      });

    if (insertError) {
      console.error('Failed to insert scan log:', insertError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('track-poster-scan error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
