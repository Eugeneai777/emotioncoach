import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LifeCard, AwakeningDimension } from "@/config/awakeningConfig";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Lightbulb, Sparkles, Zap, Bell, MessageCircle, Wrench } from "lucide-react";

interface AwakeningLifeCardProps {
  lifeCard: LifeCard;
  dimension: AwakeningDimension;
  onContinueChat: () => void;
  onGetTool: () => void;
  onClose: () => void;
}

const AwakeningLifeCard: React.FC<AwakeningLifeCardProps> = ({
  lifeCard,
  dimension,
  onContinueChat,
  onGetTool,
  onClose
}) => {
  const sections = [
    {
      icon: Eye,
      label: '看见',
      content: lifeCard.seeing,
      delay: 0.1
    },
    {
      icon: Heart,
      label: '鼓励',
      content: lifeCard.encourage,
      delay: 0.2
    },
    {
      icon: Lightbulb,
      label: '盲点',
      content: lifeCard.blindSpot,
      delay: 0.3
    },
    {
      icon: Sparkles,
      label: '启发',
      content: lifeCard.insight,
      delay: 0.4
    },
    {
      icon: Zap,
      label: '微行动',
      content: lifeCard.microAction,
      delay: 0.5,
      highlight: true
    }
  ];

  return (
    <div className="space-y-4">
      {/* 生命卡片内容 */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: section.delay, duration: 0.3 }}
            className={cn(
              "p-3 rounded-lg",
              section.highlight 
                ? `bg-gradient-to-r ${dimension.gradient} text-white` 
                : "bg-muted/50"
            )}
          >
            <div className="flex items-start gap-2">
              <section.icon className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                section.highlight ? "text-white" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-xs font-medium",
                  section.highlight ? "text-white/80" : "text-muted-foreground"
                )}>
                  {section.label}
                </span>
                <p className={cn(
                  "text-sm mt-0.5",
                  section.highlight ? "text-white" : "text-foreground"
                )}>
                  {section.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 智能提醒 */}
      {lifeCard.reminder && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              {lifeCard.reminder.time} 提醒你 {lifeCard.reminder.action}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100">
            开启
          </Button>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 pt-2"
      >
        <Button
          onClick={onContinueChat}
          className={cn(
            "flex-1 bg-gradient-to-r text-white",
            dimension.gradient
          )}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          继续深聊
        </Button>
        <Button
          onClick={onGetTool}
          variant="outline"
          className="flex-1"
        >
          <Wrench className="w-4 h-4 mr-2" />
          给我工具
        </Button>
      </motion.div>

      {/* 记下来按钮 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          记下来，稍后再说
        </Button>
      </motion.div>
    </div>
  );
};

export default AwakeningLifeCard;
