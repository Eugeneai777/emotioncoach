import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  /** 当原位 CTA / 页面底部锚点露出时自动隐藏，避免与正文按钮重复 */
  hideOnAnchorRef?: React.RefObject<HTMLElement>;
}

/**
 * 底部 Sticky CTA — 男版「领取完整 PDF 诊断报告」常驻入口
 * 使用 position:sticky（非 fixed），iOS / 微信 / 安卓 / PC 兼容稳定
 */
export function MaleVitalityClaimStickyBar({ onClick, hideOnAnchorRef }: Props) {
  const [hidden, setHidden] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      try { (window as any).gtag?.("event", "pdf_claim_sticky_view"); } catch {}
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
        className="mx-auto max-w-2xl px-4 pt-3 backdrop-blur-md bg-background/85 border-t border-border/60"
        style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}
      >
        <Button
          onClick={() => {
            try { (window as any).gtag?.("event", "pdf_claim_sticky_clicked"); } catch {}
            onClick();
          }}
          className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-gradient-to-r from-teal-700 to-amber-600 hover:from-teal-600 hover:to-amber-500 text-white shadow-lg shadow-teal-700/20"
        >
          📋 领取我的完整诊断报告（PDF）
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-1.5">
          由 有劲顾问 亲自发送 · 24 小时内送达 · 1v1 解读建议
        </p>
      </div>
    </div>
  );
}
