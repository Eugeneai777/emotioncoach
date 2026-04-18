import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Sparkles, Brain, Target, Share2, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePackages, getPackagePrice } from "@/hooks/usePackages";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";

interface SCL90PrePayGateProps {
  onPaymentSuccess: (userId: string) => void;
  onBack: () => void;
  userId?: string;
}

/**
 * SCL-90 答题前付费墙：付费后才能开始 90 题答题。
 * 与情绪健康测评对齐的「先付费 → 再答题」流程。
 */
export function SCL90PrePayGate({ onPaymentSuccess, onBack, userId }: SCL90PrePayGateProps) {
  const [showPayDialog, setShowPayDialog] = useState(false);
  const { data: packages } = usePackages();
  const reportPrice = getPackagePrice(packages, "scl90_report", 9.9);

  const features = [
    { icon: Brain, text: "10维度详细分析" },
    { icon: Sparkles, text: "AI智能解读" },
    { icon: Target, text: "专业应对建议" },
    { icon: Share2, text: "精美分享卡片" },
  ];

  const handleSuccess = (uid: string) => {
    setShowPayDialog(false);
    onPaymentSuccess(uid);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      {/* 标题区 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-primary-foreground">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs">即将开始</p>
                <h2 className="text-xl font-bold">SCL-90 心理健康测评</h2>
              </div>
            </div>
            <p className="text-primary-foreground/90 text-sm">
              专业 90 题量表 · 10 大心理因子全面评估 · AI 智能解读
            </p>
          </div>
        </Card>
      </motion.div>

      {/* 包含内容 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              解锁完整测评包含
            </h3>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/50"
                >
                  <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 价格 + 立即支付按钮 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="bg-background/95 backdrop-blur-sm pt-4 pb-safe">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden relative">
            <div className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              限时67%OFF
            </div>

            <CardContent className="p-4">
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-primary">¥{reportPrice.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground line-through pb-1">¥29.9</span>
              </div>

              <Button
                className={cn(
                  "w-full h-12 text-base font-semibold",
                  "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                )}
                onClick={() => setShowPayDialog(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                立即支付 · 开始测评
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                支付即表示同意《服务协议》
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* 支付弹窗（复用通用 AssessmentPayDialog） */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handleSuccess}
        userId={userId}
        packageKey="scl90_report"
        packageName="SCL-90 心理健康测评"
      />
    </div>
  );
}
