import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 验证用户
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, payment_method, payment_info } = await req.json();

    if (!amount || !payment_method || !payment_info) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const withdrawAmount = parseFloat(amount);

    // 1. 查找合伙人信息
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: 'Partner not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 验证可提现余额
    if (partner.available_balance < withdrawAmount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          available: partner.available_balance,
          requested: withdrawAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 创建提现记录
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('partner_withdrawals')
      .insert({
        partner_id: partner.id,
        amount: withdrawAmount,
        payment_method,
        payment_info,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      throw withdrawalError;
    }

    // 4. 扣减可提现余额
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        available_balance: partner.available_balance - withdrawAmount
      })
      .eq('id', partner.id);

    if (updateError) {
      // 如果更新失败，删除提现记录
      await supabase
        .from('partner_withdrawals')
        .delete()
        .eq('id', withdrawal.id);
      
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        withdrawal_id: withdrawal.id,
        amount: withdrawAmount,
        status: 'pending',
        message: '提现申请已提交，等待管理员审核'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in partner-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
