import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestRequest {
  userId: string;
  digestType: 'weekly_summary' | 'milestone' | 'care_reminder' | 'growth_celebration';
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, digestType, data }: DigestRequest = await req.json();

    if (!userId || !digestType) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email, smart_notification_enabled')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "用户未设置邮箱" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 检查是否是临时邮箱
    if (profile.email.includes('@temp.youjin365.com')) {
      return new Response(
        JSON.stringify({ error: "临时邮箱无法接收邮件", isTemp: true }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = profile.display_name || '朋友';
    let emailHtml = '';
    let subject = '';

    switch (digestType) {
      case 'weekly_summary':
        const weeklyData = await buildWeeklySummaryData(supabase, userId, data);
        emailHtml = buildWeeklySummaryEmail(displayName, weeklyData);
        subject = `🌟 ${displayName}，这是你的一周成长记录`;
        break;

      case 'milestone':
        emailHtml = buildMilestoneEmail(displayName, data);
        subject = `🎉 恭喜${displayName}达成新里程碑！`;
        break;

      case 'care_reminder':
        emailHtml = buildCareReminderEmail(displayName, data);
        subject = `💝 ${displayName}，我们想念你`;
        break;

      case 'growth_celebration':
        emailHtml = buildGrowthCelebrationEmail(displayName, data);
        subject = `✨ ${displayName}，你的成长令人骄傲`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "未知的摘要类型" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "有劲AI <noreply@eugeneai.me>",
      to: [profile.email],
      subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("智能摘要邮件发送成功:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("发送智能摘要邮件错误:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// 构建周报数据
async function buildWeeklySummaryData(supabase: any, userId: string, existingData?: any) {
  if (existingData?.conversationCount !== undefined) {
    return existingData;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 获取本周对话数
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString());

  // 获取本周情绪记录
  const { data: briefings } = await supabase
    .from('briefings')
    .select('emotion_theme, emotion_intensity, insight, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .gte('created_at', weekAgo.toISOString())
    .order('created_at', { ascending: false });

  // 获取目标进度
  const { data: goals } = await supabase
    .from('emotion_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  // 获取最近的洞察记忆
  const { data: memories } = await supabase
    .from('user_coach_memory')
    .select('content')
    .eq('user_id', userId)
    .eq('memory_type', 'insight')
    .gte('created_at', weekAgo.toISOString())
    .order('importance_score', { ascending: false })
    .limit(2);

  // 计算统计数据
  const emotionThemes = briefings?.map((b: any) => b.emotion_theme).filter(Boolean) || [];
  const avgIntensity = briefings?.length
    ? briefings.reduce((sum: number, b: any) => sum + (b.emotion_intensity || 0), 0) / briefings.length
    : null;

  return {
    conversationCount: conversationCount || 0,
    briefingCount: briefings?.length || 0,
    avgIntensity: avgIntensity?.toFixed(1),
    dominantEmotions: [...new Set(emotionThemes)].slice(0, 3),
    goalProgress: goals?.length ? Math.round((goals.filter((g: any) => g.is_completed).length / goals.length) * 100) : 0,
    recentInsights: memories?.map((m: any) => m.content) || [],
    highlight: briefings?.[0]?.insight || null,
  };
}

// ========== 邮件模板 ==========

function buildWeeklySummaryEmail(displayName: string, data: any): string {
  const siteUrl = "https://wechat.eugenewe.net";
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <img src="${siteUrl}/logo-youjin-ai.png" alt="有劲AI" width="56" height="56" style="border-radius: 50%; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        <h1 style="color: white; margin: 0; font-size: 22px;">🌟 ${displayName}，这是你的一周成长记录</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
          ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 周报
        </p>
      </div>
      
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <!-- Stats Grid -->
        <div style="display: flex; justify-content: space-around; text-align: center; padding: 20px 0; border-bottom: 1px solid #f3f4f6;">
          <div>
            <div style="font-size: 28px; font-weight: bold; color: #10b981;">${data.conversationCount || 0}</div>
            <div style="font-size: 12px; color: #6b7280;">次对话</div>
          </div>
          <div>
            <div style="font-size: 28px; font-weight: bold; color: #8b5cf6;">${data.briefingCount || 0}</div>
            <div style="font-size: 12px; color: #6b7280;">条记录</div>
          </div>
          <div>
            <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${data.goalProgress || 0}%</div>
            <div style="font-size: 12px; color: #6b7280;">目标进度</div>
          </div>
        </div>

        ${data.dominantEmotions?.length ? `
        <!-- Emotion Summary -->
        <div style="margin: 24px 0;">
          <h3 style="font-size: 14px; color: #374151; margin: 0 0 12px 0;">💭 本周情绪主题</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${data.dominantEmotions.map((e: string) => `
              <span style="background: #f0fdf4; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 13px;">${e}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${data.recentInsights?.length ? `
        <!-- Insights -->
        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <h3 style="font-size: 14px; color: #854d0e; margin: 0 0 8px 0;">💡 我记得你说过</h3>
          ${data.recentInsights.map((insight: string) => `
            <p style="margin: 8px 0 0 0; color: #a16207; font-size: 14px; font-style: italic;">"${insight}"</p>
          `).join('')}
        </div>
        ` : ''}

        ${data.highlight ? `
        <!-- Weekly Highlight -->
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <h3 style="font-size: 14px; color: #0369a1; margin: 0 0 8px 0;">✨ 本周亮点洞察</h3>
          <p style="margin: 0; color: #0284c7; font-size: 14px;">${data.highlight}</p>
        </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-size: 15px; font-weight: 500;">
            继续我的成长之旅 →
          </a>
        </div>

        <!-- Encouragement -->
        <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
          每一次记录，都是对自己的温柔关照。<br/>
          下周继续加油，我会一直陪着你 💚
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; background: #f9fafb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          有劲AI · 每个人的生活教练
        </p>
        <p style="font-size: 11px; color: #d1d5db; margin: 8px 0 0 0;">
          如不想收到此类邮件，可在设置中关闭智能通知
        </p>
      </div>
    </div>
  `;
}

function buildMilestoneEmail(displayName: string, data: any): string {
  const siteUrl = "https://wechat.eugenewe.net";
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
        <h1 style="color: white; margin: 0; font-size: 22px;">恭喜${displayName}达成新里程碑！</h1>
      </div>
      
      <div style="background: white; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
        <div style="background: #fef3c7; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: bold; color: #d97706;">${data.milestone || '重要成就'}</div>
          <p style="color: #92400e; margin: 8px 0 0 0;">${data.description || '你的坚持令人敬佩'}</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          ${data.message || '每一个里程碑都是你成长路上的印记，继续前行吧！'}
        </p>

        <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-size: 15px; font-weight: 500;">
          查看我的成就 →
        </a>
      </div>

      <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; background: #f9fafb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">有劲AI · 每个人的生活教练</p>
      </div>
    </div>
  `;
}

function buildCareReminderEmail(displayName: string, data: any): string {
  const siteUrl = "https://wechat.eugenewe.net";
  const daysAway = data?.daysAway || '一段时间';
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #ec4899, #db2777); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">💝</div>
        <h1 style="color: white; margin: 0; font-size: 22px;">${displayName}，我们想念你</h1>
      </div>
      
      <div style="background: white; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
          亲爱的${displayName}，
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
          已经有${daysAway}没有看到你了，不知道你最近过得怎么样？
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
          无论你是忙碌、疲惫，还是遇到了什么困难，我都想让你知道：<strong>这里永远有个地方欢迎你回来</strong>。
        </p>

        ${data?.lastInsight ? `
        <div style="background: #fdf2f8; border-left: 4px solid #ec4899; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; color: #9d174d; font-size: 14px;">
            💭 记得你上次说过："${data.lastInsight}"
          </p>
        </div>
        ` : ''}
        
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
          当你准备好的时候，随时回来聊聊。我会一直在这里。
        </p>

        <div style="text-align: center;">
          <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #db2777); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-size: 15px; font-weight: 500;">
            回来看看 →
          </a>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 13px; margin: 24px 0 0 0;">
          带着温暖，<br/>你的有劲AI 💚
        </p>
      </div>

      <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; background: #f9fafb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">有劲AI · 每个人的生活教练</p>
      </div>
    </div>
  `;
}

function buildGrowthCelebrationEmail(displayName: string, data: any): string {
  const siteUrl = "https://wechat.eugenewe.net";
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">✨</div>
        <h1 style="color: white; margin: 0; font-size: 22px;">${displayName}，你的成长令人骄傲</h1>
      </div>
      
      <div style="background: white; padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
          亲爱的${displayName}，
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
          我注意到你最近有一些令人欣喜的变化：
        </p>

        <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: #5b21b6; font-size: 15px; margin: 0; line-height: 1.8;">
            ${data?.growthDetail || '你的情绪状态正在改善，记录频率也在提升'}
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
          这些改变或许看起来很小，但它们证明了你内心的力量和对自己的承诺。
          <strong>继续保持，你正在成为更好的自己。</strong>
        </p>

        <div style="text-align: center;">
          <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-size: 15px; font-weight: 500;">
            继续成长之旅 →
          </a>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; background: #f9fafb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">有劲AI · 每个人的生活教练</p>
      </div>
    </div>
  `;
}

serve(handler);
