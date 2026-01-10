import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardCheck, Tent, Handshake, ChevronRight, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WealthTrilogyCardProps {
  className?: string;
}

const trilogySteps = [
  {
    step: 1,
    emoji: "🔍",
    title: "检测",
    subtitle: "财富卡点测评",
    description: "30道题深度分析，找出隐藏的财富障碍",
    icon: ClipboardCheck,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50/90 to-violet-50/80 dark:from-purple-950/40 dark:to-violet-950/30",
    borderColor: "border-purple-200/60 dark:border-purple-800/40",
    route: "/wealth-block",
    badge: "推荐",
  },
  {
    step: 2,
    emoji: "✨",
    title: "觉醒",
    subtitle: "7天训练营",
    description: "AI教练 + 社群共振 + 每日实践",
    icon: Tent,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50/90 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30",
    borderColor: "border-amber-200/60 dark:border-amber-800/40",
    route: "/wealth-camp-intro",
  },
  {
    step: 3,
    emoji: "🚀",
    title: "升维",
    subtitle: "成为合伙人",
    description: "分发体验包，获得持续分成",
    icon: Handshake,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30",
    borderColor: "border-emerald-200/60 dark:border-emerald-800/40",
    route: "/partner/youjin-intro",
  },
];

export const WealthTrilogyCard = ({ className = "" }: WealthTrilogyCardProps) => {
  const navigate = useNavigate();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-amber-500">💰</span>
          财富觉醒 3 部曲
        </h3>
        <span className="text-xs text-muted-foreground">
          检测 → 觉醒 → 升维
        </span>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden space-y-2">
        {trilogySteps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <div key={step.step} className="relative">
              {/* Connection line */}
              {index < trilogySteps.length - 1 && (
                <div className="absolute left-5 top-full w-0.5 h-2 z-0">
                  <div className={`w-full h-full bg-gradient-to-b ${step.gradient} opacity-40`} />
                </div>
              )}

              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(step.route)}
              >
                <Card
                  className={`relative bg-gradient-to-br ${step.bgGradient} backdrop-blur border ${step.borderColor} overflow-hidden cursor-pointer transition-all hover:shadow-md`}
                >
                  {step.badge && (
                    <div className={`absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r ${step.gradient} text-white text-[10px] font-medium rounded-bl-lg`}>
                      {step.badge}
                    </div>
                  )}

                  <div className="p-3 flex items-center gap-3">
                    {/* Step Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md`}>
                      <span className="text-lg">{step.emoji}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                          Step {step.step}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{step.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="shrink-0 w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Cards */}
      <div className="hidden md:grid grid-cols-3 gap-3">
        {trilogySteps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <div key={step.step} className="relative">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(step.route)}
                className="h-full"
              >
                <Card
                  className={`h-full bg-gradient-to-br ${step.bgGradient} backdrop-blur border ${step.borderColor} overflow-hidden cursor-pointer transition-all hover:shadow-lg`}
                >
                  {step.badge && (
                    <div className={`absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r ${step.gradient} text-white text-[10px] font-medium rounded-bl-lg`}>
                      {step.badge}
                    </div>
                  )}

                  <div className="p-4 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md`}>
                        <span className="text-lg">{step.emoji}</span>
                      </div>
                      <div>
                        <span className={`text-xs font-bold bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                          Step {step.step}
                        </span>
                        <h4 className="text-base font-bold text-foreground">{step.title}</h4>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-muted-foreground mb-1">{step.subtitle}</p>
                    <p className="text-xs text-foreground/70 flex-1">{step.description}</p>

                    {/* Action hint */}
                    <div className={`flex items-center gap-1 mt-3 text-xs font-medium bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                      了解更多
                      <ChevronRight className="h-3 w-3 text-amber-500" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Connection arrow */}
              {index < trilogySteps.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <motion.div 
                    className={`w-4 h-4 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center shadow-sm`}
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
