import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import CampVideoTasks from "./CampVideoTasks";

interface Task {
  id: string;
  task_title: string;
  task_description?: string;
  is_completed: boolean;
  display_order: number;
}

interface CampDailyTaskListProps {
  campId: string;
  date?: Date;
  briefingData?: any;
}

const CampDailyTaskList = ({ campId, date = new Date(), briefingData }: CampDailyTaskListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    if (campId && user) {
      loadTasks();
    }
  }, [campId, user, dateStr]);

  const loadTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("camp_daily_tasks")
        .select("*")
        .eq("camp_id", campId)
        .eq("user_id", user.id)
        .eq("progress_date", dateStr)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("加载任务失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!user || !newTaskTitle.trim()) return;

    try {
      setAdding(true);
      const { error } = await supabase.from("camp_daily_tasks").insert({
        camp_id: campId,
        user_id: user.id,
        progress_date: dateStr,
        task_title: newTaskTitle.trim(),
        display_order: tasks.length,
      });

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "任务已添加到今日清单",
      });

      setNewTaskTitle("");
      await loadTasks();
    } catch (error) {
      console.error("添加任务失败:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("camp_daily_tasks")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_completed: completed } : t
        )
      );
    } catch (error) {
      console.error("更新任务失败:", error);
      toast({
        title: "更新失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("camp_daily_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      
      toast({
        title: "删除成功",
        description: "任务已从清单中移除",
      });
    } catch (error) {
      console.error("删除任务失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">每日任务清单</CardTitle>
          {tasks.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{tasks.length} 已完成
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 推荐视频课程 */}
            <CampVideoTasks 
              campId={campId} 
              date={date}
              briefingData={briefingData}
            />

            {tasks.length > 0 && <Separator className="my-4" />}

            {/* 任务列表 */}
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg group"
                  >
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={(checked) =>
                        toggleTask(task.id, checked as boolean)
                      }
                    />
                    <span
                      className={`flex-1 ${
                        task.is_completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.task_title}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">还没有添加任务</p>
                <p className="text-sm">添加今天要完成的小目标吧 ✨</p>
              </div>
            )}

            {/* 添加任务 */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="添加新任务..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
                disabled={adding}
              />
              <Button
                size="icon"
                onClick={addTask}
                disabled={!newTaskTitle.trim() || adding}
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CampDailyTaskList;