import { Helmet } from 'react-helmet';
import PageHeader from '@/components/PageHeader';
import { GrowthPathVisualization } from '@/components/growth/GrowthPathVisualization';
import { useUserGrowthStage } from '@/hooks/useUserGrowthStage';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function GrowthSupportPath() {
  const { stage, loading } = useUserGrowthStage();

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-primary/5 to-background dark:from-primary/10">
      <Helmet>
        <title>成长支持路径 - 有劲AI</title>
        <meta name="description" content="一目了然的成长支持路径，从测评到训练营到长期陪伴" />
      </Helmet>

      <PageHeader title="成长支持路径" showBack />

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 顶部说明 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <h1 className="text-xl font-bold text-primary">
                🌱 你的成长支持路径
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                原来不是你不行，是卡在了某种情绪反应模式里。
                <br />
                我们陪你一步步走出来。
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 可视化路径 */}
        <GrowthPathVisualization 
          currentStage={stage} 
          loading={loading}
        />

        {/* 四层支持系统说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3 text-center">🏰 四层支持系统</h3>
              <div className="grid grid-cols-2 gap-3">
                <SupportLayer 
                  emoji="📋" 
                  title="觉察测评" 
                  desc="看见真实的自己" 
                />
                <SupportLayer 
                  emoji="🤖" 
                  title="AI即时陪伴" 
                  desc="24小时智能教练" 
                />
                <SupportLayer 
                  emoji="🏕️" 
                  title="结构化训练营" 
                  desc="21天系统转化" 
                />
                <SupportLayer 
                  emoji="👨‍🏫" 
                  title="真人教练" 
                  desc="专业深度支持" 
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 底部安全区 */}
        <div className="h-safe-bottom" />
      </main>
    </div>
  );
}

interface SupportLayerProps {
  emoji: string;
  title: string;
  desc: string;
}

function SupportLayer({ emoji, title, desc }: SupportLayerProps) {
  return (
    <div className="p-3 rounded-lg bg-background text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
