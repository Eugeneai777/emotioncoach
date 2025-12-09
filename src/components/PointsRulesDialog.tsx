import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PointsRulesCard } from "./PointsRulesCard";

interface PointsRulesDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PointsRulesDialog({ trigger, open, onOpenChange }: PointsRulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            ⚡ 点数使用规则
          </DialogTitle>
        </DialogHeader>
        <PointsRulesCard mode="detailed" />
      </DialogContent>
    </Dialog>
  );
}
