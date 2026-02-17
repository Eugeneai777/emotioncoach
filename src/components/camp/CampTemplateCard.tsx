import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, ShoppingCart } from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function formatMoney(value: number | null | undefined): string {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(num);
}

interface CampTemplateCardProps {
  camp: CampTemplate;
  index: number;
  enrolledCount?: number;
  onClick: () => void;
  onPurchase?: (camp: CampTemplate) => void;
}

export function CampTemplateCard({ camp, index, enrolledCount = 0, onClick, onPurchase }: CampTemplateCardProps) {
  const isBloomCamp = ['emotion_bloom', 'identity_bloom', 'life_bloom'].includes(camp.camp_type);
  const isParentCamp = camp.camp_type === 'parent_emotion_21';

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
        hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-200/30 
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
      onClick={!isLocked && !isPaidCamp ? onClick : undefined}
      role={!isLocked && !isPaidCamp ? "button" : undefined}
    >
      {/* 渐变头图 - 手机端压缩 */}
      <div className={`relative h-24 sm:h-36 bg-gradient-to-br ${camp.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />

        {isBloomCamp && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 right-4 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute top-1/2 right-8 w-16 h-16 border border-white/20 rounded-full" />
          </div>
        )}

        {/* 标签 - 手机端只显示1个 */}
        <div className="absolute top-2 right-2 flex flex-wrap gap-1.5 justify-end">
          {isBloomCamp && (
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-purple-600 shadow-sm">
              ✨ 绽放系列
            </div>
          )}
          {isParentCamp && (
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-emerald-700 shadow-sm">
              👨‍👩‍👧 亲子专题
            </div>
          )}
          {/* 深度转化标签仅桌面端显示 */}
          {isBloomCamp && (
            <div className="hidden sm:block px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-600 shadow-sm">
              🎯 深度转化
            </div>
          )}
          {!isBloomCamp && isPopular && (
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-orange-600 shadow-sm">
              🔥 热门
            </div>
          )}
          {!isBloomCamp && isRecommended && (
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-teal-600 shadow-sm">
              ⭐ 推荐
            </div>
          )}
          {isLocked && (
            <div className="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-muted-foreground shadow-sm flex items-center gap-1">
              <Lock className="w-3 h-3" />
              未解锁
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2 text-3xl sm:text-5xl filter drop-shadow-lg">
          {camp.icon}
        </div>
      </div>

      <CardHeader className="relative z-10 pt-2 pb-1 sm:pt-3 sm:pb-2">
        {/* 标题行：标题 + 天数徽章 */}
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-xl line-clamp-1 text-teal-800 dark:text-teal-200 flex-1 min-w-0">
            {camp.camp_name}
          </CardTitle>
          <Badge className={`bg-gradient-to-r ${camp.gradient} text-white border-0 shrink-0 text-[10px] sm:text-xs`}>
            {camp.duration_days}天
          </Badge>
        </div>
        {/* subtitle：始终显示 */}
        {camp.camp_subtitle && (
          <p className="text-xs sm:text-sm text-teal-600/80 dark:text-teal-400/80 line-clamp-1 mt-0.5">
            {camp.camp_subtitle}
          </p>
        )}
      </CardHeader>

      <CardContent className="relative z-10 space-y-2 flex-1 pt-0">
        {/* description：仅桌面端显示 */}
        {camp.description && (
          <p className="hidden sm:block text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {camp.description}
          </p>
        )}

        {/* 阶课程徽章 */}
        {camp.stages && camp.stages.length > 0 && (
          <Badge variant="outline" className="border-teal-300/50 text-teal-600 dark:border-teal-700/50 dark:text-teal-400 text-[10px] sm:text-xs">
            {camp.stages.length}阶课程
          </Badge>
        )}

        {/* 价格信息 */}
        {camp.price !== undefined && camp.price !== null && (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {Number(camp.original_price) > Number(camp.price) && Number(camp.original_price) > 0 && (
              <span className="text-muted-foreground line-through text-xs">
                ¥{formatMoney(camp.original_price)}
              </span>
            )}
            <span className="text-lg sm:text-2xl font-bold text-teal-600 dark:text-teal-400">
              ¥{formatMoney(camp.price)}
            </span>
            {camp.price_note && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px]">
                {camp.price_note}
              </Badge>
            )}
          </div>
        )}

        {isLocked && camp.prerequisites?.message && (
          <div className="bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3 h-3 shrink-0" />
              {camp.prerequisites.message}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10 mt-auto pt-0">
        {isLocked ? (
          <Button disabled className="w-full gap-2" size="sm">
            暂未解锁
          </Button>
        ) : isPaidCamp ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPurchase?.(camp);
            }}
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4" />
            购买 ¥{formatMoney(camp.price)}
          </Button>
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
            size="sm"
          >
            {isBloomCamp ? '✨ 开启绽放之旅' : '立即开启'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
