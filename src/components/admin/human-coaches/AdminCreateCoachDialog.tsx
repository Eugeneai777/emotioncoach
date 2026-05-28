import { useState, useEffect, useRef } from "react";
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
import { Loader2, X, Plus, Sparkles, Eraser } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCoachPriceTiers } from "@/hooks/useCoachPriceTiers";
import { AdminCertificationUploader } from "./AdminCertificationUploader";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

interface AdminCreateCoachDialogProps {
  open: boolean;
  onClose: () => void;
}

type CoachStatus = "approved" | "pending";

const DRAFT_KEY = "admin-create-coach-draft-v1";

type FormState = {
  name: string;
  phone: string;
  title: string;
  bio: string;
  experience_years: number;
  specialties: string[];
  price_tier_id: string;
  admin_note: string;
  status: CoachStatus;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  title: "",
  bio: "",
  experience_years: 0,
  specialties: [],
  price_tier_id: "",
  admin_note: "",
  status: "approved",
};

function loadDraft(): { form: FormState; pasteText: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      form: { ...EMPTY_FORM, ...(parsed.form || {}) },
      pasteText: typeof parsed.pasteText === "string" ? parsed.pasteText : "",
    };
  } catch {
    return null;
  }
}

export function AdminCreateCoachDialog({ open, onClose }: AdminCreateCoachDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: priceTiers } = useCoachPriceTiers();

  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [createdCoachId, setCreatedCoachId] = useState<string | null>(null);
  const [createdCoachName, setCreatedCoachName] = useState<string>("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const hydratedRef = useRef(false);

  // 打开时恢复草稿（仅一次）
  useEffect(() => {
    if (!open || hydratedRef.current) return;
    hydratedRef.current = true;
    const draft = loadDraft();
    if (draft) {
      setForm(draft.form);
      setPasteText(draft.pasteText);
      const hasContent =
        draft.form.name || draft.form.phone || draft.form.title ||
        draft.form.bio || draft.form.specialties.length > 0 || draft.pasteText;
      if (hasContent) setDraftRestored(true);
    }
  }, [open]);

  // 自动保存草稿（debounce 500ms）
  useEffect(() => {
    if (!open || createdCoachId) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, pasteText }));
      } catch {
        /* ignore quota */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form, pasteText, open, createdCoachId]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const resetAll = () => {
    setForm(EMPTY_FORM);
    setNewSpecialty("");
    setPasteText("");
    setCreatedCoachId(null);
    setCreatedCoachName("");
    setDraftRestored(false);
    hydratedRef.current = false;
  };

  const handleClearDraft = () => {
    clearDraft();
    setForm(EMPTY_FORM);
    setPasteText("");
    setNewSpecialty("");
    setDraftRestored(false);
    toast.success("草稿已清空");
  };

  const handleClose = () => {
    if (submitting) return;
    // 不清空 form，保留草稿
    onClose();
    // 关闭后重置 hydration 标志，下次打开能重新读草稿
    setTimeout(() => {
      hydratedRef.current = false;
      setDraftRestored(false);
    }, 300);
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

  const handleAIParse = async () => {
    const text = pasteText.trim();
    if (!text) {
      toast.error("请先粘贴文本");
      return;
    }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-coach-profile", {
        body: { text },
      });
      if (data?.error || error) {
        const msg = await extractEdgeFunctionError(data, error, "AI 识别失败");
        toast.error(msg);
        return;
      }
      const ext = data?.data || {};
      let filled = 0;
      setForm((prev) => {
        const next = { ...prev };
        const setIfEmpty = (k: keyof FormState, v: any) => {
          if (!v) return;
          const cur = (next as any)[k];
          if (!cur || (typeof cur === "string" && !cur.trim()) || (k === "experience_years" && !cur)) {
            (next as any)[k] = v;
            filled++;
          }
        };
        setIfEmpty("name", ext.name);
        setIfEmpty("phone", ext.phone);
        setIfEmpty("title", ext.title);
        setIfEmpty("experience_years", ext.experience_years);
        setIfEmpty("bio", ext.bio);
        if (Array.isArray(ext.specialties) && ext.specialties.length) {
          const merged = Array.from(new Set([...next.specialties, ...ext.specialties]));
          if (merged.length > next.specialties.length) {
            next.specialties = merged;
            filled++;
          }
        }
        return next;
      });
      toast.success(filled > 0 ? `已自动填充 ${filled} 项，请核对` : "未识别到新字段");
    } catch (e: any) {
      toast.error(`AI 识别失败：${e?.message || "请稍后重试"}`);
    } finally {
      setParsing(false);
    }
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
      // 成功落库 → 清草稿
      clearDraft();
      setCreatedCoachId(coach.id);
      setCreatedCoachName(name);
    } catch (e: any) {
      toast.error(`创建失败：${e?.message || "请稍后重试"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 第 2 步：证书补充
  if (createdCoachId) {
    return (
      <Dialog open={open} onOpenChange={(o) => {
        if (!o) {
          resetAll();
          onClose();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>第 2 步 · 补充资质证书</DialogTitle>
            <DialogDescription>
              已为「{createdCoachName}」创建档案，可在此代上传证书，或跳过直接完成。
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <AdminCertificationUploader coachId={createdCoachId} />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { resetAll(); onClose(); }}>
              跳过，稍后再补
            </Button>
            <Button onClick={() => { resetAll(); onClose(); }}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>手动录入教练 · 第 1 步</DialogTitle>
          <DialogDescription>
            管理员直接创建教练档案，可选「直接通过」或「列入待审核」；下一步可补充证书
          </DialogDescription>
        </DialogHeader>

        {draftRestored && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>已恢复上次未完成的草稿</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-amber-800 hover:bg-amber-100"
              onClick={handleClearDraft}
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              清空草稿
            </Button>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* AI 智能粘贴 */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              智能粘贴（推荐）
            </div>
            <p className="text-xs text-muted-foreground">
              粘贴教练简历 / 朋友圈介绍 / 微信资料，AI 会自动识别姓名、手机号、头衔、年限、专长、简介
            </p>
            <Textarea
              rows={3}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例如：张敏，13800001111，国家二级心理咨询师，10 年经验，擅长亲子关系、情绪管理..."
              disabled={parsing}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleAIParse}
                disabled={parsing || !pasteText.trim()}
              >
                {parsing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                )}
                AI 识别填充
              </Button>
            </div>
          </div>

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
              placeholder="例如:高级心理咨询师"
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
            提示：草稿会自动保存，关闭弹窗后再次打开可继续填写；提交成功后会自动清除。头像可在教练编辑入口补充。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            关闭
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            提交并下一步
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
