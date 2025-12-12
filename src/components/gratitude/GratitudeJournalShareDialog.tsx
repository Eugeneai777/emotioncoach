import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface GratitudeJournalShareDialogProps {
  trigger?: React.ReactNode;
}

export const GratitudeJournalShareDialog = ({ trigger }: GratitudeJournalShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/gratitude-journal-intro`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = "感恩日记-分享海报.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("海报已保存");
    } catch {
      toast.error("生成海报失败");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">分享感恩日记</DialogTitle>
        </DialogHeader>

        {/* Share Poster Preview */}
        <div 
          ref={posterRef}
          className="bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 space-y-4"
        >
          <div className="text-center space-y-2">
            <div className="text-4xl">📔</div>
            <h3 className="text-lg font-bold text-teal-900">我的感恩日记</h3>
            <p className="text-sm text-teal-700">每天1分钟，看见幸福的力量</p>
          </div>

          <div className="bg-white/60 backdrop-blur rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-teal-600">
              <Sparkles className="w-3.5 h-3.5" />
              核心价值
            </div>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>✨ 7维度幸福分析</li>
              <li>✨ AI自动生成报告</li>
              <li>✨ 每天只需1分钟</li>
              <li>✨ 科学验证有效</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-xs text-teal-600">扫码开始记录</p>
            <div className="mt-2 inline-block bg-white p-2 rounded-lg">
              <div className="w-20 h-20 bg-teal-100 rounded flex items-center justify-center">
                <span className="text-teal-400 text-xs">二维码</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "已复制" : "复制链接"}
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={handleDownloadPoster}
            disabled={generating}
          >
            <Download className="w-4 h-4" />
            {generating ? "生成中..." : "保存海报"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
