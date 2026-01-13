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
    const { sceneStr } = await req.json();

    if (!sceneStr) {
      return new Response(
        JSON.stringify({ error: '缺少sceneStr参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询场景状态
    const { data: scene, error } = await supabase
      .from('wechat_login_scenes')
      .select('*')
      .eq('scene_str', sceneStr)
      .single();

    if (error || !scene) {
      return new Response(
        JSON.stringify({ status: 'expired', message: '二维码已过期' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查是否过期
    if (new Date(scene.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ status: 'expired', message: '二维码已过期' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 如果已确认登录，生成一次性 token_hash 让前端完成 Supabase 登录
    if (scene.status === 'confirmed' && scene.user_id) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(scene.user_id);

      if (userError || !userData?.user?.email) {
        console.error('Failed to get user email:', userError);
        return new Response(
          JSON.stringify({ status: 'expired', message: '登录信息无效，请重新扫码' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const redirectTo = `${(new URL(req.url)).origin}/`;
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
        options: { redirectTo },
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error('Failed to generate magic link:', linkError);
        return new Response(
          JSON.stringify({ status: 'expired', message: '生成登录凭证失败，请重试' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          status: 'confirmed',
          userId: scene.user_id,
          email: userData.user.email,
          tokenHash: linkData.properties.hashed_token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // 如果是未注册状态，提示用户先注册
    if (scene.status === 'not_registered') {
      return new Response(
        JSON.stringify({ status: 'not_registered', message: '该微信未注册，请先注册' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 如果已扫码但未确认
    if (scene.status === 'scanned') {
      return new Response(
        JSON.stringify({ status: 'scanned', message: '已扫码，请在微信中确认' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 仍在等待扫码
    return new Response(
      JSON.stringify({ status: 'pending', message: '等待扫码' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('检查登录状态失败:', error);
    const message = error instanceof Error ? error.message : '检查状态失败';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
