import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders, validateServiceRole } from '../_shared/auth.ts'

// 判断产品线 - 与 wechat-pay-callback 中的 package_key 保持一致
function getProductLine(orderType: string): 'youjin' | 'bloom' {
  // 有劲产品线：会员、测评、训练营、有劲合伙人
  const youjinProducts = [
    'basic', 'member365', 'trial', 'package_trial', 'package_365',
    'ai_coach_upgrade',
    'wealth_block_assessment', 'scl90_report', 'emotion_health_assessment',
    'camp-emotion_journal_21', 'wealth_camp_7day',
    'youjin_partner_l1', 'youjin_partner_l2', 'youjin_partner_l3'
  ];
  // 绽放产品线：绽放合伙人
  const bloomProducts = ['partner', 'partner_package', 'bloom_partner'];
  
  if (youjinProducts.includes(orderType)) return 'youjin';
  if (bloomProducts.includes(orderType)) return 'bloom';
  return 'youjin';
}

// 检查绽放合伙人是否应获得有劲产品佣金（绽放合伙人自动拥有有劲 L1 权益）
function shouldBloomGetYoujinCommission(partnerType: string, productLine: string): boolean {
  return partnerType === 'bloom' && productLine === 'youjin';
}

// 获取绽放合伙人推广有劲产品时的佣金率（固定 L1 级别：18%）
const BLOOM_YOUJIN_L1_RATE = 0.18;

