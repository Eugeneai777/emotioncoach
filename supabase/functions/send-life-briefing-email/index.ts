import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendBriefingRequest {
  briefingId: string;
}

interface VibrantLifeBriefing {
  id: string;
  user_id: string;
  user_issue_summary: string | null;
  summary: string | null;
  insight: string | null;
  action: string | null;
  recommended_coach_type: string | null;
  reasoning: string | null;
  conversation_id: string | null;
  created_at: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const coachTypeLabels: Record<string, string> = {
  emotion: "情绪教练",
  parent: "亲子教练",
  communication: "沟通教练",
  story: "故事教练",
  tool: "成长工具",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

function buildEmailHtml(
  briefing: VibrantLifeBriefing,
  messages: Message[],
  userName: string
): string {
  const dateStr = formatDate(briefing.created_at);
  const coachLabel = briefing.recommended_coach_type
    ? coachTypeLabels[briefing.recommended_coach_type] || briefing.recommended_coach_type
    : null;

  // Build conversation HTML
  let conversationHtml = "";
  if (messages.length > 0) {
    conversationHtml = `
      <div style="margin-top: 24px;">
        <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 12px; font-weight: 500;">💬 对话记录</h3>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px;">
          ${messages
            .map(
              (msg) => `
            <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; background: ${
              msg.role === "user" ? "#e0f2fe" : "#ffffff"
            }; margin-left: ${msg.role === "user" ? "40px" : "0"}; margin-right: ${
                msg.role === "user" ? "0" : "40px"
              };">
              <p style="font-size: 11px; color: #9ca3af; margin: 0 0 4px 0;">${
                msg.role === "user" ? "我" : "有劲AI"
              }</p>
              <p style="font-size: 13px; color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.5;">${
                msg.content
              }</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🌿 你的生活记录</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">来自有劲AI生活教练</p>
        </div>

        <!-- Content -->
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <!-- Greeting -->
          <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
            ${userName ? `${userName}，` : ""}这是你的生活记录 📝
          </p>

          <!-- Date & Coach Type -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 13px; color: #9ca3af;">${dateStr}</span>
            ${
              coachLabel
                ? `<span style="font-size: 12px; color: #10b981; background: #ecfdf5; padding: 4px 10px; border-radius: 12px;">🎯 ${coachLabel}</span>`
                : ""
            }
          </div>

          <!-- Issue Summary -->
          ${
            briefing.user_issue_summary
              ? `
            <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #92400e; margin: 0 0 6px 0; font-weight: 500;">💬 你聊了什么</p>
              <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.6;">${briefing.user_issue_summary}</p>
            </div>
          `
              : ""
          }

          <!-- Summary -->
          ${
            briefing.summary
              ? `
            <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #166534; margin: 0 0 6px 0; font-weight: 500;">📝 对话总结</p>
              <p style="font-size: 14px; color: #14532d; margin: 0; line-height: 1.6;">${briefing.summary}</p>
            </div>
          `
              : ""
          }

          <!-- Insight -->
          ${
            briefing.insight
              ? `
            <div style="background: linear-gradient(135deg, #fef9c3, #fef3c7); border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">
              <p style="font-size: 12px; color: #92400e; margin: 0 0 6px 0; font-weight: 500;">💡 核心洞察</p>
              <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.6;">${briefing.insight}</p>
            </div>
          `
              : ""
          }

          <!-- Action -->
          ${
            briefing.action
              ? `
            <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #10b981;">
              <p style="font-size: 12px; color: #166534; margin: 0 0 6px 0; font-weight: 500;">✅ 行动建议</p>
              <p style="font-size: 14px; color: #14532d; margin: 0; line-height: 1.6;">${briefing.action}</p>
            </div>
          `
              : ""
          }

          <!-- Recommended Service -->
          ${
            coachLabel && briefing.reasoning
              ? `
            <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #6b7280; margin: 0 0 6px 0; font-weight: 500;">🎯 推荐服务：${coachLabel}</p>
              <p style="font-size: 13px; color: #4b5563; margin: 0; line-height: 1.5;">${briefing.reasoning}</p>
            </div>
          `
              : ""
          }

          <!-- Conversation -->
          ${conversationHtml}

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 28px;">
            <a href="https://wechat.eugenewe.net/coach/vibrant_life_sage" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 25px; font-size: 15px; font-weight: 500;">
              继续和有劲AI对话 →
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 13px; color: #9ca3af; margin: 0;">有劲AI · 每个人的生活教练</p>
            <p style="font-size: 11px; color: #d1d5db; margin: 8px 0 0 0;">
              这是一封自动发送的邮件，请勿直接回复
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未授权" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "认证失败" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { briefingId }: SendBriefingRequest = await req.json();

    if (!briefingId) {
      return new Response(
        JSON.stringify({ error: "缺少 briefingId 参数" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch briefing and verify ownership
    const { data: briefing, error: briefingError } = await supabase
      .from("vibrant_life_sage_briefings")
      .select("*")
      .eq("id", briefingId)
      .eq("user_id", user.id)
      .single();

    if (briefingError || !briefing) {
      console.error("Briefing fetch error:", briefingError);
      return new Response(
        JSON.stringify({ error: "未找到该记录或无权访问" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch conversation messages if available
    let messages: Message[] = [];
    if (briefing.conversation_id) {
      const { data: msgData } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", briefing.conversation_id)
        .order("created_at", { ascending: true });
      
      if (msgData) {
        messages = msgData as Message[];
      }
    }

    // Get user email
    const userEmail = user.email;
    if (!userEmail || !userEmail.includes("@") || userEmail.includes("@temp.")) {
      return new Response(
        JSON.stringify({ 
          error: "请先绑定真实邮箱",
          hint: "微信临时账号无法发送邮件，请在设置中绑定您的邮箱"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.display_name || "";

    // Build and send email
    const emailHtml = buildEmailHtml(briefing as VibrantLifeBriefing, messages, userName);
    const dateStr = briefing.created_at 
      ? new Date(briefing.created_at).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })
      : "今天";

    const emailResponse = await resend.emails.send({
      from: "有劲AI <noreply@eugeneai.me>",
      to: [userEmail],
      subject: `【有劲AI】你的生活记录 - ${dateStr}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: emailResponse.error.message,
          hint: "邮件发送失败，请稍后重试"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Life briefing email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email: userEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-life-briefing-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
