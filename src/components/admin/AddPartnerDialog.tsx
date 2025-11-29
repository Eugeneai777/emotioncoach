import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPartnerDialog({ open, onOpenChange, onSuccess }: AddPartnerDialogProps) {
  const [email, setEmail] = useState("");
  const [l1Rate, setL1Rate] = useState("30");
  const [l2Rate, setL2Rate] = useState("10");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePartnerCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'YJ';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 简化：直接通过邮箱查询用户配置文件
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(100);

      if (profileError) throw profileError;

      // 这里需要管理员手动输入用户ID，或通过其他方式查找
      // 暂时使用email作为查找依据（实际应该有更好的方式）
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();
      if (!currentAdmin) throw new Error("请先登录");

      // 由于无法直接通过email查找用户，这里简化处理
      // 实际使用中，管理员应该通过用户列表选择用户
      throw new Error("请通过用户管理页面选择用户ID后再添加合伙人");

    } catch (error: any) {
      console.error('Error adding partner:', error);
      toast.error("添加失败", {
        description: error.message || "请稍后重试"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>手动添加合伙人</DialogTitle>
          <DialogDescription>
            为指定用户开通合伙人权限
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">用户邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入用户邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="l1-rate">一级提成比例 (%)</Label>
              <Input
                id="l1-rate"
                type="number"
                min="0"
                max="100"
                step="1"
                value={l1Rate}
                onChange={(e) => setL1Rate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l2-rate">二级提成比例 (%)</Label>
              <Input
                id="l2-rate"
                type="number"
                min="0"
                max="100"
                step="1"
                value={l2Rate}
                onChange={(e) => setL2Rate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">备注（可选）</Label>
            <Textarea
              id="note"
              placeholder="添加备注说明"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "添加中..." : "确认添加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
