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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DisableAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  isCurrentlyDisabled: boolean;
  onSuccess: () => void;
}

export function DisableAccountDialog({
  open,
  onOpenChange,
  userId,
  userName,
  isCurrentlyDisabled,
  onSuccess,
}: DisableAccountDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isCurrentlyDisabled) {
        // 恢复账号
        const { error } = await supabase
          .from('profiles')
          .update({
            is_disabled: false,
            disabled_at: null,
            disabled_reason: null,
          })
          .eq('id', userId);

        if (error) throw error;
        toast.success(`已恢复账号：${userName}`);
      } else {
        // 停用账号
        const { error } = await supabase
          .from('profiles')
          .update({
            is_disabled: true,
            disabled_at: new Date().toISOString(),
            disabled_reason: reason || null,
          })
          .eq('id', userId);

        if (error) throw error;
        toast.success(`已停用账号：${userName}`);
      }
      
      onSuccess();
      onOpenChange(false);
      setReason("");
    } catch (error) {
      console.error('Error updating account status:', error);
      toast.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCurrentlyDisabled ? '恢复账号' : '停用账号'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentlyDisabled 
              ? `确定要恢复用户 "${userName}" 的账号吗？恢复后用户可正常登录使用。`
              : `确定要停用用户 "${userName}" 的账号吗？停用后该用户将无法登录，但数据会保留。`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {!isCurrentlyDisabled && (
          <div className="space-y-2">
            <Label htmlFor="reason">停用原因（可选）</Label>
            <Textarea
              id="reason"
              placeholder="请输入停用原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={isCurrentlyDisabled ? "" : "bg-orange-600 hover:bg-orange-700"}
          >
            {loading ? '处理中...' : (isCurrentlyDisabled ? '确认恢复' : '确认停用')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
