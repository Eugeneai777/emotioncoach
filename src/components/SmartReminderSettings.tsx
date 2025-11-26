import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, TrendingUp, Loader2 } from "lucide-react";

interface ReminderSuggestion {
  recommended_time: string;
  reasoning: string;
  based_on_pattern: string;
  frequency_suggestion: string;
}

export const SmartReminderSettings = () => {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [intensityReminderEnabled, setIntensityReminderEnabled] = useState(true);
  const [intensityReminderTime, setIntensityReminderTime] = useState("21:00");
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<ReminderSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('reminder_enabled, reminder_time, intensity_reminder_enabled, intensity_reminder_time, reminder_auto_dismiss_seconds')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setReminderEnabled(data.reminder_enabled ?? true);
        setReminderTime(data.reminder_time || '20:00');
        setIntensityReminderEnabled(data.intensity_reminder_enabled ?? true);
        setIntensityReminderTime(data.intensity_reminder_time || '21:00');
        setAutoDismissSeconds(data.reminder_auto_dismiss_seconds ?? 10);
      }
    } catch (error: any) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: "通知已启用",
          description: "我们会在你设定的时间提醒你",
        });
      } else {
        toast({
          title: "通知未启用",
          description: "你可以稍后在浏览器设置中启用通知",
          variant: "destructive",
        });
      }
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { error } = await supabase
        .from('profiles')
        .update({
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
          intensity_reminder_enabled: intensityReminderEnabled,
          intensity_reminder_time: intensityReminderTime,
          reminder_auto_dismiss_seconds: autoDismissSeconds,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "设置已保存",
        description: "提醒设置已更新",
      });

      // 如果启用了提醒和浏览器通知，设置下一次提醒
      if ((reminderEnabled || intensityReminderEnabled) && notificationsEnabled) {
        scheduleNextReminder();
      }
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const scheduleNextReminder = () => {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilReminder = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('情绪觉醒时刻 🌿', {
          body: '今天的你，感觉如何？劲老师在这里陪着你',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
      // Schedule next day's reminder
      scheduleNextReminder();
    }, timeUntilReminder);
  };

  const loadSmartSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      // 获取用户最近的简报时间
      const { data: briefings } = await supabase
        .from('briefings')
        .select(`
          created_at,
          conversations!inner(user_id)
        `)
        .eq('conversations.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!briefings || briefings.length === 0) {
        toast({
          title: "暂无数据",
          description: "完成更多情绪梳理后，我们就能为你提供智能建议了",
        });
        return;
      }

      // 分析时间模式
      const timePattern: Record<number, number> = {};
      briefings.forEach((b: any) => {
        const hour = new Date(b.created_at).getHours();
        timePattern[hour] = (timePattern[hour] || 0) + 1;
      });

      // 找到最常用的时间段
      const mostCommonHour = Object.entries(timePattern)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      const hour = parseInt(mostCommonHour[0]);
      const count = mostCommonHour[1];
      const percentage = Math.round((count / briefings.length) * 100);

      const suggestedTime = `${hour.toString().padStart(2, '0')}:00`;
      
      setSuggestion({
        recommended_time: suggestedTime,
        reasoning: `你通常在${hour}点左右进行情绪梳理（${percentage}%的时间）`,
        based_on_pattern: `分析了你最近${briefings.length}次梳理的时间`,
        frequency_suggestion: count > 10 ? "保持这个习惯很棒！" : "可以尝试更规律地在这个时间进行梳理"
      });
    } catch (error: any) {
      toast({
        title: "分析失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setReminderTime(suggestion.recommended_time);
      setReminderEnabled(true);
      toast({
        title: "已应用建议",
        description: "记得点击保存哦",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">每日提醒</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                在你选择的时间提醒你进行情绪梳理
              </p>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {reminderEnabled && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">提醒时间</Label>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />

              {/* Auto dismiss setting */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm">提醒自动消失时间（秒）</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={autoDismissSeconds}
                    onChange={(e) => setAutoDismissSeconds(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {autoDismissSeconds === 0 ? '不自动消失' : `${autoDismissSeconds}秒后`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  设置为0表示提醒不会自动消失，需要手动关闭
                </p>
              </div>
              
              {/* Browser Notifications */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">浏览器通知</Label>
                  <p className="text-xs text-muted-foreground">
                    允许我们发送浏览器通知
                  </p>
                </div>
                {notificationsEnabled ? (
                  <Badge variant="secondary" className="text-xs">已启用</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestNotificationPermission}
                    className="text-xs"
                  >
                    启用
                  </Button>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full"
          >
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </Card>

      {/* 情绪强度记录提醒 */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <Label className="text-base font-semibold">情绪强度记录提醒</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                每天提醒你记录当下的情绪强度
              </p>
            </div>
            <Switch
              checked={intensityReminderEnabled}
              onCheckedChange={setIntensityReminderEnabled}
            />
          </div>

          {intensityReminderEnabled && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">提醒时间</Label>
              </div>
              <input
                type="time"
                value={intensityReminderTime}
                onChange={(e) => setIntensityReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 定期记录情绪强度可以帮助你：
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• 追踪每日情绪变化规律</li>
                  <li>• 识别情绪波动周期</li>
                  <li>• 建立情绪觉察习惯</li>
                </ul>
              </div>
            </div>
          )}

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full"
          >
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </Card>

      {/* Smart Suggestions */}
      <Card className="p-4 md:p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">智能建议</Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadSmartSuggestion}
              disabled={loadingSuggestion}
            >
              {loadingSuggestion ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "分析习惯"
              )}
            </Button>
          </div>

          {suggestion && (
            <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  建议时间：{suggestion.recommended_time}
                </p>
                <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{suggestion.based_on_pattern}</p>
                <p className="text-xs text-primary">{suggestion.frequency_suggestion}</p>
              </div>
              <Button
                size="sm"
                onClick={applySuggestion}
                className="w-full"
              >
                使用这个时间
              </Button>
            </div>
          )}

          {!suggestion && !loadingSuggestion && (
            <p className="text-sm text-muted-foreground text-center py-4">
              点击"分析习惯"，根据你的使用模式获取个性化建议
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
