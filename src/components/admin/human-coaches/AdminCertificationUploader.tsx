import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Upload,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminCertificationUploaderProps {
  coachId: string;
  /** 父组件已审阅勾选回调（待审核流程）；不传则不渲染勾选框 */
  reviewedCertIds?: Set<string>;
  onToggleReviewed?: (id: string, checked: boolean) => void;
  /** 失效时回调（用于刷新父组件查询） */
  onChange?: () => void;
}

type CertRow = {
  id: string;
  coach_id: string;
  cert_name: string;
  cert_type: string;
  cert_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  image_url: string | null;
  verification_status: string | null;
  admin_note: string | null;
};

const CERT_TYPES = [
  { value: "psychology", label: "心理咨询师" },
  { value: "coaching", label: "教练认证" },
  { value: "counseling", label: "咨询师" },
  { value: "training", label: "专业培训" },
  { value: "education", label: "学历/学位" },
  { value: "other", label: "其他" },
];

const emptyForm = {
  cert_name: "",
  cert_type: "other",
  cert_number: "",
  issuing_authority: "",
  issue_date: "",
  image_url: "",
};

const compressImage = (file: File, maxSize = 1600): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const r = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("压缩失败"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

async function uploadCertImage(coachId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 10 * 1024 * 1024) throw new Error("图片不能超过 10MB");
  const blob = await compressImage(file);
  const path = `certifications/${coachId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("community-images")
    .upload(path, blob, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("community-images").getPublicUrl(path);
  return data.publicUrl;
}

export function AdminCertificationUploader({
  coachId,
  reviewedCertIds,
  onToggleReviewed,
  onChange,
}: AdminCertificationUploaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const replaceInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["admin-coach-certs", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_certifications")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CertRow[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-coach-certs", coachId] });
    queryClient.invalidateQueries({ queryKey: ["human-coach-detail", coachId] });
    queryClient.invalidateQueries({ queryKey: ["human-coach-edit", coachId] });
    queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
    queryClient.invalidateQueries({ queryKey: ["coach-applications"] });
    queryClient.invalidateQueries({ queryKey: ["approved-coaches"] });
    onChange?.();
  };

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setAdding(true);
  };

  const openEdit = (cert: CertRow) => {
    setForm({
      cert_name: cert.cert_name || "",
      cert_type: cert.cert_type || "other",
      cert_number: cert.cert_number || "",
      issuing_authority: cert.issuing_authority || "",
      issue_date: cert.issue_date || "",
      image_url: cert.image_url || "",
    });
    setEditingId(cert.id);
    setAdding(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setAdding(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleNewImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingNew(true);
    try {
      const url = await uploadCertImage(coachId, file);
      setForm((p) => ({ ...p, image_url: url }));
      toast.success("图片已上传");
    } catch (err: any) {
      toast.error(err?.message || "上传失败");
    } finally {
      setUploadingNew(false);
    }
  };

  const handleReplaceImage = async (
    cert: CertRow,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReplacingId(cert.id);
    try {
      const url = await uploadCertImage(coachId, file);
      const { data, error } = await supabase
        .from("coach_certifications")
        .update({ image_url: url })
        .eq("id", cert.id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("无权限或记录不存在");
      toast.success("图片已替换");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "替换失败");
    } finally {
      setReplacingId(null);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    const name = form.cert_name.trim();
    if (!name) {
      toast.error("请填写证书名称");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("coach_certifications")
          .update({
            cert_name: name,
            cert_type: form.cert_type,
            cert_number: form.cert_number.trim() || null,
            issuing_authority: form.issuing_authority.trim() || null,
            issue_date: form.issue_date || null,
            image_url: form.image_url || null,
          })
          .eq("id", editingId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("无权限或记录不存在");
        toast.success("证书已更新");
      } else {
        const { error } = await supabase.from("coach_certifications").insert({
          coach_id: coachId,
          cert_name: name,
          cert_type: form.cert_type,
          cert_number: form.cert_number.trim() || null,
          issuing_authority: form.issuing_authority.trim() || null,
          issue_date: form.issue_date || null,
          image_url: form.image_url || null,
          verification_status: "verified",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          admin_note: "管理员代上传",
        });
        if (error) throw error;
        toast.success("证书已新增");
      }
      refresh();
      closeForm();
    } catch (err: any) {
      toast.error(err?.message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("coach_certifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("证书已删除");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "加载中…" : `共 ${certs.length} 张证书`}
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1">
          <Plus className="h-4 w-4" />
          替学员上传证书
        </Button>
      </div>

      {certs.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {cert.image_url ? (
                <a
                  href={cert.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-20 h-20 rounded bg-muted overflow-hidden shrink-0 hover:opacity-80"
                >
                  <img
                    src={cert.image_url}
                    alt={cert.cert_name}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <div className="w-20 h-20 rounded bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0 text-sm space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{cert.cert_name}</span>
                  {cert.verification_status === "verified" && (
                    <Badge className="bg-green-500 text-white">已验证</Badge>
                  )}
                  {cert.verification_status === "pending" && (
                    <Badge variant="secondary">待验证</Badge>
                  )}
                  {cert.verification_status === "rejected" && (
                    <Badge variant="destructive">无效</Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-xs space-y-0.5">
                  <div>类型：{cert.cert_type}</div>
                  {cert.cert_number && <div>编号：{cert.cert_number}</div>}
                  {cert.issuing_authority && (
                    <div>机构：{cert.issuing_authority}</div>
                  )}
                  {cert.admin_note && (
                    <div className="italic">备注：{cert.admin_note}</div>
                  )}
                </div>
                {cert.image_url && (
                  <a
                    href={cert.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    查看大图
                  </a>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {onToggleReviewed && reviewedCertIds && (
                  <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                    <Checkbox
                      checked={reviewedCertIds.has(cert.id)}
                      onCheckedChange={(v) =>
                        onToggleReviewed(cert.id, !!v)
                      }
                    />
                    <span>已审阅</span>
                  </label>
                )}
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    title="替换图片"
                    onClick={() => replaceInputs.current[cert.id]?.click()}
                    disabled={replacingId === cert.id}
                  >
                    {replacingId === cert.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => (replaceInputs.current[cert.id] = el)}
                    onChange={(e) => handleReplaceImage(cert, e)}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    title="编辑"
                    onClick={() => openEdit(cert)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="删除"
                    onClick={() => {
                      if (window.confirm(`确认删除「${cert.cert_name}」？`)) {
                        handleDelete(cert.id);
                      }
                    }}
                    disabled={deletingId === cert.id}
                  >
                    {deletingId === cert.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {!isLoading && certs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            暂无证书，点击右上角「替学员上传证书」开始添加
          </CardContent>
        </Card>
      )}

      <Dialog open={adding} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "编辑证书" : "替学员新增证书"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>
                证书名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.cert_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cert_name: e.target.value }))
                }
                placeholder="例如：家庭教育指导师"
              />
            </div>

            <div className="space-y-1">
              <Label>类型</Label>
              <Select
                value={form.cert_type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, cert_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>证书编号</Label>
                <Input
                  value={form.cert_number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cert_number: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>颁发日期</Label>
                <Input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, issue_date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>颁发机构</Label>
              <Input
                value={form.issuing_authority}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    issuing_authority: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>证书图片</Label>
              {form.image_url ? (
                <div className="relative w-full h-40 bg-muted rounded overflow-hidden">
                  <img
                    src={form.image_url}
                    alt="证书"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-1 right-1 h-7 text-xs"
                    onClick={() =>
                      setForm((p) => ({ ...p, image_url: "" }))
                    }
                  >
                    移除
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-24 border border-dashed border-border rounded cursor-pointer hover:bg-muted/40 transition-colors">
                  {uploadingNew ? (
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> 上传中…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      点击上传证书图片
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNewImageUpload}
                    disabled={uploadingNew}
                  />
                </label>
              )}
            </div>

            {!editingId && (
              <p className="text-xs text-muted-foreground">
                管理员代上传的证书将自动标记为「已验证」，并记录管理员备注。
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeForm}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={submitting || uploadingNew}>
              {submitting && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {editingId ? "保存修改" : "新增证书"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
