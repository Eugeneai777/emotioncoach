import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, Copy, Loader2, Link2, Trash2, Users, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CERT_OPTIONS = [
  { value: "national_level2", label: "国家二级心理咨询师" },
  { value: "national_level3", label: "国家三级心理咨询师" },
  { value: "marriage_family", label: "婚姻家庭咨询师" },
  { value: "sand_therapy", label: "沙盘治疗师" },
  { value: "cbt_cert", label: "CBT 认知行为治疗认证" },
  { value: "nlp_cert", label: "NLP 执行师认证" },
  { value: "coaching_cert", label: "ICF 教练认证" },
  { value: "eap_cert", label: "EAP 咨询师" },
  { value: "psychology_degree", label: "心理学学位" },
  { value: "education_degree", label: "教育学学位" },
  { value: "social_work_cert", label: "社会工作师" },
  { value: "mindfulness_cert", label: "正念导师认证" },
];

export function CoachInvitationManager() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [note, setNote] = useState("");
  const [defaultServiceName, setDefaultServiceName] = useState("绽放身份教练");
  const [defaultCerts, setDefaultCerts] = useState<{ certType: string; certName: string }[]>([]);
  const [customCertName, setCustomCertName] = useState("");
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [note, setNote] = useState("");
  const [defaultServiceName, setDefaultServiceName] = useState("绽放身份教练");
  const [defaultCerts, setDefaultCerts] = useState<{ certType: string; certName: string }[]>([]);

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["coach-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("coach_invitations")
        .insert({
          invitee_name: inviteeName || null,
          note: note || null,
          default_service_name: defaultServiceName || null,
          default_certifications: defaultCerts.length > 0 ? defaultCerts : [],
          created_by: (await supabase.auth.getUser()).data.user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coach-invitations"] });
      toast.success("邀请链接已生成");
      copyLink(data.token);
      setShowCreateDialog(false);
      setInviteeName("");
      setNote("");
      setDefaultServiceName("绽放身份教练");
      setDefaultCerts([]);
    },
    onError: (error) => {
      toast.error("创建失败: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coach_invitations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-invitations"] });
      toast.success("已删除");
    },
  });

  const copyLink = (token: string) => {
    const url = `https://wechat.eugenewe.net/become-coach?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("邀请链接已复制到剪贴板");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          生成邀请链接发送给教练，教练通过链接注册并填写资料
        </p>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          生成邀请链接
        </Button>
      </div>

      {(!invitations || invitations.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无邀请记录，点击上方按钮生成邀请链接
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* 顶部：名称 + 状态 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium truncate">
                        {inv.invitee_name || "未命名链接"}
                      </span>
                      <Badge
                        variant={inv.status === "used" ? "secondary" : "default"}
                        className={inv.status !== "used" ? "bg-emerald-500/90 hover:bg-emerald-500 shrink-0" : "shrink-0"}
                      >
                        {inv.status === "used" ? "已停用" : "有效"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => deleteMutation.mutate(inv.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* 中间：服务名称 + 备注 */}
                  {((inv as any).default_service_name || inv.note) && (
                    <div className="space-y-1">
                      {(inv as any).default_service_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {(inv as any).default_service_name}
                        </p>
                      )}
                      {inv.note && (
                        <p className="text-sm text-muted-foreground truncate">
                          {inv.note}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 底部：日期 + 注册数 + 操作 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(inv.created_at), "yyyy/MM/dd", { locale: zhCN })}
                      </span>
                      <span className="flex items-center gap-1">
                        已注册 <strong className="text-foreground">{inv.used_count}</strong> 人
                      </span>
                    </div>
                    {inv.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(inv.token)}
                        className="gap-1.5 shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                        复制链接
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              生成教练邀请链接
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>链接名称</Label>
              <Input
                placeholder="如：亲子教练招募"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>统一服务名称</Label>
              <Input
                placeholder="如：绽放身份教练"
                value={defaultServiceName}
                onChange={(e) => setDefaultServiceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                教练注册时将自动创建此名称的60分钟服务
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>备注（可选）</Label>
              <Input
                placeholder="如：擅长亲子关系的教练"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>预设资质证书（可选）</Label>
              <p className="text-xs text-muted-foreground">
                选中的证书将在教练注册时自动带入，无需手动填写
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {CERT_OPTIONS.map((option) => {
                  const selected = defaultCerts.some(c => c.certType === option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="rounded-full min-h-[36px] px-3 text-xs"
                      onClick={() => {
                        if (selected) {
                          setDefaultCerts(defaultCerts.filter(c => c.certType !== option.value));
                        } else {
                          setDefaultCerts([...defaultCerts, { certType: option.value, certName: option.label }]);
                        }
                      }}
                    >
                      {selected && <Check className="h-3 w-3 mr-1" />}
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              {defaultCerts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {defaultCerts.map(c => (
                    <Badge key={c.certType} variant="secondary" className="gap-1">
                      {c.certName}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDefaultCerts(defaultCerts.filter(dc => dc.certType !== c.certType))} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              生成并复制链接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
