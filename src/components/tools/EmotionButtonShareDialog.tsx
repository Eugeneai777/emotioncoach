import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmotionButtonShareCard from './EmotionButtonShareCard';

interface EmotionButtonShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerCode?: string;
}

const EmotionButtonShareDialog: React.FC<EmotionButtonShareDialogProps> = ({
  open,
  onOpenChange,
  partnerCode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerateImage = async () => {
    if (!exportRef.current) return;

    setIsGenerating(true);
    try {
      // 等待二维码生成
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      // 尝试使用系统分享
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '情绪按钮-分享卡片.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '情绪按钮 - 即时情绪稳定系统',
              text: '基于神经科学的即时情绪稳定系统，288条专业认知提醒，9种情绪场景覆盖'
            });
            toast({
              title: "分享成功",
              description: "图片已分享",
            });
            return;
          } catch (e) {
            // 用户取消分享或分享失败，继续下载
          }
        }
      }

      // 降级为下载
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '情绪按钮-分享卡片.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "图片已生成",
        description: "分享卡片已保存到本地",
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-600" />
            生成分享卡片
          </DialogTitle>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex justify-center overflow-hidden rounded-xl border border-teal-100 bg-gray-50">
          <div className="transform scale-[0.5] origin-top" style={{ marginBottom: '-50%' }}>
            <EmotionButtonShareCard partnerCode={partnerCode} />
          </div>
        </div>

        {/* 隐藏的导出用卡片 */}
        <div className="fixed left-[-9999px] top-0">
          <EmotionButtonShareCard ref={exportRef} partnerCode={partnerCode} />
        </div>

        {/* 操作按钮 */}
        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              生成分享图片
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          图片包含二维码，扫码可直接使用情绪按钮
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default EmotionButtonShareDialog;
