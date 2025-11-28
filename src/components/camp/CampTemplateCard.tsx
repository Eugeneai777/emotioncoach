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
  onClick: () => void;
}

export function CampTemplateCard({ camp, index, onClick }: CampTemplateCardProps) {
  // 绽放训练营不检查前置条件锁定
  const isBloomCamp = ['emotion_bloom', 'identity_bloom'].includes(camp.camp_type);
  
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

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4 ${
        isLocked ? 'opacity-60' : 'cursor-pointer'
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${camp.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-5xl">{camp.icon}</span>
          {isLocked && (
            <div className="p-2 rounded-full bg-muted">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">{camp.camp_name}</CardTitle>
        <CardDescription className="text-base">{camp.camp_subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-muted-foreground leading-relaxed">{camp.description}</p>
        
        <div className="flex gap-2">
          {!['emotion_bloom', 'identity_bloom'].includes(camp.camp_type) && (
            <Badge className={`bg-gradient-to-r ${camp.gradient} text-white border-0`}>
              {camp.duration_days}天
            </Badge>
          )}
          {camp.stages && camp.stages.length > 0 && (
            <Badge variant="outline">
              {camp.stages.length}阶课程
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
          className={`w-full gap-2 pointer-events-none ${!isLocked ? `bg-gradient-to-r ${camp.gradient} hover:opacity-90 text-white` : ''}`}
        >
          {isLocked ? '暂未解锁' : '了解详情'}
          {!isLocked && <ArrowRight className="w-4 h-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
