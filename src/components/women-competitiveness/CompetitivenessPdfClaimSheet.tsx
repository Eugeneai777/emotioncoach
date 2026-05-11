import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import CompetitivenessPdfClaimCard from "./CompetitivenessPdfClaimCard";
import { generateCardBlob } from "@/utils/shareCardConfig";
import { formatClaimCode } from "@/utils/claimCodeUtils";
import type { CompetitivenessCategory } from "./competitivenessData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimCode?: string | null;
  loadingCode?: boolean;
  displayName?: string;
  avatarUrl?: string;
  totalScore: number;
  categoryScores: Record<CompetitivenessCategory, number>;
  weakestCategory: CompetitivenessCategory;
  strongestCategory: CompetitivenessCategory;
  levelName?: string;
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

export function CompetitivenessPdfClaimSheet({
  open,
  onOpenChange,
  claimCode,
  loadingCode,
  displayName,
  avatarUrl,
  totalScore,
  categoryScores,
  weakestCategory,
  strongestCategory,
  levelName,
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
    const cacheKey = `${claimCode}::${totalScore}`;
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
        console.error("[Comp-ClaimSheet] preview gen failed", e);
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, claimCode, avatarUrl, totalScore]);

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
    a.download = `35+竞争力专属凭证_${claimCode || "code"}.png`;
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
          <ol className="space-y-2 text-sm text-foreground/85 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900">
            <li className="flex gap-2">
              <span className="font-bold text-pink-600 shrink-0">1.</span>
              <span>截图保存下方「专属凭证」</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-pink-600 shrink-0">2.</span>
              <span>长按识别二维码 · 添加 助教 企微</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-pink-600 shrink-0">3.</span>
              <span>把「截图 + 领取码」发给助教，<b>24 小时内</b>收到完整 PDF + 1 次 1v1 解读</span>
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
              className="h-11 gap-1.5 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700"
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
          <CompetitivenessPdfClaimCard
            ref={cardRef}
            claimCode={claimCode}
            displayName={displayName}
            avatarUrl={safeAvatar}
            totalScore={totalScore}
            categoryScores={categoryScores}
            weakestCategory={weakestCategory}
            strongestCategory={strongestCategory}
            levelName={levelName}
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
          "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #fae8ff 60%, #f5d0fe 100%)",
        color: "#3b0764",
      }}
    >
      <div className="text-pink-600 text-xs tracking-widest mb-2 font-semibold">🌸 35+ 「她」专属筹码盘</div>
      <div className="text-[11px] text-fuchsia-700/70 mb-6">PRIVATE · 仅供本人</div>
      <div className="text-[11px] text-fuchsia-800/70 mb-2 tracking-wider">━ 你的专属领取码 ━</div>
      <div
        className="font-mono font-extrabold tracking-[0.3em] text-4xl mb-3"
        style={{
          background: "linear-gradient(135deg, #ec4899 0%, #c026d3 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {formatClaimCode(claimCode) || "— —"}
      </div>
      <div className="text-pink-700 text-[11px]">🔒 仅限本人凭码领取 · 24 小时内送达</div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-fuchsia-700/60">
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>高清凭证生成中…</span>
      </div>
    </div>
  );
}
