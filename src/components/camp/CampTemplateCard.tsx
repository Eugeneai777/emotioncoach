import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, ShoppingCart } from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampTemplateCardProps {
  camp: CampTemplate;
  index: number;
  enrolledCount?: number;
  onClick: () => void;
  onPurchase?: (camp: CampTemplate) => void;
}

export function CampTemplateCard({ camp, index, enrolledCount = 0, onClick, onPurchase }: CampTemplateCardProps) {
  // 绽放训练营不检查前置条件锁定
  const isBloomCamp = ['emotion_bloom', 'identity_bloom'].includes(camp.camp_type);
  // 父母训练营特殊标识
  const isParentCamp = camp.camp_type === 'parent_emotion_21';
  
  // Check if user has completed prerequisite camp
  const { data: hasPrerequisite } = useQuery({
    queryKey: ['prerequisite-check', camp.camp_type],
    queryFn: async () => {
      if (!camp.prerequisites?.required_camp) return true;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('training_camps')
        .select('status')
        .eq('user_id', user.id)
        .eq('camp_type', camp.prerequisites.required_camp)
        .eq('status', 'completed')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !isBloomCamp && !!camp.prerequisites?.required_camp
  });

  const isLocked = !isBloomCamp && camp.prerequisites?.required_camp && !hasPrerequisite;
  const isPopular = enrolledCount >= 5;
  const isRecommended = camp.camp_type === 'emotion_journal_21';

  const isPaidCamp = camp.price && camp.price > 0;

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 
        hover:-translate-y-2 hover:shadow-xl hover:shadow-teal-200/30 
        animate-in fade-in-50 slide-in-from-bottom-4 flex flex-col h-full
        bg-white/70 backdrop-blur-sm border-teal-200/40
        dark:bg-teal-950/20 dark:border-teal-800/30 ${
        isLocked ? 'opacity-60' : ''
      } ${
        isBloomCamp 
          ? 'ring-2 ring-purple-200/50' 
          : isParentCamp
          ? 'ring-2 ring-emerald-200/50'
          : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* 封面背景 - 保留各训练营特色渐变 */}
      <div className={`relative h-36 bg-gradient-to-br ${camp.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
        
        {/* 绽放系列装饰图案 */}
        {isBloomCamp && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 right-4 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute top-1/2 right-8 w-16 h-16 border border-white/20 rounded-full" />
          </div>
        )}
        
        <div className="absolute top-3 right-3 flex flex-wrap gap-2 justify-end">
          {isBloomCamp && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-600 shadow-sm">
              ✨ 绽放系列
            </div>
          )}
          {isParentCamp && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
              👨‍👩‍👧 亲子专题
            </div>
          )}
          {isBloomCamp && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-600 shadow-sm">
              🎯 深度转化
            </div>
          )}
          {!isBloomCamp && isPopular && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-orange-600 shadow-sm">
              🔥 热门
            </div>
          )}
          {!isBloomCamp && isRecommended && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-teal-600 shadow-sm">
              ⭐ 推荐
            </div>
          )}
          {isLocked && (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-muted-foreground shadow-sm flex items-center gap-1">
              <Lock className="w-3 h-3" />
              未解锁
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 text-6xl filter drop-shadow-lg">
          {camp.icon}
        </div>
      </div>
      
      <CardHeader className="relative z-10 pt-4">
        <CardTitle className="text-xl line-clamp-1 text-teal-800 dark:text-teal-200">{camp.camp_name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem] text-teal-600/80 dark:text-teal-400/80">
          {camp.camp_subtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4 flex-1">
        <p className="text-muted-foreground leading-relaxed line-clamp-2 min-h-[3rem]">{camp.description}</p>
        
        <div className="flex flex-wrap gap-2">
          <Badge className={`bg-gradient-to-r ${camp.gradient} text-white border-0`}>
            {camp.duration_days}天
          </Badge>
          {camp.stages && camp.stages.length > 0 && (
            <Badge variant="outline" className="border-teal-300/50 text-teal-600 dark:border-teal-700/50 dark:text-teal-400">
              {camp.stages.length}阶课程
            </Badge>
          )}
        </div>

        {/* 价格信息 */}
        {camp.price !== undefined && camp.price !== null && (
          <div className="flex items-end gap-2">
            {camp.original_price && camp.original_price > camp.price && (
              <span className="text-muted-foreground line-through text-sm">
                ¥{camp.original_price.toLocaleString()}
              </span>
            )}
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              ¥{camp.price.toLocaleString()}
            </span>
            {camp.price_note && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                {camp.price_note}
              </Badge>
            )}
          </div>
        )}
        

        {isLocked && camp.prerequisites?.message && (
          <div className="bg-teal-50/50 dark:bg-teal-950/30 p-3 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {camp.prerequisites.message}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10 mt-auto">
        {isLocked ? (
          <Button disabled className="w-full gap-2">
            暂未解锁
          </Button>
        ) : isPaidCamp ? (
          <div className="w-full space-y-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPurchase?.(camp);
              }}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              立即购买 ¥{camp.price?.toLocaleString()}
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="w-full text-muted-foreground hover:text-primary"
            >
              了解更多 →
            </Button>
          </div>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`w-full gap-2 ${
              isBloomCamp
                ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-[length:200%_100%] animate-shimmer text-white hover:opacity-90'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white'
            }`}
          >
            {isBloomCamp ? '✨ 开启绽放之旅' : '立即开启'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}