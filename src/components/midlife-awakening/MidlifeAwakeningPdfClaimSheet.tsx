import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import MidlifeAwakeningPdfClaimCard from "./MidlifeAwakeningPdfClaimCard";
import { generateCardBlob } from "@/utils/shareCardConfig";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import type { MidlifeDimensionScore, MidlifePersonalityType } from "./midlifeAwakeningData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimCode?: string | null;
  loadingCode?: boolean;
  displayName?: string;
  avatarUrl?: string;
  personalityType: MidlifePersonalityType;
  dimensions: MidlifeDimensionScore[];
  internalFrictionRisk: number;
  actionPower: number;
  missionClarity: number;
  weakestDimensionLabel?: string;
}

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

export function MidlifeAwakeningPdfClaimSheet({
  open,
  onOpenChange,
  claimCode,
  loadingCode,
  displayName,
  avatarUrl,
  personalityType,
  dimensions,
  internalFrictionRisk,
  actionPower,
  missionClarity,
  weakestDimensionLabel,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [safeAvatar, setSafeAvatar] = useState<string | undefined>(undefined);
  const cacheRef = useRef<{ key: string; url: string } | null>(null);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isWeChatLike = /MicroMessenger/i.test(ua);

  useEffect(() => {
    if (!open || !claimCode) return;
    const cacheKey = `${claimCode}::${actionPower}::${missionClarity}`;
    if (cacheRef.current?.key === cacheKey) {
      setPreviewUrl(cacheRef.current.url);
      return;
    }

    let cancelled = false;
    (async () => {
      setGenerating(true);
      setPreviewUrl(null);
      try {
        const okAvatar = await safePreloadAvatar(avatarUrl);
        if (cancelled) return;
        setSafeAvatar(okAvatar);
        await nextFrame();
        if (cancelled) return;
        const blob = await generateCardBlob(cardRef, { forceScale: 1.6 });
        if (cancelled) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          if (cacheRef.current?.url) {
            try { URL.revokeObjectURL(cacheRef.current.url); } catch {}
          }
          cacheRef.current = { key: cacheKey, url };
          setPreviewUrl(url);
        }
      } catch (e) {
        console.error("[Midlife-ClaimSheet] preview gen failed", e);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, claimCode, avatarUrl, actionPower, missionClarity]);

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
      toast.error("复制失败，请手动选中复制");
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
    a.download = `中场觉醒专属凭证_${claimCode || "code"}.png`;
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
              🎁 领取你的专属 7 天伴随手册 PDF
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-6 space-y-4">
          <ol className="space-y-2 text-sm text-foreground/85 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900">
            <li className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">1.</span>
              <span>截图保存下方「专属凭证」</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">2.</span>
              <span>长按识别二维码 · 添加 顾问 企微</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-amber-600 shrink-0">3.</span>
              <span>把「截图 + 领取码」发给顾问，<b>24 小时内</b>收到完整 PDF + 1 次 1v1 解读</span>
            </li>
          </ol>

          <div className="rounded-xl bg-muted/30 p-3 relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="你的专属凭证"
                className="w-full rounded-lg shadow-md transition-opacity duration-300"
              />
            ) : (
              <ClaimSkeleton claimCode={claimCode} loading={!!(loadingCode || generating)} />
            )}
            {isWeChatLike && previewUrl && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                💡 长按上方图片 → 保存到相册
              </p>
            )}
          </div>

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
              className="h-11 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-zinc-50"
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
                  {formatClaimCode(claimCode)}
                </span>
              </span>
            </div>
          )}
        </div>

        <div style={{ position: "fixed", left: -99999, top: 0 }}>
          <MidlifeAwakeningPdfClaimCard
            ref={cardRef}
            claimCode={claimCode}
            displayName={displayName}
            avatarUrl={safeAvatar}
            personalityType={personalityType}
            dimensions={dimensions}
            internalFrictionRisk={internalFrictionRisk}
            actionPower={actionPower}
            missionClarity={missionClarity}
            weakestDimensionLabel={weakestDimensionLabel}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ClaimSkeleton({ claimCode, loading }: { claimCode?: string | null; loading: boolean }) {
  return (
    <div
      className="w-full aspect-[3/4] rounded-lg overflow-hidden flex flex-col items-center justify-center px-6 relative"
      style={{
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #1e1b4b 100%)",
        color: "#e0e7ff",
      }}
    >
      <div className="text-amber-400 text-xs tracking-widest mb-2 font-semibold">⚡ 中场觉醒 · 私密评估</div>
      <div className="text-[11px] text-indigo-300/70 mb-6">PRIVATE · 仅供本人</div>
      <div className="text-[11px] text-amber-300/70 mb-2 tracking-wider">━ 你的专属领取码 ━</div>
      <div
        className="font-mono font-extrabold tracking-[0.3em] text-4xl mb-3"
        style={{
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {formatClaimCode(claimCode) || "— —"}
      </div>
      <div className="text-amber-200 text-[11px]">🔒 仅限本人凭码领取 · 24 小时内送达</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-indigo-300/60">
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>高清凭证生成中…</span>
      </div>
    </div>
  );
}
