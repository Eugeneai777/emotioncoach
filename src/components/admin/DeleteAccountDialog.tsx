import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== "删除") {
      toast.error('请输入"删除"以确认操作');
      return;
    }

    setLoading(true);
    try {
      // 软删除：设置 deleted_at 时间戳
      const { error } = await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          is_disabled: true,
          disabled_at: new Date().toISOString(),
          disabled_reason: '账号已删除',
        })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`已删除账号：${userName}`);
      onSuccess();
      onOpenChange(false);
      setConfirmText("");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">删除账号</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除用户 "{userName}" 的账号吗？
            <br /><br />
            <span className="text-destructive font-medium">
              此操作将软删除该账号，用户数据会保留但无法访问。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirm">请输入"删除"以确认操作</Label>
          <Input
            id="confirm"
            placeholder="输入：删除"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={() => setConfirmText("")}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || confirmText !== "删除"}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? '处理中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
