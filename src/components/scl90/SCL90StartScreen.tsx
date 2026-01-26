import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Clock, Shield, ArrowLeft } from "lucide-react";
import { scl90ScoreLabels } from "./scl90Data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SCL90StartScreenProps {
  onStart: () => void;
  onBack?: () => void;
}

export function SCL90StartScreen({ onStart, onBack }: SCL90StartScreenProps) {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0.01, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {/* 返回按钮 */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-sm -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      )}

      {/* 标题 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
          <Brain className="w-4 h-4" />
          <span>SCL-90 心理健康自评</span>
        </div>
        <h2 className="text-xl font-bold">全面了解你的心理健康状态</h2>
        <p className="text-sm text-muted-foreground">
          SCL-90 是国际通用的心理健康筛查量表
        </p>
      </div>

      {/* 说明卡片 */}
      <Card className="border-0 shadow-sm bg-card/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="font-medium text-sm">90道自评题目</p>
              <p className="text-xs text-muted-foreground">涵盖10个心理健康维度</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">10-15分钟完成</p>
              <p className="text-xs text-muted-foreground">每页9题，共10页</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-sm">隐私保护</p>
              <p className="text-xs text-muted-foreground">数据安全加密，仅您可见</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 评分说明 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          请根据<strong className="text-foreground">最近一周</strong>的感受，选择符合程度：
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {scl90ScoreLabels.map(s => (
            <span 
              key={s.value} 
              className={cn(
                "px-2 py-1 rounded text-xs font-medium border",
                s.color
              )}
            >
              {s.value}={s.label}
            </span>
          ))}
        </div>
      </div>

      {/* 10因子预览 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">测评维度</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { emoji: '🫀', name: '躯体化' },
              { emoji: '🔄', name: '强迫' },
              { emoji: '👥', name: '人际敏感' },
              { emoji: '😢', name: '抑郁' },
              { emoji: '😰', name: '焦虑' },
              { emoji: '😤', name: '敌对' },
              { emoji: '😨', name: '恐怖' },
              { emoji: '🤔', name: '偏执' },
              { emoji: '🌀', name: '精神病性' },
              { emoji: '💤', name: '其他' },
            ].map(f => (
              <span 
                key={f.name}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-white/10 rounded-full text-xs"
              >
                <span>{f.emoji}</span>
                <span>{f.name}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 免责声明 */}
      <p className="text-xs text-muted-foreground text-center px-4">
        ⚠️ 本量表仅供自我筛查参考，不能替代专业心理诊断
      </p>

      {/* 开始按钮 */}
      <Button 
        onClick={onStart} 
        className="w-full h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
      >
        <Brain className="w-5 h-5 mr-2" />
        开始测评
      </Button>
    </motion.div>
  );
}
