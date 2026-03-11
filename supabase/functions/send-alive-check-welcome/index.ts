import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeRequest {
  userName: string;
  contactName: string;
  contactEmail: string;
  daysThreshold: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, contactName, contactEmail, daysThreshold }: WelcomeRequest = await req.json();

    if (!contactEmail || !contactEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid contact email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = userName || "您的朋友";
    const contactDisplayName = contactName || "尊敬的用户";
    const threshold = daysThreshold || 3;
    const siteUrl = "https://wechat.eugenewe.net/alive-check-intro";

    const emailResponse = await resend.emails.send({
      from: "有劲AI <noreply@eugeneai.me>",
      to: [contactEmail],
      subject: `【有劲AI】${displayName} 将您设为安全守护人`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💗 您被设为安全守护人</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              ${contactDisplayName}，您好！
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              <strong>${displayName}</strong> 在"有劲AI"开启了「每日安全守护」功能，并将您设为紧急联系人。
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: bold;">
                🔔 这个功能是什么？
              </p>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                用户每天进行安全打卡，用户每天进行安全打卡，确认"今天很好"。如果连续 <strong>${threshold}</strong> 天未打卡，系统会自动发邮件提醒您关心 TA 的安全状况。。如果连续 <strong>${threshold}</strong> 天未打卡，系统会自动发邮件提醒您关心 TA 的安全状况。
              </p>
            </div>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 15px; font-weight: bold;">
                🛡️ 您的角色
              </p>
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                作为安全守护人，如果收到提醒邮件，请通过电话或其他方式确认 <strong>${displayName}</strong> 的安全。这是一份信任，也是一份责任。
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-size: 16px; font-weight: bold;">
                💗 了解并开启
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
              适合独居者、空巢老人、远离家人的游子使用，<br/>
              让关心你的人安心，让你关心的人放心。
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">
              —— 有劲AI安全关怀系统 ——
            </p>
            
            <p style="font-size: 12px; color: #d1d5db; text-align: center; margin-top: 20px;">
              这是一封自动发送的邮件，请勿直接回复。
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

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-alive-check-welcome:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
