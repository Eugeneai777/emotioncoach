import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, Circle, Trash2, Timer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  estimatedTime: number;
  completed: boolean;
  createdAt: Date;
}

export const TimeManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setTasks(
          data.map((task) => ({
            id: task.id,
            title: task.title,
            priority: task.priority as "high" | "medium" | "low",
            estimatedTime: task.estimated_time,
            completed: task.completed,
            createdAt: new Date(task.created_at),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "加载失败",
        description: "无法加载任务列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!title) {
      toast({
        title: "请输入任务标题",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user!.id,
          title,
          priority,
          estimated_time: estimatedTime ? parseInt(estimatedTime) : 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          priority: data.priority as "high" | "medium" | "low",
          estimatedTime: data.estimated_time,
          completed: data.completed,
          createdAt: new Date(data.created_at),
        };

        setTasks([newTask, ...tasks]);
      }

      setTitle("");
      setEstimatedTime("");

      toast({
        title: "任务已添加",
        description: `已添加任务: ${title}`,
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "添加失败",
        description: "无法添加任务",
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Error toggling task:", error);
      toast({
        title: "更新失败",
        description: "无法更新任务状态",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;

      setTasks(tasks.filter((task) => task.id !== id));
      toast({
        title: "任务已删除",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "删除失败",
        description: "无法删除任务",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "高优先级";
      case "medium":
        return "中优先级";
      case "low":
        return "低优先级";
      default:
        return "";
    }
  };

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTime = tasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            时间管理
          </CardTitle>
          <CardDescription>高效规划，充分利用每一分钟</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总任务</p>
                    <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
                  </div>
                  <Circle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已完成</p>
                    <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">预计时长</p>
                    <p className="text-2xl font-bold text-purple-600">{totalTime}分钟</p>
                  </div>
                  <Timer className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 添加任务表单 */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>任务标题</Label>
                <Input
                  placeholder="输入任务内容"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                />
              </div>

              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={priority} onValueChange={(v: "high" | "medium" | "low") => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>预计时长（分钟）</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleAddTask} className="w-full">
              添加任务
            </Button>
          </div>

          {/* 任务列表 */}
          <div className="space-y-2">
            <h3 className="font-semibold">任务列表</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                加载中...
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无任务，开始添加你的第一个任务吧
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <Card key={task.id} className={task.completed ? "opacity-60" : ""}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {getPriorityText(task.priority)}
                          </span>
                          {task.estimatedTime > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {task.estimatedTime}分钟
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
