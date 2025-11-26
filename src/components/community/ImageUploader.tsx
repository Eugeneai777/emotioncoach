import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ImageUploaderProps {
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

const ImageUploader = ({
  imageUrls,
  onImagesChange,
  maxImages = 9,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > maxImages) {
      toast({
        title: `最多只能上传${maxImages}张图片`,
        variant: "destructive",
      });
      return;
    }

    if (!session?.user) {
      toast({
        title: "请先登录",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 检查文件大小（最大5MB）
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "图片过大",
            description: `${file.name} 超过5MB限制`,
            variant: "destructive",
          });
          continue;
        }

        // 检查文件类型
        if (!file.type.startsWith("image/")) {
          toast({
            title: "文件类型错误",
            description: `${file.name} 不是图片文件`,
            variant: "destructive",
          });
          continue;
        }

        // 生成唯一文件名
        const fileExt = file.name.split(".").pop();
        const fileName = `${session.user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        // 上传到 Supabase Storage
        const { data, error } = await supabase.storage
          .from("community-images")
          .upload(fileName, file);

        if (error) throw error;

        // 获取公开 URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("community-images").getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      onImagesChange([...imageUrls, ...uploadedUrls]);

      toast({
        title: "上传成功",
        description: `已上传 ${uploadedUrls.length} 张图片`,
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
      e.target.value = ""; // 重置 input
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    onImagesChange(newUrls);
  };

  return (
    <div className="space-y-3">
      {/* 图片预览 */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`上传的图片 ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {imageUrls.length < maxImages && (
        <div>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    选择图片（{imageUrls.length}/{maxImages}）
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
