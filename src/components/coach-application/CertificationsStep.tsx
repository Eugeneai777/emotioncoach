import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, X, Upload, FileCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Certification {
  certType: string;
  certName: string;
  issuingAuthority: string;
  certNumber: string;
  imageUrl: string;
}

interface CertificationsStepProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CERT_TYPES = [
  { value: "psychological_counselor", label: "心理咨询师" },
  { value: "marriage_counselor", label: "婚姻家庭咨询师" },
  { value: "education", label: "学历证书" },
  { value: "training", label: "培训证书" },
  { value: "other", label: "其他资质" },
];

export function CertificationsStep({
  data,
  onChange,
  onNext,
  onBack,
}: CertificationsStepProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const addCertification = () => {
    onChange([
      ...data,
      {
        certType: "psychological_counselor",
        certName: "",
        issuingAuthority: "",
        certNumber: "",
        imageUrl: "",
      },
    ]);
  };

  const removeCertification = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, updates: Partial<Certification>) => {
    onChange(data.map((cert, i) => (i === index ? { ...cert, ...updates } : cert)));
  };

  const handleImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "请选择图片文件", variant: "destructive" });
      return;
    }

    setUploading(index);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cert-${Date.now()}-${index}.${fileExt}`;
      const filePath = `certifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);

      updateCertification(index, { imageUrl: urlData.publicUrl });
      toast({ title: "证书图片上传成功" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "上传失败，请重试", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const isValid = data.length > 0 && data.every((cert) => cert.certName && cert.imageUrl);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">资质证书</h2>
        <p className="text-sm text-muted-foreground mt-1">
          上传您的专业资质证书，审核通过后将获得认证徽章
        </p>
      </div>

      <div className="space-y-4">
        {data.map((cert, index) => (
          <Card key={index} className="p-4 space-y-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeCertification(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>证书类型</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={cert.certType}
                  onChange={(e) =>
                    updateCertification(index, { certType: e.target.value })
                  }
                >
                  {CERT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>证书名称 *</Label>
                <Input
                  placeholder="如：二级心理咨询师"
                  value={cert.certName}
                  onChange={(e) =>
                    updateCertification(index, { certName: e.target.value })
                  }
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>颁发机构</Label>
                <Input
                  placeholder="颁发机构名称"
                  value={cert.issuingAuthority}
                  onChange={(e) =>
                    updateCertification(index, { issuingAuthority: e.target.value })
                  }
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>证书编号</Label>
                <Input
                  placeholder="证书编号（选填）"
                  value={cert.certNumber}
                  onChange={(e) =>
                    updateCertification(index, { certNumber: e.target.value })
                  }
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>证书图片 *</Label>
              {cert.imageUrl ? (
                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={cert.imageUrl}
                    alt="证书"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => updateCertification(index, { imageUrl: "" })}
                  >
                    重新上传
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploading === index ? (
                    <div className="text-sm text-muted-foreground">上传中...</div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        点击上传证书图片
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(index, e)}
                    disabled={uploading !== null}
                  />
                </label>
              )}
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={addCertification}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加资质证书
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>请添加至少一个资质证书</p>
          <p className="text-sm">资质证书将帮助用户了解您的专业背景</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          下一步：设置服务项目
        </Button>
      </div>
    </div>
  );
}
