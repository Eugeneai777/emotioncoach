import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TeamCoachingSession, useEnrollPaidSession } from "@/hooks/useTeamCoaching";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useQueryClient } from "@tanstack/react-query";

interface TeamCoachingPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TeamCoachingSession;
}

export function TeamCoachingPayDialog({
  open,
  onOpenChange,
  session,
}: TeamCoachingPayDialogProps) {
  const [agreedNoRefund, setAgreedNoRefund] = useState(false);
  const [showWechatPay, setShowWechatPay] = useState(false);
  const queryClient = useQueryClient();
  const enrollPaid = useEnrollPaidSession();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(price);
  };

  const handleProceedToPay = () => {
    if (!agreedNoRefund) {
      return;
    }
    // 打开微信支付对话框
    setShowWechatPay(true);
  };

  const handlePaymentSuccess = () => {
    // 支付成功后刷新数据
    queryClient.invalidateQueries({ queryKey: ['team-coaching-session', session.id] });
    queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollment', session.id] });
    queryClient.invalidateQueries({ queryKey: ['team-coaching-enrollments'] });
    setShowWechatPay(false);
    onOpenChange(false);
  };

  // 构建支付包信息
  const packageInfo = {
    key: `team_coaching_${session.id}`,
    name: session.title,
    price: session.price || 0,
  };

  return (
    <>
      <Dialog open={open && !showWechatPay} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认报名</DialogTitle>
            <DialogDescription>
              请确认以下信息并完成支付
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 课程信息 */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium">{session.title}</h3>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(session.session_date), 'M月d日', { locale: zhCN })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{session.start_time.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{session.current_count}/{session.max_participants}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-muted-foreground">应付金额</span>
                <span className="text-xl font-bold text-primary">
                  ¥{formatPrice(session.price || 0)}
                </span>
              </div>
            </div>

            {/* 不可退款提示 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-destructive">
                  不可退款声明
                </p>
                <p className="text-xs text-muted-foreground">
                  本课程为虚拟服务商品，一经支付成功，费用不予退还。请在支付前确认您的时间安排。
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="agree-no-refund"
                    checked={agreedNoRefund}
                    onCheckedChange={(checked) => setAgreedNoRefund(checked === true)}
                  />
                  <label 
                    htmlFor="agree-no-refund" 
                    className="text-sm cursor-pointer"
                  >
                    我已了解并同意以上条款
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              className="flex-1"
              onClick={handleProceedToPay}
              disabled={!agreedNoRefund}
            >
              确认支付
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 微信支付对话框 */}
      <UnifiedPayDialog
        open={showWechatPay}
        onOpenChange={(open) => {
          setShowWechatPay(open);
          if (!open) {
            // 如果关闭支付对话框，也关闭确认对话框
            onOpenChange(false);
          }
        }}
        packageInfo={packageInfo}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
