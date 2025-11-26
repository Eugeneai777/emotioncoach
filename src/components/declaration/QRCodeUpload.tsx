import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface QRCodeUploadProps {
  onQRCodeChange: (qrCode: string | null, isGenerated: boolean) => void;
  currentQRCode: string | null;
}

export const QRCodeUpload = ({ onQRCodeChange, currentQRCode }: QRCodeUploadProps) => {
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "请上传小于5MB的图片",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onQRCodeChange(result, false);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQRCode = async () => {
    if (!url.trim()) {
      toast({
        title: "请输入网址",
        description: "需要输入有效的网址来生成二维码",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      onQRCodeChange(qrCodeDataUrl, true);
      toast({
        title: "二维码已生成",
        description: "已根据网址生成二维码",
      });
    } catch (error) {
      console.error("生成二维码失败:", error);
      toast({
        title: "生成失败",
        description: "请检查网址是否有效",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemove = () => {
    onQRCodeChange(null, false);
    setUrl("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs sm:text-sm font-semibold text-foreground">二维码设置</Label>
      
      {currentQRCode ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            已设置二维码
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="w-4 h-4 mr-1" />
            移除
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="输入网址生成二维码"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button
              onClick={generateQRCode}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <Link2 className="w-4 h-4 mr-1" />
              {isGenerating ? "生成中..." : "生成"}
            </Button>
          </div>
          
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="qr-upload"
            />
            <Label
              htmlFor="qr-upload"
              className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">或上传二维码图片</span>
            </Label>
          </div>
        </>
      )}
    </div>
  );
};

interface QRCodeRendererProps {
  value: string;
  isGenerated: boolean;
  size?: number;
}

export const QRCodeRenderer = ({ value, isGenerated, size = 70 }: QRCodeRendererProps) => {
  return (
    <div 
      className="bg-white p-1.5 rounded-lg shadow-md"
      style={{ width: size + 12, height: size + 12 }}
    >
      <img
        src={value}
        alt="QR Code"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
