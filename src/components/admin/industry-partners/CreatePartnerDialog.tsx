import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { CreatePartnerForm, DEFAULT_FORM } from "./types";
import { toast } from "sonner";

interface CreatePartnerDialogProps {
  onCreatePartner: (form: CreatePartnerForm) => Promise<void>;
  isCreating: boolean;
}

export function CreatePartnerDialog({ onCreatePartner, isCreating }: CreatePartnerDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePartnerForm>({ ...DEFAULT_FORM });

  const handleCreate = async () => {
    if (!form.company_name.trim()) {
      toast.error("请填写公司/机构名称");
      return;
    }
    await onCreatePartner(form);
    setOpen(false);
    setForm({ ...DEFAULT_FORM });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新建行业合伙人
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>新建行业合伙人</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>公司/机构名称 *</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              placeholder="例如: XX心理咨询中心"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>联系人</Label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="姓名"
              />
            </div>
            <div>
              <Label>联系电话</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                placeholder="手机号"
              />
            </div>
          </div>
          <div>
            <Label>佣金比例</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.commission_l1}
              onChange={(e) => setForm((f) => ({ ...f, commission_l1: e.target.value }))}
              placeholder="0.20 = 20%"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(parseFloat(form.commission_l1) * 100 || 0).toFixed(0)}%
            </p>
          </div>
          <div>
            <Label>流量来源</Label>
            <Input
              value={form.traffic_source}
              onChange={(e) => setForm((f) => ({ ...f, traffic_source: e.target.value }))}
              placeholder="例如: 微信公众号、线下门店"
            />
          </div>
          <div>
            <Label>结算周期</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base"
              value={form.settlement_cycle}
              onChange={(e) => setForm((f) => ({ ...f, settlement_cycle: e.target.value }))}
            >
              <option value="monthly">月结</option>
              <option value="quarterly">季结</option>
              <option value="yearly">年结</option>
            </select>
          </div>
          <div>
            <Label>合作备注</Label>
            <Textarea
              value={form.cooperation_note}
              onChange={(e) => setForm((f) => ({ ...f, cooperation_note: e.target.value }))}
              placeholder="合作协议、特殊条款等"
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating} className="w-full">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            创建
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
