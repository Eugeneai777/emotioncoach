import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

function parseAddress(raw: string): { name: string; phone: string; address: string } | null {
  const cleaned = raw.replace(/[-\s·]/g, match => match === ' ' ? ' ' : '');
  const stripped = cleaned.replace(/[-·]/g, '');
  const phoneMatch = stripped.match(/1[3-9]\d{9}/);
  if (!phoneMatch) return null;

  const phone = phoneMatch[0];
  // Remove phone (with possible separators) from original text
  const phonePattern = phone.split('').join('[\\s\\-·]?');
  const withoutPhone = raw.replace(new RegExp(phonePattern), ' ').trim();

  // Extract name: 2-4 Chinese characters, typically near the start or labeled
  const labeledName = withoutPhone.match(/(?:收货人|姓名|联系人)[：:]\s*([\u4e00-\u9fa5]{2,4})/);
  const nameMatch = labeledName
    ? labeledName[1]
    : (withoutPhone.match(/([\u4e00-\u9fa5]{2,4})/) || [])[1];

  const name = nameMatch || '';

  // Address: remove name, clean up labels and extra punctuation
  let address = withoutPhone;
  if (name) address = address.replace(name, '');
  address = address
    .replace(/(?:收货人|姓名|联系人|电话|手机|联系电话|地址|收货地址)[：:]\s*/g, '')
    .replace(/[,，;；\s]+/g, ' ')
    .trim();

  return { name, phone, address };
}

export function CheckoutForm({ open, onOpenChange, productName, price, onConfirm, loading }: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSubmit = name.trim() && phone.trim() && address.trim();

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const result = parseAddress(text);
    if (!result) return;
    e.preventDefault();
    if (result.name) setName(result.name);
    setPhone(result.phone);
    if (result.address) setAddress(result.address);
    toast({ title: "✅ 已自动识别收货信息" });
  };

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
        <div className="space-y-4" onPaste={handlePaste}>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{productName}</p>
            <p className="text-sm font-bold text-destructive">¥{price}</p>
          </div>

          <p className="text-xs text-muted-foreground">💡 粘贴完整地址可自动识别</p>

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
