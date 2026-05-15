import { useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  defaultOpen?: boolean;
}

/** 折叠"查看完整报告" — 包裹雷达图 + 状态表 + 维度详解 */
export function MaleVitalityFullReportCollapse({ children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">📊</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">查看完整诊断报告</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                雷达图 · 6 项状态详解 · 维度建议
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-border/40">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
