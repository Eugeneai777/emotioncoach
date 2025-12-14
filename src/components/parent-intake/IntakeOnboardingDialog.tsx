import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { IntakeOnboardingFlow } from "./IntakeOnboardingFlow";

interface IntakeOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryType: string;
  secondaryType: string | null;
  onStartCamp: () => void;
  onStartChat: () => void;
}

export function IntakeOnboardingDialog({
  open,
  onOpenChange,
  primaryType,
  secondaryType,
  onStartCamp,
  onStartChat,
}: IntakeOnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
        <div className="p-6">
          <IntakeOnboardingFlow
            primaryType={primaryType}
            secondaryType={secondaryType}
            onStartCamp={() => {
              onOpenChange(false);
              onStartCamp();
            }}
            onStartChat={() => {
              onOpenChange(false);
              onStartChat();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
