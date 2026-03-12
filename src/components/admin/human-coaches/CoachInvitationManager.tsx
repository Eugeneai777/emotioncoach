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
import { Plus, Copy, Loader2, Link2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function CoachInvitationManager() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteePhone, setInviteePhone] = useState("");
  const [note, setNote] = useState("");

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
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
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
      setInviteePhone("");
      setNote("");
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
    const url = `${window.location.origin}/become-coach?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("邀请链接已复制到剪贴板");
  };

  const getStatusBadge = (invitation: any) => {
    if (invitation.status === "used") {
      return <Badge variant="secondary">已使用</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    return <Badge className="bg-green-500">有效</Badge>;
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          生成邀请链接发送给教练，教练通过链接注册并填写资料
        </p>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
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
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {inv.invitee_name || "未指定姓名"}
                      </span>
                      {getStatusBadge(inv)}
                    </div>
                    {inv.invitee_phone && (
                      <p className="text-sm text-muted-foreground">
                        手机: {inv.invitee_phone}
                      </p>
                    )}
                    {inv.note && (
                      <p className="text-sm text-muted-foreground">
                        备注: {inv.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      创建于{" "}
                      {format(new Date(inv.created_at), "MM月dd日 HH:mm", {
                        locale: zhCN,
                      })}
                      {" · "}
                      过期于{" "}
                      {format(new Date(inv.expires_at), "MM月dd日 HH:mm", {
                        locale: zhCN,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.status === "pending" &&
                      new Date(inv.expires_at) > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(inv.token)}
                          className="gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          复制链接
                        </Button>
                      )}
                    {inv.status !== "used" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(inv.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              生成教练邀请链接
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>受邀教练姓名（可选）</Label>
              <Input
                placeholder="如：张老师"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
              />
            </div>
            <div>
              <Label>手机号（可选）</Label>
              <Input
                placeholder="如：13800138000"
                value={inviteePhone}
                onChange={(e) => setInviteePhone(e.target.value)}
              />
            </div>
            <div>
              <Label>备注（可选）</Label>
              <Input
                placeholder="如：某培训机构推荐"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
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
