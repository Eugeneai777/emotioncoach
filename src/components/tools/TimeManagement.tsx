import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, Circle, Trash2, Timer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);

  const handleAddTask = () => {
    if (!title) {
      toast({
        title: "请输入任务标题",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      priority,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : 0,
      completed: false,
      createdAt: new Date(),
    };

    setTasks([newTask, ...tasks]);
    setTitle("");
    setEstimatedTime("");

    toast({
      title: "任务已添加",
      description: `已添加任务: ${title}`,
    });
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
      title: "任务已删除",
    });
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
            {tasks.length === 0 ? (
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
