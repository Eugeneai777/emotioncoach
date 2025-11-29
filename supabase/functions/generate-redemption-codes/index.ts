import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

// 生成6位随机兑换码
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除容易混淆的字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 根据预购数量确定等级
function determineLevel(count: number): string {
  if (count >= 1000) return 'L3';
  if (count >= 500) return 'L2';
  if (count >= 100) return 'L1';
  return 'L0';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partner_id, count } = await req.json();

    if (!partner_id || !count || count < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid partner_id or count' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 验证合伙人
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partner_id)
      .eq('partner_type', 'youjin')
      .single();

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: '合伙人不存在或类型错误' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 批量生成唯一兑换码
    const codes: string[] = [];
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1年有效期

    const existingCodes = new Set<string>();
    const { data: existing } = await supabase
      .from('partner_redemption_codes')
      .select('code');
    
    if (existing) {
      existing.forEach(item => existingCodes.add(item.code));
    }

    // 生成唯一的兑换码
    while (codes.length < count) {
      const code = generateCode();
      if (!existingCodes.has(code)) {
        codes.push(code);
        existingCodes.add(code);
      }
    }

    // 3. 批量插入兑换码
    const redemptionCodes = codes.map(code => ({
      partner_id,
      code,
      expires_at: expiresAt.toISOString(),
      status: 'available'
    }));

    const { error: insertError } = await supabase
      .from('partner_redemption_codes')
      .insert(redemptionCodes);

    if (insertError) {
      console.error('Failed to insert redemption codes:', insertError);
      throw insertError;
    }

    // 4. 更新合伙人信息
    const newLevel = determineLevel(partner.prepurchase_count + count);
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        prepurchase_count: partner.prepurchase_count + count,
        partner_level: newLevel,
        prepurchase_expires_at: expiresAt.toISOString()
      })
      .eq('id', partner_id);

    if (updateError) {
      console.error('Failed to update partner:', updateError);
      throw updateError;
    }

    // 5. 根据等级更新佣金比例
    const { data: levelRule } = await supabase
      .from('partner_level_rules')
      .select('*')
      .eq('partner_type', 'youjin')
      .eq('level_name', newLevel)
      .single();

    if (levelRule) {
      await supabase
        .from('partners')
        .update({
          commission_rate_l1: levelRule.commission_rate_l1,
          commission_rate_l2: levelRule.commission_rate_l2
        })
        .eq('id', partner_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        count: codes.length,
        level: newLevel,
        expires_at: expiresAt.toISOString(),
        codes: codes  // 返回生成的兑换码列表
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-redemption-codes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});