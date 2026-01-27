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

    const { appointmentId, reason } = await req.json();

    if (!appointmentId) {
      throw new Error('Missing appointment ID');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('coaching_appointments')
      .select('*, coach_services(cancel_hours_before)')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new Error('Appointment already cancelled');
    }

    if (appointment.status === 'completed') {
      throw new Error('Cannot cancel completed appointment');
    }

    // Check cancellation time limit
    const cancelHoursBefore = appointment.coach_services?.cancel_hours_before || 24;
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < cancelHoursBefore) {
      throw new Error(`需要提前${cancelHoursBefore}小时取消预约`);
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('coaching_appointments')
      .update({
        status: 'cancelled',
        cancel_reason: reason || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (updateError) {
      throw new Error('Failed to cancel appointment');
    }

    // Release the time slot
    if (appointment.slot_id) {
      await supabase
        .from('coach_time_slots')
        .update({
          status: 'available',
          appointment_id: null,
        })
        .eq('id', appointment.slot_id);
    }

    // Update order status if exists
    if (appointment.order_id) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('order_no', appointment.order_id);
    }

    // TODO: Process refund if payment was made

    // Send user cancellation notification
    try {
      await supabase.functions.invoke('send-appointment-notification', {
        body: {
          userId: user.id,
          scenario: 'appointment_cancelled',
          appointmentId,
        },
      });
      console.log('User cancellation notification sent');
    } catch (notifyError) {
      console.error('Failed to send user cancellation notification:', notifyError);
    }

    // Send coach cancellation notification
    if (appointment.coach_id) {
      try {
        await supabase.functions.invoke('send-appointment-notification', {
          body: {
            coachId: appointment.coach_id,
            scenario: 'coach_appointment_cancelled',
            appointmentId,
          },
        });
        console.log('Coach cancellation notification sent');
      } catch (notifyError) {
        console.error('Failed to send coach cancellation notification:', notifyError);
      }
    }

    console.log('Appointment cancelled successfully:', appointmentId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in cancel-appointment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
