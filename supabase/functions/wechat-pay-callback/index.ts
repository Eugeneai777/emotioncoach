import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM 解密
async function decryptAesGcm(ciphertext: string, nonce: string, associatedData: string, key: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(key);
  // 微信的 nonce 是纯字符串（12字符），直接用 TextEncoder 转换
  const nonceBytes = new TextEncoder().encode(nonce);
  // ciphertext 是 base64 编码的
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const associatedDataBytes = new TextEncoder().encode(associatedData);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonceBytes, additionalData: associatedDataBytes },
    cryptoKey,
    ciphertextBytes
  );
  
  return new TextDecoder().decode(decrypted);
}

// 套餐配额映射
const packageQuotaMap: Record<string, number> = {
  'basic': 50,
  'member365': 1000,
  'partner': 9999999, // 无限
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('WeChat callback received:', body);

    const notification = JSON.parse(body);
    
    // 验证通知类型
    if (notification.event_type !== 'TRANSACTION.SUCCESS') {
      console.log('Not a success event:', notification.event_type);
      return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取API密钥
    const apiV3Key = Deno.env.get('WECHAT_API_V3_KEY');
    if (!apiV3Key) {
      throw new Error('API密钥未配置');
    }

    // 解密通知内容
    const resource = notification.resource;
    const decryptedData = await decryptAesGcm(
      resource.ciphertext,
      resource.nonce,
      resource.associated_data || '',
      apiV3Key
    );
    
    const paymentData = JSON.parse(decryptedData);
    console.log('Decrypted payment data:', paymentData);

    const orderNo = paymentData.out_trade_no;
    const tradeNo = paymentData.transaction_id;
    const tradeState = paymentData.trade_state;

    if (tradeState !== 'SUCCESS') {
      console.log('Payment not successful:', tradeState);
      return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 初始化Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询订单
    const { data: order, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();

    if (queryError || !order) {
      console.error('Order not found:', orderNo);
      return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否已处理
    if (order.status === 'paid') {
      console.log('Order already paid:', orderNo);
      return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        trade_no: tradeNo,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_no', orderNo);

    if (updateError) {
      console.error('Update order error:', updateError);
      throw new Error('订单更新失败');
    }

    // 处理训练营购买订单（package_key 以 'camp-' 开头）
    if (order.package_key.startsWith('camp-')) {
      const campType = order.package_key.replace('camp-', '');
      
      // 获取训练营模板信息
      const { data: campTemplate } = await supabase
        .from('camp_templates')
        .select('camp_name')
        .eq('camp_type', campType)
        .single();

      // 创建训练营购买记录
      const { error: purchaseError } = await supabase
        .from('user_camp_purchases')
        .insert({
          user_id: order.user_id,
          camp_type: campType,
          camp_name: campTemplate?.camp_name || order.product_name || '训练营',
          purchase_price: order.amount,
          payment_method: 'wechat',
          payment_status: 'completed',
          transaction_id: tradeNo,
          purchased_at: new Date().toISOString(),
          expires_at: null // 不设置过期时间，永久有效
        });

      if (purchaseError) {
        console.error('Create camp purchase error:', purchaseError);
      } else {
        console.log('Camp purchase recorded:', order.user_id, campType);
      }
      
      // 训练营购买不增加有劲点数（训练营是独立权益）
    } else {
      // 非训练营订单：增加用户配额
      const quota = packageQuotaMap[order.package_key] || 0;
      if (quota > 0) {
        // 查询用户当前配额
        const { data: userAccount, error: accountError } = await supabase
          .from('user_accounts')
          .select('total_quota, used_quota')
          .eq('user_id', order.user_id)
          .single();

        if (accountError) {
          console.error('Query user account error:', accountError);
        } else if (userAccount) {
          // 更新用户配额
          const newTotalQuota = (userAccount.total_quota || 0) + quota;
          const { error: quotaError } = await supabase
            .from('user_accounts')
            .update({ 
              total_quota: newTotalQuota,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', order.user_id);

          if (quotaError) {
            console.error('Update quota error:', quotaError);
          } else {
            console.log('User quota updated:', order.user_id, '+', quota);
          }
        }
      }
    }

    // 如果是合伙人套餐，创建合伙人记录
    if (order.package_key === 'partner') {
      const { error: partnerError } = await supabase
        .from('partners')
        .upsert({
          user_id: order.user_id,
          partner_type: 'youjin',
          level: 'basic',
          status: 'active',
          investment_amount: order.amount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (partnerError) {
        console.error('Create partner error:', partnerError);
      } else {
        console.log('Partner created:', order.user_id);
      }
    }

    // 处理有劲合伙人套餐购买/升级 (youjin_partner_l1, youjin_partner_l2, youjin_partner_l3)
    if (order.package_key.startsWith('youjin_partner_')) {
      const levelName = order.package_key.replace('youjin_partner_', '').toUpperCase(); // l1 -> L1
      console.log('Processing youjin partner package:', levelName);
      
      // 获取等级规则
      const { data: levelRule, error: levelError } = await supabase
        .from('partner_level_rules')
        .select('*')
        .eq('partner_type', 'youjin')
        .eq('level_name', levelName)
        .single();
      
      if (levelError) {
        console.error('Get level rule error:', levelError);
      } else if (levelRule) {
        // 查询是否已是合伙人
        const { data: existingPartner } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', order.user_id)
          .maybeSingle();
        
        // 生成合伙人邀请码
        const generatePartnerCode = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        };
        
        if (existingPartner && existingPartner.partner_type === 'youjin') {
          // 升级：直接覆盖为新等级（全价购买模式）
          const { error: updateError } = await supabase
            .from('partners')
            .update({
              partner_level: levelName,
              prepurchase_count: levelRule.min_prepurchase,  // 直接设为新等级配额
              commission_rate_l1: levelRule.commission_rate_l1,
              commission_rate_l2: levelRule.commission_rate_l2,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPartner.id);
          
          if (updateError) {
            console.error('Upgrade partner error:', updateError);
          } else {
            console.log('Partner upgraded:', order.user_id, existingPartner.partner_level, '->', levelName);
          }
        } else {
          // 新建合伙人记录
          const partnerCode = generatePartnerCode();
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年有效期
          
          const { error: insertError } = await supabase
            .from('partners')
            .insert({
              user_id: order.user_id,
              partner_type: 'youjin',
              partner_level: levelName,
              partner_code: partnerCode,
              prepurchase_count: levelRule.min_prepurchase,
              prepurchase_expires_at: expiresAt.toISOString(),
              commission_rate_l1: levelRule.commission_rate_l1,
              commission_rate_l2: levelRule.commission_rate_l2,
              status: 'active',
              source: 'purchase',
            });
          
          if (insertError) {
            console.error('Create youjin partner error:', insertError);
          } else {
            console.log('Youjin partner created:', order.user_id, levelName, 'code:', partnerCode);
          }
        }
      }
    }

    // 更新 partner_referrals 的 conversion_status
    const newConversionStatus = order.package_key === 'partner' ? 'became_partner' : 'purchased_365';
    const { data: referral, error: referralQueryError } = await supabase
      .from('partner_referrals')
      .select('id, partner_id')
      .eq('referred_user_id', order.user_id)
      .eq('level', 1)
      .single();

    if (!referralQueryError && referral) {
      const { error: referralUpdateError } = await supabase
        .from('partner_referrals')
        .update({ 
          conversion_status: newConversionStatus,
          converted_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (referralUpdateError) {
        console.error('Update referral conversion_status error:', referralUpdateError);
      } else {
        console.log('Referral conversion_status updated:', referral.id, '->', newConversionStatus);
        
        // 计算合伙人佣金
        try {
          const { data: commissionResult, error: commissionError } = await supabase.functions.invoke('calculate-commission', {
            body: {
              order_id: order.id,
              user_id: order.user_id,
              order_amount: order.amount,
              order_type: order.package_key
            }
          });
          
          if (commissionError) {
            console.error('Commission calculation error:', commissionError);
          } else {
            console.log('Commission calculation result:', commissionResult);
          }
        } catch (commError) {
          console.error('Failed to calculate commission:', commError);
        }
        
        // 发送合伙人通知
        try {
          await supabase.functions.invoke('notify-partner', {
            body: {
              partnerId: referral.partner_id,
              eventType: newConversionStatus === 'became_partner' ? 'became_partner' : 'purchased',
              referredUserId: order.user_id,
              packageKey: order.package_key,
              amount: order.amount
            }
          });
        } catch (notifyError) {
          console.error('Notify partner error:', notifyError);
        }
      }
    }

    // 如果是预约订单，更新预约状态并发送确认通知
    if (order.order_type === 'appointment') {
      // 查找关联的预约
      const { data: appointment, error: appointmentQueryError } = await supabase
        .from('coaching_appointments')
        .select('id')
        .eq('order_id', orderNo)
        .single();

      if (!appointmentQueryError && appointment) {
        // 更新预约状态为已确认
        const { error: appointmentUpdateError } = await supabase
          .from('coaching_appointments')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointment.id);

        if (appointmentUpdateError) {
          console.error('Update appointment status error:', appointmentUpdateError);
        } else {
          console.log('Appointment confirmed:', appointment.id);

          // 获取预约详情（包含教练信息）
          const { data: appointmentDetail } = await supabase
            .from('coaching_appointments')
            .select('coach_id')
            .eq('id', appointment.id)
            .single();

          // 发送用户预约确认通知
          try {
            await supabase.functions.invoke('send-appointment-notification', {
              body: {
                userId: order.user_id,
                scenario: 'appointment_confirmed',
                appointmentId: appointment.id,
              },
            });
            console.log('User appointment confirmation notification sent');
          } catch (notifyError) {
            console.error('Failed to send user appointment confirmation:', notifyError);
          }

          // 发送教练新预约通知
          if (appointmentDetail?.coach_id) {
            try {
              await supabase.functions.invoke('send-appointment-notification', {
                body: {
                  coachId: appointmentDetail.coach_id,
                  scenario: 'coach_new_appointment',
                  appointmentId: appointment.id,
                },
              });
              console.log('Coach new appointment notification sent');
            } catch (notifyError) {
              console.error('Failed to send coach new appointment notification:', notifyError);
            }
          }
        }
      }
    }

    // 如果是预付卡充值订单，增加用户教练预付卡余额（区分实付和赠送）
    if (order.order_type === 'prepaid_recharge') {
      // 获取预付卡套餐信息
      const { data: prepaidPkg } = await supabase
        .from('coaching_prepaid_packages')
        .select('price, bonus_amount, total_value, package_name')
        .eq('package_key', order.package_key)
        .single();

      // 实付金额 = 套餐价格（用户实际支付的）
      const paidAmount = prepaidPkg?.price || order.amount;
      // 赠送金额 = 套餐赠送
      const bonusAmount = prepaidPkg?.bonus_amount || 0;

      // 调用新版原子性充值函数（分别记录 paid 和 bonus）
      const { data: addResult, error: addError } = await supabase
        .rpc('add_coaching_balance', {
          p_user_id: order.user_id,
          p_paid_amount: paidAmount,
          p_bonus_amount: bonusAmount,
          p_order_no: orderNo,
          p_description: `充值: ${prepaidPkg?.package_name || order.package_key}`,
        });

      if (addError) {
        console.error('Error adding coaching balance:', addError);
      } else {
        const resultRow = addResult?.[0];
        if (resultRow?.success) {
          console.log('Coaching prepaid balance added:', order.user_id, 'paid:', paidAmount, 'bonus:', bonusAmount);
        } else {
          console.error('Add coaching balance failed:', resultRow?.message);
        }
      }
    }

    console.log('Payment callback processed successfully:', orderNo);

    return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WeChat callback error:', error);
    const errorMessage = error instanceof Error ? error.message : '处理回调失败';
    return new Response(
      JSON.stringify({ code: 'FAIL', message: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
