import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Database, Heart, Sparkles, ShoppingCart, GraduationCap, Check, X, ArrowRight } from "lucide-react";

interface CampConversionCardProps {
  hasPurchased: boolean;
  onPurchase: () => void;
  onStart: () => void;
  onViewDetails: () => void;
}

const trilogy = [
  {
    icon: Clock,
    name: "成长追踪",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    description: "21天持续追踪变化"
  },
  {
    icon: Database,
    name: "画像对比",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50",
    description: "Day 1 vs Day 21"
  },
  {
    icon: Heart,
    name: "AI见证",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-50",
    description: "每次蜕变被看见"
  }
];

const comparisonItems = [
  { 
    without: "信息会遗忘，行动难持续",
    with: "21天持续追踪，建立新习惯"
  },
  {
    without: "缺少反馈，不知是否进步",
    with: "每天教练对话，实时调整"
  },
  {
    without: "孤军奋战，容易放弃",
    with: "AI见证蜕变，为你命名"
  }
];

export function CampConversionCard({ 
  hasPurchased, 
  onPurchase, 
  onStart, 
  onViewDetails 
}: CampConversionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-lg">这份报告只是开始</span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            你刚刚获得的是 <span className="font-semibold">Day 0 快照</span>——你此刻的财富心理状态。<br/>
            但真正的改变，需要<span className="font-semibold">持续的觉察与练习</span>。
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* AI陪伴三部曲 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-foreground">🤖 AI陪伴三部曲</span>
              <span className="text-[10px] text-muted-foreground">Powered by 有劲AI</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {trilogy.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className={`p-3 ${item.bgColor} rounded-xl text-center relative overflow-hidden`}
                >
                  <div className="absolute top-1 right-1 text-lg font-bold opacity-10">{idx + 1}</div>
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 对比展示 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">选择你的路径：</p>
            {comparisonItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-start gap-1.5 p-2 bg-muted/50 rounded-lg">
                  <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-muted-foreground">{item.without}</span>
                </div>
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded-lg">
                  <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-amber-700">{item.with}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Day 0 说明 */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
            <p className="text-xs text-center text-foreground leading-relaxed">
              📸 今天的测评结果是你「活画像」的 <span className="font-semibold text-amber-600">Day 0</span> 基准线<br/>
              <span className="text-muted-foreground">21天后，你将清晰看见自己的成长轨迹</span>
            </p>
          </div>

          {/* 价格和CTA */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-muted-foreground line-through">¥399</span>
              <span className="text-3xl font-bold text-amber-600">¥299</span>
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">限时特惠</span>
            </div>
            
            {hasPurchased ? (
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg h-12 text-base"
                onClick={onStart}
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                开始训练营
              </Button>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl h-14 text-lg font-semibold"
                  onClick={onPurchase}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  ¥299 立即加入训练营
                </Button>
              </motion.div>
            )}
            
            <Button 
              variant="ghost" 
              className="text-muted-foreground text-sm"
              onClick={onViewDetails}
            >
              查看训练营详情 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
