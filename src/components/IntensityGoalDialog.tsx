import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";

interface IntensityGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const IntensityGoalDialog = ({ open, onOpenChange, onSuccess }: IntensityGoalDialogProps) => {
  const [goalCategory, setGoalCategory] = useState<string>("intensity_average");
  const [goalType, setGoalType] = useState<"weekly" | "monthly">("weekly");
  const [intensityMin, setIntensityMin] = useState(3);
  const [intensityMax, setIntensityMax] = useState(6);
  const [targetDays, setTargetDays] = useState(5);
  const [peakThreshold, setPeakThreshold] = useState(7);
  const [maxPeakDays, setMaxPeakDays] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleCreateGoal = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const now = new Date();
      const startDate = goalType === "weekly" 
        ? new Date(now.setDate(now.getDate() - now.getDay()))
        : new Date(now.getFullYear(), now.getMonth(), 1);
      
      const endDate = goalType === "weekly"
        ? new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      let description = "";
      let goalData: any = {
        user_id: user.id,
        goal_type: goalType,
        goal_category: goalCategory,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        is_active: true,
        target_count: 0,
      };

      switch (goalCategory) {
        case "intensity_average":
          goalData.intensity_min = intensityMin;
          goalData.intensity_max = intensityMax;
          description = `保持平均情绪强度在 ${intensityMin}-${intensityMax} 分`;
          break;
        case "intensity_range_days":
          goalData.intensity_min = intensityMin;
          goalData.intensity_max = intensityMax;
          goalData.intensity_target_days = targetDays;
          description = `${targetDays} 天情绪在 ${intensityMin}-${intensityMax} 分区间`;
          break;
        case "intensity_peak_control":
          goalData.intensity_min = peakThreshold;
          goalData.intensity_target_days = maxPeakDays;
          description = `高强度(>${peakThreshold}分)天数不超过 ${maxPeakDays} 天`;
          break;
      }

      goalData.description = description;

      const { error } = await supabase
        .from("emotion_goals")
        .insert(goalData);

      if (error) throw error;

      toast({
        title: "目标创建成功 🎯",
        description: description,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>设定情绪强度目标</DialogTitle>
          <DialogDescription>
            设置基于情绪强度的管理目标，追踪你的情绪健康
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 目标周期 */}
          <div className="space-y-2">
            <Label>目标周期</Label>
            <RadioGroup value={goalType} onValueChange={(v) => setGoalType(v as "weekly" | "monthly")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">每周目标</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">每月目标</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 目标类型 */}
          <div className="space-y-2">
            <Label>目标类型</Label>
            <RadioGroup value={goalCategory} onValueChange={setGoalCategory}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intensity_average" id="avg" />
                <Label htmlFor="avg" className="cursor-pointer">平均强度控制</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intensity_range_days" id="range" />
                <Label htmlFor="range" className="cursor-pointer">理想区间天数</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intensity_peak_control" id="peak" />
                <Label htmlFor="peak" className="cursor-pointer">峰值控制</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 打卡要求提示 */}
          <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  目标评估要求
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  <li className={goalType === "weekly" ? "font-bold" : ""}>
                    <strong>周目标</strong>：每周至少记录 <strong>3 天</strong>
                  </li>
                  <li className={goalType === "monthly" ? "font-bold" : ""}>
                    <strong>月目标</strong>：每月至少记录 <strong>10 天</strong>
                  </li>
                  <li>
                    记录需要<strong>均匀分布</strong>，避免集中打卡
                  </li>
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  <span>满足要求后才能准确计算强度目标进度</span>
                </p>
              </div>
            </div>
          </div>

          {/* 根据不同目标类型显示不同的配置 */}
          {goalCategory === "intensity_average" && (
            <div className="space-y-3 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>保持平均情绪强度在目标区间内</span>
              </div>
              <div className="space-y-2">
                <Label>目标强度区间：{intensityMin} - {intensityMax} 分</Label>
                <Slider
                  value={[intensityMin, intensityMax]}
                  onValueChange={([min, max]) => {
                    setIntensityMin(min);
                    setIntensityMax(max);
                  }}
                  min={1}
                  max={10}
                  step={1}
                  minStepsBetweenThumbs={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 分（平静）</span>
                  <span>10 分（极度强烈）</span>
                </div>
              </div>
            </div>
          )}

          {goalCategory === "intensity_range_days" && (
            <div className="space-y-3 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>设置在理想强度区间的目标天数</span>
              </div>
              <div className="space-y-2">
                <Label>理想强度区间：{intensityMin} - {intensityMax} 分</Label>
                <Slider
                  value={[intensityMin, intensityMax]}
                  onValueChange={([min, max]) => {
                    setIntensityMin(min);
                    setIntensityMax(max);
                  }}
                  min={1}
                  max={10}
                  step={1}
                  minStepsBetweenThumbs={1}
                />
              </div>
              <div className="space-y-2">
                <Label>目标天数</Label>
                <Input
                  type="number"
                  min="1"
                  max={goalType === "weekly" ? 7 : 31}
                  value={targetDays}
                  onChange={(e) => setTargetDays(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {goalCategory === "intensity_peak_control" && (
            <div className="space-y-3 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>控制高强度情绪的出现频率</span>
              </div>
              <div className="space-y-2">
                <Label>高强度阈值：{peakThreshold} 分</Label>
                <Slider
                  value={[peakThreshold]}
                  onValueChange={([val]) => setPeakThreshold(val)}
                  min={5}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>最多允许天数</Label>
                <Input
                  type="number"
                  min="0"
                  max={goalType === "weekly" ? 7 : 31}
                  value={maxPeakDays}
                  onChange={(e) => setMaxPeakDays(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <Button onClick={handleCreateGoal} disabled={isSaving} className="w-full">
            {isSaving ? "创建中..." : "创建目标"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};