import React from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface AssessmentOption {
  emoji: string;
  title: string;
  sub: string;
  route: string;
  price: string;
}

interface AssessmentPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessments: AssessmentOption[];
}

const AssessmentPickerSheet: React.FC<AssessmentPickerSheetProps> = ({
  open,
  onOpenChange,
  assessments,
}) => {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-5">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-bold text-center">
            选一个适合你的测评
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          {assessments.map((a) => (
            <button
              key={a.route}
              onClick={() => {
                onOpenChange(false);
                navigate(a.route);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted/80 active:scale-[0.98] transition-all text-left"
            >
              <span className="text-2xl shrink-0">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.sub}</p>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-bold dark:bg-orange-500/20 dark:text-orange-400">
                {a.price}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AssessmentPickerSheet;
