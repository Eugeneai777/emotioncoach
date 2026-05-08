import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  hideOnAnchorRef?: React.RefObject<HTMLElement>;
}

/**
 * 35+ 女性版底部 Sticky CTA — 「领取我的专属 PDF 报告」常驻入口
 */
export function EmotionHealthClaimStickyBar({ onClick, hideOnAnchorRef }: Props) {
  const [hidden, setHidden] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      try { (window as any).gtag?.("event", "eh_pdf_claim_sticky_view"); } catch {}
    }
  }, []);

  useEffect(() => {
    const el = hideOnAnchorRef?.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setHidden(e.isIntersecting);
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hideOnAnchorRef]);

  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0 z-30 transition-all duration-300",
        hidden ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"
      )}
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      <div
        className="mx-auto max-w-2xl px-4 pt-3 backdrop-blur-md bg-background/85 border-t border-rose-200/60 dark:border-rose-900/60"
        style={{ boxShadow: "0 -2px 16px rgba(244,114,182,0.12)" }}
      >
        <Button
          onClick={() => {
            try { (window as any).gtag?.("event", "eh_pdf_claim_sticky_clicked"); } catch {}
            onClick();
          }}
          className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white shadow-lg shadow-pink-500/25"
        >
          🎁 领取我的专属 PDF 报告
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-1.5">
          由 助教 亲自发送 · 24 小时内送达 · 含 1v1 解读建议
        </p>
      </div>
    </div>
  );
}
