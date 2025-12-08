import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code and user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 验证兑换码
    const { data: redemptionCode, error: codeError } = await supabase
      .from('partner_redemption_codes')
      .select('*, partners(*)')
      .eq('code', code)
      .single();

    if (codeError || !redemptionCode) {
      console.error('Redemption code not found:', codeError);
      return new Response(
        JSON.stringify({ error: '兑换码不存在或无效' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 检查兑换码状态
    if (redemptionCode.status !== 'available') {
      return new Response(
        JSON.stringify({ 
          error: redemptionCode.status === 'redeemed' ? '兑换码已被使用' : '兑换码已过期' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 检查是否过期
    if (new Date(redemptionCode.expires_at) < new Date()) {
      await supabase
        .from('partner_redemption_codes')
        .update({ status: 'expired' })
        .eq('id', redemptionCode.id);

      return new Response(
        JSON.stringify({ error: '兑换码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 检查用户是否已被其他人推荐
    const { data: existingReferral } = await supabase
      .from('partner_referrals')
      .select('id')
      .eq('referred_user_id', user_id)
      .single();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ error: '您已经被其他合伙人推荐，无法重复兑换' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取入口类型和额度
    const entryType = redemptionCode.entry_type || 'free';
    const quotaAmount = redemptionCode.quota_amount || (entryType === 'free' ? 10 : 50);
    const entryPrice = redemptionCode.entry_price || (entryType === 'free' ? 0 : 9.9);

    // 5. 标记兑换码为已使用
    const { error: updateError } = await supabase
      .from('partner_redemption_codes')
      .update({
        status: 'redeemed',
        redeemed_by: user_id,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', redemptionCode.id);

    if (updateError) {
      console.error('Failed to update redemption code:', updateError);
      throw updateError;
    }

    // 6. 给用户增加对话额度（根据入口类型）
    const { error: quotaError } = await supabase.rpc('deduct_user_quota', {
      p_user_id: user_id,
      p_amount: -quotaAmount  // 负数表示增加额度
    });

    if (quotaError) {
      console.error('Failed to add quota:', quotaError);
      // 不阻断流程，继续建立推荐关系
    }

    // 7. 建立推荐关系（关键步骤！）
    const { data: referral, error: referralError } = await supabase
      .from('partner_referrals')
      .insert({
        partner_id: redemptionCode.partner_id,
        referred_user_id: user_id,
        level: 1
      })
      .select()
      .single();

    if (referralError) {
      console.error('Failed to create referral:', referralError);
      throw referralError;
    }

    // 8. 更新合伙人直推统计
    await supabase
      .from('partners')
      .update({ 
        total_referrals: (redemptionCode.partners as any).total_referrals + 1 
      })
      .eq('id', redemptionCode.partner_id);

    // 9. 查找推荐人的上级（二级）
    const { data: parentReferral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', (redemptionCode.partners as any).user_id)
      .eq('level', 1)
      .single();

    if (parentReferral && parentReferral.partners) {
      // 创建二级推荐关系
      const { data: l2Referral } = await supabase
        .from('partner_referrals')
        .insert({
          partner_id: parentReferral.partner_id,
          referred_user_id: user_id,
          parent_referral_id: referral.id,
          level: 2
        })
        .select()
        .single();

      if (l2Referral) {
        // 更新二级合伙人统计
        await supabase
          .from('partners')
          .update({ 
            total_l2_referrals: (parentReferral.partners as any).total_l2_referrals + 1 
          })
          .eq('id', parentReferral.partner_id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `兑换成功！已获得${quotaAmount}次对话额度`,
        referral_id: referral.id,
        partner_code: (redemptionCode.partners as any).partner_code,
        entry_type: entryType,
        quota_amount: quotaAmount,
        entry_price: entryPrice
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in redeem-code:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
