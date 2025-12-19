import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
];

export function BasicInfoStep({ data, onChange, onNext }: BasicInfoStepProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = data.specialties.includes(specialty)
      ? data.specialties.filter((s) => s !== specialty)
      : [...data.specialties, specialty];
    onChange({ ...data, specialties: newSpecialties });
  };

  const isValid =
    data.displayName.trim() &&
    data.phone.trim() &&
    data.bio.trim() &&
    data.specialties.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">基本信息</h2>
        <p className="text-sm text-muted-foreground mt-1">
          填写您的个人信息，让用户更好地了解您
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24">
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
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <span className="text-sm text-muted-foreground">
          {uploading ? "上传中..." : "点击上传头像"}
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">显示名称 *</Label>
          <Input
            id="displayName"
            placeholder="您的称呼，如：张老师"
            value={data.displayName}
            onChange={(e) => onChange({ ...data, displayName: e.target.value })}
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">联系电话 *</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="您的手机号码"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            maxLength={11}
            autoComplete="tel"
          />
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
          <Label htmlFor="bio">个人简介 *</Label>
          <Textarea
            id="bio"
            placeholder="介绍您的专业背景、咨询风格和经验..."
            value={data.bio}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            className="min-h-[100px]"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {data.bio.length}/500
          </p>
        </div>

        <div className="space-y-2">
          <Label>擅长领域 * (至少选择1个)</Label>
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
        </div>
      </div>

      <Button onClick={onNext} disabled={!isValid} className="w-full">
        下一步：上传资质证书
      </Button>
    </div>
  );
}
