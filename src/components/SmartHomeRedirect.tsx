import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_COACH = "/coach/vibrant_life_sage";

const SmartHomeRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTargetPath(DEFAULT_COACH);
      return;
    }

    const resolve = async () => {
      try {
        // 查询用户 preferred_coach
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_coach")
          .eq("id", user.id)
          .maybeSingle();

        const preferredCoach = profile?.preferred_coach;

        if (preferredCoach === "wealth") {
          // 并行检查合伙人状态、测评购买、活跃训练营
          const [partnerRes, assessmentRes, campRes] = await Promise.all([
            supabase
              .from("partners")
              .select("id, status")
              .eq("user_id", user.id)
              .eq("status", "active")
              .maybeSingle(),
            supabase
              .from("orders")
              .select("id")
              .eq("user_id", user.id)
              .eq("package_key", "wealth_block_assessment")
              .eq("status", "paid")
              .limit(1)
              .maybeSingle(),
            supabase
              .from("training_camps")
              .select("id")
              .eq("user_id", user.id)
              .in("camp_type", ["wealth_block_7", "wealth_block_21"])
              .eq("status", "active")
              .limit(1)
              .maybeSingle(),
          ]);

          const isActivePartner = !!partnerRes.data;
          const hasPaidAssessment = !!assessmentRes.data;
          const hasActiveCamp = !!campRes.data;

          // 已购买测评但未完成：触发即时提醒
          if (hasPaidAssessment) {
            triggerAssessmentReminder(user.id);
          }

          // 所有 wealth 用户统一跳转到财富教练页面
          setTargetPath("/coach/wealth_coach_4_questions");
        } else {
          setTargetPath(DEFAULT_COACH);
        }
      } catch (err) {
        console.error("[SmartHomeRedirect] Error:", err);
        setTargetPath(DEFAULT_COACH);
      }
    };

    resolve();
  }, [user, authLoading]);

  if (!targetPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    );
  }

  return <Navigate to={targetPath} replace />;
};

/**
 * 检查用户是否已完成测评，如未完成则触发即时通知提醒
 * 使用 localStorage 做日级去重
 */
async function triggerAssessmentReminder(userId: string) {
  try {
    // localStorage 日级去重
    const todayKey = `assessment_reminder_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(todayKey)) return;

    // 检查是否已完成测评
    const { data: assessments } = await supabase
      .from("wealth_block_assessments")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (assessments && assessments.length > 0) return; // 已完成，无需提醒

    // 标记今天已触发
    localStorage.setItem(todayKey, "1");

    // 触发智能通知
    await supabase.functions.invoke("generate-smart-notification", {
      body: {
        scenario: "assessment_incomplete_reminder",
        context: {
          user_id: userId,
          action_path: "/wealth-block",
          coach_type: "wealth",
        },
      },
    });

    console.log("[SmartHomeRedirect] 已触发测评未完成提醒");
  } catch (err) {
    console.error("[SmartHomeRedirect] 触发测评提醒失败:", err);
  }
}

export default SmartHomeRedirect;
