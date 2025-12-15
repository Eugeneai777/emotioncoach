import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarUploader({ 
  currentUrl, 
  onUpload, 
  size = "md",
  className 
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast({
        title: "请选择图片文件",
        variant: "destructive",
      });
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "图片大小不能超过5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // 压缩图片
      const compressedFile = await compressImage(file);
      
      // 生成唯一文件名
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 获取公共 URL
      const { data: urlData } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUpload(publicUrl);

      toast({
        title: "头像上传成功",
        description: "你的新头像已保存",
      });
    } catch (error) {
      console.error("上传失败:", error);
      toast({
        title: "上传失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // 压缩图片到 400x400
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        // 保持比例缩放
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("压缩失败"));
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
          <AvatarImage src={previewUrl || undefined} alt="头像" />
          <AvatarFallback className="bg-muted">
            <User className={cn(iconSizes[size], "text-muted-foreground")} />
          </AvatarFallback>
        </Avatar>
        
        {/* 上传按钮覆盖层 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "absolute inset-0 rounded-full flex items-center justify-center",
            "bg-black/40 opacity-0 hover:opacity-100 transition-opacity",
            "cursor-pointer disabled:cursor-not-allowed",
            uploading && "opacity-100"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            上传中...
          </>
        ) : (
          <>
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            {currentUrl ? "更换头像" : "上传头像"}
          </>
        )}
      </Button>
    </div>
  );
}
