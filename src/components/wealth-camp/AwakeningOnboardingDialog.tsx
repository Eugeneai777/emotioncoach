import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Target, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

const ONBOARDING_KEY = 'wealth_awakening_onboarding_completed';

interface AwakeningOnboardingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AwakeningOnboardingDialog: React.FC<AwakeningOnboardingDialogProps> = ({ 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(0);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  useEffect(() => {
    if (!isControlled) {
      const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
      if (!hasCompleted) {
        // 延迟显示，让页面先加载
        const timer = setTimeout(() => setInternalOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isControlled]);
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };
  
  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    handleOpenChange(false);
  };
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };
  
  const steps = [
    {
      icon: <Sparkles className="h-8 w-8 text-amber-500" />,
      title: '欢迎开启财富觉醒之旅',
      description: '这是一段为期7天的财富意识提升旅程，帮助你突破内在卡点，与金钱建立更和谐的关系。',
      highlights: [
        { emoji: '🧘', text: '每日冥想 · 静心连接' },
        { emoji: '💬', text: '教练梳理 · 觉察成长' },
        { emoji: '🎁', text: '给予行动 · 打开流动' },
      ]
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-emerald-500" />,
      title: '觉醒指数：你的成长轨迹',
      description: '我们用 0-100 的统一标准衡量你的财富意识状态，分数越高代表越觉醒。',
      highlights: [
        { emoji: '📊', text: '觉醒起点 = 来自 Day 0 测评' },
        { emoji: '📈', text: '当前觉醒 = 训练中的最佳表现' },
        { emoji: '🔥', text: '成长值 = 你的进步幅度' },
      ]
    },
    {
      icon: <Target className="h-8 w-8 text-violet-500" />,
      title: '7天目标：提升至少10分',
      description: '通过每日坚持，你的觉醒指数将稳步提升。达到 80+ 即为高度觉醒状态！',
      highlights: [
        { emoji: '🟢', text: '80+ 高度觉醒 · 财富畅通' },
        { emoji: '🟡', text: '60-79 稳步觉醒 · 持续突破' },
        { emoji: '🟠', text: '40-59 初步觉醒 · 开始改变' },
      ]
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: '积分升级：解锁觉醒等级',
      description: '完成每日任务获得积分，积分累积可解锁更高等级，见证你的蜕变之旅。',
      highlights: [
        { emoji: '🧘', text: '完成冥想 +10分' },
        { emoji: '💬', text: '完成梳理 +20分' },
        { emoji: '🎁', text: '完成给予 +15分' },
      ]
    },
  ];
  
  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm" hideCloseButton>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center">
                  {currentStep.icon}
                </div>
              </div>
              <DialogTitle className="text-lg">{currentStep.title}</DialogTitle>
              <DialogDescription className="text-sm mt-2">
                {currentStep.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2 my-4">
              {currentStep.highlights.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-1.5 my-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step 
                  ? 'w-6 bg-amber-500' 
                  : index < step 
                    ? 'w-1.5 bg-emerald-500' 
                    : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2 mt-2">
          {step > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              上一步
            </Button>
          )}
          <Button 
            onClick={handleNext}
            className={`flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ${step === 0 ? 'w-full' : ''}`}
          >
            {step === steps.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                开始旅程
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
        
        {/* 跳过按钮 */}
        {step < steps.length - 1 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleComplete}
            className="w-full mt-2 text-muted-foreground text-xs"
          >
            跳过引导
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AwakeningOnboardingDialog;

// 导出重置函数供测试使用
export const resetOnboarding = () => {
  localStorage.removeItem(ONBOARDING_KEY);
};
