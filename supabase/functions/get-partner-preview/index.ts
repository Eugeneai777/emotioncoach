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
    const url = new URL(req.url);
    let partnerId = url.searchParams.get('partner_id');

    // Also support POST body
    if (!partnerId && req.method === 'POST') {
      const body = await req.json();
      partnerId = body.partner_id;
    }

    if (!partnerId) {
      return new Response(
        JSON.stringify({ error: '缺少合伙人ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get partner's selected_experience_packages and status
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id, status, selected_experience_packages, partner_type')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: '合伙人不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (partner.status !== 'active') {
      return new Response(
        JSON.stringify({ error: '该合伙人暂不可用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active experience items
    const { data: allItems, error: itemsError } = await adminClient
      .from('partner_experience_items')
      .select('item_key, package_key, name, value, icon, description, color_theme, category')
      .eq('is_active', true)
      .order('display_order');

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return new Response(
        JSON.stringify({ error: '获取权益信息失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by partner's selected packages
    const selectedKeys: string[] = partner.selected_experience_packages || [];
    const items = selectedKeys.length > 0
      ? (allItems || []).filter(item => selectedKeys.includes(item.package_key))
      : (allItems || []);

    return new Response(
      JSON.stringify({
        partner_type: partner.partner_type,
        items: items.map(item => ({
          item_key: item.item_key,
          name: item.name,
          value: item.value,
          icon: item.icon,
          description: item.description,
          color_theme: item.color_theme,
          category: item.category,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('get-partner-preview error:', error);
    return new Response(
      JSON.stringify({ error: '系统错误' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
