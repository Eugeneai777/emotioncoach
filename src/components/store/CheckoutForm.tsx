import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RegionPicker } from "./RegionPicker";
import { startPaymentFlow, trackPaymentEvent, getCurrentFlowId } from "@/utils/paymentFlowTracker";
export interface CheckoutInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  idCardName?: string;
  idCardNumber?: string;
}

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  price: number;
  onConfirm: (info: CheckoutInfo) => void;
  loading?: boolean;
  shippingNote?: string;
  needIdCard?: boolean;
}

function parseAddress(raw: string): { name: string; phone: string; address: string } | null {
  const cleaned = raw.replace(/[-\s·]/g, match => match === ' ' ? ' ' : '');
  const stripped = cleaned.replace(/[-·]/g, '');
  const phoneMatch = stripped.match(/1[3-9]\d{9}/);
  if (!phoneMatch) return null;

  const phone = phoneMatch[0];
  const phonePattern = phone.split('').join('[\\s\\-·]?');
  const withoutPhone = raw.replace(new RegExp(phonePattern), ' ').trim();

  const labeledName = withoutPhone.match(/(?:收货人|姓名|联系人)[：:]\s*([\u4e00-\u9fa5]{2,4})/);
  const nameMatch = labeledName
    ? labeledName[1]
    : (withoutPhone.match(/([\u4e00-\u9fa5]{2,4})/) || [])[1];

  const name = nameMatch || '';

  let address = withoutPhone;
  if (name) address = address.replace(name, '');
  address = address
    .replace(/(?:收货人|姓名|联系人|电话|手机|联系电话|地址|收货地址)[：:]\s*/g, '')
    .replace(/[,，;；\s]+/g, ' ')
    .trim();

  return { name, phone, address };
}

function validateIdCard(num: string): boolean {
  return /^\d{17}[\dXx]$/.test(num);
}

export function CheckoutForm({ open, onOpenChange, productName, price, onConfirm, loading, shippingNote, needIdCard }: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [idCardName, setIdCardName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");

  // 埋点：表单打开
  useEffect(() => {
    if (open) {
      if (!getCurrentFlowId()) {
        startPaymentFlow({ productName, amount: price });
      }
      trackPaymentEvent('checkout_opened', {
        metadata: { productName, price },
      });
    }
  }, [open, productName, price]);

  const baseCanSubmit = name.trim() && phone.trim() && province && city && district && detailAddress.trim();
  const idCardValid = !needIdCard || (idCardName.trim() && validateIdCard(idCardNumber.trim()));
  const canSubmit = baseCanSubmit && idCardValid;

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const result = parseAddress(text);
    if (!result) return;
    e.preventDefault();
    if (result.name) setName(result.name);
    setPhone(result.phone);
    if (result.address) setDetailAddress(result.address);
    // Auto-fill id card name from buyer name
    if (needIdCard && result.name && !idCardName) {
      setIdCardName(result.name);
    }
    toast({ title: "✅ 已自动识别收货信息", description: "请选择省市区后确认" });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      toast({ title: "请输入正确的手机号", variant: "destructive" });
      return;
    }
    if (needIdCard && !validateIdCard(idCardNumber.trim())) {
      toast({ title: "请输入正确的18位身份证号", variant: "destructive" });
      return;
    }
    const fullAddress = `${province}${city}${district} ${detailAddress.trim()}`;
    // 埋点：收货信息提交
    trackPaymentEvent('checkout_submitted', {
      metadata: { productName, price },
    });
    onConfirm({
      buyerName: name.trim(),
      buyerPhone: phone.trim(),
      buyerAddress: fullAddress,
      ...(needIdCard ? { idCardName: idCardName.trim(), idCardNumber: idCardNumber.trim().toUpperCase() } : {}),
    });
  };

  const displayShippingNote = shippingNote || "由香港直邮，预计 4-7 个工作日送达";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
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

          {/* Shipping note */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm shrink-0 mt-0.5">📦</span>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong>配送说明：</strong>{displayShippingNote}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">💡 粘贴完整地址可自动识别姓名和电话</p>

          <div>
            <Label>收货人 *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="请输入姓名" />
          </div>
          <div>
            <Label>联系电话 *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" type="tel" maxLength={11} />
          </div>

          <RegionPicker
            province={province}
            city={city}
            district={district}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
          />

          <div>
            <Label>详细地址 *</Label>
            <Input value={detailAddress} onChange={e => setDetailAddress(e.target.value)} placeholder="街道、楼栋、门牌号等" />
          </div>

          {/* ID Card section for cross-border customs */}
          {needIdCard && (
            <div className="space-y-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                清关信息
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                因海关清关需要，请填写与收件人一致的身份信息（仅用于清关，不会用于其他用途）
              </p>
              <div>
                <Label>身份证姓名 *</Label>
                <Input value={idCardName} onChange={e => setIdCardName(e.target.value)} placeholder="请输入身份证上的姓名" />
              </div>
              <div>
                <Label>身份证号码 *</Label>
                <Input
                  value={idCardNumber}
                  onChange={e => setIdCardNumber(e.target.value)}
                  placeholder="请输入18位身份证号码"
                  maxLength={18}
                />
                {idCardNumber && !validateIdCard(idCardNumber) && (
                  <p className="text-xs text-destructive mt-1">请输入正确的18位身份证号码</p>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            确认并支付 ¥{price}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
