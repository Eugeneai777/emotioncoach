import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Sparkles, Loader2, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BIO_TEMPLATE,
  BIO_MIN_LENGTH,
  BIO_MAX_LENGTH,
  validateBasicInfo,
} from "@/lib/coachApplicationTemplates";

interface BasicInfoData {
  displayName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  yearsExperience: number;
}

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  onNext: () => void;
}

const SPECIALTY_OPTIONS = [
  "情绪管理",
  "亲子关系",
  "婚姻家庭",
  "职场压力",
  "人际沟通",
  "个人成长",
  "焦虑抑郁",
  "青少年心理",
  "企业管理",
];

const Req = () => <span className="text-destructive ml-0.5">*</span>;

export function BasicInfoStep({ data, onChange, onNext }: BasicInfoStepProps) {
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const avatarRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const specRef = useRef<HTMLDivElement>(null);

  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `coach-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);
      onChange({ ...data, avatarUrl: urlData.publicUrl });
      toast({ title: "头像上传成功" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "上传失败，请重试", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleOptimizeBio = async () => {
    if (!data.bio.trim()) return;
    setOptimizing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-coach-application", {
        body: {
          action: "optimize_bio",
          displayName: data.displayName,
          specialties: data.specialties,
          yearsExperience: data.yearsExperience,
          bio: data.bio,
          structure_hint:
            "请保留 4 段式结构（专业背景 / 咨询风格 / 擅长人群与议题 / 我的承诺），输出中文，控制在 300 字内。",
        },
      });
      if (error) throw error;
      if (result?.result) {
        onChange({ ...data, bio: result.result });
        toast({ title: "简介优化成功" });
      }
    } catch (error) {
      console.error("Optimize bio error:", error);
      toast({ title: "优化失败，请重试", variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const handleInsertTemplate = () => {
    if (data.bio.trim() && !window.confirm("将覆盖当前简介内容，确定继续？")) return;
    onChange({ ...data, bio: BIO_TEMPLATE });
    markTouched("bio");
    setTimeout(() => bioRef.current?.focus(), 50);
  };

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = data.specialties.includes(specialty)
      ? data.specialties.filter((s) => s !== specialty)
      : [...data.specialties, specialty];
    onChange({ ...data, specialties: newSpecialties });
    markTouched("specialties");
  };

  const scrollToField = (field: string) => {
    const map: Record<string, React.RefObject<HTMLElement>> = {
      avatarUrl: avatarRef,
      displayName: nameRef,
      phone: phoneRef,
      bio: bioRef,
      specialties: specRef,
    };
    const ref = map[field];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      (ref.current as any).focus?.();
    }
  };

  const handleNext = () => {
    // 标记全部 touched，露出所有错误态
    setTouched({
      avatarUrl: true,
      displayName: true,
      phone: true,
      bio: true,
      specialties: true,
    });
    const err = validateBasicInfo({
      displayName: data.displayName,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      specialties: data.specialties,
    });
    if (err) {
      toast({ title: err.message, variant: "destructive" });
      scrollToField(err.field);
      return;
    }
    onNext();
  };

  const bioLen = data.bio.trim().length;
  const bioTooShort = touched.bio && bioLen > 0 && bioLen < BIO_MIN_LENGTH;
  const bioEmpty = touched.bio && bioLen === 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">基本信息</h2>
        <p className="text-sm text-muted-foreground mt-1">
          带 <span className="text-destructive">*</span> 为必填项
        </p>
      </div>

      {/* Avatar Upload */}
      <div ref={avatarRef} className="flex flex-col items-center gap-3" tabIndex={-1}>
        <div className="relative">
          <Avatar className={`h-24 w-24 ${touched.avatarUrl && !data.avatarUrl ? "ring-2 ring-destructive" : ""}`}>
            <AvatarImage src={data.avatarUrl} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="h-4 w-4 text-primary-foreground" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { markTouched("avatarUrl"); handleAvatarUpload(e); }}
              disabled={uploading}
            />
          </label>
        </div>
        <span className="text-sm text-muted-foreground">
          头像<Req />
          {uploading ? " 上传中..." : data.avatarUrl ? "（点击右下角可更换）" : "（点击上传）"}
        </span>
        {touched.avatarUrl && !data.avatarUrl && (
          <p className="text-xs text-destructive">请上传头像</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">显示名称<Req /></Label>
          <Input
            ref={nameRef}
            id="displayName"
            placeholder="您的称呼，如：张老师"
            value={data.displayName}
            onChange={(e) => onChange({ ...data, displayName: e.target.value })}
            onBlur={() => markTouched("displayName")}
            maxLength={20}
          />
          {touched.displayName && !data.displayName.trim() && (
            <p className="text-xs text-destructive">请填写显示名称</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">联系电话<Req /></Label>
          <Input
            ref={phoneRef}
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="11 位手机号"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            onBlur={() => markTouched("phone")}
            maxLength={11}
            autoComplete="tel"
          />
          {touched.phone && data.phone.trim() && !/^1[3-9]\d{9}$/.test(data.phone.trim()) && (
            <p className="text-xs text-destructive">请输入有效的 11 位手机号</p>
          )}
          {touched.phone && !data.phone.trim() && (
            <p className="text-xs text-destructive">请填写联系电话</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">从业年限</Label>
          <Input
            id="experience"
            type="number"
            inputMode="numeric"
            min={0}
            max={50}
            placeholder="从业年限"
            value={data.yearsExperience || ""}
            onChange={(e) =>
              onChange({ ...data, yearsExperience: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label htmlFor="bio">个人简介<Req /></Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleInsertTemplate}
                className="gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                插入模板
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOptimizeBio}
                disabled={!data.bio.trim() || optimizing}
                className="gap-1.5"
              >
                {optimizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {optimizing ? "优化中..." : "AI 优化"}
              </Button>
            </div>
          </div>
          <Textarea
            ref={bioRef}
            id="bio"
            placeholder={`建议按【专业背景】【咨询风格】【擅长人群与议题】【我的承诺】四段撰写，或点击右上方「插入模板」一键生成范例。\n至少 ${BIO_MIN_LENGTH} 字。`}
            value={data.bio}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            onBlur={() => markTouched("bio")}
            className="min-h-[160px]"
            maxLength={BIO_MAX_LENGTH}
          />
          <div className="flex items-center justify-between">
            {bioEmpty ? (
              <p className="text-xs text-destructive">请填写个人简介</p>
            ) : bioTooShort ? (
              <p className="text-xs text-destructive">至少 {BIO_MIN_LENGTH} 字</p>
            ) : (
              <span />
            )}
            <p className={`text-xs ${bioTooShort || bioEmpty ? "text-destructive" : "text-muted-foreground"}`}>
              {bioLen}/{BIO_MAX_LENGTH}（至少 {BIO_MIN_LENGTH} 字）
            </p>
          </div>
        </div>

        <div ref={specRef} className="space-y-2" tabIndex={-1}>
          <Label>擅长领域<Req /> (至少选择 1 个)</Label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((specialty) => (
              <Button
                key={specialty}
                type="button"
                variant={data.specialties.includes(specialty) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSpecialty(specialty)}
                className="rounded-full min-h-[40px] px-4"
              >
                {specialty}
              </Button>
            ))}
          </div>
          {touched.specialties && data.specialties.length === 0 && (
            <p className="text-xs text-destructive">请至少选择 1 个擅长领域</p>
          )}
        </div>
      </div>

      <Button onClick={handleNext} className="w-full">
        下一步：选择资质证书
      </Button>
    </div>
  );
}
