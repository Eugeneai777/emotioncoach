import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Check, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  growthNodes, 
  stageLabels, 
  stageCtas,
  type GrowthStage,
  type GrowthNode 
} from '@/config/growthPathConfig';

interface GrowthPathVisualizationProps {
  currentStage: GrowthStage;
  loading?: boolean;
}

export function GrowthPathVisualization({ currentStage, loading }: GrowthPathVisualizationProps) {
  const navigate = useNavigate();
  
  const getNodeStatus = (node: GrowthNode): 'completed' | 'current' | 'upcoming' => {
    const stageOrder: GrowthStage[] = ['new_user', 'assessed', 'in_camp', 'member365'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nodeIndex = stageOrder.indexOf(node.stage);
    
    // 特殊处理：new_user 阶段的测评节点是 current
    if (node.id === 'assessment' && currentStage === 'new_user') return 'current';
    if (node.id === 'assessment' && currentIndex > 0) return 'completed';
    
    // AI教练节点
    if (node.id === 'ai_coach') {
      if (currentStage === 'assessed') return 'current';
      if (currentIndex > stageOrder.indexOf('assessed')) return 'completed';
      return 'upcoming';
    }
    
    // 其他节点
    if (nodeIndex < currentIndex) return 'completed';
    if (node.stage === currentStage) return 'current';
    return 'upcoming';
  };

  const currentCta = stageCtas[currentStage];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 当前位置指示 */}
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="px-4 py-1.5 text-sm">
          📍 {stageLabels[currentStage]}
        </Badge>
      </div>

      {/* 路径节点 */}
      <div className="space-y-3">
        {growthNodes.slice(0, 3).map((node, index) => {
          const status = getNodeStatus(node);
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GrowthNodeCard 
                node={node} 
                status={status}
                onNavigate={() => navigate(node.route)}
              />
              {index < 2 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 365会员节点 - 居中突出 */}
      <div className="flex justify-center py-2">
        <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <GrowthNodeCard 
          node={growthNodes[3]} 
          status={getNodeStatus(growthNodes[3])}
          onNavigate={() => navigate(growthNodes[3].route)}
          featured
        />
      </motion.div>

      {/* 成为合伙人 */}
      <div className="flex justify-center py-2">
        <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card 
          className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/partner/youjin-intro')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">💪</div>
            <h3 className="font-semibold">成为有劲合伙人</h3>
            <p className="text-sm text-muted-foreground mt-1">
              分享你的成长故事，帮助更多人开启觉醒之旅
            </p>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
              ¥999起 · 佣金20%-50%
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 主CTA按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4"
      >
        <Button 
          size="lg" 
          className="w-full h-14 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          onClick={() => navigate(currentCta.route)}
        >
          {currentCta.text}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    </div>
  );
}

interface GrowthNodeCardProps {
  node: GrowthNode;
  status: 'completed' | 'current' | 'upcoming';
  onNavigate: () => void;
  featured?: boolean;
}

function GrowthNodeCard({ node, status, onNavigate, featured }: GrowthNodeCardProps) {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  
  return (
    <Card 
      className={cn(
        "relative transition-all duration-300 cursor-pointer",
        `bg-gradient-to-br ${node.gradient}`,
        node.borderColor,
        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isCompleted && "opacity-80",
        featured && "border-2"
      )}
      onClick={onNavigate}
    >
      <CardContent className={cn("p-4", featured && "py-5")}>
        <div className="flex items-center gap-4">
          {/* 状态指示器 */}
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
            isCompleted && "bg-emerald-100 dark:bg-emerald-900/30",
            isCurrent && "bg-primary/10 animate-pulse",
            !isCompleted && !isCurrent && "bg-muted"
          )}>
            {isCompleted ? (
              <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              node.emoji
            )}
          </div>
          
          {/* 内容 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold",
                featured ? "text-lg" : "text-base"
              )}>
                {node.title}
              </h3>
              {node.price && (
                <Badge variant="outline" className="text-xs">
                  {node.price}
                </Badge>
              )}
              {isCurrent && (
                <Badge className="text-xs bg-primary/20 text-primary border-0">
                  当前阶段
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {node.subtitle}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {node.description}
            </p>
          </div>

          {/* 箭头 */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
