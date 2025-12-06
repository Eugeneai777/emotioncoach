import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 验证 JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // 用 anon key 验证用户身份
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ 认证失败:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { partner_code } = await req.json();

    if (!partner_code) {
      return new Response(
        JSON.stringify({ error: 'Missing partner_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 只能为自己处理推荐关系
    const referred_user_id = user.id;
    console.log(`📝 处理推荐: 用户 ${referred_user_id} 使用推广码 ${partner_code}`);

    // 使用 service role 进行数据库操作
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 验证推广码，查找合伙人
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('partner_code', partner_code)
      .eq('status', 'active')
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError);
      return new Response(
        JSON.stringify({ error: 'Invalid partner code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 防止自推荐
    if (partner.user_id === referred_user_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot refer yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 检查用户是否已被推荐
    const { data: existingReferral } = await supabase
      .from('partner_referrals')
      .select('id')
      .eq('referred_user_id', referred_user_id)
      .single();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ message: 'User already referred', referral_id: existingReferral.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 创建一级推荐关系
    const { data: l1Referral, error: l1Error } = await supabase
      .from('partner_referrals')
      .insert({
        partner_id: partner.id,
        referred_user_id: referred_user_id,
        level: 1
      })
      .select()
      .single();

    if (l1Error) {
      console.error('Error creating L1 referral:', l1Error);
      throw l1Error;
    }

    // 4. 更新合伙人直推统计
    await supabase
      .from('partners')
      .update({ total_referrals: partner.total_referrals + 1 })
      .eq('id', partner.id);

    // 5. 查找推荐人的上级（二级）
    const { data: parentReferral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', partner.user_id)
      .single();

    if (parentReferral && parentReferral.partners) {
      // 创建二级推荐关系
      const { data: l2Referral, error: l2Error } = await supabase
        .from('partner_referrals')
        .insert({
          partner_id: parentReferral.partner_id,
          referred_user_id: referred_user_id,
          parent_referral_id: l1Referral.id,
          level: 2
        })
        .select()
        .single();

      if (!l2Error && l2Referral) {
        // 更新二级合伙人统计
        await supabase
          .from('partners')
          .update({ 
            total_l2_referrals: (parentReferral.partners as any).total_l2_referrals + 1 
          })
          .eq('id', parentReferral.partner_id);
      }
    }

    console.log(`✅ 推荐关系创建成功: ${referred_user_id} → ${partner.partner_code}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        referral_id: l1Referral.id,
        partner_name: partner.partner_code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-referral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
