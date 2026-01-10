import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCamp } from "@/types/trainingCamp";
import CampProgressCalendar from "./CampProgressCalendar";
import { useToast } from "@/hooks/use-toast";
import { getDaysSinceStart } from "@/utils/dateUtils";

export function TrainingCampDetail() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [camp, setCamp] = useState<TrainingCamp | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 动态计算当前是第几天（从1开始显示）
  const calculatedCurrentDay = camp ? Math.max(1,
    getDaysSinceStart(camp.start_date) + 1
  ) : 1;
  const displayCurrentDay = camp ? Math.min(calculatedCurrentDay, camp.duration_days) : 1;

  useEffect(() => {
    loadCamp();
  }, [campId]);

  const loadCamp = async () => {
    try {
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('id', campId)
        .single();

      if (error) throw error;
      setCamp({
        ...data,
        check_in_dates: Array.isArray(data.check_in_dates) ? data.check_in_dates : []
      } as TrainingCamp);
    } catch (error) {
      console.error('Error loading camp:', error);
      toast({
        title: "加载失败",
        description: "无法加载训练营信息",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextMilestone = () => {
    if (!camp) return null;
    
    // 财富训练营是7天，其他训练营是21天
    const isWealthCamp = camp.camp_type?.includes('wealth');
    
    if (isWealthCamp) {
      if (!camp.milestone_7_reached) {
        return { name: "7天毕业", daysNeeded: 7 - camp.completed_days, icon: "🏆" };
      }
      return null;
    }
    
    // 其他21天训练营
    if (!camp.milestone_7_reached) {
      return { name: "一周勇士", daysNeeded: 7 - camp.completed_days, icon: "⭐" };
    }
    if (!camp.milestone_14_reached) {
      return { name: "半程达人", daysNeeded: 14 - camp.completed_days, icon: "🌟" };
    }
    if (!camp.milestone_21_completed) {
      return { name: "习惯大师", daysNeeded: 21 - camp.completed_days, icon: "🏆" };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">未找到训练营</div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const completionRate = ((camp.completed_days / camp.duration_days) * 100).toFixed(0);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">{camp?.camp_type?.includes('wealth') ? '7天训练营' : '21天训练营'}</h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{displayCurrentDay}</div>
              <div className="text-sm text-muted-foreground">当前天数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">{camp.completed_days}</div>
              <div className="text-sm text-muted-foreground">已打卡</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{completionRate}%</div>
              <div className="text-sm text-muted-foreground">完成度</div>
            </div>
          </div>
        </Card>

        <CampProgressCalendar
          campId={camp.id}
          startDate={camp.start_date}
          checkInDates={camp.check_in_dates}
          currentDay={calculatedCurrentDay}
          makeupDaysLimit={1}
          onMakeupCheckIn={undefined}
        />

        {nextMilestone && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              下一个里程碑
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl mb-1">{nextMilestone.icon}</div>
                <div className="font-medium">{nextMilestone.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {nextMilestone.daysNeeded}
                </div>
                <div className="text-sm text-muted-foreground">天后达成</div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI 教练建议
          </h3>
          <div className="space-y-2 text-muted-foreground">
            {camp.completed_days >= 14 && (
              <p>🎉 太棒了！你已经坚持了两周，习惯正在养成中！</p>
            )}
            {camp.completed_days >= 7 && camp.completed_days < 14 && (
              <p>💪 你已经完成了第一个里程碑，继续保持这个节奏！</p>
            )}
            {camp.completed_days < 7 && (
              <p>🌱 良好的开始！建立规律的记录习惯是成长的第一步。</p>
            )}
            <p>记住：每天花几分钟记录情绪，就是在投资自己的心理健康。</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
