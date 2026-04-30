import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface WeChatPdfGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前测评结果记录 ID，用于拼接专属链接 */
  recordId?: string | null;
  /** 当前测评 key，用于拼接专属链接 */
  assessmentKey: string;
  /** 用户点"改为保存图片" */
  onSwitchToImage: () => void;
}

const EXTERNAL_DOMAIN = "https://wechat.eugenewe.net";

export function WeChatPdfGuideSheet({
  open,
  onOpenChange,
  recordId,
  assessmentKey,
  onSwitchToImage,
}: WeChatPdfGuideSheetProps) {
  const buildShareUrl = () => {
    const params = new URLSearchParams();
    if (recordId) params.set("recordId", recordId);
    params.set("autoSave", "pdf");
    return `${EXTERNAL_DOMAIN}/assessment/${assessmentKey}?${params.toString()}`;
  };

  const handleCopy = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制 · 请打开浏览器粘贴访问");
    } catch {
      // 降级：用临时 textarea
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("链接已复制 · 请打开浏览器粘贴访问");
      } catch {
        toast.error("复制失败，请手动长按下方链接复制");
      }
      document.body.removeChild(ta);
    }
  };

  const handleSwitch = () => {
    // 先切换路径，再关闭 Sheet（遵循 Component Reentrancy 规范）
    onSwitchToImage();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[88vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-left">📄 PDF 需在浏览器中打开</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            微信暂不支持直接保存 PDF 文件。请按以下任一方式打开：
          </p>

          {/* 方式一：复制链接 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </span>
              <span className="font-semibold text-sm">复制专属链接</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              复制后打开手机浏览器，粘贴访问即可，页面会自动定位到「保存 PDF」按钮。
            </p>
            <Button
              className="w-full gap-2 min-h-[44px]"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4" /> 复制专属链接
            </Button>
          </div>

          {/* 方式二：右上角菜单 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                2
              </span>
              <span className="font-semibold text-sm">右上角菜单 → 在浏览器打开</span>
            </div>
            <div className="flex items-center gap-3">
              {/* 静态 SVG 示意图 */}
              <svg width="64" height="42" viewBox="0 0 120 80" className="shrink-0">
                <rect x="2" y="2" width="116" height="76" rx="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" />
                <circle cx="100" cy="14" r="2" fill="hsl(var(--primary))" />
                <circle cx="106" cy="14" r="2" fill="hsl(var(--primary))" />
                <circle cx="112" cy="14" r="2" fill="hsl(var(--primary))" />
                <rect x="14" y="34" width="60" height="6" rx="2" fill="hsl(var(--border))" />
                <rect x="14" y="46" width="80" height="6" rx="2" fill="hsl(var(--border))" />
                <rect x="14" y="58" width="40" height="6" rx="2" fill="hsl(var(--border))" />
              </svg>
              <p className="text-xs text-muted-foreground leading-relaxed">
                点击屏幕<strong>右上角「···」</strong>，选择「<strong>在浏览器打开</strong>」，再点击保存 PDF。
              </p>
            </div>
          </div>

          {/* 兜底：改为保存图片 */}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-3 flex items-start gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>嫌麻烦？保存为图片更简单，长按图片即可存到相册。</span>
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 min-h-[44px]"
              onClick={handleSwitch}
            >
              <ImageIcon className="w-4 h-4" /> 改为保存图片（推荐）
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
