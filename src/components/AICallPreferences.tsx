import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Phone, Loader2 } from 'lucide-react';

interface AICallPreferencesData {
  late_night_companion: boolean;
  gratitude_reminder: boolean;
  emotion_check: boolean;
  reactivation: boolean;
  camp_followup: boolean;
  care: boolean;
  todo_reminder: boolean;
}

interface TimeSlots {
  morning: boolean;
  noon: boolean;
  evening: boolean;
}

const DEFAULT_PREFERENCES: AICallPreferencesData = {
  late_night_companion: true,
  gratitude_reminder: true,
  emotion_check: true,
  reactivation: true,
  camp_followup: true,
  care: true,
  todo_reminder: true,
};

const DEFAULT_TIME_SLOTS: TimeSlots = {
  morning: true,
  noon: true,
  evening: true,
};

export function AICallPreferences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiCallEnabled, setAiCallEnabled] = useState(true);
  const [preferences, setPreferences] = useState<AICallPreferencesData>(DEFAULT_PREFERENCES);
  const [gratitudeSlots, setGratitudeSlots] = useState<TimeSlots>(DEFAULT_TIME_SLOTS);
  const [todoSlots, setTodoSlots] = useState<TimeSlots>(DEFAULT_TIME_SLOTS);

  const scenarios = [
    { key: 'todo_reminder' as const, label: '待办提醒', description: '每天3次帮你规划和回顾待办', icon: '✅' },
    { key: 'gratitude_reminder' as const, label: '感恩提醒', description: '每天3次提醒记录感恩事项', icon: '🌸' },
    { key: 'late_night_companion' as const, label: '深夜陪伴', description: '深夜检测到活跃时关心你', icon: '🌙' },
    { key: 'emotion_check' as const, label: '情绪关怀', description: '检测到情绪波动时主动联系', icon: '💚' },
    { key: 'reactivation' as const, label: '久未联系', description: '7天未使用时温柔提醒', icon: '👋' },
    { key: 'camp_followup' as const, label: '训练营提醒', description: '训练营任务未完成时提醒', icon: '🏕️' },
  ];

  const gratitudeTimeSlots = [
    { key: 'morning' as const, label: '早晨 8:00', description: '开启新的一天' },
    { key: 'noon' as const, label: '中午 12:30', description: '回顾上午的小确幸' },
    { key: 'evening' as const, label: '晚上 21:00', description: '睡前感恩回顾' },
  ];

  const todoTimeSlots = [
    { key: 'morning' as const, label: '早晨 8:00', description: '规划今日待办' },
    { key: 'noon' as const, label: '中午 12:30', description: '检查进度' },
    { key: 'evening' as const, label: '晚上 21:00', description: '回顾总结' },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('ai_call_enabled, ai_call_preferences, gratitude_reminder_slots, todo_reminder_slots')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setAiCallEnabled(data.ai_call_enabled ?? true);
        setPreferences({ ...DEFAULT_PREFERENCES, ...(data.ai_call_preferences as Partial<AICallPreferencesData> || {}) });
        setGratitudeSlots({ ...DEFAULT_TIME_SLOTS, ...(data.gratitude_reminder_slots as Partial<TimeSlots> || {}) });
        setTodoSlots({ ...DEFAULT_TIME_SLOTS, ...(data.todo_reminder_slots as Partial<TimeSlots> || {}) });
      }
    } catch (error) {
      console.error('Error loading AI call preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (field: string, value: any) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
      if (error) throw error;
      toast({ title: '已保存', description: '设置已更新 🌿' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: '保存失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalToggle = (checked: boolean) => { setAiCallEnabled(checked); savePreference('ai_call_enabled', checked); };
  const handleScenarioToggle = (key: keyof AICallPreferencesData, checked: boolean) => { const n = { ...preferences, [key]: checked }; setPreferences(n); savePreference('ai_call_preferences', n); };
  const handleGratitudeSlotToggle = (key: keyof TimeSlots, checked: boolean) => { const n = { ...gratitudeSlots, [key]: checked }; setGratitudeSlots(n); savePreference('gratitude_reminder_slots', n); };
  const handleTodoSlotToggle = (key: keyof TimeSlots, checked: boolean) => { const n = { ...todoSlots, [key]: checked }; setTodoSlots(n); savePreference('todo_reminder_slots', n); };

  if (loading) return <Card><CardContent className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></CardContent></Card>;

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg md:text-2xl text-foreground flex items-center gap-2"><Phone className="w-5 h-5" />AI教练来电设置</CardTitle>
        <CardDescription className="text-xs md:text-sm text-muted-foreground">AI教练会在合适的时机主动来电关心你 📞</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm md:text-base font-medium text-foreground">启用AI主动来电</Label>
            <p className="text-xs md:text-sm text-muted-foreground">关闭后不再接收任何AI来电</p>
          </div>
          <Switch checked={aiCallEnabled} onCheckedChange={handleGlobalToggle} disabled={saving} />
        </div>
        {aiCallEnabled && (
          <>
            <Separator />
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{scenario.icon}</span>
                    <div>
                      <Label className="text-sm md:text-base font-medium">{scenario.label}</Label>
                      <p className="text-xs text-muted-foreground">{scenario.description}</p>
                    </div>
                  </div>
                  <Switch checked={preferences[scenario.key] !== false} onCheckedChange={(c) => handleScenarioToggle(scenario.key, c)} disabled={saving} />
                </div>
              ))}
            </div>
            {preferences.todo_reminder !== false && (
              <>
                <Separator />
                <div className="pl-4 md:pl-8 space-y-3 border-l-2 border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2"><span>✅</span>待办提醒时段</p>
                  {todoTimeSlots.map((slot) => (
                    <div key={slot.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{slot.label}</span>
                        <span className="text-xs text-muted-foreground">{slot.description}</span>
                      </div>
                      <Switch checked={todoSlots[slot.key] !== false} onCheckedChange={(c) => handleTodoSlotToggle(slot.key, c)} disabled={saving} />
                    </div>
                  ))}
                </div>
              </>
            )}
            {preferences.gratitude_reminder !== false && (
              <>
                <Separator />
                <div className="pl-4 md:pl-8 space-y-3 border-l-2 border-rose-200 dark:border-rose-800">
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2"><span>🌸</span>感恩提醒时段</p>
                  {gratitudeTimeSlots.map((slot) => (
                    <div key={slot.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{slot.label}</span>
                        <span className="text-xs text-muted-foreground">{slot.description}</span>
                      </div>
                      <Switch checked={gratitudeSlots[slot.key] !== false} onCheckedChange={(c) => handleGratitudeSlotToggle(slot.key, c)} disabled={saving} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
