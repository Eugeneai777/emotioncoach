import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const durations = [
  { value: 5, label: "5 分钟" },
  { value: 10, label: "10 分钟" },
  { value: 15, label: "15 分钟" },
  { value: 20, label: "20 分钟" },
  { value: 30, label: "30 分钟" }
];

const sounds = [
  { value: "none", label: "无背景音" },
  { value: "rain", label: "雨声" },
  { value: "ocean", label: "海浪" },
  { value: "forest", label: "森林" }
];

export const MeditationTimer = () => {
  const { user } = useAuth();
  const [duration, setDuration] = useState(10);
  const [selectedSound, setSelectedSound] = useState("none");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [notes, setNotes] = useState("");
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setTimeLeft(duration * 60);
    startTimeRef.current = Date.now();
    if (selectedSound !== "none") {
      setIsSoundPlaying(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
    setIsSoundPlaying(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
    setIsSoundPlaying(false);
  };

  const handleComplete = async () => {
    setIsActive(false);
    setIsSoundPlaying(false);
    const actualDuration = Math.round((Date.now() - startTimeRef.current) / 1000);

    // 保存到数据库
    if (user) {
      try {
        await supabase.from("meditation_sessions").insert({
          user_id: user.id,
          duration: actualDuration,
          background_sound: selectedSound,
          notes: notes || null
        });

        toast({
          title: "冥想完成！",
          description: `你完成了 ${Math.round(actualDuration / 60)} 分钟的冥想`,
        });
      } catch (error) {
        console.error("Error saving meditation session:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>冥想设置</CardTitle>
          <CardDescription>选择你的冥想时长和背景音</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">冥想时长</label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => {
                const newDuration = parseInt(value);
                setDuration(newDuration);
                if (!isActive) {
                  setTimeLeft(newDuration * 60);
                }
              }}
              disabled={isActive}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">背景音效</label>
            <Select
              value={selectedSound}
              onValueChange={setSelectedSound}
              disabled={isActive}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sounds.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-8">
            {/* 计时器显示 */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* 进度环 */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>

              {/* 时间显示 */}
              <div className="relative z-10 text-center">
                <div className="text-5xl font-bold text-primary">{formatTime(timeLeft)}</div>
                {isSoundPlaying && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">{sounds.find(s => s.value === selectedSound)?.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex gap-4">
              {!isActive ? (
                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  开始冥想
                </Button>
              ) : (
                <Button onClick={handlePause} size="lg" variant="outline" className="gap-2">
                  <Pause className="w-5 h-5" />
                  暂停
                </Button>
              )}
              <Button onClick={handleReset} size="lg" variant="outline" className="gap-2">
                <RotateCcw className="w-5 h-5" />
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>冥想笔记</CardTitle>
          <CardDescription>记录你的感受和体验（可选）</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="冥想后，你有什么感受？"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
};
