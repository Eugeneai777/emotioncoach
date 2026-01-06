import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referred_user_id, camp_id, camp_type } = await req.json();

    console.log(`📬 处理邀请成功通知: referred_user_id=${referred_user_id}, camp_id=${camp_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find pending invite referrals for this user
    const { data: referrals, error: refError } = await supabase
      .from('camp_invite_referrals')
      .select('id, inviter_user_id')
      .eq('referred_user_id', referred_user_id)
      .eq('status', 'pending')
      .eq('camp_type', camp_type || 'wealth_block_21');

    if (refError) {
      console.error('❌ 查询邀请记录失败:', refError);
      throw refError;
    }

    if (!referrals || referrals.length === 0) {
      console.log('ℹ️ 没有找到待处理的邀请记录');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending referrals found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 找到 ${referrals.length} 条邀请记录`);

    // 2. Get referred user's name
    const { data: referredProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', referred_user_id)
      .single();

    const referredName = referredProfile?.display_name || '好友';

    // 3. Process each referral
    for (const referral of referrals) {
      // Update referral status
      await supabase
        .from('camp_invite_referrals')
        .update({
          status: 'joined',
          joined_at: new Date().toISOString(),
          camp_id: camp_id,
        })
        .eq('id', referral.id);

      // Get inviter's invite count
      const { count: inviteCount } = await supabase
        .from('camp_invite_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_user_id', referral.inviter_user_id)
        .eq('status', 'joined');

      // Send notification to inviter
      try {
        console.log(`📤 发送通知给邀请者: ${referral.inviter_user_id}`);
        
        const notificationPayload = {
          userId: referral.inviter_user_id,
          scenario: 'invite_success',
          notification: {
            title: '🎉 邀请成功',
            content: `${referredName}已加入训练营`,
            remark: `已成功邀请 ${inviteCount || 1} 位好友`,
            referredName,
            inviteCount: inviteCount || 1,
          }
        };

        // Call send-wechat-template-message
        const response = await fetch(`${supabaseUrl}/functions/v1/send-wechat-template-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(notificationPayload),
        });

        if (response.ok) {
          // Mark notification as sent
          await supabase
            .from('camp_invite_referrals')
            .update({
              notification_sent: true,
              notification_sent_at: new Date().toISOString(),
            })
            .eq('id', referral.id);
          
          console.log(`✅ 通知发送成功`);
        } else {
          const errorText = await response.text();
          console.error(`❌ 通知发送失败: ${errorText}`);
        }
      } catch (notifyError) {
        console.error(`❌ 发送通知失败:`, notifyError);
        // Continue processing other referrals even if notification fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${referrals.length} referrals`,
        referrals_processed: referrals.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-camp-invite-success:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