// 获取产品专属佣金率，如果未配置则回退到等级默认值
async function getCommissionRates(
  supabase: any,
  partnerLevelRuleId: string,
  packageKey: string,
  defaultL1: number,
  defaultL2: number
): Promise<{ l1: number; l2: number } | null> {
  // 1. 先查产品专属配置
  const { data: productConfig } = await supabase
    .from('partner_product_commissions')
    .select('commission_rate_l1, commission_rate_l2, is_enabled')
    .eq('partner_level_rule_id', partnerLevelRuleId)
    .eq('package_key', packageKey)
    .maybeSingle();

  if (productConfig) {
    // 产品被禁用，不参与分成
    if (!productConfig.is_enabled) {
      console.log(`Product ${packageKey} is disabled for this level, skipping commission`);
      return null;
    }
    return {
      l1: parseFloat(productConfig.commission_rate_l1),
      l2: parseFloat(productConfig.commission_rate_l2)
    };
  }

  // 2. 未配置，使用等级默认佣金率
  console.log(`No product config for ${packageKey}, using level defaults: L1=${defaultL1}, L2=${defaultL2}`);
  return { l1: defaultL1, l2: defaultL2 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate that this is an internal service call
  const authError = validateServiceRole(req);
  if (authError) return authError;

  try {
    const { order_id, user_id, order_amount, order_type } = await req.json();

    if (!order_id || !user_id || !order_amount || !order_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const amount = parseFloat(order_amount);
    const confirmDate = new Date();
    confirmDate.setDate(confirmDate.getDate() + 21);

    const commissions = [];
    const productLine = getProductLine(order_type);

    console.log(`Processing commission for order ${order_id}, product: ${order_type}, line: ${productLine}`);

    // L1 推荐人
    const { data: l1Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 1)
      .single();

    if (l1Referral && l1Referral.partners) {
      const partner = l1Referral.partners as any;
      
      // 检查是否应计算佣金：产品线匹配 或 绽放合伙人推广有劲产品
      const isMatchingProductLine = partner.partner_type === productLine;
      const isBloomPromotingYoujin = shouldBloomGetYoujinCommission(partner.partner_type, productLine);
      
      if (isMatchingProductLine || isBloomPromotingYoujin) {
        // 绽放合伙人推广有劲产品时使用固定 L1 佣金率
        if (isBloomPromotingYoujin) {
          const commissionRate = BLOOM_YOUJIN_L1_RATE;
          const commissionAmount = amount * commissionRate;

          console.log(`Bloom partner ${partner.id} promoting youjin product, using L1 rate: ${commissionRate}`);

          const { data: commission, error: commError } = await supabase
            .from('partner_commissions')
            .insert({
              partner_id: partner.id,
              order_id,
              order_type,
              source_user_id: user_id,
              commission_level: 1,
              order_amount: amount,
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              status: 'pending',
              confirm_at: confirmDate.toISOString(),
              product_line: productLine
            })
            .select()
            .single();

          if (!commError && commission) {
            await supabase.rpc('add_partner_pending_balance', {
              p_partner_id: partner.id,
              p_amount: commissionAmount
            });
            commissions.push(commission);
            console.log(`L1 commission (bloom->youjin) created: ¥${commissionAmount.toFixed(2)} (${(commissionRate * 100).toFixed(0)}%)`);
          }
        } else {
          // 原有逻辑：产品线匹配时的佣金计算
          // 获取合伙人等级规则ID
          const { data: levelRule } = await supabase
            .from('partner_level_rules')
            .select('id, commission_rate_l1, commission_rate_l2')
            .eq('partner_type', partner.partner_type)
            .eq('level_name', partner.partner_level)
            .maybeSingle();

          if (levelRule) {
            const defaultL1 = parseFloat(levelRule.commission_rate_l1);
            const defaultL2 = parseFloat(levelRule.commission_rate_l2);

            // 获取产品专属佣金率（仅有劲合伙人支持产品级配置）
            let rates: { l1: number; l2: number } | null = null;
            if (partner.partner_type === 'youjin') {
              rates = await getCommissionRates(supabase, levelRule.id, order_type, defaultL1, defaultL2);
            } else {
              rates = { l1: defaultL1, l2: defaultL2 };
            }

            if (rates && rates.l1 > 0) {
              const commissionAmount = amount * rates.l1;

              const { data: commission, error: commError } = await supabase
                .from('partner_commissions')
                .insert({
                  partner_id: partner.id,
                  order_id,
                  order_type,
                  source_user_id: user_id,
                  commission_level: 1,
                  order_amount: amount,
                  commission_rate: rates.l1,
                  commission_amount: commissionAmount,
                  status: 'pending',
                  confirm_at: confirmDate.toISOString(),
                  product_line: productLine
                })
                .select()
                .single();

              if (!commError && commission) {
                await supabase.rpc('add_partner_pending_balance', {
                  p_partner_id: partner.id,
                  p_amount: commissionAmount
                });
                commissions.push(commission);
                console.log(`L1 commission created: ¥${commissionAmount.toFixed(2)} (${(rates.l1 * 100).toFixed(0)}%)`);
              }
            }
          } else {
            // 无等级规则，使用合伙人自身的佣金率
            const commissionRate = parseFloat(partner.commission_rate_l1);
            if (commissionRate > 0) {
              const commissionAmount = amount * commissionRate;

              const { data: commission, error: commError } = await supabase
                .from('partner_commissions')
                .insert({
                  partner_id: partner.id,
                  order_id,
                  order_type,
                  source_user_id: user_id,
                  commission_level: 1,
                  order_amount: amount,
                  commission_rate: commissionRate,
                  commission_amount: commissionAmount,
                  status: 'pending',
                  confirm_at: confirmDate.toISOString(),
                  product_line: productLine
                })
                .select()
                .single();

              if (!commError && commission) {
                await supabase.rpc('add_partner_pending_balance', {
                  p_partner_id: partner.id,
                  p_amount: commissionAmount
                });
                commissions.push(commission);
              }
            }
          }
        }
      }
    }

    // L2 推荐人
    const { data: l2Referral } = await supabase
      .from('partner_referrals')
      .select('partner_id, partners(*)')
      .eq('referred_user_id', user_id)
      .eq('level', 2)
      .single();

    if (l2Referral && l2Referral.partners) {
      const partner = l2Referral.partners as any;
      
      if (partner.partner_type === productLine) {
        // 获取合伙人等级规则ID
        const { data: levelRule } = await supabase
          .from('partner_level_rules')
          .select('id, commission_rate_l1, commission_rate_l2')
          .eq('partner_type', partner.partner_type)
          .eq('level_name', partner.partner_level)
          .maybeSingle();

        if (levelRule) {
          const defaultL1 = parseFloat(levelRule.commission_rate_l1);
          const defaultL2 = parseFloat(levelRule.commission_rate_l2);

          // 获取产品专属佣金率（仅有劲合伙人支持产品级配置）
          let rates: { l1: number; l2: number } | null = null;
          if (partner.partner_type === 'youjin') {
            rates = await getCommissionRates(supabase, levelRule.id, order_type, defaultL1, defaultL2);
          } else {
            rates = { l1: defaultL1, l2: defaultL2 };
          }

          if (rates && rates.l2 > 0) {
            const commissionAmount = amount * rates.l2;

            const { data: commission, error: commError } = await supabase
              .from('partner_commissions')
              .insert({
                partner_id: partner.id,
                order_id,
                order_type,
                source_user_id: user_id,
                commission_level: 2,
                order_amount: amount,
                commission_rate: rates.l2,
                commission_amount: commissionAmount,
                status: 'pending',
                confirm_at: confirmDate.toISOString(),
                product_line: productLine
              })
              .select()
              .single();

            if (!commError && commission) {
              await supabase.rpc('add_partner_pending_balance', {
                p_partner_id: partner.id,
                p_amount: commissionAmount
              });
              commissions.push(commission);
              console.log(`L2 commission created: ¥${commissionAmount.toFixed(2)} (${(rates.l2 * 100).toFixed(0)}%)`);
            }
          }
        } else {
          // 无等级规则，使用合伙人自身的佣金率
          const commissionRateL2 = parseFloat(partner.commission_rate_l2);
          if (commissionRateL2 > 0) {
            const commissionAmount = amount * commissionRateL2;

            const { data: commission, error: commError } = await supabase
              .from('partner_commissions')
              .insert({
                partner_id: partner.id,
                order_id,
                order_type,
                source_user_id: user_id,
                commission_level: 2,
                order_amount: amount,
                commission_rate: commissionRateL2,
                commission_amount: commissionAmount,
                status: 'pending',
                confirm_at: confirmDate.toISOString(),
                product_line: productLine
              })
              .select()
              .single();

            if (!commError && commission) {
              await supabase.rpc('add_partner_pending_balance', {
                p_partner_id: partner.id,
                p_amount: commissionAmount
              });
              commissions.push(commission);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, commissions, message: `Created ${commissions.length} commission records` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-commission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});