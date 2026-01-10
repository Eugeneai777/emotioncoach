import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Gift, TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerConversionCardProps {
  variant?: 'compact' | 'full';
  className?: string;
  context?: 'after_challenge' | 'level_up' | 'sidebar';
}

export function PartnerConversionCard({ 
  variant = 'full', 
  className,
  context = 'sidebar'
}: PartnerConversionCardProps) {
  const navigate = useNavigate();

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">成为合伙人</p>
              <p className="text-xs text-emerald-600">解锁更多专属权益</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            onClick={() => navigate('/partner/youjin-plan')}
          >
            了解 <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={cn(
        "overflow-hidden border-0 shadow-lg",
        className
      )}>
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">成为有劲合伙人</h3>
                <p className="text-xs text-muted-foreground">解锁全部高级功能</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              推荐
            </Badge>
          </div>

          {/* Benefits Preview */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700">给予行动任务</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700">推广赚收益</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate('/partner/youjin-plan')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            了解合伙人计划
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
