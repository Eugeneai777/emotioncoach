import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCoachPriceTiers } from "@/hooks/useCoachPriceTiers";

interface AdminCreateCoachDialogProps {
  open: boolean;
  onClose: () => void;
}

type CoachStatus = "approved" | "pending";

export function AdminCreateCoachDialog({ open, onClose }: AdminCreateCoachDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: priceTiers } = useCoachPriceTiers();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    title: "",
    bio: "",
    experience_years: 0,
    specialties: [] as string[],
    price_tier_id: "",
    admin_note: "",
    status: "approved" as CoachStatus,
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  const reset = () => {
    setForm({
      name: "",
      phone: "",
      title: "",
      bio: "",
      experience_years: 0,
      specialties: [],
      price_tier_id: "",
      admin_note: "",
      status: "approved",
    });
    setNewSpecialty("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const addSpecialty = () => {
    const t = newSpecialty.trim();
    if (!t) return;
    if (form.specialties.includes(t)) return;
    setForm((p) => ({ ...p, specialties: [...p.specialties, t] }));
    setNewSpecialty("");
  };

  const removeSpecialty = (s: string) => {
    setForm((p) => ({ ...p, specialties: p.specialties.filter((x) => x !== s) }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) {
      toast.error("请填写教练姓名");
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      toast.error("请输入 11 位手机号");
      return;
    }

    setSubmitting(true);
    try {
      const isApproved = form.status === "approved";
      const tierPrice = priceTiers?.find((t) => t.id === form.price_tier_id)?.price;

      const insertPayload: any = {
        name,
        phone,
        claim_phone: phone,
        claim_country_code: "+86",
        submitted_by_user_id: user.id,
        status: form.status,
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
        experience_years: form.experience_years || null,
        specialties: form.specialties.length ? form.specialties : null,
        admin_note: form.admin_note.trim() || null,
        is_accepting_new: isApproved,
      };

      if (isApproved) {
        insertPayload.is_verified = true;
        insertPayload.verified_at = new Date().toISOString();
        insertPayload.trust_level = 1;
        insertPayload.badge_type = "certified";
        if (form.price_tier_id) {
          insertPayload.price_tier_id = form.price_tier_id;
          insertPayload.price_tier_set_at = new Date().toISOString();
          insertPayload.price_tier_set_by = user.id;
        }
      }

      const { data: coach, error: insertErr } = await supabase
        .from("human_coaches")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr || !coach) {
        const msg = insertErr?.message || "";
        if (msg.includes("human_coaches_claim_phone_unique")) {
          toast.error("该手机号已有教练记录");
        } else {
          toast.error(`创建失败：${msg || "请稍后重试"}`);
        }
        setSubmitting(false);
        return;
      }

      // 默认服务（防止列表显示异常）
      const { error: svcErr } = await supabase.from("coach_services").insert({
        coach_id: coach.id,
        service_name: `${name} 一对一咨询（60分钟）`,
        duration_minutes: 60,
        price: tierPrice ?? 0,
        is_active: isApproved,
      });
      if (svcErr) {
        console.warn("[admin-create-coach] default service insert failed:", svcErr);
      }

      toast.success(isApproved ? "教练已录入并直接通过" : "教练已录入，状态为待审核");
      queryClient.invalidateQueries({ queryKey: ["human-coaches-stats"] });
      queryClient.invalidateQueries({ queryKey: ["coach-applications"] });
      queryClient.invalidateQueries({ queryKey: ["approved-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["active-human-coaches"] });
      reset();
      onClose();
    } catch (e: any) {
      toast.error(`创建失败：${e?.message || "请稍后重试"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>手动录入教练</DialogTitle>
          <DialogDescription>
            管理员直接创建教练档案，可选「直接通过」或「列入待审核」
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>状态</Label>
            <RadioGroup
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v as CoachStatus }))}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="approved" id="status-approved" />
                <Label htmlFor="status-approved" className="cursor-pointer font-normal">
                  直接通过
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pending" id="status-pending" />
                <Label htmlFor="status-pending" className="cursor-pointer font-normal">
                  列入待审核
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              姓名 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="教练真实姓名"
            />
          </div>

          <div className="space-y-2">
            <Label>
              手机号 <span className="text-destructive">*</span>
            </Label>
            <Input
              inputMode="numeric"
              maxLength={11}
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))
              }
              placeholder="11 位手机号"
            />
          </div>

          <div className="space-y-2">
            <Label>职称 / 头衔</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="例如：高级心理咨询师"
            />
          </div>

          <div className="space-y-2">
            <Label>从业年限</Label>
            <Input
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(e) =>
                setForm((p) => ({ ...p, experience_years: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>价格档位（仅直接通过时生效）</Label>
            <Select
              value={form.price_tier_id}
              onValueChange={(v) => setForm((p) => ({ ...p, price_tier_id: v }))}
              disabled={form.status !== "approved"}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择价格档位（可选）" />
              </SelectTrigger>
              <SelectContent>
                {priceTiers?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.tier_name} · ¥{t.price}/{t.duration_minutes}分钟
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>专长领域</Label>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialty();
                  }
                }}
                placeholder="输入后回车添加"
              />
              <Button type="button" variant="outline" onClick={addSpecialty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(s)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>简介</Label>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="教练个人简介"
            />
          </div>

          <div className="space-y-2">
            <Label>管理员备注</Label>
            <Textarea
              rows={2}
              value={form.admin_note}
              onChange={(e) => setForm((p) => ({ ...p, admin_note: e.target.value }))}
              placeholder="内部备注，仅管理员可见"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            提示：头像、详细资质等可在创建后通过教练编辑入口补充。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
