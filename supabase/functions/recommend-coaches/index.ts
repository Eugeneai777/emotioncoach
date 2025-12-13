import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoachScore {
  coach_id: string;
  total_score: number;
  specialty_score: number;
  rating_score: number;
  availability_score: number;
  experience_score: number;
  match_reasons: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { limit = 5 } = await req.json().catch(() => ({}));

    // 1. Get all active coaches
    const { data: coaches, error: coachError } = await supabase
      .from("human_coaches")
      .select("*")
      .eq("status", "active")
      .eq("is_accepting_new", true);

    if (coachError) throw coachError;
    if (!coaches || coaches.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "暂无可用教练" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get user behavior analysis if logged in
    let userProfile: any = null;
    let userEmotions: string[] = [];
    let userBriefings: any[] = [];

    if (userId) {
      // Get user behavior analysis
      const { data: behaviorData } = await supabase
        .from("user_behavior_analysis")
        .select("*")
        .eq("user_id", userId)
        .order("analysis_date", { ascending: false })
        .limit(1)
        .single();

      userProfile = behaviorData;
      userEmotions = behaviorData?.dominant_emotions || [];

      // Get recent briefings for emotion themes
      const { data: briefings } = await supabase
        .from("briefings")
        .select("emotion_theme, emotion_intensity, created_at")
        .eq("conversation_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      userBriefings = briefings || [];

      // Extract emotion themes from briefings
      if (briefings && briefings.length > 0) {
        const recentEmotions = briefings
          .map((b: any) => b.emotion_theme)
          .filter(Boolean);
        userEmotions = [...new Set([...userEmotions, ...recentEmotions])];
      }
    }

    // 3. Get available time slots count for each coach
    const today = new Date().toISOString().split("T")[0];
    const { data: timeSlots } = await supabase
      .from("coach_time_slots")
      .select("coach_id")
      .eq("status", "available")
      .gte("slot_date", today);

    const availabilityMap: Record<string, number> = {};
    timeSlots?.forEach((slot: any) => {
      availabilityMap[slot.coach_id] = (availabilityMap[slot.coach_id] || 0) + 1;
    });

    // 4. Calculate scores for each coach
    const coachScores: CoachScore[] = coaches.map((coach: any) => {
      const matchReasons: string[] = [];
      let specialtyScore = 0;
      let ratingScore = 0;
      let availabilityScore = 0;
      let experienceScore = 0;

      // Specialty matching (0-40 points)
      const coachSpecialties: string[] = coach.specialties || [];
      const emotionSpecialtyMap: Record<string, string[]> = {
        "焦虑": ["情绪管理", "压力疏导", "焦虑调节"],
        "抑郁": ["情绪疏导", "心理支持", "抑郁陪伴"],
        "愤怒": ["情绪调节", "冲突处理", "愤怒管理"],
        "悲伤": ["情绪陪伴", "哀伤辅导", "心理疏导"],
        "恐惧": ["恐惧克服", "安全感建立", "情绪稳定"],
        "压力": ["压力管理", "职场心理", "减压技巧"],
        "亲子": ["亲子关系", "家庭教育", "青少年心理"],
        "沟通": ["人际沟通", "情感表达", "关系修复"],
        "职场": ["职业规划", "职场压力", "工作倦怠"],
        "情感": ["情感问题", "婚恋咨询", "亲密关系"],
      };

      // Match user emotions to coach specialties
      let matchedSpecialties: string[] = [];
      userEmotions.forEach((emotion) => {
        const relatedSpecialties = emotionSpecialtyMap[emotion] || [];
        const matched = coachSpecialties.filter((s) =>
          relatedSpecialties.some((rs) => s.includes(rs) || rs.includes(s))
        );
        matchedSpecialties = [...matchedSpecialties, ...matched];
      });

      // Also check for direct specialty matches
      coachSpecialties.forEach((specialty) => {
        if (
          userEmotions.some(
            (e) =>
              specialty.includes(e) ||
              e.includes(specialty.slice(0, 2))
          )
        ) {
          matchedSpecialties.push(specialty);
        }
      });

      matchedSpecialties = [...new Set(matchedSpecialties)];
      if (matchedSpecialties.length > 0) {
        specialtyScore = Math.min(40, matchedSpecialties.length * 15);
        matchReasons.push(`专业领域匹配: ${matchedSpecialties.slice(0, 2).join("、")}`);
      }

      // Rating score (0-30 points)
      const rating = Number(coach.rating) || 0;
      const positiveRate = Number(coach.positive_rate) || 0;
      ratingScore = (rating / 5) * 20 + (positiveRate / 100) * 10;
      if (rating >= 4.5) {
        matchReasons.push(`高评分 ${rating.toFixed(1)}分`);
      }
      if (positiveRate >= 95) {
        matchReasons.push(`${positiveRate.toFixed(0)}%好评率`);
      }

      // Availability score (0-15 points)
      const slotCount = availabilityMap[coach.id] || 0;
      availabilityScore = Math.min(15, slotCount * 2);
      if (slotCount >= 5) {
        matchReasons.push("近期可预约");
      }

      // Experience score (0-15 points)
      const years = coach.experience_years || 0;
      experienceScore = Math.min(15, years * 1.5);
      if (years >= 5) {
        matchReasons.push(`${years}年经验`);
      }

      // Badge bonus
      if (coach.badge_type === "gold") {
        ratingScore += 5;
        matchReasons.push("金牌教练");
      } else if (coach.badge_type === "preferred") {
        ratingScore += 3;
        matchReasons.push("优选教练");
      }

      // Verified bonus
      if (coach.is_verified) {
        experienceScore += 2;
      }

      // Default reasons if no specific matches
      if (matchReasons.length === 0) {
        if (coach.total_sessions > 50) {
          matchReasons.push(`已服务${coach.total_sessions}+人`);
        }
        if (coachSpecialties.length > 0) {
          matchReasons.push(`擅长${coachSpecialties[0]}`);
        }
      }

      const totalScore =
        specialtyScore + ratingScore + availabilityScore + experienceScore;

      return {
        coach_id: coach.id,
        total_score: totalScore,
        specialty_score: specialtyScore,
        rating_score: ratingScore,
        availability_score: availabilityScore,
        experience_score: experienceScore,
        match_reasons: matchReasons.slice(0, 3),
      };
    });

    // 5. Sort by score and get top coaches
    coachScores.sort((a, b) => b.total_score - a.total_score);
    const topCoachIds = coachScores.slice(0, limit).map((c) => c.coach_id);
    const scoreMap = new Map(coachScores.map((c) => [c.coach_id, c]));

    // 6. Get full coach details for recommendations
    const recommendations = coaches
      .filter((c: any) => topCoachIds.includes(c.id))
      .map((coach: any) => {
        const score = scoreMap.get(coach.id)!;
        return {
          ...coach,
          match_score: score.total_score,
          match_reasons: score.match_reasons,
          score_breakdown: {
            specialty: score.specialty_score,
            rating: score.rating_score,
            availability: score.availability_score,
            experience: score.experience_score,
          },
        };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score);

    console.log(`Recommended ${recommendations.length} coaches for user ${userId || "anonymous"}`);

    return new Response(
      JSON.stringify({
        recommendations,
        user_emotions: userEmotions,
        has_user_profile: !!userProfile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Recommend coaches error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
