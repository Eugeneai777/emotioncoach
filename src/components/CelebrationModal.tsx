import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles } from "lucide-react";

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalType: "weekly" | "monthly";
  achievementName?: string;
}

const CelebrationModal = ({ open, onOpenChange, goalType, achievementName }: CelebrationModalProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (open) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1,
      }));
      setConfetti(particles);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-primary rounded-full animate-fall"
              style={{
                left: `${particle.left}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Trophy className="w-20 h-20 text-primary opacity-20" />
            </div>
            <Trophy className="w-20 h-20 text-primary animate-bounce" />
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2 justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
              恭喜你！
              <Sparkles className="w-6 h-6 text-primary" />
            </h2>
            <p className="text-lg text-muted-foreground">
              你完成了{goalType === "weekly" ? "本周" : "本月"}的情绪管理目标
            </p>
          </div>

          {achievementName && (
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Badge className="text-sm px-4 py-1.5 bg-primary hover:bg-primary">
                🏆 新徽章解锁
              </Badge>
              <p className="text-sm font-medium text-foreground">{achievementName}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            你的坚持和努力值得被看见 🌿
            <br />
            继续保持这份对自己的关爱
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationModal;
