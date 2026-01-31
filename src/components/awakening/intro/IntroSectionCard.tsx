import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IntroSectionCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "quote";
  delay?: number;
}

const IntroSectionCard: React.FC<IntroSectionCardProps> = ({
  children,
  className,
  variant = "default",
  delay = 0
}) => {
  const variants = {
    default: "bg-card border",
    highlight: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/30",
    quote: "bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-purple-950/30 border-purple-200/50 dark:border-purple-800/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
    >
      <Card className={cn("p-4", variants[variant], className)}>
        {children}
      </Card>
    </motion.div>
  );
};

export default IntroSectionCard;
