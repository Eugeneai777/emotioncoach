import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle, ArrowRight, Sparkles, Calendar, BookOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepActionCardProps {
  isSaved: boolean;
  isSaving?: boolean;
  hasPurchased: boolean;
  awakeningStart: number;
  day7Target: number;
  onSave?: () => void;
  onPurchase: () => void;
  onStartCamp?: () => void;
}

export function NextStepActionCard({
  isSaved,
  isSaving,
  hasPurchased,
  awakeningStart,
  day7Target,
  onSave,
  onPurchase,
  onStartCamp
}: NextStepActionCardProps) {
  
  const steps = [
    {
      id: 1,
      title: '完成测评',
      description: '了解你的财富卡点',
      completed: true,
      icon: Check,
    },
    {
      id: 2,
      title: '保存结果',
      description: '同步到财富档案',
      completed: isSaved,
      icon: BookOpen,
      action: !isSaved && onSave ? onSave : undefined,
      actionLabel: isSaving ? '保存中...' : '点击保存',
    },
    {
      id: 3,
      title: '加入训练营',
      description: `从${awakeningStart}分突破到${day7Target}分`,
      completed: hasPurchased,
      icon: Calendar,
      action: hasPurchased ? onStartCamp : onPurchase,
      actionLabel: hasPurchased ? '开始训练' : '立即加入',
      highlight: !hasPurchased,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30">
        <CardContent className="p-4 space-y-4">
          {/* 头部 */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-violet-100 dark:bg-violet-900/50">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">✨ 看完测评，下一步怎么做？</h3>
              <p className="text-xs text-muted-foreground">跟着步骤，开启觉醒之旅</p>
            </div>
          </div>

          {/* 步骤列表 */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className="absolute left-4 top-10 w-0.5 h-6 bg-gradient-to-b from-violet-300 to-violet-200 dark:from-violet-700 dark:to-violet-800" />
                )}
                
                <div 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-all",
                    step.completed 
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50" 
                      : step.highlight
                        ? "bg-violet-100/80 dark:bg-violet-900/30 border-2 border-violet-300 dark:border-violet-600"
                        : "bg-white/60 dark:bg-white/5 border border-border/50"
                  )}
                >
                  {/* 步骤指示器 */}
                  <div 
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      step.completed 
                        ? "bg-emerald-500 text-white" 
                        : step.highlight
                          ? "bg-violet-500 text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-bold">{step.id}</span>
                    )}
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        step.completed ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                      )}>
                        {step.title}
                      </h4>
                      {step.completed && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full">
                          已完成
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    
                    {/* 操作按钮 */}
                    {step.action && !step.completed && (
                      <Button
                        size="sm"
                        onClick={step.action}
                        disabled={isSaving}
                        className={cn(
                          "mt-2 h-7 text-xs",
                          step.highlight 
                            ? "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        )}
                      >
                        {step.actionLabel}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    
                    {/* 已购买用户的开始按钮 */}
                    {step.id === 3 && hasPurchased && onStartCamp && (
                      <Button
                        size="sm"
                        onClick={onStartCamp}
                        className="mt-2 h-7 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                      >
                        开始训练
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 同步提示 */}
          <div className="flex items-center gap-2 p-2.5 bg-white/50 dark:bg-white/5 rounded-lg">
            <RefreshCw className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              {isSaved 
                ? "✅ 你的测评数据已同步到财富日记，成为 Day 0 起点" 
                : "保存后，测评数据将自动同步到财富日记作为 Day 0 起点"}
            </p>
          </div>

          {/* 购买按钮 - 未购买时显示 */}
          {!hasPurchased && (
            <Button
              onClick={onPurchase}
              className="w-full h-11 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-lg font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              ¥299 立即加入，开启觉醒之旅
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
