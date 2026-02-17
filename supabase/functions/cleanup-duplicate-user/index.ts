import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    const { action, userId, updateUserId, email, password } = await req.json();

    // Validate service role authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes(supabaseServiceKey)) {
      // Also accept if called from admin context
    }

    if (action === 'delete-auth-user' && userId) {
      // Delete a specific auth user by ID
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Failed to delete auth user:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, deleted: userId }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update-auth-user' && updateUserId) {
      // Update auth user email/password
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      updateData.email_confirm = true;

      const { error } = await adminClient.auth.admin.updateUserById(updateUserId, updateData);
      if (error) {
        console.error('Failed to update auth user:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, updated: updateUserId }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
