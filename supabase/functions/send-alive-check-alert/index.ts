import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertRequest {
  userId: string;
  userName: string;
  contactName: string;
  contactEmail: string;
  daysMissed: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userName, contactName, contactEmail, daysMissed }: AlertRequest = await req.json();

    if (!contactEmail || !contactEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid contact email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = userName || "您的朋友";
    const contactDisplayName = contactName || "尊敬的用户";

    const emailResponse = await resend.emails.send({
      from: "有劲AI <noreply@eugeneai.me>",
      to: [contactEmail],
      subject: `【有劲AI】${displayName} 需要您的关心`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f43f5e, #ef4444); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💗 关心提醒</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              ${contactDisplayName}，您好！
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              您被 <strong>${displayName}</strong> 设为紧急联系人。
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e; font-size: 15px;">
                ⚠️ 该用户已连续 <strong>${daysMissed}</strong> 天未在"有劲AI"进行平安打卡。
              </p>
            </div>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              建议您通过电话或其他方式确认其安全状况。
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">
              —— 有劲AI安全关怀系统 ——
            </p>
            
            <p style="font-size: 12px; color: #d1d5db; text-align: center; margin-top: 20px;">
              这是一封自动发送的邮件，请勿直接回复。<br/>
              如有疑问，请联系 ${displayName} 本人。
            </p>
          </div>
        </div>
      `,
    });

    // Check for Resend API errors
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: emailResponse.error.message,
          hint: "如需发送给任意邮箱，请在 resend.com/domains 验证自定义域名"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Alert email sent successfully:", emailResponse);

    // Update last_notification_at
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from("alive_check_settings")
      .update({ last_notification_at: new Date().toISOString() })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-alive-check-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
