import { useCallback, useEffect, useState } from "react";
import { Bug, BugOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutDebugToggleProps {
  routeKey: string;
}

const DEBUG_CLASS = "admin-layout-overflow-debug";
const DEBUG_ATTR = "data-admin-layout-debug";

function clearOverflowMarks() {
  document.querySelectorAll(`.${DEBUG_CLASS}`).forEach((el) => {
    el.classList.remove(DEBUG_CLASS);
    el.removeAttribute("data-layout-overflow");
    el.removeAttribute("title");
  });
}

export function AdminLayoutDebugToggle({ routeKey }: AdminLayoutDebugToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [overflowCount, setOverflowCount] = useState(0);

  const scanOverflow = useCallback(() => {
    clearOverflowMarks();

    if (!enabled) {
      setOverflowCount(0);
      return;
    }

    const main = document.querySelector("main[data-admin-main]");
    if (!main) return;

    const overflowing: HTMLElement[] = [];
    main.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.closest(`[${DEBUG_ATTR}]`)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      if (el.scrollWidth - el.clientWidth > 2) overflowing.push(el);
    });

    overflowing.forEach((el) => {
      const extra = Math.ceil(el.scrollWidth - el.clientWidth);
      el.classList.add(DEBUG_CLASS);
      el.setAttribute("data-layout-overflow", `横向溢出 ${extra}px`);
      el.setAttribute("title", `横向溢出 ${extra}px：scrollWidth ${el.scrollWidth}px / clientWidth ${el.clientWidth}px`);
    });
    setOverflowCount(overflowing.length);
  }, [enabled]);

  useEffect(() => {
    document.body.toggleAttribute("data-admin-overflow-debug", enabled);
    scanOverflow();

    if (!enabled) {
      return () => {
        document.body.removeAttribute("data-admin-overflow-debug");
        clearOverflowMarks();
      };
    }

    const main = document.querySelector("main[data-admin-main]");
    const observer = main ? new MutationObserver(() => window.requestAnimationFrame(scanOverflow)) : null;
    observer?.observe(main!, { childList: true, subtree: true, attributes: true, characterData: true });
    window.addEventListener("resize", scanOverflow);
    const timer = window.setTimeout(scanOverflow, 250);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", scanOverflow);
      window.clearTimeout(timer);
      document.body.removeAttribute("data-admin-overflow-debug");
      clearOverflowMarks();
    };
  }, [enabled, routeKey, scanOverflow]);

  return (
    <div className="ml-auto flex items-center gap-2" {...{ [DEBUG_ATTR]: "toolbar" }}>
      <style>{`
        body[data-admin-overflow-debug] main[data-admin-main] * {
          outline: 1px dashed hsl(var(--muted-foreground) / 0.18);
          outline-offset: -1px;
        }
        body[data-admin-overflow-debug] .${DEBUG_CLASS} {
          outline: 3px solid hsl(var(--destructive)) !important;
          outline-offset: -3px;
          box-shadow: inset 0 0 0 9999px hsl(var(--destructive) / 0.08), 0 0 0 2px hsl(var(--destructive) / 0.25) !important;
          background-image: repeating-linear-gradient(135deg, hsl(var(--destructive) / 0.12) 0 8px, transparent 8px 16px) !important;
        }
      `}</style>
      {enabled && (
        <span className="hidden sm:inline-flex rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
          溢出容器：{overflowCount}
        </span>
      )}
      <Button
        type="button"
        variant={enabled ? "destructive" : "outline"}
        size="sm"
        onClick={() => setEnabled((value) => !value)}
        className={cn("shrink-0", enabled && "shadow-sm")}
      >
        {enabled ? <BugOff /> : <Bug />}
        {enabled ? "退出布局调试" : "布局调试"}
      </Button>
    </div>
  );
}