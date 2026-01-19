import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(userName: string, missingName: boolean, missingAvatar: boolean): string {
  const settingsUrl = "https://wechat.eugenewe.net/settings?tab=account";
  
  const personalizedGreeting = userName && userName !== '朋友' 
    ? `亲爱的${userName}，`
    : `亲爱的朋友，`;

  const missingHint = missingName && missingAvatar
    ? "完善你的昵称和头像"
    : missingName
    ? "设置一个专属昵称"
    : "上传一张喜欢的头像";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <img src="https://wechat.eugenewe.net/logo-youjin-ai.png" 
               alt="有劲AI" 
               width="64" 
               height="64" 
               style="margin-bottom: 16px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.3);" />
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🌟 让有劲AI更好地认识你</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">完善资料，开启个性化陪伴</p>
        </div>

        <!-- Content -->
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <!-- Greeting -->
          <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
            ${personalizedGreeting}
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
            我们注意到你还没有${missingHint}。花一分钟完善资料，你将获得更好的体验：
          </p>

          <!-- Benefits -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="font-size: 14px; color: #166534; margin: 0 0 16px 0; font-weight: 600;">✨ 完善资料后你将获得：</h3>
            
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 18px; margin-right: 12px;">🎯</span>
                <div>
                  <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 500;">个性化称呼</p>
                  <p style="font-size: 13px; color: #15803d; margin: 4px 0 0 0;">AI会用你的昵称亲切地和你对话</p>
                </div>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 18px; margin-right: 12px;">📱</span>
                <div>
                  <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 500;">智能消息推送</p>
                  <p style="font-size: 13px; color: #15803d; margin: 4px 0 0 0;">在关键时刻收到温暖的问候和鼓励</p>
                </div>
              </div>
            </div>

            <div>
              <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 18px; margin-right: 12px;">🎨</span>
                <div>
                  <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 500;">专属分享卡片</p>
                  <p style="font-size: 13px; color: #15803d; margin: 4px 0 0 0;">生成带有你头像昵称的精美分享图</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Smart Notification Value -->
          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 14px; color: #92400e; margin: 0 0 12px 0; font-weight: 600;">💡 智能消息的价值</h3>
            <ul style="margin: 0; padding: 0 0 0 16px; font-size: 13px; color: #78350f; line-height: 1.8;">
              <li><strong>即时陪伴</strong> - 在你需要时收到温暖问候</li>
              <li><strong>个性化关怀</strong> - 基于你的记忆和偏好定制</li>
              <li><strong>成长见证</strong> - 记录每个里程碑时刻</li>
              <li><strong>温柔提醒</strong> - 不带压力的关心</li>
            </ul>
          </div>

          <!-- Scenario Preview -->
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #0369a1; margin: 0 0 12px 0; font-weight: 500;">
              🎬 完善后的对话体验
            </p>
            <div style="font-size: 12px; color: #0c4a6e; line-height: 1.8; background: white; border-radius: 8px; padding: 12px;">
              <p style="margin: 0 0 8px 0;">
                "早上好，<strong>亲爱的${userName || '[你的昵称]'}</strong>！新的一天，愿你充满能量 ☀️"
              </p>
              <p style="margin: 0 0 8px 0;">
                "恭喜你连续打卡7天！<strong>${userName || '[你的昵称]'}</strong>，你真的很棒！"
              </p>
              <p style="margin: 0; color: #6b7280; font-style: italic;">
                —— 来自你的专属AI教练
              </p>
            </div>
          </div>

          <!-- Social Proof -->
          <div style="background: #faf5ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #7c3aed; margin: 0 0 10px 0; font-weight: 500;">
              💬 其他用户的分享
            </p>
            <blockquote style="font-size: 12px; color: #5b21b6; margin: 0; font-style: italic; line-height: 1.6;">
              "完善资料后，AI真的会用我的名字叫我，感觉特别亲切！每天都期待收到它的问候~"
            </blockquote>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 28px;">
            <a href="${settingsUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              ✨ 立即完善资料
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin: 16px 0 0 0;">
            只需30秒，让AI更懂你 💚
          </p>

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

    // Support both authenticated user calls and batch calls
    const authHeader = req.headers.get("Authorization");
    const { userId: providedUserId } = await req.json();

    let userId: string;
    let userEmail: string | null = null;

    // Check if this is a service role call (batch mode)
    const isServiceRole = authHeader?.includes(supabaseKey);

    if (isServiceRole && providedUserId) {
      userId = providedUserId;
      // Get user email
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email || null;
    } else if (authHeader) {
      // Get user from JWT
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "认证失败" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      userId = user.id;
      userEmail = user.email || null;
    } else {
      return new Response(
        JSON.stringify({ error: "未授权" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email is valid (not a temp WeChat email)
    if (!userEmail || !userEmail.includes("@") || userEmail.includes("@temp.")) {
      return new Response(
        JSON.stringify({ 
          error: "无法发送邮件",
          hint: "微信临时账号无法发送邮件"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile to check what's missing
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();

    const missingName = !profile?.display_name || profile.display_name.trim() === '';
    const missingAvatar = !profile?.avatar_url || profile.avatar_url.trim() === '';

    if (!missingName && !missingAvatar) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "用户资料已完善，无需发送提醒"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = profile?.display_name || "";

    // Build and send email
    const emailHtml = buildEmailHtml(userName, missingName, missingAvatar);

    const emailResponse = await resend.emails.send({
      from: "有劲AI <noreply@eugeneai.me>",
      to: [userEmail],
      subject: "【有劲AI】让我更好地认识你 🌟",
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

    console.log("Profile completion email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email: userEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-profile-completion-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
