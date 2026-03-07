import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  user_id: string;
  display_name: string;
  phone: string;
  bound_at: string;
}

interface PartnerTeamManagerProps {
  partnerId: string;
}

export function PartnerTeamManager({ partnerId }: PartnerTeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("manage-partner-team", {
        body: { action: "list", partner_id: partnerId },
      });

      if (error) throw error;
      setMembers(data.members || []);
    } catch (err: any) {
      console.error("fetchMembers error:", err);
      toast.error("加载团队成员失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [partnerId]);

  const handleAdd = async () => {
    if (!phone.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-partner-team", {
        body: { action: "add", partner_id: partnerId, phone: phone.trim() },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || "添加成功");
      setPhone("");
      setAddDialogOpen(false);
      fetchMembers();
    } catch (err: any) {
      toast.error("添加失败: " + (err.message || "未知错误"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("确认移除该成员？移除后该用户将无法管理此合伙人。")) return;
    setRemovingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-partner-team", {
        body: { action: "remove", partner_id: partnerId, user_id_to_remove: userId },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("已移除");
      fetchMembers();
    } catch (err: any) {
      toast.error("移除失败: " + (err.message || "未知错误"));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">团队成员</h3>
          <span className="text-sm text-muted-foreground">({members.length}人)</span>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          添加成员
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        团队成员可以登录后台查看和管理此合伙人的所有活动、教练、测评等内容。
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无团队成员，点击"添加成员"开始添加
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>添加时间</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">
                    {m.display_name}
                    <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0">有劲飞轮</Badge>
                  </TableCell>
                  <TableCell>{m.phone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.bound_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(m.user_id)}
                      disabled={removingId === m.user_id}
                    >
                      {removingId === m.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>添加团队成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              输入用户手机号，添加为此合伙人的运营团队成员。
            </p>
            <div>
              <Label>手机号</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入用户手机号"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd} disabled={adding || !phone.trim()} className="w-full">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              确认添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
