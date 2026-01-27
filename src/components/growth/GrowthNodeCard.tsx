import { motion, type Variants, type Transition } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrowthNode } from '@/config/growthPathConfig';

export type NodeStatus = 'completed' | 'current' | 'upcoming';

interface GrowthNodeCardProps {
  node: GrowthNode;
  status: NodeStatus;
  index: number;
  onNavigate: () => void;
}

const nodeVariants: Variants = {
  hidden: { opacity: 0.01, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 } as Transition
  }
};

const pulseTransition: Transition = { 
  duration: 2, 
  repeat: Infinity, 
  ease: "easeInOut" as const 
};

export function GrowthNodeCard({ node, status, index, onNavigate }: GrowthNodeCardProps) {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isUpcoming = status === 'upcoming';

  return (
    <motion.div
      variants={nodeVariants}
      className="relative pl-8"
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {/* 时间轴节点圆 */}
      <div className="absolute left-0 top-4 z-10">
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </motion.div>
        )}
        {isCurrent && (
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 hsl(var(--primary) / 0.4)",
                "0 0 0 8px hsl(var(--primary) / 0)",
                "0 0 0 0 hsl(var(--primary) / 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
          </motion.div>
        )}
        {isUpcoming && (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center">
            <Lock className="w-3 h-3 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* 卡片内容 */}
      <motion.div
        animate={isCurrent ? { scale: [1, 1.02, 1] } : undefined}
        transition={isCurrent ? pulseTransition : undefined}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card 
          className={cn(
            "relative transition-all duration-300 cursor-pointer min-h-[72px]",
            isCompleted && "bg-accent/50 border-accent",
            isCurrent && "bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-lg shadow-primary/10",
            isUpcoming && "bg-muted/30 border-muted-foreground/10 opacity-60"
          )}
          onClick={isUpcoming ? undefined : onNavigate}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* emoji 图标 */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                isCompleted && "bg-accent",
                isCurrent && "bg-primary/10",
                isUpcoming && "bg-muted"
              )}>
                {node.emoji}
              </div>
              
              {/* 文字内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn(
                    "font-semibold",
                    isCurrent ? "text-primary" : ""
                  )}>
                    {node.title}
                  </h3>
                  {isCompleted && (
                    <Badge className="text-xs bg-accent text-accent-foreground border-0">
                      已完成
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="text-xs bg-primary/10 text-primary border-0 animate-pulse">
                      当前
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {node.subtitle}
                </p>
                {isCurrent && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {node.description}
                  </p>
                )}
              </div>

              {/* 右侧操作 */}
              <div className="flex-shrink-0">
                {isCurrent ? (
                  <Button 
                    size="sm" 
                    className="h-8 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate();
                    }}
                  >
                    {node.ctaText}
                  </Button>
                ) : isCompleted ? (
                  <ChevronRight className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>
            </div>

            {/* 待解锁提示 */}
            {isUpcoming && (
              <p className="text-xs text-muted-foreground/60 mt-2 pl-13">
                完成上一步后解锁
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
