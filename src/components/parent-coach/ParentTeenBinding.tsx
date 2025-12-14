import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Copy, UserCheck, Clock, Trash2, Info, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { InvitationScriptCard } from "./InvitationScriptCard";

interface Binding {
  id: string;
  binding_code: string;
  teen_nickname: string | null;
  status: string;
  code_expires_at: string;
  bound_at: string | null;
  teen_user_id: string | null;
}

export function ParentTeenBinding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState("");
  const [showScriptCard, setShowScriptCard] = useState(false);
  const [latestCode, setLatestCode] = useState("");

  const { data: bindings, isLoading } = useQuery({
    queryKey: ["parent-teen-bindings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("parent_teen_bindings")
        .select("*")
        .eq("parent_user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Binding[];
    },
    enabled: !!user?.id,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (teenNickname: string) => {
      // Generate a 6-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      const { data, error } = await supabase
        .from("parent_teen_bindings")
        .insert({
          parent_user_id: user?.id,
          binding_code: code,
          teen_nickname: teenNickname || null,
          code_expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["parent-teen-bindings"] });
      setNickname("");
      setLatestCode(data.binding_code);
      setShowScriptCard(true);
      toast({ title: "绑定码已生成", description: "选择话术分享给孩子" });
    },
    onError: () => {
      toast({ title: "生成失败", description: "请稍后重试", variant: "destructive" });
    },
  });

  const deleteBindingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("parent_teen_bindings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-teen-bindings"] });
      toast({ title: "已删除" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "已复制绑定码" });
  };

  const activeBindings = bindings?.filter(b => b.status === "active") || [];
  const pendingBindings = bindings?.filter(b => b.status === "pending") || [];

  return (
    <div className="space-y-4">
      <Card className="bg-white/60 backdrop-blur border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-teal-500" />
              亲子绑定
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/parent-teen-intro")}
              className="text-violet-600 gap-1"
            >
              <Info className="h-4 w-4" />
              了解更多
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate new binding code */}
          <div className="space-y-3 p-4 bg-teal-50/50 rounded-xl">
            <Label className="text-sm text-muted-foreground">为孩子生成绑定码</Label>
            <div className="flex gap-2">
              <Input
                placeholder="孩子昵称（可选）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => generateCodeMutation.mutate(nickname)}
                disabled={generateCodeMutation.isPending}
                className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
              >
                生成
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              绑定码有效期24小时，孩子使用后可建立双向连接
            </p>
          </div>

          {/* Active bindings */}
          {activeBindings.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-green-500" />
                已绑定
              </Label>
              {activeBindings.map((binding) => (
                <div
                  key={binding.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">
                      {binding.teen_nickname || "孩子"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {binding.bound_at && format(new Date(binding.bound_at), "MM月dd日绑定", { locale: zhCN })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBindingMutation.mutate(binding.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pending bindings */}
          {pendingBindings.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4 text-amber-500" />
                待绑定
              </Label>
              {pendingBindings.map((binding) => (
                <div
                  key={binding.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider">
                        {binding.binding_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(binding.binding_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLatestCode(binding.binding_code);
                          setShowScriptCard(true);
                        }}
                        className="text-violet-600"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {binding.teen_nickname && `${binding.teen_nickname} · `}
                      {format(new Date(binding.code_expires_at), "MM月dd日 HH:mm 过期", { locale: zhCN })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBindingMutation.mutate(binding.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="text-center text-muted-foreground py-4">加载中...</div>
          )}

          {!isLoading && bindings?.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              还没有绑定记录，生成绑定码邀请孩子加入吧
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Card */}
      {showScriptCard && latestCode && (
        <InvitationScriptCard bindingCode={latestCode} />
      )}
    </div>
  );
}
