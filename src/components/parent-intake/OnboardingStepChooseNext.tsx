import { motion } from "framer-motion";
import { Tent, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStepChooseNextProps {
  onStartCamp: () => void;
  onStartChat: () => void;
}

export const OnboardingStepChooseNext = ({
  onStartCamp,
  onStartChat,
}: OnboardingStepChooseNextProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-4xl mb-3"
        >
          🎯
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          选择你的下一步
        </h2>
        <p className="text-muted-foreground text-sm">
          两条路都可以帮助你，选择更适合现在的你
        </p>
      </div>

      {/* Two Options */}
      <div className="space-y-4">
        {/* Option 1: Start Camp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onStartCamp}
            className="w-full h-auto p-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Tent className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">开启21天训练营</span>
            </div>
            <p className="text-sm text-white/90 ml-13 pl-13">
              想要系统提升 · 愿意每天花15分钟
            </p>
            <p className="text-xs text-white/70 mt-2 ml-13 pl-13">
              "21天后，你会看到明显的改变"
            </p>
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">或者</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2: Start Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={onStartChat}
            variant="outline"
            className="w-full h-auto p-5 rounded-2xl flex flex-col items-start text-left border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-bold text-lg text-foreground">先和教练聊聊</span>
            </div>
            <p className="text-sm text-muted-foreground">
              有紧急问题想倾诉 · 想先体验一下
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              "没有压力，聊完再决定要不要加入训练营"
            </p>
          </Button>
        </motion.div>
      </div>

      {/* Bottom Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-muted-foreground mt-5"
      >
        💡 无论选择哪条路，亲子教练都会陪伴你
      </motion.p>
    </div>
  );
};
