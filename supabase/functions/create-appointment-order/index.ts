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

    const { coachId, serviceId, slotId, userNotes, payType = 'native' } = await req.json();

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

    // Generate order number
    const orderNo = `APT${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create appointment record
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
        status: 'pending',
        payment_status: 'pending',
        order_id: orderNo,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      throw new Error('Failed to create appointment');
    }

    // Update slot status to booked
    await supabase
      .from('coach_time_slots')
      .update({ 
        status: 'booked',
        appointment_id: appointment.id,
      })
      .eq('id', slotId);

    // Create order record
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_key: `appointment_${serviceId}`,
        amount: service.price,
        status: 'pending',
        order_type: 'appointment',
      });

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    // Call WeChat Pay to get payment URL
    const wechatPayResponse = await fetch(`${supabaseUrl}/functions/v1/create-wechat-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orderNo,
        amount: service.price,
        description: `预约咨询: ${service.service_name}`,
        payType,
      }),
    });

    const wechatPayData = await wechatPayResponse.json();

    if (!wechatPayData.success) {
      console.error('WeChat Pay error:', wechatPayData);
      throw new Error(wechatPayData.error || 'Failed to create payment');
    }

    console.log('Appointment order created successfully:', orderNo);

    return new Response(
      JSON.stringify({
        success: true,
        orderNo,
        appointmentId: appointment.id,
        codeUrl: wechatPayData.codeUrl,
        h5Url: wechatPayData.h5Url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-appointment-order:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
