import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield, 
  MessageCircle, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  Sparkles,
  EyeOff,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { INVITATION_SCRIPTS, PRIVACY_COMMITMENTS } from "@/config/teenModeGuidance";

interface TeenModeOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCode: () => void;
}

const STEPS = [
  {
    title: "认识青少年模式",
    icon: Users,
    gradient: "from-violet-400 to-purple-500"
  },
  {
    title: "隐私承诺",
    icon: Shield,
    gradient: "from-teal-400 to-cyan-500"
  },
  {
    title: "如何邀请",
    icon: MessageCircle,
    gradient: "from-pink-400 to-rose-500"
  }
];

export function TeenModeOnboarding({ 
  open, 
  onOpenChange, 
  onGenerateCode 
}: TeenModeOnboardingProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({ title: "话术已复制" });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      onGenerateCode();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Progress Indicator */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-violet-500" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${STEPS[currentStep].gradient} flex items-center justify-center`}>
              {(() => {
                const Icon = STEPS[currentStep].icon;
                return <Icon className="h-6 w-6 text-white" />;
              })()}
            </div>
            <DialogTitle className="text-xl">
              {STEPS[currentStep].title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            {/* Step 1: Introduction */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  亲子教练双轨模式让你和孩子各自拥有专属的AI陪伴空间
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-teal-50 rounded-xl text-center">
                    <div className="text-2xl mb-2">👨‍👩‍👧</div>
                    <h4 className="font-medium text-sm">家长版</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      理解情绪、学习沟通
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-xl text-center">
                    <div className="text-2xl mb-2">🧒</div>
                    <h4 className="font-medium text-sm">青少年版</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      安全倾诉、不被评判
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    你的对话洞察会帮助AI更好地理解孩子的家庭背景
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Privacy */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  隐私保护是孩子愿意使用的基础，也是建立信任的关键
                </p>
                
                <div className="space-y-3">
                  {PRIVACY_COMMITMENTS.map((commitment, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg"
                    >
                      <EyeOff className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{commitment}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Heart className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    你只能看到孩子的使用频率和心情趋势
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Invitation */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  选择合适的时机和话术，自然地介绍给孩子
                </p>
                
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {INVITATION_SCRIPTS.slice(0, 3).map((item, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-muted/50 rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="text-sm font-medium">{item.scenario}</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic pl-6">
                        "{item.script.slice(0, 60)}..."
                      </p>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyScript(item.script)}
                          className="h-7 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          复制话术
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            上一步
          </Button>
          
          <Button
            onClick={handleNext}
            className={`gap-1 ${
              currentStep === STEPS.length - 1 
                ? "bg-gradient-to-r from-violet-500 to-purple-600" 
                : ""
            }`}
          >
            {currentStep === STEPS.length - 1 ? "生成绑定码" : "下一步"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
