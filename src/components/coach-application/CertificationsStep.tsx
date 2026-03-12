import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileCheck, Upload, X, Check, Lock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Certification {
  certType: string;
  certName: string;
  issuingAuthority: string;
  certNumber: string;
  imageUrl: string;
  description: string;
}

interface CertificationsStepProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  onNext: () => void;
  onBack: () => void;
  presetCertTypes?: string[];
}

const CERT_OPTIONS = [
  { value: "national_level2", label: "国家二级心理咨询师", category: "psychological_counselor" },
  { value: "national_level3", label: "国家三级心理咨询师", category: "psychological_counselor" },
  { value: "marriage_family", label: "婚姻家庭咨询师", category: "marriage_counselor" },
  { value: "sand_therapy", label: "沙盘治疗师", category: "training" },
  { value: "cbt_cert", label: "CBT 认知行为治疗认证", category: "training" },
  { value: "nlp_cert", label: "NLP 执行师认证", category: "training" },
  { value: "coaching_cert", label: "ICF 教练认证", category: "training" },
  { value: "eap_cert", label: "EAP 咨询师", category: "training" },
  { value: "psychology_degree", label: "心理学学位", category: "education" },
  { value: "education_degree", label: "教育学学位", category: "education" },
  { value: "social_work_cert", label: "社会工作师", category: "other" },
  { value: "mindfulness_cert", label: "正念导师认证", category: "training" },
];

export function CertificationsStep({
  data,
  onChange,
  onNext,
  onBack,
  presetCertTypes = [],
}: CertificationsStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [customCertName, setCustomCertName] = useState("");
  const { toast } = useToast();

  const isPreset = (certType: string) => presetCertTypes.includes(certType);
  const isSelected = (value: string) => data.some((c) => c.certType === value);

  const toggleCert = (option: (typeof CERT_OPTIONS)[0]) => {
    if (isPreset(option.value)) return; // Cannot toggle preset certs
    if (isSelected(option.value)) {
      onChange(data.filter((c) => c.certType !== option.value));
    } else {
      onChange([
        ...data,
        {
          certType: option.value,
          certName: option.label,
          issuingAuthority: "",
          certNumber: "",
          imageUrl: "",
          description: "",
        },
      ]);
    }
  };

  const addCustomCert = () => {
    const name = customCertName.trim();
    if (!name) return;
    const key = `custom_${Date.now()}`;
    onChange([
      ...data,
      {
        certType: key,
        certName: name,
        issuingAuthority: "",
        certNumber: "",
        imageUrl: "",
        description: "",
      },
    ]);
    setCustomCertName("");
  };

  const removeCert = (certType: string) => {
    if (isPreset(certType)) return;
    onChange(data.filter((c) => c.certType !== certType));
  };

  const updateCert = (certType: string, updates: Partial<Certification>) => {
    onChange(data.map((c) => (c.certType === certType ? { ...c, ...updates } : c)));
  };

  const handleImageUpload = async (
    certType: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }
    setUploading(certType);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cert-${Date.now()}.${fileExt}`;
      const filePath = `certifications/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);
      updateCert(certType, { imageUrl: urlData.publicUrl });
      toast({ title: "证书图片上传成功" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "上传失败，请重试", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const hasPresets = presetCertTypes.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">资质证书</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hasPresets
            ? "以下资质已由管理员预设，您还可以添加其他资质证书"
            : "选择您拥有的资质证书，可选择上传证书图片"}
        </p>
      </div>

      {/* Selectable cert options */}
      <div className="space-y-3">
        <Label>{hasPresets ? "资质证书（可继续添加）" : "选择您的资质（选填）"}</Label>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map((option) => {
            const preset = isPreset(option.value);
            const selected = isSelected(option.value);
            return (
              <Button
                key={option.value}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCert(option)}
                disabled={preset}
                className={`rounded-full min-h-[40px] px-4 ${preset ? "opacity-90" : ""}`}
              >
                {preset ? (
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                ) : selected ? (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                ) : null}
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom cert input */}
      <div className="flex gap-2">
        <Input
          placeholder="其他资质名称..."
          value={customCertName}
          onChange={(e) => setCustomCertName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustomCert()}
          maxLength={30}
        />
        <Button
          variant="outline"
          onClick={addCustomCert}
          disabled={!customCertName.trim()}
        >
          添加
        </Button>
      </div>

      {/* Selected certs - optional image upload */}
      {data.length > 0 && (
        <div className="space-y-3">
          <Label className="text-muted-foreground">已选择的资质（可选上传证书图片）</Label>
          {data.map((cert) => {
            const preset = isPreset(cert.certType);
            return (
              <Card key={cert.certType} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{cert.certName}</span>
                    {preset && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Lock className="h-2.5 w-2.5 mr-0.5" />
                        预设
                      </Badge>
                    )}
                  </div>
                  {!preset && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeCert(cert.certType)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {cert.imageUrl ? (
                  <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={cert.imageUrl}
                      alt="证书"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 right-1 h-7 text-xs"
                      onClick={() => updateCert(cert.certType, { imageUrl: "" })}
                    >
                      移除图片
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-16 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploading === cert.certType ? (
                      <span className="text-xs text-muted-foreground">上传中...</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        上传证书图片（选填）
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(cert.certType, e)}
                      disabled={uploading !== null}
                    />
                  </label>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {data.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂未选择资质证书（选填）</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button onClick={onNext} className="flex-1">
          下一步：确认提交
        </Button>
      </div>
    </div>
  );
}
