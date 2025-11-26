import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Share2, MessageCircle } from "lucide-react";
import CampShareDialog from "./CampShareDialog";

interface CampCheckInSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campId: string;
  campName: string;
  campDay: number;
  briefingId?: string;
  emotionTheme?: string;
  emotionIntensity?: number;
  insight?: string;
  action?: string;
}

const CampCheckInSuccessDialog = ({
  open,
  onOpenChange,
  campId,
  campName,
  campDay,
  briefingId,
  emotionTheme,
  emotionIntensity,
  insight,
  action,
}: CampCheckInSuccessDialogProps) => {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      // Load confetti
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });
    }
  }, [open]);

  const handleShare = () => {
    onOpenChange(false);
    setShowShareDialog(true);
  };

  const handleContinue = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              🎉 打卡成功！
            </DialogTitle>
            <DialogDescription className="text-center">
              恭喜完成今日情绪日记练习
              <br />
              已连续打卡 <span className="text-primary font-semibold">{campDay}</span> 天
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleShare}
              className="w-full gap-2"
              size="lg"
            >
              <Share2 className="w-4 h-4" />
              分享到社区
            </Button>
            <Button
              variant="outline"
              onClick={handleContinue}
              className="w-full gap-2"
              size="lg"
            >
              <MessageCircle className="w-4 h-4" />
              继续对话
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            💡 分享每日反思，获得社区支持和鼓励
          </p>
        </DialogContent>
      </Dialog>

      <CampShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        campId={campId}
        campName={campName}
        campDay={campDay}
        briefingId={briefingId}
        emotionTheme={emotionTheme}
        emotionIntensity={emotionIntensity}
        insight={insight}
        action={action}
      />
    </>
  );
};

export default CampCheckInSuccessDialog;
