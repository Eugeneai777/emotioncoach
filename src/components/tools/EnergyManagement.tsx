import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Battery, Brain, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface EnergyLog {
  id: string;
  physical_energy: number;
  mental_energy: number;
  emotional_energy: number;
  notes: string;
  logged_at: string;
}

export const EnergyManagement = () => {
  const { user } = useAuth();
  const [physicalEnergy, setPhysicalEnergy] = useState(5);
  const [mentalEnergy, setMentalEnergy] = useState(5);
  const [emotionalEnergy, setEmotionalEnergy] = useState(5);
  const [notes, setNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState<EnergyLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecentLogs();
    }
  }, [user]);

  const loadRecentLogs = async () => {
    const { data, error } = await supabase
      .from("energy_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("logged_at", { ascending: false })
      .limit(7);

    if (error) {
      console.error("加载能量记录失败:", error);
      return;
    }

    setRecentLogs(data || []);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("energy_logs")
      .insert({
        user_id: user?.id,
        physical_energy: physicalEnergy,
        mental_energy: mentalEnergy,
        emotional_energy: emotionalEnergy,
        notes: notes.trim() || null
      });

    setLoading(false);

    if (error) {
      toast.error("保存失败");
      return;
    }

    toast.success("能量记录已保存！");
    setNotes("");
    loadRecentLogs();
  };

  const getEnergyLevel = (value: number) => {
    if (value <= 3) return { label: "低", color: "text-red-500" };
    if (value <= 7) return { label: "中", color: "text-yellow-500" };
    return { label: "高", color: "text-green-500" };
  };

  const getAverageEnergy = () => {
    if (recentLogs.length === 0) return null;
    
    const avg = {
      physical: Math.round(recentLogs.reduce((sum, log) => sum + (log.physical_energy || 0), 0) / recentLogs.length),
      mental: Math.round(recentLogs.reduce((sum, log) => sum + (log.mental_energy || 0), 0) / recentLogs.length),
      emotional: Math.round(recentLogs.reduce((sum, log) => sum + (log.emotional_energy || 0), 0) / recentLogs.length),
    };

    return avg;
  };

  const avgEnergy = getAverageEnergy();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">能量管理</h2>
        <p className="text-muted-foreground">了解你的能量曲线，优化时间安排</p>
      </div>

      {avgEnergy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              近期平均水平
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Battery className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{avgEnergy.physical}</div>
              <div className="text-sm text-muted-foreground">身体能量</div>
            </div>
            <div className="text-center">
              <Brain className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{avgEnergy.mental}</div>
              <div className="text-sm text-muted-foreground">心理能量</div>
            </div>
            <div className="text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-pink-500" />
              <div className="text-2xl font-bold">{avgEnergy.emotional}</div>
              <div className="text-sm text-muted-foreground">情绪能量</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>记录当前能量状态</CardTitle>
          <CardDescription>滑动调节你现在的能量水平（1-10）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-blue-500" />
                身体能量
              </Label>
              <span className={`text-lg font-semibold ${getEnergyLevel(physicalEnergy).color}`}>
                {physicalEnergy} - {getEnergyLevel(physicalEnergy).label}
              </span>
            </div>
            <Slider
              value={[physicalEnergy]}
              onValueChange={(value) => setPhysicalEnergy(value[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                心理能量
              </Label>
              <span className={`text-lg font-semibold ${getEnergyLevel(mentalEnergy).color}`}>
                {mentalEnergy} - {getEnergyLevel(mentalEnergy).label}
              </span>
            </div>
            <Slider
              value={[mentalEnergy]}
              onValueChange={(value) => setMentalEnergy(value[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                情绪能量
              </Label>
              <span className={`text-lg font-semibold ${getEnergyLevel(emotionalEnergy).color}`}>
                {emotionalEnergy} - {getEnergyLevel(emotionalEnergy).label}
              </span>
            </div>
            <Slider
              value={[emotionalEnergy]}
              onValueChange={(value) => setEmotionalEnergy(value[0])}
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
              placeholder="记录影响能量的因素、感受或计划..."
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
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.logged_at), "MM月dd日 HH:mm", { locale: zhCN })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">身体:</span>{" "}
                      <span className="font-semibold">{log.physical_energy}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">心理:</span>{" "}
                      <span className="font-semibold">{log.mental_energy}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">情绪:</span>{" "}
                      <span className="font-semibold">{log.emotional_energy}</span>
                    </div>
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
