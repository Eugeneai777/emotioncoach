import { motion } from "framer-motion";
import { CalendarDays, MessageCircleHeart, Sparkles, ChevronDown } from "lucide-react";
import { getPatternConfig } from "@/config/reactionPatternConfig";
import { fourPoorRichConfig } from "@/config/fourPoorConfig";
import qrCode from "@/assets/wealth-advisor-qrcode.jpg";

interface WealthAdvisorQRCardProps {
  reactionPattern: string;
  dominantPoor: string;
}

const painPointCopy: Record<string, string> = {
  harmony: "你的和谐型模式虽然稳定，但仍有巨大的上升空间",
  chase: "你的追逐型模式，越用力越推远，需要专业校准",
  avoid: "你的逃避型模式，靠自己很难突破那道心墙",
  trauma: "你的创伤型模式，需要安全的专业陪伴才能疗愈",
};

export function WealthAdvisorQRCard({ reactionPattern, dominantPoor }: WealthAdvisorQRCardProps) {
  const patternConfig = getPatternConfig(reactionPattern);
  const poorConfig = fourPoorRichConfig[dominantPoor];

  const patternName = patternConfig?.name || "你的反应模式";
  const poorName = poorConfig?.poorName || "财富卡点";
  const normalizedKey = patternConfig?.key || reactionPattern;
  const painText = painPointCopy[normalizedKey] || "你的财富模式，需要专业引导来突破";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      className="relative"
    >
      {/* Enhanced pulse glow border */}
      <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-amber-400/70 via-violet-500/70 to-amber-400/70 animate-pulse blur-md" />
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-violet-500/80 via-amber-400/80 to-violet-500/80 animate-pulse blur-sm" />

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1045] via-[#2d1b69] to-[#1a0e3a] p-5 sm:p-6">
        {/* Starfield particles via pseudo-elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${5 + Math.random() * 90}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Decorative sparkles */}
        <div className="absolute top-3 right-3 text-amber-300/50">
          <Sparkles className="w-6 h-6" />
        </div>

        {/* Title - action-oriented with gradient text */}
        <div className="text-center mb-4">
          <p className="text-amber-300/80 text-xs tracking-widest mb-2">✦ 仅限测评用户 · 免费领取 ✦</p>
          <h3 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent leading-tight">
            立即获得你的专属觉醒方案
          </h3>
        </div>

        {/* Personalized pain point */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/10">
          <p className="text-white/90 text-sm text-center leading-relaxed">
            你的<span className="text-amber-300 font-semibold">【{poorName}】</span>卡点 +
            <span className="text-amber-300 font-semibold">【{patternName}】</span>模式
          </p>
          <p className="text-white/70 text-xs text-center mt-1">{painText}</p>
          <p className="text-amber-400 text-xs text-center mt-1.5 font-semibold">⚡ 现在就有机会改变</p>
        </div>

        {/* Two value propositions - enhanced */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-amber-400/30 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent" />
            <div className="relative">
              <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold text-sm">7天定制觉醒路径</p>
              <p className="text-amber-300 text-[11px] mt-1 font-semibold">📋 马上获得</p>
              <p className="text-white/50 text-[10px] mt-0.5 leading-snug">根据你的测评结果<br/>定制专属觉醒方案</p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-violet-400/30 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 to-transparent" />
            <div className="relative">
              <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <MessageCircleHeart className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold text-sm">1对1随时觉醒对话</p>
              <p className="text-violet-300 text-[11px] mt-1 font-semibold">💬 不限次数</p>
              <p className="text-white/50 text-[10px] mt-0.5 leading-snug">顾问随时在线<br/>陪你突破每一个卡点</p>
            </div>
          </motion.div>
        </div>

        {/* QR Code - maximized CTA */}
        <div className="flex flex-col items-center">
          {/* Bouncing arrow */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-amber-300 mb-1"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>

          <div className="bg-white rounded-xl p-3 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40">
            <img
              src={qrCode}
              alt="扫码添加财富觉醒顾问"
              className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg object-contain"
            />
          </div>

          {/* Pulsing CTA text */}
          <motion.p
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-amber-300 text-base sm:text-lg font-bold mt-3"
          >
            👆 长按识别，马上领取
          </motion.p>
          <p className="text-white/50 text-xs mt-1.5">
            已有 <span className="text-amber-300/80 font-semibold">3,200+</span> 人领取 · 免费
          </p>
        </div>
      </div>
    </motion.div>
  );
}
