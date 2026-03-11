import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Bell, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const REMINDER_TYPES = [
  { value: "medicine", label: "💊 吃药", color: "hsl(0 60% 95%)" },
  { value: "water", label: "💧 喝水", color: "hsl(200 60% 95%)" },
  { value: "walk", label: "🚶 散步", color: "hsl(150 50% 95%)" },
  { value: "rest", label: "😴 休息", color: "hsl(270 40% 95%)" },
  { value: "other", label: "📝 其他", color: "hsl(45 60% 95%)" },
];

interface Reminder {
  id: string;
  reminder_type: string;
  title: string;
  reminder_time: string;
  is_enabled: boolean;
}

const ElderRemindersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("medicine");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadReminders(data.user.id);
    });
  }, []);

  const loadReminders = async (userId: string) => {
    const { data } = await supabase
      .from("elder_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("reminder_time");
    if (data) setReminders(data);
  };

  const addReminder = async () => {
    if (!user) {
      toast({ title: "请先登录", variant: "destructive" });
      return;
    }
    const title = newTitle.trim() || REMINDER_TYPES.find((t) => t.value === newType)?.label.slice(2) || "提醒";
    const { error } = await supabase.from("elder_reminders").insert({
      user_id: user.id,
      reminder_type: newType,
      title,
      reminder_time: newTime,
    });
    if (error) {
      toast({ title: "添加失败", variant: "destructive" });
      return;
    }
    toast({ title: "提醒已添加 ✅" });
    setShowAdd(false);
    setNewTitle("");
    loadReminders(user.id);
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("elder_reminders").delete().eq("id", id);
    if (user) loadReminders(user.id);
    toast({ title: "已删除" });
  };

  const typeInfo = (type: string) => REMINDER_TYPES.find((t) => t.value === type) || REMINDER_TYPES[4];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(30 60% 98%)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/elder-care")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold" style={{ color: "hsl(25 40% 30%)" }}>🔔 重要提醒</h1>
      </div>

      <div className="px-5 py-4 max-w-md mx-auto space-y-4">
        {/* Reminder list */}
        {reminders.length === 0 && !showAdd && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "hsl(25 40% 70%)" }} />
            <p className="text-lg font-medium mb-1" style={{ color: "hsl(25 35% 40%)" }}>还没有提醒</p>
            <p className="text-base" style={{ color: "hsl(25 25% 55%)" }}>点击下方按钮添加第一个提醒</p>
          </div>
        )}

        {reminders.map((r) => {
          const info = typeInfo(r.reminder_type);
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ backgroundColor: info.color }}
            >
              <Clock className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(25 50% 45%)" }} />
              <div className="flex-1">
                <p className="text-base font-semibold" style={{ color: "hsl(25 40% 25%)" }}>
                  {info.label.slice(0, 2)} {r.title}
                </p>
                <p className="text-sm" style={{ color: "hsl(25 30% 50%)" }}>
                  每天 {r.reminder_time.slice(0, 5)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteReminder(r.id)}
                className="rounded-full"
              >
                <Trash2 className="w-4 h-4" style={{ color: "hsl(0 50% 50%)" }} />
              </Button>
            </div>
          );
        })}

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 className="text-base font-bold" style={{ color: "hsl(25 40% 30%)" }}>添加新提醒</h3>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2">
              {REMINDER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: newType === t.value ? "hsl(25 75% 55%)" : t.color,
                    color: newType === t.value ? "white" : "hsl(25 35% 30%)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="提醒内容（可选）"
              className="w-full rounded-xl px-4 py-3 text-base border-none outline-none"
              style={{ backgroundColor: "hsl(30 40% 96%)" }}
            />

            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: "hsl(25 50% 50%)" }} />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-xl px-4 py-3 text-lg font-medium border-none outline-none"
                style={{ backgroundColor: "hsl(30 40% 96%)" }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addReminder}
                className="flex-1 text-base rounded-xl"
                style={{ backgroundColor: "hsl(25 75% 55%)", color: "white", minHeight: 48 }}
              >
                确认添加
              </Button>
              <Button
                onClick={() => setShowAdd(false)}
                variant="outline"
                className="text-base rounded-xl"
                style={{ minHeight: 48 }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* Add button */}
        {!showAdd && (
          <Button
            onClick={() => setShowAdd(true)}
            className="w-full text-lg font-semibold rounded-2xl gap-2"
            style={{ backgroundColor: "hsl(25 75% 55%)", color: "white", minHeight: 56 }}
          >
            <Plus className="w-5 h-5" />
            添加提醒
          </Button>
        )}
      </div>
    </div>
  );
};

export default ElderRemindersPage;
