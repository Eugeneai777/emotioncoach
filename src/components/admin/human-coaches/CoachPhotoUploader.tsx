import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface CoachPhotoUploaderProps {
  currentUrl?: string | null;
  coachId: string;
  onUpload: (url: string) => void;
  className?: string;
}

const compressImage = (file: File, maxWidth = 800, maxHeight = 1067): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("压缩失败"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export function CoachPhotoUploader({
  currentUrl,
  coachId,
  onUpload,
  className,
}: CoachPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片大小不能超过10MB");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `${coachId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("coach-photos")
        .upload(fileName, compressed, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("coach-photos")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUpload(publicUrl);
      toast.success("照片上传成功");
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">教练照片（3:4）</label>
      <div
        className="relative w-32 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted"
        onClick={() => fileInputRef.current?.click()}
      >
        <AspectRatio ratio={3 / 4}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="教练照片"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
              uploading ? "opacity-100" : "opacity-0 hover:opacity-100"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </AspectRatio>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <p className="text-xs text-muted-foreground">点击上传或更换照片</p>
    </div>
  );
}
