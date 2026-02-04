import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, MessageCircle, GraduationCap, Gift, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_KEY = 'global_onboarding_completed';

interface OnboardingStep {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <BookOpen className="w-8 h-8" />,
    emoji: "📖",
    title: "记录觉察日记",
    description: "用6个维度记录生活中的困境与顺境，打破自动驾驶模式",
    features: [
      "情绪、选择、关系 - 发现破局点",
      "感恩、行动、方向 - 找到滋养点",
      "AI生成专属「生命卡片」"
    ],
    gradient: "from-teal-500 to-cyan-500"
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    emoji: "💬",
    title: "AI教练对话",
    description: "随时随地与专业AI教练对话，获得情绪支持与成长指导",
    features: [
      "情绪教练 - 理解和处理情绪",
      "亲子教练 - 改善亲子关系",
      "语音对话 - 像朋友聊天一样自然"
    ],
    gradient: "from-rose-500 to-pink-500"
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    emoji: "🎓",
    title: "21天训练营",
    description: "系统化学习，每日打卡，养成好习惯",
    features: [
      "21天情绪觉察训练营",
      "真人教练1对1点评",
      "社群支持与鼓励"
    ],
    gradient: "from-violet-500 to-purple-500"
  }
];

export const GlobalOnboarding = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 检查是否需要显示引导
    const checkOnboardingStatus = async () => {
      if (hasChecked) return;
      setHasChecked(true);

      // 先检查 localStorage
      const localCompleted = localStorage.getItem(ONBOARDING_KEY);
      if (localCompleted) return;

      // 如果已登录，检查数据库
      if (user) {
        try {
          const { data } = await supabase
            .from('page_tour_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('page_key', 'global_onboarding')
            .maybeSingle();
          
          if (data) return;
        } catch (err) {
          console.error('Error checking onboarding status:', err);
        }
      }

      // 延迟显示，避免页面加载时立即弹出
      setTimeout(() => setOpen(true), 1500);
    };

    checkOnboardingStatus();
  }, [user, hasChecked]);

  const handleComplete = async () => {
    setOpen(false);
    
    // 保存到 localStorage
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    // 如果已登录，保存到数据库
    if (user) {
      try {
        await supabase
          .from('page_tour_progress')
          .upsert({
            user_id: user.id,
            page_key: 'global_onboarding',
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,page_key'
          });
      } catch (err) {
        console.error('Error saving onboarding progress:', err);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent hideCloseButton className="sm:max-w-md p-0 gap-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>新手引导</DialogTitle>
        </VisuallyHidden>
        
        {/* 顶部渐变背景 */}
        <div className={cn(
          "relative h-40 bg-gradient-to-br flex items-center justify-center",
          step.gradient
        )}>
          {/* 跳过按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute top-3 right-3 text-white/70 hover:text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center text-white"
            >
              <motion.span
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl block mb-2"
              >
                {step.emoji}
              </motion.span>
            </motion.div>
          </AnimatePresence>
          
          {/* 波浪底部 */}
          <svg 
            className="absolute bottom-0 left-0 right-0 text-background" 
            viewBox="0 0 400 40"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 L0,20 Q100,0 200,20 T400,20 L400,40 Z" 
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* 内容区域 */}
        <div className="px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* 底部操作区 */}
        <div className="px-6 pb-6 space-y-3">
          {/* 进度指示器 */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-primary/30 hover:bg-primary/50"
                )}
              />
            ))}
          </div>
          
          {/* 操作按钮 */}
          <Button
            onClick={handleNext}
            className={cn(
              "w-full bg-gradient-to-r text-white",
              step.gradient
            )}
          >
            {isLastStep ? (
              <>
                <Gift className="w-4 h-4 mr-2" />
                开始使用
              </>
            ) : (
              <>
                下一步
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
