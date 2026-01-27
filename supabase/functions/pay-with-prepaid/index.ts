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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { coachId, serviceId, slotId, userNotes } = await req.json();

    if (!coachId || !serviceId || !slotId) {
      throw new Error('Missing required fields');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('coach_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    // Get slot details and verify availability
    const { data: slot, error: slotError } = await supabase
      .from('coach_time_slots')
      .select('*')
      .eq('id', slotId)
      .eq('status', 'available')
      .single();

    if (slotError || !slot) {
      throw new Error('Time slot not available');
    }

    // Check user prepaid balance
    const { data: balance, error: balanceError } = await supabase
      .from('coaching_prepaid_balance')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error checking balance:', balanceError);
      throw new Error('Failed to check balance');
    }

    const currentBalance = balance?.balance || 0;
    if (currentBalance < service.price) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '余额不足',
          currentBalance,
          required: service.price,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate order number
    const orderNo = `APT${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create appointment record (directly confirmed)
    const { data: appointment, error: appointmentError } = await supabase
      .from('coaching_appointments')
      .insert({
        coach_id: coachId,
        user_id: user.id,
        service_id: serviceId,
        service_name: service.service_name,
        slot_id: slotId,
        appointment_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: service.duration_minutes,
        amount_paid: service.price,
        user_notes: userNotes || null,
        status: 'confirmed',
        payment_status: 'paid',
        order_id: orderNo,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      throw new Error('Failed to create appointment');
    }

    // Deduct balance using atomic function
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_coaching_balance', {
        p_user_id: user.id,
        p_amount: service.price,
        p_appointment_id: appointment.id,
        p_description: `预约咨询: ${service.service_name} - ${slot.slot_date}`,
      });

    if (deductError) {
      console.error('Error deducting balance:', deductError);
      // Rollback: delete appointment
      await supabase.from('coaching_appointments').delete().eq('id', appointment.id);
      throw new Error('Failed to deduct balance');
    }

    const deductResultRow = deductResult?.[0];
    if (!deductResultRow?.success) {
      // Rollback: delete appointment
      await supabase.from('coaching_appointments').delete().eq('id', appointment.id);
      throw new Error(deductResultRow?.message || '扣款失败');
    }

    // Update slot status to booked
    await supabase
      .from('coach_time_slots')
      .update({ 
        status: 'booked',
        appointment_id: appointment.id,
      })
      .eq('id', slotId);

    // Create order record (already paid)
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_key: `appointment_${serviceId}`,
        amount: service.price,
        status: 'paid',
        order_type: 'appointment',
        paid_at: new Date().toISOString(),
        product_name: `预付卡支付: ${service.service_name}`,
      });

    if (orderError) {
      console.error('Error creating order:', orderError);
      // Don't throw - payment already processed
    }

    // Send notifications
    try {
      // User notification
      await supabase.functions.invoke('send-appointment-notification', {
        body: {
          userId: user.id,
          scenario: 'appointment_confirmed',
          appointmentId: appointment.id,
        },
      });

      // Coach notification
      await supabase.functions.invoke('send-appointment-notification', {
        body: {
          coachId: coachId,
          scenario: 'coach_new_appointment',
          appointmentId: appointment.id,
        },
      });
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
    }

    console.log('Prepaid appointment created successfully:', orderNo);

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        appointmentId: appointment.id,
        newBalance: deductResultRow.new_balance,
        message: '预约成功！已从预付卡余额扣款',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in pay-with-prepaid:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
