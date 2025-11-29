import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Partner } from "@/hooks/usePartner";
import { Wallet } from "lucide-react";

interface WithdrawalFormProps {
  partner: Partner;
}

export function WithdrawalForm({ partner }: WithdrawalFormProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'bank'>('wechat');
  const [paymentInfo, setPaymentInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("请输入有效的提现金额");
      return;
    }

    if (withdrawAmount > partner.available_balance) {
      toast.error("提现金额不能超过可提现余额");
      return;
    }

    if (!paymentInfo.trim()) {
      toast.error("请输入收款账号信息");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('partner-withdrawal', {
        body: {
          amount: withdrawAmount,
          payment_method: paymentMethod,
          payment_info: {
            account: paymentInfo.trim(),
            method: paymentMethod
          }
        }
      });

      if (error) throw error;

      toast.success("提现申请已提交", {
        description: "请等待管理员审核，通常1-3个工作日内处理"
      });

      setAmount("");
      setPaymentInfo("");
      
      // 刷新页面
      window.location.reload();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error("提现申请失败", {
        description: error.message || "请稍后重试"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          提现申请
        </CardTitle>
        <CardDescription>
          可提现余额: <span className="text-lg font-bold text-primary">¥{partner.available_balance.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">提现金额</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={partner.available_balance}
              placeholder="请输入提现金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              最低提现金额 ¥0.01，最高 ¥{partner.available_balance.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">收款方式</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wechat">微信</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
                <SelectItem value="bank">银行卡</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-info">收款账号信息</Label>
            <Textarea
              id="payment-info"
              placeholder={
                paymentMethod === 'wechat' 
                  ? '请输入微信号或手机号' 
                  : paymentMethod === 'alipay' 
                  ? '请输入支付宝账号' 
                  : '请输入银行卡号、开户行、户名'
              }
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium">提现说明：</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>提现申请提交后1-3个工作日内处理</li>
              <li>请确保收款信息准确无误</li>
              <li>提现金额将从可提现余额中扣除</li>
              <li>如有疑问请联系客服</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || partner.available_balance <= 0}
          >
            {loading ? "提交中..." : "提交提现申请"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
