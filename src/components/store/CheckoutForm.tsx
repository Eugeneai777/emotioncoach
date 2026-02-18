import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";

export interface CheckoutInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
}

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: number;
  onConfirm: (info: CheckoutInfo) => void;
  loading?: boolean;
}

export function CheckoutForm({ open, onOpenChange, productName, price, onConfirm, loading }: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSubmit = name.trim() && phone.trim() && address.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      buyerName: name.trim(),
      buyerPhone: phone.trim(),
      buyerAddress: address.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            填写收货信息
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{productName}</p>
            <p className="text-sm font-bold text-destructive">¥{price}</p>
          </div>

          <div>
            <Label>收货人 *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="请输入姓名" />
          </div>
          <div>
            <Label>联系电话 *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" type="tel" />
          </div>
          <div>
            <Label>收货地址 *</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="请输入详细地址" />
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            确认并支付 ¥{price}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
