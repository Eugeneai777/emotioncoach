import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import type { CampTemplate } from "@/types/trainingCamp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampTemplateCardProps {
  camp: CampTemplate;
  index: number;
  enrolledCount?: number;
  onClick: () => void;
}

export function CampTemplateCard({ camp, index, enrolledCount = 0, onClick }: CampTemplateCardProps) {
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

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4 ${
        isLocked ? 'opacity-60' : 'cursor-pointer'
      } ${
        isBloomCamp 
          ? 'ring-2 ring-purple-200/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' 
          : isParentCamp
          ? 'ring-2 ring-emerald-200/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
          : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      onClick={!isLocked ? onClick : undefined}
    >
      {/* 封面背景 */}
      <div className={`relative ${isBloomCamp || isParentCamp ? 'h-40' : 'h-32'} bg-gradient-to-br ${camp.gradient} overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
        
        {/* 绽放系列装饰图案 */}
        {isBloomCamp && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 right-4 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute top-1/2 right-8 w-16 h-16 border border-white/20 rounded-full" />
          </div>
        )}
        
        {/* 绽放系列徽章 */}
        {isBloomCamp && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-600 shadow-sm">
            ✨ 绽放系列
          </div>
        )}
        
        {/* 亲子专题徽章 */}
        {isParentCamp && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
            👨‍👩‍👧 亲子专题
          </div>
        )}
        
        <div className="absolute top-3 right-3 flex gap-2">
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
            <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-purple-600 shadow-sm">
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
        <CardTitle className="text-2xl">{camp.camp_name}</CardTitle>
        <CardDescription className="text-base">
          {camp.camp_subtitle}
          {isParentCamp && (
            <span className="block text-emerald-600 font-medium mt-1">
              专为青春期父母设计
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-muted-foreground leading-relaxed">{camp.description}</p>
        
        <div className="flex flex-wrap gap-2">
          <Badge className={`bg-gradient-to-r ${camp.gradient} text-white border-0`}>
            {camp.duration_days}天
          </Badge>
          {camp.stages && camp.stages.length > 0 && (
            <Badge variant="outline">
              {camp.stages.length}阶课程
            </Badge>
          )}
          {enrolledCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <span className="text-xs">👥</span>
              {enrolledCount}人已加入
            </Badge>
          )}
        </div>

        {isLocked && camp.prerequisites?.message && (
          <div className="bg-muted/50 p-3 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {camp.prerequisites.message}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10">
        <Button 
          disabled={isLocked}
          className={`w-full gap-2 pointer-events-none ${
            !isLocked 
              ? isBloomCamp
                ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-[length:200%_100%] animate-shimmer text-white hover:opacity-90'
                : `bg-gradient-to-r ${camp.gradient} hover:opacity-90 text-white`
              : ''
          }`}
        >
          {isLocked ? '暂未解锁' : isBloomCamp ? '✨ 开启绽放之旅' : '了解详情'}
          {!isLocked && <ArrowRight className="w-4 h-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
