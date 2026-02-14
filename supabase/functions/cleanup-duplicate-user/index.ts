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
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // One-time cleanup - validate with a simple check
    const { action } = await req.json();
    if (action !== 'delete-gene-duplicate') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // First try to remove identities, then delete user
    const geneUserId = '460ae18d-0c93-444c-befb-a2942f38221f';
    
    // List and delete user identities first
    const { data: userData } = await adminClient.auth.admin.getUserById(geneUserId);
    console.log('User data:', JSON.stringify(userData));
    
    if (userData?.user?.identities) {
      for (const identity of userData.user.identities) {
        console.log(`Deleting identity: ${identity.id}, provider: ${identity.provider}`);
        await adminClient.auth.admin.deleteUser(geneUserId, true); // soft delete first
      }
    }
    
    const { error } = await adminClient.auth.admin.deleteUser(geneUserId);
    
    if (error) {
      console.error('Failed to delete auth user:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, deleted: geneUserId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
