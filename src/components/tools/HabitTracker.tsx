import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check, Flame } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Habit {
  id: string;
  name: string;
  category: string;
  target_frequency: string;
  is_active: boolean;
}

interface HabitLog {
  id: string;
  habit_id: string;
  logged_at: string;
  completed: boolean;
}

export const HabitTracker = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    category: "健康",
    target_frequency: "daily"
  });
  const [loading, setLoading] = useState(false);

  const categories = ["健康", "学习", "工作", "生活", "社交", "其他"];
  const frequencies = [
    { value: "daily", label: "每天" },
    { value: "weekly", label: "每周" },
    { value: "custom", label: "自定义" }
  ];

  useEffect(() => {
    if (user) {
      loadHabits();
      loadHabitLogs();
    }
  }, [user]);

  const loadHabits = async () => {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("加载习惯失败");
      return;
    }

    setHabits(data || []);
  };

  const loadHabitLogs = async () => {
    const startDate = format(startOfWeek(new Date(), { locale: zhCN }), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("habit_logs")
      .select("*, habits!inner(user_id)")
      .eq("habits.user_id", user?.id)
      .gte("logged_at", startDate);

    if (error) {
      console.error("加载打卡记录失败:", error);
      return;
    }

    setHabitLogs(data || []);
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) {
      toast.error("请输入习惯名称");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("habits")
      .insert({
        user_id: user?.id,
        name: newHabit.name,
        category: newHabit.category,
        target_frequency: newHabit.target_frequency
      });

    setLoading(false);

    if (error) {
      toast.error("添加习惯失败");
      return;
    }

    toast.success("习惯添加成功！");
    setNewHabit({ name: "", category: "健康", target_frequency: "daily" });
    setShowAddForm(false);
    loadHabits();
  };

  const handleCheckIn = async (habitId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingLog = habitLogs.find(
      log => log.habit_id === habitId && log.logged_at === dateStr
    );

    if (existingLog) {
      toast.info("今天已经打卡过了");
      return;
    }

    const { error } = await supabase
      .from("habit_logs")
      .insert({
        habit_id: habitId,
        logged_at: dateStr,
        completed: true
      });

    if (error) {
      toast.error("打卡失败");
      return;
    }

    toast.success("打卡成功！");
    loadHabitLogs();
  };

  const getStreak = (habitId: string) => {
    const logs = habitLogs
      .filter(log => log.habit_id === habitId && log.completed)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const log of logs) {
      const logDate = parseISO(log.logged_at);
      const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  };

  const isCheckedToday = (habitId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return habitLogs.some(
      log => log.habit_id === habitId && log.logged_at === today && log.completed
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">习惯追踪</h2>
          <p className="text-muted-foreground">养成好习惯，追踪你的进步</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          添加习惯
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>创建新习惯</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>习惯名称</Label>
              <Input
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="例如：每天阅读30分钟"
              />
            </div>
            <div>
              <Label>分类</Label>
              <Select
                value={newHabit.category}
                onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>目标频率</Label>
              <Select
                value={newHabit.target_frequency}
                onValueChange={(value) => setNewHabit({ ...newHabit, target_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHabit} disabled={loading}>
                {loading ? "添加中..." : "添加"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {habits.map((habit) => {
          const streak = getStreak(habit.id);
          const checkedToday = isCheckedToday(habit.id);

          return (
            <Card key={habit.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{habit.name}</h3>
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full text-sm">
                          <Flame className="w-4 h-4" />
                          <span>{streak}天</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {habit.category} · {frequencies.find(f => f.value === habit.target_frequency)?.label}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleCheckIn(habit.id, new Date())}
                    disabled={checkedToday}
                    variant={checkedToday ? "outline" : "default"}
                    className="gap-2"
                  >
                    {checkedToday ? (
                      <>
                        <Check className="w-4 h-4" />
                        已完成
                      </>
                    ) : (
                      "打卡"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {habits.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">还没有创建任何习惯</p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                创建第一个习惯
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
