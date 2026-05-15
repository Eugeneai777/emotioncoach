import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import MaleVitalityPdfClaimCard from "./MaleVitalityPdfClaimCard";
import { generateCardBlob } from "@/utils/shareCardConfig";
import { formatClaimCode } from "@/utils/claimCodeUtils";


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

/**
 * 头像预解码 + 跨域降级，避免 html2canvas 阻塞
 * 1.5s 超时直接返回 undefined，海报走「首字母彩色块」兜底
 */
async function safePreloadAvatar(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok ? url : undefined);
    };
    img.crossOrigin = "anonymous";
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = url;
    setTimeout(() => finish(false), 1500);
  });
}

const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

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
  const [safeAvatar, setSafeAvatar] = useState<string | undefined>(undefined);

  // 缓存 { key, url } —— 同一 claimCode 二次打开瞬开
  const cacheRef = useRef<{ key: string; url: string } | null>(null);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isWeChatLike = /MicroMessenger/i.test(ua);

  // 自动生成预览图
  useEffect(() => {
    if (!open || !claimCode) return;
    const cacheKey = `${claimCode}::${statusPercent}`;

    // 命中缓存：瞬开
    if (cacheRef.current?.key === cacheKey) {
      setPreviewUrl(cacheRef.current.url);
      return;
    }

    let cancelled = false;
    (async () => {
      setGenerating(true);
      setPreviewUrl(null);
      try {
        // 1) 头像预解码 + 1.5s 超时降级
        const okAvatar = await safePreloadAvatar(avatarUrl);
        if (cancelled) return;
        setSafeAvatar(okAvatar);

        // 2) 等离屏 DOM 完成布局（双 RAF，比 setTimeout 更准更快）
        await nextFrame();
        if (cancelled) return;

        // 3) 截图：scale 1.6 平衡清晰度与速度（750 → 1200px）
        const blob = await generateCardBlob(cardRef, { forceScale: 1.6 });
        if (cancelled) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          // 释放上一张缓存
          if (cacheRef.current?.url) {
            try { URL.revokeObjectURL(cacheRef.current.url); } catch {}
          }
          cacheRef.current = { key: cacheKey, url };
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
    };
  }, [open, claimCode, avatarUrl, statusPercent]);

  // 卸载时统一释放
  useEffect(() => {
    return () => {
      if (cacheRef.current?.url) {
        try { URL.revokeObjectURL(cacheRef.current.url); } catch {}
        cacheRef.current = null;
      }
    };
  }, []);

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
              🎯 预约你的 1V1 顾问解读
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
              <span>把「截图 + 领取码」发给顾问,即可<b>预约 1V1 解读</b>,拆解认知盲区,拿到专属行动方案</span>
            </li>
          </ol>

          {/* 凭证预览 — 骨架屏即时反馈 */}
          <div className="rounded-xl bg-muted/30 p-3 relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="你的专属凭证"
                className="w-full rounded-lg shadow-md transition-opacity duration-300"
              />
            ) : (
              <ClaimSkeleton
                claimCode={claimCode}
                statusLabel={statusLabel}
                loading={loadingCode || generating}
              />
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
            avatarUrl={safeAvatar}
            statusPercent={statusPercent}
            statusLabel={statusLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** 凭证骨架屏：瞬时显示领取码，等待高清图期间消除空白感 */
function ClaimSkeleton({
  claimCode,
  statusLabel,
  loading,
}: {
  claimCode?: string | null;
  statusLabel: string;
  loading: boolean;
}) {
  return (
    <div
      className="w-full aspect-[3/4] rounded-lg overflow-hidden flex flex-col items-center justify-center px-6 text-white relative"
      style={{
        background:
          "linear-gradient(160deg, #0B1220 0%, #11192C 45%, #1A1030 100%)",
      }}
    >
      <div className="text-amber-400 text-xs tracking-widest mb-2">⚡ 男人有劲状态</div>
      <div className="text-[11px] text-white/60 mb-6">{statusLabel}</div>
      <div className="text-[11px] text-white/70 mb-2 tracking-wider">━ 你的领取码 ━</div>
      <div
        className="font-mono font-extrabold text-white tracking-[0.3em] text-4xl mb-3"
        style={{ textShadow: "0 2px 16px rgba(245,158,11,0.4)" }}
      >
        {formatClaimCode(claimCode) || "— —"}
      </div>
      <div className="text-amber-300 text-[11px]">🔒 仅限本人凭码领取 · 24 小时内送达</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-white/50">
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>高清凭证生成中…</span>
      </div>
    </div>
  );
}
