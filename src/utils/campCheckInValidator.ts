import { supabase } from "@/integrations/supabase/client";

export interface CheckInValidation {
  isValid: boolean;
  completedSteps: {
    declaration: boolean;
    emotionLog: boolean;
    reflection: boolean;
  };
  emotionLogCount: number;
  hasIntensity: boolean;
  hasInsight: boolean;
  hasAction: boolean;
  canCheckIn: boolean;
  reason?: string;
}

export type CheckInRequirement = "single_emotion" | "full_practice" | "strict_quality";

/**
 * 验证今日打卡是否满足条件
 */
export const validateCheckIn = async (
  userId: string,
  campId: string,
  requirement: CheckInRequirement = "single_emotion"
): Promise<CheckInValidation> => {
  const today = new Date().toISOString().split("T")[0];

  // 1. 检查今日进度
  const { data: progress } = await supabase
    .from("camp_daily_progress")
    .select("*")
    .eq("camp_id", campId)
    .eq("progress_date", today)
    .maybeSingle();

  // 2. 检查今日情绪记录
  const { data: briefings } = await supabase
    .from("briefings")
    .select("*, conversations!inner(*)")
    .eq("conversations.user_id", userId)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const emotionLogCount = briefings?.length || 0;
  const latestBriefing = briefings?.[0];

  const completedSteps = {
    declaration: progress?.declaration_completed || false,
    emotionLog: emotionLogCount > 0,
    reflection: progress?.reflection_completed || false,
  };

  const hasIntensity = latestBriefing?.emotion_intensity != null;
  const hasInsight = !!latestBriefing?.insight;
  const hasAction = !!latestBriefing?.action;

  // 3. 根据要求级别验证
  let canCheckIn = false;
  let reason = "";

  switch (requirement) {
    case "single_emotion":
      canCheckIn = completedSteps.emotionLog;
      if (!canCheckIn) {
        reason = "至少需要完成1次情绪记录";
      }
      break;

    case "full_practice":
      canCheckIn =
        completedSteps.declaration &&
        completedSteps.emotionLog &&
        completedSteps.reflection;
      if (!canCheckIn) {
        const missing = [];
        if (!completedSteps.declaration) missing.push("宣言卡");
        if (!completedSteps.emotionLog) missing.push("情绪记录");
        if (!completedSteps.reflection) missing.push("晚间复盘");
        reason = `还需完成：${missing.join("、")}`;
      }
      break;

    case "strict_quality":
      canCheckIn =
        completedSteps.emotionLog &&
        hasIntensity &&
        hasInsight &&
        hasAction;
      if (!canCheckIn) {
        const missing = [];
        if (!completedSteps.emotionLog) missing.push("情绪记录");
        if (!hasIntensity) missing.push("记录情绪强度");
        if (!hasInsight) missing.push("写下洞察");
        if (!hasAction) missing.push("设定行动");
        reason = `还需：${missing.join("、")}`;
      }
      break;
  }

  return {
    isValid: true,
    completedSteps,
    emotionLogCount,
    hasIntensity,
    hasInsight,
    hasAction,
    canCheckIn,
    reason: canCheckIn ? undefined : reason,
  };
};

/**
 * 执行打卡
 */
export const performCheckIn = async (
  userId: string,
  campId: string,
  checkinType: "auto" | "manual" | "makeup" = "manual"
): Promise<{ success: boolean; error?: string }> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 更新或创建打卡进度
    const { error } = await supabase
      .from("camp_daily_progress")
      .upsert(
        {
          camp_id: campId,
          user_id: userId,
          progress_date: today,
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checkin_type: checkinType,
          validation_passed: true,
        },
        {
          onConflict: "camp_id,progress_date",
        }
      );

    if (error) throw error;

    // 更新训练营完成天数
    const { data: camp } = await supabase
      .from("training_camps")
      .select("*")
      .eq("id", campId)
      .single();

    if (camp) {
      const checkInDates = Array.isArray(camp.check_in_dates)
        ? camp.check_in_dates
        : [];

      if (!checkInDates.includes(today)) {
        checkInDates.push(today);

        await supabase
          .from("training_camps")
          .update({
            completed_days: camp.completed_days + 1,
            check_in_dates: checkInDates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campId);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("打卡失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "打卡失败",
    };
  }
};

/**
 * 检查是否可以补打卡
 */
export const canMakeupCheckIn = async (
  userId: string,
  campId: string,
  targetDate: string,
  makeupDaysLimit: number
): Promise<{ canMakeup: boolean; reason?: string }> => {
  const today = new Date();
  const target = new Date(targetDate);
  const daysDiff = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 0) {
    return { canMakeup: false, reason: "只能补过去的打卡" };
  }

  if (daysDiff > makeupDaysLimit) {
    return {
      canMakeup: false,
      reason: `只能补 ${makeupDaysLimit} 天内的打卡`,
    };
  }

  // 检查该日期是否已经打卡
  const { data: existing } = await supabase
    .from("camp_daily_progress")
    .select("is_checked_in")
    .eq("camp_id", campId)
    .eq("progress_date", targetDate)
    .maybeSingle();

  if (existing?.is_checked_in) {
    return { canMakeup: false, reason: "该日期已经打过卡" };
  }

  return { canMakeup: true };
};
