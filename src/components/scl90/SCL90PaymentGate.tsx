import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lock, 
  Sparkles, 
  Brain, 
  MessageSquare, 
  Target, 
  Share2,
  ChevronRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePackages, getPackagePrice } from "@/hooks/usePackages";
import { SCL90Result, scl90FactorInfo, SCL90Factor, severityConfig } from "./scl90Data";
import { SCL90PayDialog } from "./SCL90PayDialog";
import { useAuth } from "@/hooks/useAuth";

interface SCL90PaymentGateProps {
  result: SCL90Result;
  answers: Record<number, number>;
  onPaymentSuccess: (userId: string) => void;
  onBack: () => void;
}

export function SCL90PaymentGate({ 
  result, 
  answers, 
  onPaymentSuccess,
  onBack 
}: SCL90PaymentGateProps) {
  const { user } = useAuth();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const { data: packages } = usePackages();
  const reportPrice = getPackagePrice(packages, 'scl90_report', 9.9);

  // 获取前3个高分因子（模糊显示）
  const topFactors = Object.entries(result.factorScores)
    .filter(([key]) => key !== 'other')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const severityInfo = severityConfig[result.severityLevel];

  // 解锁后包含的内容 - 简化文案
  const features = [
    { icon: Brain, text: "10维度详细分析" },
    { icon: Sparkles, text: "AI智能解读" },
    { icon: Target, text: "专业应对建议" },
    { icon: Share2, text: "精美分享卡片" },
  ];

  const handlePaymentSuccess = (userId: string) => {
    setShowPayDialog(false);
    onPaymentSuccess(userId);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 测评完成提示 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className={cn(
            "bg-gradient-to-br p-5 text-white",
            severityInfo.color
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-xs">测评完成</p>
                <h2 className="text-xl font-bold">{severityInfo.label}</h2>
              </div>
            </div>
            <p className="text-white/90 text-sm">
              您已完成 90 道题目的作答，系统已生成您的心理健康测评报告。
            </p>
          </div>
        </Card>
      </motion.div>

      {/* 预览摘要（模糊显示） */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">报告预览</span>
            </div>
            
            {/* 模糊的因子展示 */}
            <div className="space-y-2 mb-4">
              {topFactors.map(([key, score], index) => {
                const info = scl90FactorInfo[key as SCL90Factor];
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{info.emoji}</span>
                      <span className="text-sm font-medium">{info.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", info.bgColor)}
                          style={{ width: `${Math.min((score as number) / 5 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground blur-sm select-none">
                        {(score as number).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 解锁提示 */}
            <div className="text-center py-3 border-t border-dashed">
              <p className="text-sm text-muted-foreground">
                解锁完整报告，查看详细分析和专业建议
              </p>
            </div>
          </CardContent>
          
          {/* 锁定覆盖层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" 
               style={{ top: '60%' }} 
          />
        </Card>
      </motion.div>

      {/* 完整报告包含 - 2x2网格 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              解锁后获得
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50"
                >
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 价格和购买按钮 - 增强紧迫感 */}
      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 bg-background pt-4 pb-safe"
        style={{ transform: "translateZ(0)" }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden relative">
          {/* 限时标签 */}
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            限时67%OFF
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-primary">¥{reportPrice.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground line-through pb-1">¥29.9</span>
            </div>
            
            <Button 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              onClick={() => setShowPayDialog(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              立即解锁完整报告
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              支付即表示同意《服务协议》
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 支付对话框 */}
      <SCL90PayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        onSuccess={handlePaymentSuccess}
        userId={user?.id}
        pendingAnswers={answers}
        pendingResult={result}
      />
    </div>
  );
}
