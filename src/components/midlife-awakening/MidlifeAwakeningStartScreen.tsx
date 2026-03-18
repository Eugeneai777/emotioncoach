import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Target, Compass, Zap, Shield, Bot, ChevronRight, Users
} from "lucide-react";
import { personalityTypeConfig, dimensionConfig, type MidlifePersonalityType, type MidlifeDimension } from "./midlifeAwakeningData";

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

interface MidlifeAwakeningStartScreenProps {
  onStart: () => void;
  onPayClick?: () => void;
  hasPurchased?: boolean;
  isLoading?: boolean;
  price?: number;
}

function PersonalityPreview() {
  const types = Object.keys(personalityTypeConfig) as MidlifePersonalityType[];
  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map((key) => {
        const t = personalityTypeConfig[key];
        return (
          <div key={key} className={`p-3 rounded-xl ${t.bgColor} text-center`}>
            <span className="text-2xl block mb-1">{t.emoji}</span>
            <p className="text-xs font-semibold">{t.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.feature}</p>
          </div>
        );
      })}
    </div>
  );
}

function DimensionPreview() {
  const dims = Object.keys(dimensionConfig) as MidlifeDimension[];
  return (
    <div className="grid grid-cols-3 gap-2">
      {dims.map((key) => {
        const d = dimensionConfig[key];
        return (
          <div key={key} className={`p-2 rounded-lg ${d.bgColor} text-center`}>
            <span className="text-lg block">{d.icon}</span>
            <p className="text-[10px] font-medium mt-1">{d.shortName}</p>
          </div>
        );
      })}
    </div>
  );
}

export function MidlifeAwakeningStartScreen({ onStart, onPayClick, hasPurchased, isLoading, price }: MidlifeAwakeningStartScreenProps) {
  const handleAction = () => {
    onStart();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Hero */}
      <AnimatedSection>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-fuchsia-500 p-6 text-white text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <span className="text-5xl block mb-3">🧭</span>
            </motion.div>
            <h1 className="text-xl font-bold mb-1">中场觉醒力测评 3.0</h1>
            <p className="text-sm opacity-90">你不是迷惘，你只是卡在中场转弯处</p>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-around text-center py-2">
              <div>
                <p className="text-lg font-bold text-primary">6</p>
                <p className="text-[10px] text-muted-foreground">维度</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">30</p>
                <p className="text-[10px] text-muted-foreground">题目</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">4</p>
                <p className="text-[10px] text-muted-foreground">人格类型</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">AI</p>
                <p className="text-[10px] text-muted-foreground">深度解读</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 痛点共鸣 */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-pink-500" />
              你是否正经历这些？
            </h3>
            <div className="space-y-2">
              {[
                '明明什么都有，却总觉得缺少什么',
                '忙碌了半辈子，不知道自己真正想要什么',
                '害怕做选择，又害怕不做选择',
                '外人眼中成功，内心却充满不安',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pink-500 mt-0.5">•</span>
                  <span className="text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 六大维度预览 */}
      <AnimatedSection delay={0.15}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              6维深度扫描
            </h3>
            <DimensionPreview />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 四种人格预览 */}
      <AnimatedSection delay={0.2}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-500" />
              你会是哪种中场人格？
            </h3>
            <PersonalityPreview />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 你将获得 */}
      <AnimatedSection delay={0.25}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              测评后你将获得
            </h3>
            <div className="space-y-2">
              {[
                { icon: <Target className="w-4 h-4 text-blue-500" />, text: '六维雷达图全景分析' },
                { icon: <Users className="w-4 h-4 text-purple-500" />, text: '中场人格类型报告' },
                { icon: <Bot className="w-4 h-4 text-pink-500" />, text: 'AI觉醒教练1对1对话' },
                { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: '个性化突破方案推荐' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {item.icon}
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection delay={0.3}>
        <div className="space-y-3 pt-2">
          <Button
            onClick={hasPurchased ? onStart : (onPayClick ?? onStart)}
            disabled={isLoading}
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl shadow-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : hasPurchased ? (
              <>开始测评 <ChevronRight className="w-5 h-5 ml-1" /></>
            ) : (
              <>¥{price ?? '?'} 开始测评 <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            约5-8分钟完成 · 测评结果永久保存 · 含AI深度解读
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
