import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CampSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [morningReminderTime, setMorningReminderTime] = useState("08:00");
  const [eveningReminderTime, setEveningReminderTime] = useState("20:00");
  const [lateWarningEnabled, setLateWarningEnabled] = useState(true);
  const [checkinRequirement, setCheckinRequirement] = useState("single_emotion");
  const [makeupAllowed, setMakeupAllowed] = useState(true);
  const [makeupDaysLimit, setMakeupDaysLimit] = useState(1);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "camp_morning_reminder_time, camp_evening_reminder_time, camp_late_warning_enabled, camp_checkin_requirement, camp_makeup_allowed, camp_makeup_days_limit"
        )
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setMorningReminderTime(data.camp_morning_reminder_time || "08:00");
        setEveningReminderTime(data.camp_evening_reminder_time || "20:00");
        setLateWarningEnabled(data.camp_late_warning_enabled ?? true);
        setCheckinRequirement(data.camp_checkin_requirement || "single_emotion");
        setMakeupAllowed(data.camp_makeup_allowed ?? true);
        setMakeupDaysLimit(data.camp_makeup_days_limit || 1);
      }
    } catch (error) {
      console.error("加载训练营设置失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载训练营设置",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          camp_morning_reminder_time: morningReminderTime,
          camp_evening_reminder_time: eveningReminderTime,
          camp_late_warning_enabled: lateWarningEnabled,
          camp_checkin_requirement: checkinRequirement,
          camp_makeup_allowed: makeupAllowed,
          camp_makeup_days_limit: makeupDaysLimit,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "设置已保存",
        description: "训练营设置已更新 🏕️",
      });
    } catch (error) {
      console.error("保存训练营设置失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="py-8 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg md:text-2xl text-foreground">
          训练营设置
        </CardTitle>
        <CardDescription className="text-xs md:text-sm text-muted-foreground">
          配置打卡提醒和要求 🏕️
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 打卡提醒 */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">打卡提醒</h3>

          <div className="space-y-2">
            <Label htmlFor="morning-time" className="text-sm">
              早间提醒时间
            </Label>
            <Input
              id="morning-time"
              type="time"
              value={morningReminderTime}
              onChange={(e) => setMorningReminderTime(e.target.value)}
              className="border-border"
            />
            <p className="text-xs text-muted-foreground">
              提醒完成宣言卡练习
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evening-time" className="text-sm">
              晚间提醒时间
            </Label>
            <Input
              id="evening-time"
              type="time"
              value={eveningReminderTime}
              onChange={(e) => setEveningReminderTime(e.target.value)}
              className="border-border"
            />
            <p className="text-xs text-muted-foreground">
              提醒完成晚间复盘
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="late-warning" className="text-sm">
                未打卡警告
              </Label>
              <p className="text-xs text-muted-foreground">
                21:00 再次提醒未完成打卡
              </p>
            </div>
            <Switch
              id="late-warning"
              checked={lateWarningEnabled}
              onCheckedChange={setLateWarningEnabled}
            />
          </div>
        </div>

        {/* 打卡规则 */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium text-foreground">打卡规则</h3>

          <div className="space-y-2">
            <Label htmlFor="requirement" className="text-sm">
              最低打卡要求
            </Label>
            <Select value={checkinRequirement} onValueChange={setCheckinRequirement}>
              <SelectTrigger id="requirement" className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_emotion">1次情绪记录</SelectItem>
                <SelectItem value="full_practice">完成3步练习</SelectItem>
                <SelectItem value="strict_quality">高质量记录</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {checkinRequirement === "single_emotion" &&
                "完成1次情绪记录即可打卡"}
              {checkinRequirement === "full_practice" &&
                "需完成宣言卡、情绪记录和晚间复盘"}
              {checkinRequirement === "strict_quality" &&
                "需记录情绪强度、写下洞察和设定行动"}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="makeup" className="text-sm">
                允许补打卡
              </Label>
              <p className="text-xs text-muted-foreground">
                是否允许补前几天的打卡
              </p>
            </div>
            <Switch
              id="makeup"
              checked={makeupAllowed}
              onCheckedChange={setMakeupAllowed}
            />
          </div>

          {makeupAllowed && (
            <div className="space-y-2">
              <Label htmlFor="makeup-days" className="text-sm">
                补打卡时限（天）
              </Label>
              <Input
                id="makeup-days"
                type="number"
                min={1}
                max={3}
                value={makeupDaysLimit}
                onChange={(e) =>
                  setMakeupDaysLimit(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="border-border"
              />
              <p className="text-xs text-muted-foreground">
                可补打卡的天数（1-3天）
              </p>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full"
        >
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CampSettings;
