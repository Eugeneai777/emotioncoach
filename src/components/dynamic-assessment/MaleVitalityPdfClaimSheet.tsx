import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import MaleVitalityPdfClaimCard from "./MaleVitalityPdfClaimCard";
import { generateCardBlob } from "@/utils/shareCardConfig";


interface MaleVitalityPdfClaimSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimCode?: string | null;
  loadingCode?: boolean;
  displayName?: string;
  avatarUrl?: string;
  statusPercent: number;
  statusLabel: string;
}

export function MaleVitalityPdfClaimSheet({
  open,
  onOpenChange,
  claimCode,
  loadingCode,
  displayName,
  avatarUrl,
  statusPercent,
  statusLabel,
}: MaleVitalityPdfClaimSheetProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isWeChatLike = /MicroMessenger/i.test(ua);

  // 自动生成预览图（开 Sheet + 拿到码后）
  useEffect(() => {
    if (!open || !claimCode) return;
    let cancelled = false;
    let urlToRevoke: string | null = null;
    (async () => {
      setGenerating(true);
      try {
        // 等卡片渲染完成
        await new Promise((r) => setTimeout(r, 150));
        const blob = await generateCardBlob(cardRef, { forceScale: 2 });
        if (cancelled) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          urlToRevoke = url;
          setPreviewUrl(url);
        }
      } catch (e) {
        console.error("[ClaimSheet] preview gen failed", e);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [open, claimCode]);

  const handleCopyCode = async () => {
    if (!claimCode) return;
    try {
      await navigator.clipboard.writeText(claimCode);
      toast.success(`领取码已复制：${claimCode}`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = claimCode;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success(`领取码已复制：${claimCode}`);
      } catch {
        toast.error("复制失败，请手动选中复制");
      }
      document.body.removeChild(ta);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewUrl) {
      toast.error("图片还在生成中，请稍候");
      return;
    }
    if (isWeChatLike) {
      toast.message("长按下方图片即可保存到相册", { duration: 4000 });
      return;
    }
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `男人有劲领取凭证_${claimCode || "code"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("已保存到本地");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] overflow-y-auto p-0"
      >
        <div className="px-5 pt-5 pb-3">
          <SheetHeader>
            <SheetTitle className="text-left text-base">
              📋 领取你的专属诊断报告
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* 三步引导 */}
          <ol className="space-y-2 text-sm text-foreground/85 bg-muted/40 rounded-xl p-3">
            <li className="flex gap-2">
              <span className="font-bold text-primary shrink-0">1.</span>
              <span>截图保存下方「专属凭证」</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary shrink-0">2.</span>
              <span>长按识别二维码 · 添加 有劲顾问 微信</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary shrink-0">3.</span>
              <span>把「截图 + 领取码」发给顾问，<b>24 小时内</b>收到完整报告 + 1 次 1v1 解读建议</span>
            </li>
          </ol>

          {/* 凭证预览 */}
          <div className="rounded-xl bg-muted/30 p-3">
            {loadingCode || (generating && !previewUrl) ? (
              <div className="aspect-[3/4] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="你的专属凭证"
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center text-sm text-muted-foreground">
                凭证生成失败，请重试
              </div>
            )}
            {isWeChatLike && previewUrl && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                💡 长按上方图片 → 保存到相册
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-11 gap-1.5"
              onClick={handleCopyCode}
              disabled={!claimCode}
            >
              <Copy className="w-4 h-4" />
              复制领取码
            </Button>
            <Button
              className="h-11 gap-1.5"
              onClick={handleDownloadImage}
              disabled={!previewUrl}
            >
              <DownloadIcon className="w-4 h-4" />
              {isWeChatLike ? "长按图片保存" : "保存到本地"}
            </Button>
          </div>

          {claimCode && (
            <div className="text-center">
              <span className="inline-block text-xs text-muted-foreground">
                你的领取码：
                <span className="font-mono font-bold text-foreground tracking-widest ml-1">
                  {claimCode}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 离屏渲染海报（用于截图） */}
        <div style={{ position: "fixed", left: -99999, top: 0 }}>
          <MaleVitalityPdfClaimCard
            ref={cardRef}
            claimCode={claimCode}
            displayName={displayName}
            avatarUrl={avatarUrl}
            statusPercent={statusPercent}
            statusLabel={statusLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
