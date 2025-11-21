import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Heart, Lightbulb, X, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmotionIntensityGuide } from "./EmotionIntensityGuide";
import { useSmartNotification } from "@/hooks/useSmartNotification";

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  created_at: string;
}

interface AlertSuggestion {
  immediate_actions: string[];
  self_care_tips: string[];
  when_to_seek_help: string;
  encouraging_message: string;
}

export const EmotionAlert = () => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [alertData, setAlertData] = useState<{
    consecutiveDays: number;
    avgIntensity: number;
    recentEmotions: string[];
  } | null>(null);
  const [suggestions, setSuggestions] = useState<AlertSuggestion | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();
  const { triggerNotification } = useSmartNotification();

  useEffect(() => {
    checkEmotionAlert();
  }, []);

  const checkEmotionAlert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取用户最近7天的对话
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (!conversations || conversations.length === 0) return;

      const conversationIds = conversations.map(c => c.id);

      // 获取最近7天的简报
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: briefings, error } = await supabase
        .from('briefings')
        .select('id, emotion_theme, emotion_intensity, created_at')
        .in('conversation_id', conversationIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error || !briefings) return;

      // 分析是否有连续高强度情绪
      const highIntensityBriefings = briefings.filter(
        b => b.emotion_intensity && b.emotion_intensity > 7
      );

      if (highIntensityBriefings.length >= 2) {
        // 检查是否是连续的
        const dates = highIntensityBriefings.map(b => 
          new Date(b.created_at).toDateString()
        );
        const uniqueDates = new Set(dates);
        
        if (uniqueDates.size >= 2) {
          const avgIntensity = highIntensityBriefings.reduce(
            (sum, b) => sum + (b.emotion_intensity || 0), 
            0
          ) / highIntensityBriefings.length;

          const recentEmotions = highIntensityBriefings
            .slice(0, 3)
            .map(b => b.emotion_theme);

          setAlertData({
            consecutiveDays: uniqueDates.size,
            avgIntensity: Math.round(avgIntensity * 10) / 10,
            recentEmotions
          });
          setIsAlertActive(true);
        }
      }

      // 检测持续低落情绪（强度 <= 4）
      const lowMoodBriefings = briefings.filter(
        b => b.emotion_intensity && b.emotion_intensity <= 4
      );

      if (lowMoodBriefings.length >= 3) {
        const dates = lowMoodBriefings.map(b => 
          new Date(b.created_at).toDateString()
        );
        const uniqueDates = new Set(dates);
        
        // 如果有至少3天出现低落情绪，触发关怀通知
        if (uniqueDates.size >= 3) {
          const avgIntensity = lowMoodBriefings.reduce(
            (sum, b) => sum + (b.emotion_intensity || 0), 
            0
          ) / lowMoodBriefings.length;

          const dominantEmotions = lowMoodBriefings
            .slice(0, 5)
            .map(b => b.emotion_theme);

          // 触发关怀通知
          await triggerNotification('sustained_low_mood', {
            consecutive_days: uniqueDates.size,
            avg_intensity: Math.round(avgIntensity * 10) / 10,
            dominant_emotions: dominantEmotions
          });
        }
      }
    } catch (error) {
      console.error('检测预警失败:', error);
    }
  };

  const getSuggestions = async () => {
    if (!alertData) return;
    
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('emotion-alert-suggestions', {
        body: {
          consecutive_days: alertData.consecutiveDays,
          avg_intensity: alertData.avgIntensity,
          recent_emotions: alertData.recentEmotions
        }
      });

      if (error) throw error;

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('获取建议失败:', error);
      toast({
        title: "获取建议失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!isAlertActive || !alertData || dismissed) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/80 to-background overflow-hidden animate-in fade-in-50 slide-in-from-top-4 duration-700">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                情绪关注提醒
                <span className="text-xs font-normal text-muted-foreground">
                  最近{alertData.consecutiveDays}天
                </span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                劲老师注意到你最近的情绪强度较高（平均 {alertData.avgIntensity}/10 分），
                包括 {alertData.recentEmotions.join('、')} 等情绪。
                这可能意味着你正在经历一些挑战 🌿
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!suggestions && (
          <Button
            onClick={getSuggestions}
            disabled={loadingSuggestions}
            className="w-full gap-2"
            variant="outline"
          >
            {loadingSuggestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成应对建议中...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                获取应对建议
              </>
            )}
          </Button>
        )}

        {suggestions && (
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Heart className="w-4 h-4 text-orange-600" />
                即刻可以做的
              </div>
              <div className="space-y-2 pl-6">
                {suggestions.immediate_actions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span className="text-sm text-muted-foreground">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                自我照顾建议
              </div>
              <div className="space-y-2 pl-6">
                {suggestions.self_care_tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {suggestions.when_to_seek_help && (
              <Alert className="border-amber-200 bg-amber-50/50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertTitle className="text-sm text-amber-900">何时寻求专业帮助</AlertTitle>
                <AlertDescription className="text-xs text-amber-800">
                  {suggestions.when_to_seek_help}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                💫 {suggestions.encouraging_message}
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <EmotionIntensityGuide />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
