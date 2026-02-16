import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CalendarDays, MessageCircleHeart, Sparkles } from "lucide-react";
import { getPatternConfig } from "@/config/reactionPatternConfig";
import { fourPoorRichConfig } from "@/config/fourPoorConfig";
import qrCode from "@/assets/wealth-advisor-qrcode.jpg";

interface PostCallAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactionPattern: string;
  dominantPoor: string;
}

const painPointCopy: Record<string, string> = {
  harmony: "你的和谐型模式虽然稳定，但仍有巨大的上升空间",
  chase: "你的追逐型模式，越用力越推远，需要专业校准",
  avoid: "你的逃避型模式，靠自己很难突破那道心墙",
  trauma: "你的创伤型模式，需要安全的专业陪伴才能疗愈",
};

export function PostCallAdvisorDialog({ open, onOpenChange, reactionPattern, dominantPoor }: PostCallAdvisorDialogProps) {
  const patternConfig = getPatternConfig(reactionPattern);
  const poorConfig = fourPoorRichConfig[dominantPoor];

  const patternName = patternConfig?.name || "你的反应模式";
  const poorName = poorConfig?.poorName || "财富卡点";
  const normalizedKey = patternConfig?.key || reactionPattern;
  const painText = painPointCopy[normalizedKey] || "你的财富模式，需要专业引导来突破";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton={false} className="p-0 border-0 bg-transparent shadow-none sm:max-w-md">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1045] via-[#2d1b69] to-[#1a0e3a] p-5">
          {/* Decorative sparkles */}
          <div className="absolute top-3 right-3 text-amber-300/40">
            <Sparkles className="w-5 h-5" />
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <p className="text-amber-300 text-lg font-bold mb-1">🎉 教练对话完成！</p>
            <p className="text-white/70 text-sm">想要更深入的突破？添加专属顾问</p>
          </div>

          {/* Personalized pain point */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/10">
            <p className="text-white/90 text-sm text-center leading-relaxed">
              你的<span className="text-amber-300 font-semibold">【{poorName}】</span>卡点 +
              <span className="text-amber-300 font-semibold">【{patternName}】</span>模式
            </p>
            <p className="text-white/70 text-xs text-center mt-1">{painText}</p>
          </div>

          {/* Two value propositions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">7天觉醒路径</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">根据你的测评结果<br/>定制专属觉醒方案</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <MessageCircleHeart className="w-4 h-4 text-white" />
              </div>
              <p className="text-white font-semibold text-sm">随时觉醒对话</p>
              <p className="text-white/60 text-[11px] mt-1 leading-snug">顾问随时在线<br/>陪你突破每一个卡点</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-xl p-2.5 shadow-lg shadow-black/20">
              <img
                src={qrCode}
                alt="扫码添加财富觉醒顾问"
                className="w-36 h-36 rounded-lg object-contain"
              />
            </div>
            <p className="text-amber-300 text-sm font-medium mt-3">
              👆 扫码添加顾问，开启觉醒之旅
            </p>
            <p className="text-white/40 text-[11px] mt-1.5">
              已有 2,680+ 人开启财富觉醒 · 免费
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
