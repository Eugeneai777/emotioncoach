import { motion, type Variants } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  growthNodes, 
  stageLabels, 
  stageCtas,
  type GrowthStage,
  type GrowthNode 
} from '@/config/growthPathConfig';
import { GrowthNodeCard, type NodeStatus } from './GrowthNodeCard';
import { GrowthProgressLine } from './GrowthProgressLine';

interface GrowthPathVisualizationProps {
  currentStage: GrowthStage;
  loading?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const headerVariants: Variants = {
  hidden: { opacity: 0.01, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export function GrowthPathVisualization({ currentStage, loading }: GrowthPathVisualizationProps) {
  const navigate = useNavigate();
  
  const getNodeStatus = (node: GrowthNode): NodeStatus => {
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

  // 计算完成进度
  const completedCount = growthNodes.filter(node => getNodeStatus(node) === 'completed').length;
  const progressPercent = Math.round((completedCount / growthNodes.length) * 100);

  const currentCta = stageCtas[currentStage];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse ml-8" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      style={{ transform: "translateZ(0)" }}
    >
      {/* 进度头部 */}
      <motion.div variants={headerVariants}>
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  📍 {stageLabels[currentStage]}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                <p className="text-xs text-muted-foreground">
                  已完成 {completedCount}/{growthNodes.length} 步
                </p>
              </div>
            </div>
            {/* 进度条 */}
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 时间轴容器 */}
      <div className="relative">
        {/* 进度线 */}
        <GrowthProgressLine 
          totalNodes={growthNodes.length}
          completedCount={completedCount}
          nodeHeight={100}
        />

        {/* 节点列表 */}
        <motion.div 
          variants={containerVariants}
          className="space-y-4"
        >
          {growthNodes.map((node, index) => (
            <GrowthNodeCard
              key={node.id}
              node={node}
              status={getNodeStatus(node)}
              index={index}
              onNavigate={() => navigate(node.route)}
            />
          ))}
        </motion.div>
      </div>

      {/* 合伙人横幅 */}
      <motion.div
        variants={headerVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transform: "translateZ(0)" }}
      >
        <Card 
          className="bg-gradient-to-r from-accent to-accent/80 border-accent cursor-pointer overflow-hidden"
          onClick={() => navigate('/partner/youjin-intro')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💪</div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">成为有劲合伙人</h3>
                <p className="text-sm text-muted-foreground">
                  分享你的成长故事，帮助更多人开启觉醒之旅
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge className="bg-background/80 text-foreground hover:bg-background">
                  ¥999起
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">佣金20%-50%</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 主CTA按钮 */}
      <motion.div
        variants={headerVariants}
        className="pt-2"
      >
        <Button 
          size="lg" 
          className="w-full h-14 text-base"
          onClick={() => navigate(currentCta.route)}
        >
          {currentCta.text}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
