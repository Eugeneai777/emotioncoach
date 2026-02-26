import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Phone, Send, Shield, Clock, Activity, DollarSign, Users, ShieldAlert, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface EmergencyContact {
  id: string;
  name: string;
  wecom_webhook_url: string;
  alert_levels: string[];
  alert_types: string[];
  is_active: boolean;
  description: string | null;
  created_at: string;
}

interface AlertLog {
  id: string;
  contact_name: string;
  alert_source: string;
  alert_level: string;
  alert_type: string;
  message: string;
  details: string | null;
  send_status: string;
  error_message: string | null;
  created_at: string;
}

const ALERT_LEVEL_OPTIONS = [
  { value: "critical", label: "严重", color: "destructive" as const },
  { value: "high", label: "高危", color: "default" as const },
  { value: "medium", label: "中等", color: "secondary" as const },
];

const ALERT_SOURCE_OPTIONS = [
  { value: "api_monitor", label: "调用监控", icon: Activity },
  { value: "cost_monitor", label: "成本监控", icon: DollarSign },
  { value: "user_anomaly", label: "用户异常", icon: Users },
  { value: "stability", label: "稳定性监控", icon: RefreshCw },
  { value: "risk_content", label: "风险内容", icon: ShieldAlert },
];

const SOURCE_LABELS: Record<string, string> = {
  api_monitor: '调用监控',
  cost_monitor: '成本监控',
  user_anomaly: '用户异常',
  stability: '稳定性监控',
  risk_content: '风险内容',
};

export default function EmergencyContactsManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    wecom_webhook_url: "",
    alert_levels: ["critical"] as string[],
    alert_types: ["api_monitor", "cost_monitor", "user_anomaly", "stability", "risk_content"] as string[],
    description: "",
  });
  const [testing, setTesting] = useState<string | null>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("emergency_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmergencyContact[];
    },
  });

  const { data: alertLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["emergency-alert-logs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("emergency_alert_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AlertLog[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await (supabase as any).from("emergency_contacts").insert({
        name: values.name,
        wecom_webhook_url: values.wecom_webhook_url,
        alert_levels: values.alert_levels,
        alert_types: values.alert_types,
        description: values.description || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
      setDialogOpen(false);
      setForm({ name: "", wecom_webhook_url: "", alert_levels: ["critical"], alert_types: ["api_monitor", "cost_monitor", "user_anomaly", "stability", "risk_content"], description: "" });
      toast.success("紧急联系人添加成功");
    },
    onError: (err: any) => toast.error("添加失败: " + err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("emergency_contacts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
      toast.success("已删除");
    },
  });

  const handleTest = async (contact: EmergencyContact) => {
    setTesting(contact.id);
    try {
      const { error } = await supabase.functions.invoke("send-emergency-alert", {
        body: {
          webhook_url: contact.wecom_webhook_url,
          test: true,
          contact_name: contact.name,
        },
      });
      if (error) throw error;
      toast.success(`测试消息已发送给 ${contact.name}`);
    } catch (err: any) {
      toast.error("测试发送失败: " + err.message);
    } finally {
      setTesting(null);
    }
  };

  const toggleLevel = (level: string) => {
    setForm((prev) => ({
      ...prev,
      alert_levels: prev.alert_levels.includes(level)
        ? prev.alert_levels.filter((l) => l !== level)
        : [...prev.alert_levels, level],
    }));
  };

  const toggleSource = (source: string) => {
    setForm((prev) => ({
      ...prev,
      alert_types: prev.alert_types.includes(source)
        ? prev.alert_types.filter((s) => s !== source)
        : [...prev.alert_types, source],
    }));
  };

  return (
    <AdminPageLayout title="紧急联系人" description="配置企业微信告警通知人员，各监控模块异常将自动推送">
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">联系人管理</TabsTrigger>
          <TabsTrigger value="logs">
            告警记录
            {alertLogs.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{alertLogs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========== 联系人管理 ========== */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />添加联系人</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>添加紧急联系人</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>姓名</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="如：张三（后端）"
                    />
                  </div>
                  <div>
                    <Label>企业微信 Webhook URL</Label>
                    <Input
                      value={form.wecom_webhook_url}
                      onChange={(e) => setForm((p) => ({ ...p, wecom_webhook_url: e.target.value }))}
                      placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      在企业微信群中添加"群机器人"获取 Webhook 地址
                    </p>
                  </div>
                  <div>
                    <Label>告警级别</Label>
                    <div className="flex gap-2 mt-1">
                      {ALERT_LEVEL_OPTIONS.map((opt) => (
                        <Badge
                          key={opt.value}
                          variant={form.alert_levels.includes(opt.value) ? opt.color : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleLevel(opt.value)}
                        >
                          {opt.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>接收模块</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ALERT_SOURCE_OPTIONS.map((opt) => (
                        <Badge
                          key={opt.value}
                          variant={form.alert_types.includes(opt.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSource(opt.value)}
                        >
                          <opt.icon className="h-3 w-3 mr-1" />
                          {opt.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      选择该联系人接收哪些监控模块的告警
                    </p>
                  </div>
                  <div>
                    <Label>备注</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="负责模块、值班时间等"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addMutation.mutate(form)}
                    disabled={!form.name || !form.wecom_webhook_url || addMutation.isPending}
                  >
                    {addMutation.isPending ? "添加中..." : "确认添加"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : !contacts?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mb-3 opacity-40" />
                <p>暂未配置紧急联系人</p>
                <p className="text-xs">添加企业微信群机器人 Webhook 即可开启告警推送</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contacts.map((c) => (
                <Card key={c.id} className={!c.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {c.name}
                      </CardTitle>
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, is_active: v })}
                      />
                    </div>
                    {c.description && (
                      <CardDescription>{c.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">级别:</span>
                      {c.alert_levels?.map((level) => {
                        const opt = ALERT_LEVEL_OPTIONS.find((o) => o.value === level);
                        return (
                          <Badge key={level} variant={opt?.color || "outline"} className="text-[10px]">
                            {opt?.label || level}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">模块:</span>
                      {(c.alert_types || []).map((type) => (
                        <Badge key={type} variant="outline" className="text-[10px]">
                          {SOURCE_LABELS[type] || type}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-3">{c.wecom_webhook_url}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(c)}
                        disabled={testing === c.id}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {testing === c.id ? "发送中..." : "测试发送"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("确认删除该联系人？")) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== 告警记录 ========== */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                最近告警推送记录
              </CardTitle>
              <CardDescription>展示各监控模块自动推送的企业微信告警历史</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : alertLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>暂无告警记录</p>
                  <p className="text-xs mt-1">当监控模块检测到异常时将自动推送告警</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {alertLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant={log.alert_level === 'critical' ? 'destructive' : log.alert_level === 'high' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {log.alert_level === 'critical' ? '严重' : log.alert_level === 'high' ? '高危' : '中等'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {SOURCE_LABELS[log.alert_source] || log.alert_source}
                          </Badge>
                          <Badge
                            variant={log.send_status === 'success' ? 'outline' : 'destructive'}
                            className="text-[10px]"
                          >
                            {log.send_status === 'success' ? '✓ 已送达' : '✕ 失败'}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            → {log.contact_name}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.details}</p>
                        )}
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-0.5">{log.error_message}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
