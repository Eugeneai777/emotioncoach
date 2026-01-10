import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Target, Sparkles, ArrowRight, Check } from 'lucide-react';

interface GraduateOnboardingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STORAGE_KEY = 'wealth_graduate_onboarding_seen';

export default function GraduateOnboardingDialog({ 
  open: controlledOpen, 
  onOpenChange 
}: GraduateOnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  useEffect(() => {
    if (!isControlled) {
      const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
      if (!hasSeenOnboarding) {
        setInternalOpen(true);
      }
    }
  }, [isControlled]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    
    if (!newOpen) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const handleComplete = () => {
    handleOpenChange(false);
  };

  const steps = [
    {
      icon: <GraduationCap className="w-12 h-12 text-amber-500" />,
      title: '🎓 恭喜完成7天财富觉醒训练营！',
      description: '你已经完成了人生中重要的一步——开始觉察自己与财富的关系。但这只是开始...',
      highlight: '你的觉醒之旅才刚刚起步',
    },
    {
      icon: <Target className="w-12 h-12 text-emerald-500" />,
      title: '💪 毕业生持续觉醒模式',
      description: '你可以继续保持觉醒习惯：',
      features: [
        { icon: '🧘', text: '7天冥想循环播放，每周重温不同主题' },
        { icon: '🎯', text: '每日AI挑战，保持成长动力' },
        { icon: '📈', text: '积分持续累积，等级不断提升' },
      ],
    },
    {
      icon: <Sparkles className="w-12 h-12 text-purple-500" />,
      title: '🌟 想要更多？成为合伙人',
      description: '成为有劲合伙人，解锁更多专属权益：',
      features: [
        { icon: '💎', text: '给予行动高级任务' },
        { icon: '🎁', text: '专属导师挑战' },
        { icon: '💰', text: '推广赚取收益' },
      ],
      cta: true,
    },
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>毕业生引导</DialogTitle>
          <DialogDescription>了解毕业后的持续觉醒模式</DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-4"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center"
              >
                {currentStep.icon}
              </motion.div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-center mb-2">
              {currentStep.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-4">
              {currentStep.description}
            </p>

            {/* Highlight */}
            {currentStep.highlight && (
              <div className="text-center p-3 bg-amber-50 rounded-lg mb-4">
                <span className="text-amber-700 font-medium">{currentStep.highlight}</span>
              </div>
            )}

            {/* Features */}
            {currentStep.features && (
              <div className="space-y-2 mb-4">
                {currentStep.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? 'bg-amber-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  继续
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  开始持续觉醒
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
