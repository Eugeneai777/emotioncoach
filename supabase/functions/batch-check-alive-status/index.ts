import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for scheduled calls
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow both cron and manual admin calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if it's a service role call
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (authHeader !== `Bearer ${supabaseKey}`) {
        console.log("Unauthorized call attempt");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting alive check batch process...");

    // Get all enabled settings
    const { data: settings, error: settingsError } = await supabase
      .from("alive_check_settings")
      .select("*")
      .eq("is_enabled", true)
      .not("emergency_contact_email", "is", null);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} enabled users`);

    const alerts: { userId: string; daysMissed: number }[] = [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    for (const setting of settings || []) {
      // Get the user's last check-in
      const { data: lastLog, error: logError } = await supabase
        .from("alive_check_logs")
        .select("checked_at")
        .eq("user_id", setting.user_id)
        .order("checked_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logError) {
        console.error(`Error fetching log for user ${setting.user_id}:`, logError);
        continue;
      }

      // Calculate days since last check-in
      let daysMissed = 0;
      if (!lastLog) {
        // Never checked in, count from when they enabled the feature
        const enabledDate = new Date(setting.created_at);
        daysMissed = Math.floor((now.getTime() - enabledDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        const lastCheckDate = new Date(lastLog.checked_at);
        daysMissed = Math.floor((now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      console.log(`User ${setting.user_id}: ${daysMissed} days since last check-in, threshold: ${setting.days_threshold}`);

      // Check if threshold exceeded
      if (daysMissed >= setting.days_threshold) {
        // Check if we already sent a notification in the last 24 hours
        if (setting.last_notification_at) {
          const lastNotification = new Date(setting.last_notification_at);
          const hoursSinceNotification = (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceNotification < 24) {
            console.log(`Skipping user ${setting.user_id}: notification sent ${hoursSinceNotification.toFixed(1)} hours ago`);
            continue;
          }
        }

        // Get user name - prefer user_display_name from settings, fallback to profile
        let userName = setting.user_display_name;
        if (!userName) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", setting.user_id)
            .maybeSingle();
          userName = profile?.display_name || "您的朋友";
        }

        // Send alert
        console.log(`Sending alert for user ${setting.user_id} to ${setting.emergency_contact_email}`);
        
        try {
          const alertResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-alive-check-alert`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                userId: setting.user_id,
                userName,
                contactName: setting.emergency_contact_name,
                contactEmail: setting.emergency_contact_email,
                daysMissed,
              }),
            }
          );

          if (alertResponse.ok) {
            alerts.push({ userId: setting.user_id, daysMissed });
            console.log(`Alert sent successfully for user ${setting.user_id}`);
          } else {
            const errorText = await alertResponse.text();
            console.error(`Failed to send alert for user ${setting.user_id}:`, errorText);
          }
        } catch (alertError) {
          console.error(`Error sending alert for user ${setting.user_id}:`, alertError);
        }
      }
    }

    console.log(`Batch check complete. Sent ${alerts.length} alerts.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: settings?.length || 0,
        alertsSent: alerts.length,
        alerts 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in batch-check-alive-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
