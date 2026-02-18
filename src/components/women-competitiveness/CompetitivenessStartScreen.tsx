import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Lock, Sparkles, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface CompetitivenessStartScreenProps {
  onStart: () => void;
  onBack?: () => void;
  onHistory?: () => void;
}

export function CompetitivenessStartScreen({ onStart, onBack, onHistory }: CompetitivenessStartScreenProps) {
  const dimensions = [
    { emoji: "💼", name: "职场生命力", desc: "跳槽勇气·谈薪能力·学习力" },
    { emoji: "🌟", name: "个人品牌力", desc: "表达力·影响力·社交资产" },
    { emoji: "🛡️", name: "情绪韧性", desc: "抗压力·自我修复·边界感" },
    { emoji: "💰", name: "财务掌控力", desc: "理财认知·被动收入·独立性" },
    { emoji: "🤝", name: "关系经营力", desc: "社交圈·求助力·家庭平衡" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-purple-50 flex flex-col items-center relative">
      <PageHeader
        rightActions={
          onHistory ? (
            <Button variant="ghost" size="sm" onClick={onHistory} className="text-muted-foreground">
              <History className="w-4 h-4 mr-1" />
              历史记录
            </Button>
          ) : undefined
        }
      />

      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-4 p-4 flex-1 flex flex-col justify-center"
        style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      >
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0.01, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center mb-4"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <div className="text-3xl mb-2">👑</div>
          <h1 className="text-xl font-bold text-rose-800 mb-1">35+女性竞争力测评</h1>
          <p className="text-sm text-muted-foreground">发现你的隐藏实力，唤醒沉睡的竞争力</p>
        </motion.div>

        {/* 五大维度预览 */}
        <motion.div
          initial={{ opacity: 0.01, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Card className="border-rose-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span className="font-medium text-rose-800">5大维度全面评估</span>
              </div>
              <div className="space-y-2">
                {dimensions.map((dim, index) => (
                  <motion.div
                    key={dim.name}
                    initial={{ opacity: 0.01, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
                    className="flex items-center gap-3 text-sm"
                    style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                  >
                    <span className="text-base">{dim.emoji}</span>
                    <span className="font-medium text-foreground w-20">{dim.name}</span>
                    <span className="text-muted-foreground text-xs">{dim.desc}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI特色 */}
        <motion.div
          initial={{ opacity: 0.01, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-rose-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <span className="font-medium text-purple-700">AI 智能分析</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI 会在关键时刻追问、生成你的专属竞争力画像和行动建议
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 鼓励语 */}
        <motion.div
          initial={{ opacity: 0.01, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-pink-400" />
                <span className="font-medium text-pink-700">给自己5分钟</span>
              </div>
              <p className="text-sm text-muted-foreground">
                35岁以后的竞争力，不是跑得更快，而是找到属于你的赛道
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 开始按钮 */}
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="pt-2"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Button
              onClick={onStart}
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white font-medium text-base rounded-full shadow-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              <span>开始测评</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* 隐私 */}
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            回答完全保密，仅用于生成专属分析报告
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
