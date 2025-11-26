import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function RechargeDialog({ open, onOpenChange, userId, userName, onSuccess }: RechargeDialogProps) {
  const [quantity, setQuantity] = useState("100");
  const [packageType, setPackageType] = useState("custom");
  const [notes, setNotes] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    const amount = parseInt(quantity);
    if (!amount || amount <= 0) {
      toast.error("请输入有效的充值额度");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-recharge', {
        body: {
          userId,
          quantity: amount,
          packageType,
          notes,
          expiryDays: expiryDays ? parseInt(expiryDays) : null
        }
      });

      if (error) throw error;

      toast.success(`成功为 ${userName} 充值 ${amount} 额度`);
      onSuccess();
      onOpenChange(false);
      setQuantity("100");
      setPackageType("custom");
      setNotes("");
      setExpiryDays("");
    } catch (error: any) {
      console.error('Recharge error:', error);
      toast.error(error.message || "充值失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>手动充值</DialogTitle>
          <DialogDescription>
            为 {userName} 增加使用额度
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">充值额度 *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="输入充值数量"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageType">套餐类型</Label>
            <Select value={packageType} onValueChange={setPackageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">自定义充值</SelectItem>
                <SelectItem value="monthly">月卡</SelectItem>
                <SelectItem value="yearly">年卡</SelectItem>
                <SelectItem value="trial">试用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDays">有效期（天数，可选）</Label>
            <Input
              id="expiryDays"
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="留空表示永久有效"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注说明</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录充值原因或相关说明"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleRecharge} disabled={loading}>
            {loading ? "充值中..." : "确认充值"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
