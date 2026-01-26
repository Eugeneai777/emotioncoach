import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

const patterns: BreathingPattern[] = [
  {
    id: "4-7-8",
    name: "4-7-8 呼吸法",
    description: "帮助快速放松和入睡",
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4
  },
  {
    id: "box",
    name: "箱式呼吸",
    description: "提高专注力和减压",
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 5
  },
  {
    id: "deep",
    name: "深度呼吸",
    description: "增加氧气供应，提神醒脑",
    inhale: 6,
    hold: 2,
    exhale: 6,
    cycles: 6
  }
];

export const BreathingExercise = () => {
  const { user } = useAuth();
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(patterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [timeLeft, setTimeLeft] = useState(selectedPattern.inhale);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [scale, setScale] = useState(1);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 切换到下一个阶段
          if (currentPhase === "inhale") {
            setCurrentPhase("hold");
            return selectedPattern.hold;
          } else if (currentPhase === "hold") {
            setCurrentPhase("exhale");
            return selectedPattern.exhale;
          } else {
            // 完成一个循环
            if (currentCycle < selectedPattern.cycles) {
              setCurrentCycle((c) => c + 1);
              setCurrentPhase("inhale");
              return selectedPattern.inhale;
            } else {
              // 完成所有循环
              handleComplete();
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentPhase, currentCycle, selectedPattern]);

  // 动画效果
  useEffect(() => {
    if (currentPhase === "inhale") {
      setScale(1.5);
    } else if (currentPhase === "hold") {
      setScale(1.5);
    } else {
      setScale(1);
    }
  }, [currentPhase]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentCycle(1);
    setCurrentPhase("inhale");
    setTimeLeft(selectedPattern.inhale);
    startTimeRef.current = Date.now();
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentCycle(1);
    setCurrentPhase("inhale");
    setTimeLeft(selectedPattern.inhale);
    setScale(1);
  };

  const handleComplete = async () => {
    setIsActive(false);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    // 保存到数据库
    if (user) {
      try {
        await supabase.from("breathing_sessions").insert({
          user_id: user.id,
          pattern_type: selectedPattern.id,
          duration: duration
        });

        toast({
          title: "呼吸练习完成！",
          description: `你完成了 ${selectedPattern.cycles} 个循环的${selectedPattern.name}`,
        });
      } catch (error) {
        console.error("Error saving breathing session:", error);
      }
    }

    handleReset();
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case "inhale":
        return "吸气";
      case "hold":
        return "屏息";
      case "exhale":
        return "呼气";
    }
  };

  return (
    <div className="space-y-3">
      {/* 模式选择 */}
      <Card>
        <CardContent className="py-3">
          <Select
            value={selectedPattern.id}
            onValueChange={(value) => {
              const pattern = patterns.find((p) => p.id === value);
              if (pattern) {
                setSelectedPattern(pattern);
                handleReset();
              }
            }}
            disabled={isActive}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patterns.map((pattern) => (
                <SelectItem key={pattern.id} value={pattern.id}>
                  <div>
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">{pattern.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 呼吸练习主区域 */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center space-y-5">
            {/* 呼吸圆圈容器 - 固定尺寸防止溢出 */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* 外圈动画 */}
              <div
                className="absolute rounded-full bg-gradient-to-br from-primary/15 to-primary/30 transition-transform duration-1000 ease-in-out"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${scale})`,
                }}
              />
              {/* 内容 */}
              <div className="relative z-10 text-center">
                <div className="text-4xl font-bold text-primary">{timeLeft}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{getPhaseText()}</div>
              </div>
            </div>

            {/* 进度信息 */}
            <div className="text-center space-y-0.5">
              <div className="text-sm font-medium">
                第 {currentCycle} / {selectedPattern.cycles} 个循环
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedPattern.inhale}s 吸气 · {selectedPattern.hold}s 屏息 · {selectedPattern.exhale}s 呼气
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex gap-3">
              {!isActive ? (
                <Button onClick={handleStart} className="gap-2 h-10 px-6">
                  <Play className="w-4 h-4" />
                  开始
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="gap-2 h-10 px-6">
                  <Pause className="w-4 h-4" />
                  暂停
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" className="gap-2 h-10">
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
