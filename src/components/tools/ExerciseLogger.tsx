import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Clock, MapPin, Flame, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ExerciseLog {
  id: string;
  exercise_type: string;
  duration: number;
  distance: number | null;
  calories: number | null;
  notes: string;
  logged_at: string;
}

export const ExerciseLogger = () => {
  const { user } = useAuth();
  const [exerciseType, setExerciseType] = useState("跑步");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(false);

  const exerciseTypes = [
    "跑步", "健走", "骑行", "游泳", "瑜伽", 
    "力量训练", "球类运动", "舞蹈", "登山", "其他"
  ];

  useEffect(() => {
    if (user) {
      loadRecentLogs();
    }
  }, [user]);

  const loadRecentLogs = async () => {
    const { data, error } = await supabase
      .from("exercise_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("logged_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("加载运动记录失败:", error);
      return;
    }

    setRecentLogs(data || []);
  };

  const handleSave = async () => {
    if (!duration || parseInt(duration) <= 0) {
      toast.error("请输入有效的运动时长");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("exercise_logs")
      .insert({
        user_id: user?.id,
        exercise_type: exerciseType,
        duration: parseInt(duration),
        distance: distance ? parseFloat(distance) : null,
        calories: calories ? parseInt(calories) : null,
        notes: notes.trim() || null
      });

    setLoading(false);

    if (error) {
      toast.error("保存失败");
      return;
    }

    toast.success("运动记录已保存！");
    setDuration("");
    setDistance("");
    setCalories("");
    setNotes("");
    loadRecentLogs();
  };

  const getWeeklyStats = () => {
    if (recentLogs.length === 0) return null;

    const totalDuration = recentLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalDistance = recentLogs.reduce((sum, log) => sum + (log.distance || 0), 0);
    const totalCalories = recentLogs.reduce((sum, log) => sum + (log.calories || 0), 0);

    return {
      workouts: recentLogs.length,
      duration: Math.round(totalDuration),
      distance: totalDistance.toFixed(1),
      calories: Math.round(totalCalories)
    };
  };

  const stats = getWeeklyStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">运动打卡</h2>
        <p className="text-muted-foreground">记录运动数据，保持健康活力</p>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              最近统计
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Dumbbell className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.workouts}</div>
              <div className="text-sm text-muted-foreground">次训练</div>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.duration}</div>
              <div className="text-sm text-muted-foreground">分钟</div>
            </div>
            {parseFloat(stats.distance) > 0 && (
              <div className="text-center">
                <MapPin className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{stats.distance}</div>
                <div className="text-sm text-muted-foreground">公里</div>
              </div>
            )}
            {stats.calories > 0 && (
              <div className="text-center">
                <Flame className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{stats.calories}</div>
                <div className="text-sm text-muted-foreground">卡路里</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>记录运动</CardTitle>
          <CardDescription>记录你的运动数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>运动类型</Label>
              <Select value={exerciseType} onValueChange={setExerciseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>时长（分钟）*</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>距离（公里）</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="5.0"
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>消耗卡路里</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="300"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录运动感受、地点或特别事项..."
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
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{log.exercise_type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.logged_at), "MM月dd日 HH:mm", { locale: zhCN })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">时长:</span>{" "}
                      <span className="font-semibold">{log.duration}分钟</span>
                    </div>
                    {log.distance && (
                      <div>
                        <span className="text-muted-foreground">距离:</span>{" "}
                        <span className="font-semibold">{log.distance}km</span>
                      </div>
                    )}
                    {log.calories && (
                      <div>
                        <span className="text-muted-foreground">卡路里:</span>{" "}
                        <span className="font-semibold">{log.calories}</span>
                      </div>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
