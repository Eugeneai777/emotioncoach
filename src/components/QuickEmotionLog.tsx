import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Check, Loader2 } from "lucide-react";
import { EmotionIntensityGuide } from "./EmotionIntensityGuide";

export const QuickEmotionLog = () => {
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const getIntensityColor = (value: number) => {
    if (value <= 3) return "bg-green-500 hover:bg-green-600";
    if (value <= 5) return "bg-blue-500 hover:bg-blue-600";
    if (value <= 7) return "bg-orange-500 hover:bg-orange-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getIntensityLabel = (value: number) => {
    if (value <= 3) return "轻微";
    if (value <= 5) return "中等";
    if (value <= 7) return "较强";
    return "强烈";
  };

  const handleSubmit = async () => {
    if (selectedIntensity === null) {
      toast({
        title: "请选择情绪强度",
        description: "请先选择一个1-10的情绪强度",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { error } = await supabase
        .from("emotion_quick_logs")
        .insert({
          user_id: user.id,
          emotion_intensity: selectedIntensity,
          note: note.trim() || null,
        });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedIntensity(null);
        setNote("");
      }, 2000);

      toast({
        title: "记录成功",
        description: "你的情绪强度已记录 🌿",
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

  if (showSuccess) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20 animate-in fade-in-50 duration-500">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">记录成功</h3>
            <p className="text-sm text-muted-foreground">你的情绪强度已保存</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">
                快速记录情绪强度
              </h3>
              <p className="text-xs text-muted-foreground">
                此刻的感受有多强烈？
              </p>
            </div>
          </div>
          <EmotionIntensityGuide />
        </div>

        {/* 情绪强度选择器 */}
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((intensity) => (
              <Button
                key={intensity}
                variant={selectedIntensity === intensity ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedIntensity(intensity)}
                className={`h-10 md:h-12 text-sm md:text-base font-medium transition-all ${
                  selectedIntensity === intensity
                    ? `${getIntensityColor(intensity)} text-white shadow-md scale-105`
                    : "hover:scale-105"
                }`}
              >
                {intensity}
              </Button>
            ))}
          </div>
          
          {selectedIntensity !== null && (
            <div className="text-center animate-in fade-in-50 slide-in-from-top-2 duration-300">
              <p className="text-sm font-medium text-foreground">
                {getIntensityLabel(selectedIntensity)} · {selectedIntensity}/10
              </p>
            </div>
          )}
        </div>

        {/* 可选备注 */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            备注（可选）
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="简单记录一下当下的感受..."
            className="min-h-[60px] max-h-[100px] resize-none text-sm"
            maxLength={200}
          />
          <div className="text-right text-[10px] text-muted-foreground">
            {note.length}/200
          </div>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={selectedIntensity === null || isSubmitting}
          className="w-full gap-2"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              记录中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              保存记录
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};