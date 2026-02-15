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

          if (isActivePartner && hasPaidAssessment) {
            setTargetPath("/coach/wealth_coach_4_questions");
          } else if (hasActiveCamp) {
            setTargetPath("/wealth-camp-checkin");
          } else {
            setTargetPath("/wealth-coach-intro");
          }
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

export default SmartHomeRedirect;
