import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RegionPicker } from "./RegionPicker";
import { AddressManager, type SavedAddress } from "./AddressManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export function CheckoutForm({ open, onOpenChange, productName, price, onConfirm, loading }: CheckoutFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [detail, setDetail] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const fullAddress = `${province}${city}${district} ${detail}`.trim();
  const canSubmit = name.trim() && phone.trim() && province && city && district && detail.trim();

  // When selecting a saved address, fill form
  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setProvince(addr.province);
    setCity(addr.city);
    setDistrict(addr.district);
    setDetail(addr.detail);
    setShowForm(false);
    setSaveAddress(false);
  };

  const handleAddNew = () => {
    setSelectedAddressId(null);
    setName("");
    setPhone("");
    setProvince("");
    setCity("");
    setDistrict("");
    setDetail("");
    setShowForm(true);
    setSaveAddress(true);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const result = parseAddress(text);
    if (!result) return;
    e.preventDefault();
    if (result.name) setName(result.name);
    setPhone(result.phone);
    if (result.address) setDetail(result.address);
    toast({ title: "✅ 已自动识别收货信息" });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Save address if checked and user is logged in
    if (saveAddress && user && !selectedAddressId) {
      try {
        // If first address, set as default
        const { data: existing } = await supabase
          .from("user_shipping_addresses" as any)
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        await supabase
          .from("user_shipping_addresses" as any)
          .insert({
            user_id: user.id,
            name: name.trim(),
            phone: phone.trim(),
            province,
            city,
            district,
            detail: detail.trim(),
            is_default: !existing || (existing as any[]).length === 0,
          } as any);
      } catch (e) {
        console.error("Save address error:", e);
      }
    }

    onConfirm({
      buyerName: name.trim(),
      buyerPhone: phone.trim(),
      buyerAddress: fullAddress,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Saved addresses */}
          <AddressManager
            userId={user?.id || null}
            selectedId={selectedAddressId}
            onSelect={handleSelectAddress}
            onAddNew={handleAddNew}
          />

          {/* Form */}
          {(showForm || !user) && (
            <>
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
                <Label>所在地区 *</Label>
                <RegionPicker
                  province={province}
                  city={city}
                  district={district}
                  onChange={(p, c, d) => { setProvince(p); setCity(c); setDistrict(d); }}
                />
              </div>
              <div>
                <Label>详细地址 *</Label>
                <Input value={detail} onChange={e => setDetail(e.target.value)} placeholder="街道、门牌号等" />
              </div>

              {user && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-address"
                    checked={saveAddress}
                    onCheckedChange={(v) => setSaveAddress(!!v)}
                  />
                  <label htmlFor="save-address" className="text-xs text-muted-foreground cursor-pointer">
                    保存此地址，下次购买快速选择
                  </label>
                </div>
              )}
            </>
          )}

          {/* Selected address preview when form is hidden */}
          {!showForm && selectedAddressId && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium">{name} · {phone}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{fullAddress}</p>
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
