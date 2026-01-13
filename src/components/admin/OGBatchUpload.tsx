import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUpsertOGConfiguration } from "@/hooks/useOGConfigurations";
import { PAGE_OG_CONFIGS } from "@/config/ogConfig";

interface OGBatchUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productLine: string;
  pageKeys: string[];
}

export function OGBatchUpload({ open, onOpenChange, productLine, pageKeys }: OGBatchUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  
  const upsertConfig = useUpsertOGConfiguration();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error("请选择图片文件");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile?.type.startsWith('image/')) {
      toast.error("请选择图片文件");
      return;
    }
    
    setFile(droppedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(droppedFile);
  }, []);

  const resizeAndUpload = async (file: File, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas with target dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const targetWidth = 1200;
        const targetHeight = 630;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate cover dimensions (fill entire canvas, crop excess)
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > targetRatio) {
          // Image is wider - fit height, crop width
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller - fit width, crop height
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Draw the image with cover scaling
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('og-images')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'image/png',
            });

          if (uploadError) {
            reject(uploadError);
            return;
          }

          const { data } = supabase.storage
            .from('og-images')
            .getPublicUrl(fileName);

          resolve(data.publicUrl);
        }, 'image/png', 0.95);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleApply = async () => {
    if (!file) {
      toast.error("请先选择图片");
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: pageKeys.length });

    try {
      // Upload resized image once
      const fileName = `og-${productLine}-series-${Date.now()}.png`;
      const imageUrl = await resizeAndUpload(file, fileName);
      
      // Apply to all pages
      for (let i = 0; i < pageKeys.length; i++) {
        const pageKey = pageKeys[i];
        const defaultConfig = PAGE_OG_CONFIGS[pageKey as keyof typeof PAGE_OG_CONFIGS];
        
        await upsertConfig.mutateAsync({
          page_key: pageKey,
          title: defaultConfig?.title,
          og_title: defaultConfig?.ogTitle,
          description: defaultConfig?.description,
          image_url: imageUrl,
          url: defaultConfig?.url,
          site_name: defaultConfig?.siteName,
          is_active: true,
        });
        
        setProgress({ current: i + 1, total: pageKeys.length });
      }

      toast.success(`已成功应用到 ${pageKeys.length} 个页面`);
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      setProgress(null);
    } catch (error) {
      console.error('Batch upload error:', error);
      toast.error("批量上传失败: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            批量上传 OG 图片
          </DialogTitle>
          <DialogDescription>
            将图片应用到 <strong>{productLine}</strong> 系列 ({pageKeys.length} 个页面)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Page list */}
          <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">将应用到以下页面：</p>
            <div className="flex flex-wrap gap-1">
              {pageKeys.map(key => (
                <span key={key} className="text-xs bg-background px-2 py-0.5 rounded">
                  {key}
                </span>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              preview ? 'border-primary/50' : 'border-border hover:border-primary/30'
            }`}
          >
            {preview ? (
              <div className="space-y-3">
                <div className="relative aspect-[1200/630] bg-muted rounded overflow-hidden">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  预览 (自动调整为 1200×630，cover 模式)
                </p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  拖拽图片到此处，或点击选择
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 PNG、JPG、WebP
                </p>
              </label>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>正在应用...</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFile(null);
                setPreview(null);
              }}
              disabled={uploading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleApply}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  应用到 {pageKeys.length} 个页面
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
