import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCampDailyProgress } from "@/hooks/useCampDailyProgress";
import { validateCheckIn, performCheckIn } from "@/utils/campCheckInValidator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DailyPracticeCard from "@/components/camp/DailyPracticeCard";
import CheckInProgress from "@/components/camp/CheckInProgress";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const CampCheckIn = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [checkinRequirement, setCheckinRequirement] = useState<string>("single_emotion");

  const { progress, loadProgress, updateProgress } = useCampDailyProgress(
    campId || "",
    user?.id || ""
  );

  useEffect(() => {
    if (campId && user) {
      loadCampData();
      loadUserSettings();
    }
  }, [campId, user]);

  useEffect(() => {
    if (campId && user && checkinRequirement) {
      validateToday();
    }
  }, [campId, user, progress, checkinRequirement]);

  const loadCampData = async () => {
    if (!campId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("training_camps")
        .select("*")
        .eq("id", campId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setCamp(data);
    } catch (error) {
      console.error("加载训练营失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载训练营信息",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("camp_checkin_requirement")
        .eq("id", user.id)
        .single();

      if (data?.camp_checkin_requirement) {
        setCheckinRequirement(data.camp_checkin_requirement);
      }
    } catch (error) {
      console.error("加载用户设置失败:", error);
    }
  };

  const validateToday = async () => {
    if (!user || !campId) return;

    try {
      const result = await validateCheckIn(user.id, campId, checkinRequirement as any);
      setValidation(result);
    } catch (error) {
      console.error("验证打卡条件失败:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !campId || !validation?.canCheckIn) return;

    try {
      setCheckingIn(true);
      const result = await performCheckIn(user.id, campId, "manual");

      if (result.success) {
        toast({
          title: "打卡成功",
          description: "恭喜你完成今日打卡！继续保持 💪",
        });

        // 刷新进度
        await loadProgress();
        await loadCampData();

        // 跳转回训练营详情
        setTimeout(() => {
          navigate(`/camp/${campId}`);
        }, 1500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("打卡失败:", error);
      toast({
        title: "打卡失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStartDeclaration = () => {
    navigate("/energy-studio");
  };

  const handleStartEmotionLog = () => {
    navigate("/");
  };

  const handleStartReflection = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!camp) {
    return null;
  }

  const completedCount =
    (progress.declaration_completed ? 1 : 0) +
    (progress.emotion_logs_count > 0 ? 1 : 0) +
    (progress.reflection_completed ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/camp/${campId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              第 {camp.current_day} 天打卡
              {progress.is_checked_in && (
                <Badge className="bg-green-500">已完成</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
            </p>
          </div>
        </div>

        {/* 打卡进度 */}
        <div className="mb-6">
          <CheckInProgress
            completedCount={completedCount}
            totalCount={3}
            canCheckIn={validation?.canCheckIn || false}
            reason={validation?.reason}
            onCheckIn={handleCheckIn}
            loading={checkingIn}
          />
        </div>

        {/* 三步练习 */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">今日练习</h2>

          {/* 早间宣言 */}
          <DailyPracticeCard
            emoji="☀️"
            title="早间练习"
            subtitle="今日宣言卡"
            description="用一句话为今天设定积极的意图，给自己注入正能量"
            duration="1分钟"
            completed={progress.declaration_completed}
            onStart={handleStartDeclaration}
            disabled={progress.is_checked_in}
          />

          {/* 白天记录 */}
          <DailyPracticeCard
            emoji="🌤️"
            title="白天记录"
            subtitle="记录情绪时刻"
            description="当情绪出现时，花几分钟和劲老师对话，梳理情绪背后的故事"
            duration="2-3分钟"
            completed={progress.emotion_logs_count > 0}
            count={progress.emotion_logs_count}
            onStart={handleStartEmotionLog}
            disabled={progress.is_checked_in}
          />

          {/* 晚间复盘 */}
          <DailyPracticeCard
            emoji="🌙"
            title="晚间复盘"
            subtitle="今日情绪梳理"
            description="睡前回顾今天的情绪旅程，沉淀洞察，规划明天的行动"
            duration="6分钟"
            completed={progress.reflection_completed}
            onStart={handleStartReflection}
            disabled={progress.is_checked_in}
          />
        </div>

        {/* 提示信息 */}
        <div className="mt-8 p-4 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            💡 温馨提示：根据你的打卡设置，
            {checkinRequirement === "single_emotion" && "完成1次情绪记录即可打卡"}
            {checkinRequirement === "full_practice" && "需完成全部3步练习才能打卡"}
            {checkinRequirement === "strict_quality" && "需完成高质量的情绪记录（包含强度、洞察和行动）"}
            。可以在设置中调整打卡要求。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampCheckIn;
