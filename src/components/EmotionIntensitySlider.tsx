import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const EmotionIntensitySlider = () => {
  const [intensity, setIntensity] = useState([5]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRecordedIntensity, setLastRecordedIntensity] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLastRecord();
  }, []);

  const loadLastRecord = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("emotion_quick_logs")
        .select("emotion_intensity, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastRecordedIntensity(data.emotion_intensity);
      }
    } catch (error) {
      console.error("加载最近记录失败:", error);
    }
  };

  const getIntensityColor = (value: number) => {
    if (value <= 3) return "text-green-500";
    if (value <= 5) return "text-blue-500";
    if (value <= 7) return "text-orange-500";
    return "text-red-500";
  };

  const getIntensityBgColor = (value: number) => {
    if (value <= 3) return "bg-green-500/20";
    if (value <= 5) return "bg-blue-500/20";
    if (value <= 7) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  const getIntensityLabel = (value: number) => {
    if (value <= 3) return "轻微";
    if (value <= 5) return "中等";
    if (value <= 7) return "较强";
    return "强烈";
  };

  const handleRecord = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { error } = await supabase
        .from("emotion_quick_logs")
        .insert({
          user_id: user.id,
          emotion_intensity: intensity[0],
          note: null,
        });

      if (error) throw error;

      setLastRecordedIntensity(intensity[0]);
      toast({
        title: "记录成功 ✓",
        description: `情绪强度 ${intensity[0]}/10 已保存`,
      });

      // 收起组件
      setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
    } catch (error) {
      console.error("记录失败:", error);
      toast({
        title: "记录失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card 
      className={cn(
        "fixed bottom-20 right-4 z-40 transition-all duration-300 shadow-lg",
        isExpanded ? "w-80" : "w-14"
      )}
    >
      {/* 折叠状态 - 只显示图标 */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full h-14 p-0 hover:bg-primary/5"
        >
          <div className="flex flex-col items-center gap-1">
            <Heart className={cn("w-5 h-5", lastRecordedIntensity ? getIntensityColor(lastRecordedIntensity) : "text-primary")} />
            {lastRecordedIntensity && (
              <span className="text-[10px] font-medium text-muted-foreground">
                {lastRecordedIntensity}
              </span>
            )}
          </div>
        </Button>
      )}

      {/* 展开状态 - 显示完整滑块 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className={cn("w-5 h-5", getIntensityColor(intensity[0]))} />
              <h3 className="text-sm font-semibold text-foreground">
                情绪强度
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* 强度数值显示 */}
          <div className={cn(
            "flex items-center justify-center gap-2 rounded-lg p-3 transition-colors",
            getIntensityBgColor(intensity[0])
          )}>
            <span className={cn("text-3xl font-bold", getIntensityColor(intensity[0]))}>
              {intensity[0]}
            </span>
            <span className="text-sm text-muted-foreground">/10</span>
          </div>

          {/* 强度描述 */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {getIntensityLabel(intensity[0])}
            </p>
          </div>

          {/* 滑块 */}
          <div className="space-y-2">
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 轻微</span>
              <span>10 强烈</span>
            </div>
          </div>

          {/* 记录按钮 */}
          <Button
            onClick={handleRecord}
            disabled={isSubmitting}
            className="w-full gap-2"
            size="sm"
          >
            {isSubmitting ? (
              <>记录中...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                记录此刻情绪
              </>
            )}
          </Button>

          {lastRecordedIntensity !== null && (
            <p className="text-xs text-muted-foreground text-center">
              上次记录: {lastRecordedIntensity}/10
            </p>
          )}
        </div>
      )}
    </Card>
  );
};