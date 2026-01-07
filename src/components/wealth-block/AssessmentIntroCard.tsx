import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Lightbulb, BarChart3, Rocket, Check, LogIn, ArrowRight } from "lucide-react";

interface AssessmentIntroCardProps {
  isLoggedIn: boolean;
  onStart: () => void;
  onLogin: () => void;
}

const valuePoints = [
  { icon: Target, title: "精准定位", desc: "识别行为、情绪、信念三层卡点" },
  { icon: Lightbulb, title: "深度觉察", desc: "AI智能追问，挖掘隐藏模式" },
  { icon: BarChart3, title: "可视化报告", desc: "四穷雷达图 + 健康指数" },
  { icon: Rocket, title: "个性化方案", desc: "基于测评的训练营推荐" },
];

const painPoints = [
  "明明知道该行动，却总是拖延",
  "想赚钱但排斥销售和推广",
  "付钱时总有种「损失」的感觉",
  "别人成功时心里酸酸的",
];

const loginBenefits = [
  "查看历史趋势变化",
  "解锁21天训练营",
  "获得AI教练个性化指导",
];

export function AssessmentIntroCard({ isLoggedIn, onStart, onLogin }: AssessmentIntroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 border-amber-200/50 p-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl" />
        
        <div className="relative text-center space-y-3">
          <div className="text-4xl mb-2">🔍</div>
          <h2 className="text-xl font-bold text-foreground">
            发现你的财富卡点
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            不是能力不够，<br />
            而是某个地方卡住了你
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <span className="px-2 py-1 bg-amber-100 rounded-full">30道场景题</span>
            <span className="px-2 py-1 bg-orange-100 rounded-full">约5分钟</span>
            <span className="px-2 py-1 bg-yellow-100 rounded-full">免费</span>
          </div>
        </div>
      </Card>

      {/* Value Points Grid */}
      <div className="grid grid-cols-2 gap-3">
        {valuePoints.map((point, idx) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <Card className="p-4 h-full bg-card/80 hover:bg-card transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 shrink-0">
                  <point.icon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-foreground">{point.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Assessment Structure Preview */}
      <Card className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-100">
        <h3 className="font-medium text-sm mb-3 text-center text-foreground">测评结构</h3>
        <div className="flex items-center justify-between text-center text-xs">
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-1.5">
              <span className="text-lg">🚶</span>
            </div>
            <div className="font-medium text-foreground">行为层</div>
            <div className="text-muted-foreground">10题</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-1.5">
              <span className="text-lg">💭</span>
            </div>
            <div className="font-medium text-foreground">情绪层</div>
            <div className="text-muted-foreground">10题</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-1.5">
              <span className="text-lg">💡</span>
            </div>
            <div className="font-medium text-foreground">信念层</div>
            <div className="text-muted-foreground">10题</div>
          </div>
        </div>
      </Card>

      {/* Pain Points */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3 text-foreground">你是否也有这些困扰？</h3>
        <div className="space-y-2">
          {painPoints.map((point, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Login Guidance (for non-logged in users) */}
      {!isLoggedIn && (
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <LogIn className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground mb-2">登录后可保存测评结果</h3>
              <div className="space-y-1.5 mb-4">
                {loginBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={onLogin} className="flex-1">
                  去登录
                </Button>
                <Button size="sm" variant="outline" onClick={onStart} className="flex-1">
                  先做测评
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onStart}
          size="lg"
          className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200/50"
        >
          <span className="mr-2">✨</span>
          开始测评
        </Button>
      </motion.div>
    </motion.div>
  );
}
