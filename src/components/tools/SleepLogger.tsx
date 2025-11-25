import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Moon, Sun, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { zhCN } from "date-fns/locale";

interface SleepLog {
  id: string;
  sleep_time: string;
  wake_time: string;
  quality_score: number;
  notes: string;
  logged_at: string;
}

export const SleepLogger = () => {
  const { user } = useAuth();
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [qualityScore, setQualityScore] = useState(7);
  const [notes, setNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecentLogs();
    }
  }, [user]);

  const loadRecentLogs = async () => {
    const { data, error } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("logged_at", { ascending: false })
      .limit(7);

    if (error) {
      console.error("加载睡眠记录失败:", error);
      return;
    }

    setRecentLogs(data || []);
  };

  const calculateDuration = (sleep: string, wake: string) => {
    if (!sleep || !wake) return null;
    
    const sleepDate = new Date(sleep);
    const wakeDate = new Date(wake);
    
    const minutes = differenceInMinutes(wakeDate, sleepDate);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return { hours, minutes: mins, total: minutes };
  };

  const handleSave = async () => {
    if (!sleepTime || !wakeTime) {
      toast.error("请填写睡眠和起床时间");
      return;
    }

    const duration = calculateDuration(sleepTime, wakeTime);
    if (!duration || duration.total <= 0) {
      toast.error("起床时间必须晚于睡眠时间");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("sleep_logs")
      .insert({
        user_id: user?.id,
        sleep_time: sleepTime,
        wake_time: wakeTime,
        quality_score: qualityScore,
        notes: notes.trim() || null
      });

    setLoading(false);

    if (error) {
      toast.error("保存失败");
      return;
    }

    toast.success("睡眠记录已保存！");
    setSleepTime("");
    setWakeTime("");
    setQualityScore(7);
    setNotes("");
    loadRecentLogs();
  };

  const getQualityLabel = (score: number) => {
    if (score <= 3) return { label: "较差", color: "text-red-500" };
    if (score <= 6) return { label: "一般", color: "text-yellow-500" };
    if (score <= 8) return { label: "良好", color: "text-green-500" };
    return { label: "优秀", color: "text-blue-500" };
  };

  const getAverageStats = () => {
    if (recentLogs.length === 0) return null;

    const avgQuality = Math.round(
      recentLogs.reduce((sum, log) => sum + (log.quality_score || 0), 0) / recentLogs.length
    );

    const avgDuration = recentLogs.reduce((sum, log) => {
      const duration = calculateDuration(log.sleep_time, log.wake_time);
      return sum + (duration?.total || 0);
    }, 0) / recentLogs.length;

    const hours = Math.floor(avgDuration / 60);
    const minutes = Math.round(avgDuration % 60);

    return { avgQuality, avgHours: hours, avgMinutes: minutes };
  };

  const stats = getAverageStats();
  const currentDuration = calculateDuration(sleepTime, wakeTime);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">睡眠记录</h2>
        <p className="text-muted-foreground">追踪睡眠质量，改善休息效果</p>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              近7天平均
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.avgHours}小时{stats.avgMinutes}分
              </div>
              <div className="text-sm text-muted-foreground">平均睡眠时长</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getQualityLabel(stats.avgQuality).color}`}>
                {stats.avgQuality}分
              </div>
              <div className="text-sm text-muted-foreground">平均睡眠质量</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>记录睡眠</CardTitle>
          <CardDescription>记录你的睡眠时间和质量</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                入睡时间
              </Label>
              <Input
                type="datetime-local"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                起床时间
              </Label>
              <Input
                type="datetime-local"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          {currentDuration && currentDuration.total > 0 && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-semibold">
                睡眠时长: {currentDuration.hours}小时{currentDuration.minutes}分钟
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>睡眠质量评分</Label>
              <span className={`text-lg font-semibold ${getQualityLabel(qualityScore).color}`}>
                {qualityScore}分 - {getQualityLabel(qualityScore).label}
              </span>
            </div>
            <Slider
              value={[qualityScore]}
              onValueChange={(value) => setQualityScore(value[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录影响睡眠的因素、梦境或感受..."
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "保存中..." : "保存记录"}
          </Button>
        </CardContent>
      </Card>

      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const duration = calculateDuration(log.sleep_time, log.wake_time);
                return (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.logged_at), "MM月dd日", { locale: zhCN })}
                      </span>
                      <span className={`text-sm font-semibold ${getQualityLabel(log.quality_score).color}`}>
                        {log.quality_score}分
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">入睡:</span>{" "}
                        <span className="font-semibold">
                          {format(new Date(log.sleep_time), "HH:mm")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">起床:</span>{" "}
                        <span className="font-semibold">
                          {format(new Date(log.wake_time), "HH:mm")}
                        </span>
                      </div>
                      {duration && (
                        <div>
                          <span className="text-muted-foreground">时长:</span>{" "}
                          <span className="font-semibold">
                            {duration.hours}h{duration.minutes}m
                          </span>
                        </div>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
