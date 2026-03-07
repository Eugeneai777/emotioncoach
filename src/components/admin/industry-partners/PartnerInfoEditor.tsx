import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, UserPlus, Link2, Unlink } from "lucide-react";

interface PartnerInfoEditorProps {
  partner: {
    id: string;
    partner_code: string;
    company_name: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    cooperation_note: string | null;
    custom_commission_rate_l1: number | null;
    custom_commission_rate_l2: number | null;
    traffic_source: string | null;
    settlement_cycle: string | null;
    user_id: string | null;
    status: string;
  };
  onSaved: () => void;
  onBindUser: (partnerId: string) => void;
}

export function PartnerInfoEditor({ partner, onSaved, onBindUser }: PartnerInfoEditorProps) {
  const [saving, setSaving] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [form, setForm] = useState({
    company_name: partner.company_name || "",
    contact_person: partner.contact_person || "",
    contact_phone: partner.contact_phone || "",
    cooperation_note: partner.cooperation_note || "",
    commission_l1: String(partner.custom_commission_rate_l1 ?? 0.20),
    traffic_source: partner.traffic_source || "",
    settlement_cycle: partner.settlement_cycle || "monthly",
    status: partner.status,
  });

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      toast.error("公司/机构名称不能为空");
      return;
    }
    setSaving(true);
    try {
      const parsed = parseFloat(form.commission_l1);
      const commissionRate = isNaN(parsed) ? 0.20 : parsed;
      const { error } = await supabase
        .from("partners")
        .update({
          company_name: form.company_name.trim(),
          contact_person: form.contact_person.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          cooperation_note: form.cooperation_note.trim() || null,
          custom_commission_rate_l1: commissionRate,
          commission_rate_l1: commissionRate,
          traffic_source: form.traffic_source.trim() || null,
          settlement_cycle: form.settlement_cycle,
          status: form.status,
        } as any)
        .eq("id", partner.id);

      if (error) throw error;
      toast.success("信息已更新");
      onSaved();
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>合伙人编码</Label>
            <Input value={partner.partner_code} disabled className="font-mono bg-muted" />
          </div>
          <div>
            <Label>公司/机构名称 *</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
              placeholder="例如: XX心理咨询中心"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>联系人</Label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm(f => ({ ...f, contact_person: e.target.value }))}
                placeholder="姓名"
              />
            </div>
            <div>
              <Label>联系电话</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                placeholder="手机号"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>佣金比例</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.commission_l1}
                onChange={(e) => setForm(f => ({ ...f, commission_l1: e.target.value }))}
                placeholder="0.20 = 20%"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(parseFloat(form.commission_l1) * 100 || 0).toFixed(0)}%
              </p>
            </div>
            <div>
              <Label>结算周期</Label>
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base"
                value={form.settlement_cycle}
                onChange={(e) => setForm(f => ({ ...f, settlement_cycle: e.target.value }))}
              >
                <option value="monthly">月结</option>
                <option value="quarterly">季结</option>
                <option value="yearly">年结</option>
              </select>
            </div>
          </div>
          <div>
            <Label>流量来源</Label>
            <Input
              value={form.traffic_source}
              onChange={(e) => setForm(f => ({ ...f, traffic_source: e.target.value }))}
              placeholder="例如: 微信公众号、线下门店"
            />
          </div>
          <div>
            <Label>状态</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base"
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div>
            <Label>合作备注</Label>
            <Textarea
              value={form.cooperation_note}
              onChange={(e) => setForm(f => ({ ...f, cooperation_note: e.target.value }))}
              placeholder="合作协议、特殊条款等"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">负责人</CardTitle>
        </CardHeader>
        <CardContent>
          {partner.user_id ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 font-medium">已设置负责人</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unbinding}
                onClick={async () => {
                  if (!confirm("确认移除负责人？移除后该合伙人将无法通过合伙人中心访问。")) return;
                  setUnbinding(true);
                  try {
                    const { error } = await supabase
                      .from("partners")
                      .update({ user_id: null } as any)
                      .eq("id", partner.id);
                    if (error) throw error;
                    toast.success("已移除负责人");
                    onSaved();
                  } catch (err: any) {
                    toast.error("移除失败: " + (err.message || "未知错误"));
                  } finally {
                    setUnbinding(false);
                  }
                }}
              >
                {unbinding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Unlink className="h-4 w-4 mr-1" />}
                移除负责人
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">尚未设置负责人，设置后负责人可登录访问合伙人中心。</p>
              <Button variant="outline" size="sm" onClick={() => onBindUser(partner.id)}>
                <UserPlus className="h-4 w-4 mr-1" />
                设置负责人
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
        保存修改
      </Button>
    </div>
  );
}
