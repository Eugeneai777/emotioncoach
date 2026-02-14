import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const normalizePhone = (phone: string, countryCode: string = '+86'): string => {
  const digits = phone.replace(/\D/g, '');
  // For Chinese numbers, take last 11 digits; for international, keep all digits
  if (countryCode === '+86') {
    return digits.length >= 11 ? digits.slice(-11) : digits;
  }
  return digits;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: '需要管理员权限' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all pending bloom invitations
    const { data: pendingInvitations, error: fetchError } = await adminClient
      .from('partner_invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('partner_type', 'bloom');

    if (fetchError) throw fetchError;
    if (!pendingInvitations || pendingInvitations.length === 0) {
      return new Response(
        JSON.stringify({ success: 0, skipped: 0, failed: 0, details: [], message: '没有待处理的邀请' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { name: string; phone: string; status: 'success' | 'skipped' | 'failed'; reason?: string }[] = [];

    for (const inv of pendingInvitations) {
      const name = inv.invitee_name || '未知';
      const rawPhone = inv.invitee_phone || '';

      try {
        // Read country code from invitation record
        const countryCode = inv.invitee_phone_country_code || '+86';

        // Validate phone
        const phone = normalizePhone(rawPhone, countryCode);
        if (phone.length < 5) {
          results.push({ name, phone: rawPhone, status: 'skipped', reason: '手机号无效' });
          continue;
        }

        const phoneWithCode = `${countryCode}${phone}`;

        // Try to create user with phone directly
        let userId: string;

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          phone: phoneWithCode,
          password: '123456',
          phone_confirm: true,
        });

        if (createError) {
          // User might already exist
          const isAlreadyRegistered = createError.message?.includes('already registered') || 
            createError.message?.includes('duplicate') || 
            createError.message?.includes('already exists') ||
            (createError as any).code === 'phone_exists';
          
          if (isAlreadyRegistered) {
            // Find existing user by phone in profiles table
            const { data: existingProfile } = await adminClient
              .from('profiles')
              .select('id')
              .eq('phone', phone)
              .eq('phone_country_code', countryCode)
              .limit(1)
              .maybeSingle();

            if (existingProfile) {
              userId = existingProfile.id;
              console.log(`Found existing user for ${phone}: ${userId}`);
            } else {
              // Fallback: try listUsers with pagination
              let found = false;
              let page = 1;
              while (!found && page <= 10) {
                const { data: { users } } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
                if (!users || users.length === 0) break;
                const match = users.find(u => u.phone === phoneWithCode);
                if (match) {
                  userId = match.id;
                  found = true;
                  console.log(`Found existing user via auth for ${phone}: ${userId}`);
                }
                page++;
              }
              if (!found) {
                results.push({ name, phone: rawPhone, status: 'failed', reason: '手机号已注册但无法匹配用户' });
                continue;
              }
            }
          } else {
            console.error(`Failed to create user for ${phone}:`, createError);
            results.push({ name, phone: rawPhone, status: 'failed', reason: createError.message });
            continue;
          }
        } else {
          userId = newUser.user.id;
        }

        // Update profiles (mark must_change_password for newly created users)
        const isNewlyCreated = !createError;
        await adminClient.from('profiles').update({
          display_name: inv.invitee_name || undefined,
          phone: phone,
          phone_country_code: countryCode,
          auth_provider: 'phone',
          preferred_coach: 'wealth',
          ...(isNewlyCreated ? { must_change_password: true } : {}),
        }).eq('id', userId);

        // Check existing partner
        const { data: existingPartner } = await adminClient
          .from('partners')
          .select('id, partner_type')
          .eq('user_id', userId)
          .limit(1);

        let partnerId: string;

        if (existingPartner && existingPartner.length > 0) {
          partnerId = existingPartner[0].id;
          if (existingPartner[0].partner_type !== 'bloom') {
            // Upgrade to bloom
            await adminClient.from('partners').update({
              partner_type: 'bloom',
              partner_level: 'L0',
              commission_rate_l1: 0.30,
              commission_rate_l2: 0.10,
              source: 'manual',
            }).eq('id', partnerId);
          }
        } else {
          const partnerCode = `BP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          const { data: newPartner, error: partnerError } = await adminClient
            .from('partners')
            .insert({
              user_id: userId,
              partner_type: 'bloom',
              partner_level: 'L0',
              partner_code: partnerCode,
              commission_rate_l1: 0.30,
              commission_rate_l2: 0.10,
              status: 'active',
              source: 'manual',
            })
            .select('id')
            .single();

          if (partnerError) {
            console.error(`Failed to create partner for ${phone}:`, partnerError);
            results.push({ name, phone: rawPhone, status: 'failed', reason: '创建合伙人失败' });
            continue;
          }
          partnerId = newPartner.id;
        }

        // Check existing bloom_partner_orders
        const { data: existingOrder } = await adminClient
          .from('bloom_partner_orders')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (!existingOrder || existingOrder.length === 0) {
          await adminClient.from('bloom_partner_orders').insert({
            user_id: userId,
            partner_id: partnerId,
            order_amount: inv.order_amount || 19800,
            delivery_status: 'pending',
            emotion_status: 'pending',
            identity_status: 'pending',
            life_status: 'pending',
          });
        }

        // Grant wealth assessment (if not already granted)
        const { data: existingAssessment } = await adminClient
          .from('orders')
          .select('id')
          .eq('user_id', userId)
          .eq('package_key', 'wealth_block_assessment')
          .eq('order_type', 'partner_benefit')
          .limit(1);

        if (!existingAssessment || existingAssessment.length === 0) {
          await adminClient.from('orders').insert({
            user_id: userId,
            package_key: 'wealth_block_assessment',
            package_name: '财富卡点测评',
            amount: 0,
            order_no: `BLOOM-WB-${Date.now()}`,
            status: 'paid',
            paid_at: new Date().toISOString(),
            order_type: 'partner_benefit',
            product_name: '财富卡点测评（绽放合伙人权益）',
          });
        }

        // Grant 7-day wealth camp (if not already granted)
        const { data: existingCamp } = await adminClient
          .from('user_camp_purchases')
          .select('id')
          .eq('user_id', userId)
          .eq('camp_type', 'wealth_block_7')
          .limit(1);

        if (!existingCamp || existingCamp.length === 0) {
          await adminClient.from('user_camp_purchases').insert({
            user_id: userId,
            camp_type: 'wealth_block_7',
            camp_name: '7天财富突破训练营',
            purchase_price: 0,
            payment_method: 'partner_benefit',
            payment_status: 'completed',
          });
        }

        // Mark invitation as claimed
        await adminClient.from('partner_invitations').update({
          status: 'claimed',
          claimed_by: userId,
          claimed_at: new Date().toISOString(),
          claimed_source: 'batch',
        }).eq('id', inv.id);

        results.push({ name, phone: rawPhone, status: 'success' });
        console.log(`Batch registered bloom partner: ${name} (${phone})`);

      } catch (err) {
        console.error(`Error processing ${name} (${rawPhone}):`, err);
        results.push({ name, phone: rawPhone, status: 'failed', reason: err instanceof Error ? err.message : '未知错误' });
      }
    }

    const summary = {
      success: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'failed').length,
      details: results,
    };

    console.log(`Batch registration complete: ${summary.success} success, ${summary.skipped} skipped, ${summary.failed} failed`);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch registration error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '系统错误' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
