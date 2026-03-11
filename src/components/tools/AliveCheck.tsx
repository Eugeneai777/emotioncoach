import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartHandshake, CheckCircle2, AlertCircle, Settings, Calendar, Loader2, Info, Share2, Plus, Trash2, Users, LogIn, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { usePartner } from "@/hooks/usePartner";
import { useNavigate } from "react-router-dom";
import AliveCheckIntroDialog from "./AliveCheckIntroDialog";
import AliveCheckShareDialog from "./AliveCheckShareDialog";
import { AliveWitnessCard } from "./AliveWitnessCard";
import { AliveAwakeningPromptCard } from "./AliveAwakeningPromptCard";
import { AwakeningDimension } from "@/config/awakeningConfig";
interface AliveCheckSettings {
  id: string;
  is_enabled: boolean;
  emergency_contact_name: string | null;
  emergency_contact_email: string | null;
  days_threshold: number;
  last_notification_at: string | null;
  user_display_name: string | null;
}

interface AliveCheckContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  is_primary: boolean;
  created_at: string;
}

interface CheckLog {
  id: string;
  checked_at: string;
  note: string | null;
  ai_witness: string | null;
  awakening_type: string | null;
  created_at: string;
}

const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const AliveCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const { partner } = usePartner();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AliveCheckSettings | null>(null);
  const [contacts, setContacts] = useState<AliveCheckContact[]>([]);
  const [logs, setLogs] = useState<CheckLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showWitness, setShowWitness] = useState(false);
  const [todayNote, setTodayNote] = useState("");
  const [witnessMessage, setWitnessMessage] = useState("");
  const [showAwakeningPrompt, setShowAwakeningPrompt] = useState(false);
  const [generatingWitness, setGeneratingWitness] = useState(false);
  
  // Form states
  const [daysThreshold, setDaysThreshold] = useState("3");
  const [isEnabled, setIsEnabled] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  
  // New contact form
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  // Check for first visit to show intro
  useEffect(() => {
    const introShown = localStorage.getItem('alive_check_intro_shown');
    if (!introShown && user) {
      setShowIntro(true);
      localStorage.setItem('alive_check_intro_shown', 'true');
    }
  }, [user]);

  // Fix loading lifecycle: set loading to false when auth is done and no user
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("alive_check_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setSettings(settingsData);
        setDaysThreshold(String(settingsData.days_threshold || 3));
        setIsEnabled(settingsData.is_enabled || false);
        setUserDisplayName(settingsData.user_display_name || "");
      }

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("alive_check_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Load recent logs
      const { data: logsData, error: logsError } = await supabase
        .from("alive_check_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("checked_at", { ascending: false })
        .limit(30);

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "加载失败",
        description: "请刷新页面重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!user) return;
    
    if (!newContactEmail || !newContactEmail.includes("@")) {
      toast({
        title: "请输入有效的邮箱地址",
        variant: "destructive"
      });
      return;
    }

    if (contacts.length >= 5) {
      toast({
        title: "最多添加5个联系人",
        variant: "destructive"
      });
      return;
    }

    setAddingContact(true);
    try {
      const { error } = await supabase
        .from("alive_check_contacts")
        .insert({
          user_id: user.id,
          contact_name: newContactName || "紧急联系人",
          contact_email: newContactEmail,
          is_primary: contacts.length === 0
        });

      if (error) throw error;

      // Send welcome email to the new contact
      // Use user_display_name from settings, fallback to profile display_name
      let userName = userDisplayName.trim();
      if (!userName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        userName = profile?.display_name || "您的朋友";
      }

      const threshold = parseInt(daysThreshold) || 3;
      const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-alive-check-welcome", {
        body: {
          userName,
          contactName: newContactName || "尊敬的用户",
          contactEmail: newContactEmail,
          daysThreshold: threshold
        }
      });

      if (emailError || emailResult?.error) {
        console.error("Error sending welcome email:", emailError || emailResult?.error);
        toast({
          title: "联系人已添加",
          description: emailResult?.hint || "欢迎邮件发送失败，请检查邮箱地址或稍后重试",
          variant: "destructive"
        });
      } else {
        console.log("Welcome email sent to", newContactEmail);
        toast({
          title: "联系人已添加",
          description: `已发送欢迎邮件至 ${newContactEmail}`
        });
      }
      setNewContactName("");
      setNewContactEmail("");
      loadData();
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "添加失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setAddingContact(false);
    }
  };

  const removeContact = async (contactId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("alive_check_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast({
        title: "联系人已删除"
      });
      loadData();
    } catch (error) {
      console.error("Error removing contact:", error);
      toast({
        title: "删除失败",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    // Validate at least one contact when enabling
    if (isEnabled && contacts.length === 0) {
      toast({
        title: "请先添加至少一个紧急联系人",
        variant: "destructive"
      });
      return;
    }

    // Validate user display name when enabling
    if (isEnabled && !userDisplayName.trim()) {
      toast({
        title: "请填写您的名字",
        description: "这样联系人收到邮件时才知道是谁",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        user_id: user.id,
        is_enabled: isEnabled,
        emergency_contact_name: contacts[0]?.contact_name || null,
        emergency_contact_email: contacts[0]?.contact_email || null,
        days_threshold: parseInt(daysThreshold) || 3,
        user_display_name: userDisplayName.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("alive_check_settings")
          .update(settingsData)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("alive_check_settings")
          .insert(settingsData)
          .select()
          .single();
        if (error) throw error;
        setSettings(data);
      }

      toast({
        title: "设置已保存",
        description: isEnabled ? "功能已开启，请记得每天打卡" : "功能已关闭"
      });
      setShowSettings(false);
      loadData();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateWitness = async (currentStreak: number) => {
    setGeneratingWitness(true);
    try {
      // Get user display name
      let userName = userDisplayName.trim();
      if (!userName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user?.id)
          .single();
        userName = profile?.display_name || "朋友";
      }

      const { data, error } = await supabase.functions.invoke("generate-alive-witness", {
        body: {
          user_name: userName,
          streak: currentStreak + 1, // Including today
          note: todayNote || null,
          time_of_day: getTimeOfDay(),
        },
      });

      if (error) {
        console.error("Error generating witness:", error);
        return "又活过一天，这就是最好的消息 ✓";
      }

      return data?.witness || "又活过一天，这就是最好的消息 ✓";
    } catch (error) {
      console.error("Error in generateWitness:", error);
      return "又活过一天，这就是最好的消息 ✓";
    } finally {
      setGeneratingWitness(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check if already checked in today
      const existingLog = logs.find(log => log.checked_at === today);
      if (existingLog) {
        toast({
          title: "今天已经打卡了",
          description: "明天再来吧！"
        });
        setChecking(false);
        return;
      }

      // Generate AI witness message
      const witness = await generateWitness(streak);
      setWitnessMessage(witness);

      const { error } = await supabase
        .from("alive_check_logs")
        .insert({
          user_id: user.id,
          checked_at: today,
          note: todayNote || null,
          ai_witness: witness,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "今天已经打卡了",
            description: "明天再来吧！"
          });
        } else {
          throw error;
        }
      } else {
        // Show witness card instead of simple toast
        setShowWitness(true);
        setTodayNote("");
        loadData();
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "打卡失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  // Handle awakening dimension selection
  const handleSelectAwakening = (dimension: AwakeningDimension) => {
    setShowAwakeningPrompt(false);
    if (dimension.toolRoute) {
      navigate(dimension.toolRoute);
    } else if (dimension.coachRoute) {
      navigate(dimension.coachRoute);
    } else {
      navigate('/awakening');
    }
  };

  // Handle proceed to awakening from witness card
  const handleProceedToAwakening = () => {
    setShowWitness(false);
    setShowAwakeningPrompt(true);
  };

  // Calculate stats
  const today = format(new Date(), "yyyy-MM-dd");
  const hasCheckedToday = logs.some(log => log.checked_at === today);
  
  const lastCheckDate = logs.length > 0 ? logs[0].checked_at : null;
  const daysSinceLastCheck = lastCheckDate 
    ? differenceInDays(new Date(), parseISO(lastCheckDate))
    : null;

  // Calculate streak
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    
    let streak = 0;
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = parseISO(sortedLogs[i].checked_at);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0 && differenceInDays(today, logDate) === 1) {
        // If missed today but checked yesterday, start counting from yesterday
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Login prompt for unauthenticated users
  if (!user) {
    return (
      <Card className="border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-4">
            <HeartHandshake className="w-8 h-8 text-rose-500" />
          </div>
          <CardTitle className="text-xl">登录后使用安全打卡</CardTitle>
          <CardDescription className="text-base">
            这是你的个人安全打卡与联系人设置，需要登录后查看和使用
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/auth?redirect=/alive-check')}
              className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              去登录
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/energy-studio-intro')}
                className="flex-1"
              >
                <Info className="w-4 h-4 mr-2" />
                了解功能
              </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            💡 每天打卡表示"今天很好"，连续未打卡时会通知您设定的紧急联系人，连续未打卡时会通知您设定的紧急联系人
          </p>
        </CardContent>
      </Card>
    );
  }

  const needsSetup = contacts.length === 0;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-500" />
              <CardTitle className="text-lg">每日平安打卡</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowIntro(true)}
              >
                <Info className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowShare(true)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            每日安全打卡，让关心你的人安心
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Display */}
          <div className="flex items-center gap-4 mb-4">
            {hasCheckedToday ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">今日已打卡</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">今日未打卡</span>
              </div>
            )}
            
            {streak > 0 && (
              <div className="text-sm text-muted-foreground">
                连续 <span className="font-bold text-rose-500">{streak}</span> 天
              </div>
            )}
          </div>

          {/* Contacts summary */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>将通知 {contacts.length} 位紧急联系人</span>
            </div>
          )}

          {/* Check-in Button */}
          {!hasCheckedToday && settings?.is_enabled && (
            <div className="space-y-3">
              <Textarea
                placeholder="今天心情如何？（选填）"
                value={todayNote}
                onChange={(e) => setTodayNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              
              <Button 
                onClick={handleCheckIn}
                disabled={checking || generatingWitness}
                className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
                size="lg"
              >
                {(checking || generatingWitness) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {generatingWitness ? '生成见证中...' : '今天很好 ✓'}
              </Button>
            </div>
          )}

          {/* Setup Prompt */}
          {needsSetup && !showSettings && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                请先设置紧急联系人才能使用此功能
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowSettings(true)}
              >
                立即设置
              </Button>
            </div>
          )}

          {/* Disabled State */}
          {!settings?.is_enabled && contacts.length > 0 && !showSettings && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                功能已关闭，开启后需要每天打卡
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowSettings(true)}
              >
                开启功能
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
          <CardTitle className="text-base">功能设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Display Name */}
            <div className="space-y-2">
              <Label htmlFor="userName">您的名字 *</Label>
              <Input
                id="userName"
                placeholder="如：小明、张三"
                value={userDisplayName}
                onChange={(e) => setUserDisplayName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                联系人收到邮件时将看到这个名字
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">启用功能</Label>
              <Switch
                id="enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            {/* Contacts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  紧急联系人 ({contacts.length}/5)
                </Label>
              </div>
              
              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {contact.contact_name}
                          {contact.is_primary && (
                            <span className="ml-2 text-xs text-rose-500">主要</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.contact_email}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new contact */}
              {contacts.length < 5 && (
                <div className="space-y-2 p-3 border border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">添加新联系人</p>
                  <Input
                    placeholder="姓名（如：妈妈、好友小明）"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="邮箱地址 *"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={addContact}
                      disabled={addingContact || !newContactEmail}
                    >
                      {addingContact ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                若您连续未打卡，系统将同时通知所有联系人
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">提醒天数</Label>
              <Select value={daysThreshold} onValueChange={setDaysThreshold}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <SelectItem key={day} value={String(day)}>
                      {day} 天未打卡时通知
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                保存设置
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">打卡记录</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm">
                        {format(parseISO(log.checked_at), "M月d日 EEEE", { locale: zhCN })}
                      </div>
                      {log.note && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {log.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 这是一个为独居或需要被关注的人设计的安全功能。
            每天简单打卡表示"我活得很好"，如果连续 {daysThreshold} 天未打卡，
            系统会自动发送邮件通知您设定的{contacts.length > 1 ? `${contacts.length}位` : ""}紧急联系人，让他们来关心您。
          </p>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AliveCheckIntroDialog 
        open={showIntro} 
        onOpenChange={setShowIntro}
        onStartSetup={() => setShowSettings(true)}
      />
      <AliveCheckShareDialog 
        open={showShare} 
        onOpenChange={setShowShare}
        partnerCode={partner?.partner_code || localStorage.getItem('share_ref_code') || undefined}
      />
      <AliveWitnessCard
        open={showWitness}
        onOpenChange={setShowWitness}
        witness={witnessMessage}
        streak={streak + 1}
        date={new Date()}
        onProceedToAwakening={handleProceedToAwakening}
      />
      <AliveAwakeningPromptCard
        open={showAwakeningPrompt}
        onOpenChange={setShowAwakeningPrompt}
        onSelectDimension={handleSelectAwakening}
      />
    </div>
  );
};
