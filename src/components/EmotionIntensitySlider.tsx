import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const EmotionIntensitySlider = () => {
  const [intensity, setIntensity] = useState([5]);
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
      className="fixed bottom-24 right-3 z-40 w-64 transition-all duration-300 shadow-xl border-2"
    >
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Heart className={cn("w-4 h-4", getIntensityColor(intensity[0]))} />
            <h3 className="text-xs font-semibold text-foreground">
              快捷记录
            </h3>
          </div>
        </div>

        {/* 强度数值显示 */}
        <div className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg p-2 transition-colors",
          getIntensityBgColor(intensity[0])
        )}>
          <span className={cn("text-2xl font-bold", getIntensityColor(intensity[0]))}>
            {intensity[0]}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-muted-foreground">/10</span>
            <span className="text-[9px] font-medium text-foreground">
              {getIntensityLabel(intensity[0])}
            </span>
          </div>
        </div>

        {/* 滑块 */}
        <div className="space-y-1.5">
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
            <span>轻微</span>
            <span>强烈</span>
          </div>
        </div>

        {/* 记录按钮 */}
        <Button
          onClick={handleRecord}
          disabled={isSubmitting}
          className="w-full gap-1.5 h-8"
          size="sm"
        >
          {isSubmitting ? (
            <span className="text-xs">记录中...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs">记录</span>
            </>
          )}
        </Button>

        {lastRecordedIntensity !== null && (
          <p className="text-[9px] text-muted-foreground text-center">
            上次: {lastRecordedIntensity}/10
          </p>
        )}
      </div>
    </Card>
  );
};