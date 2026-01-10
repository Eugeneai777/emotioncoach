import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fourPoorInfo, emotionBlockInfo, beliefBlockInfo } from "@/components/wealth-block/wealthBlockData";
import { Target, Brain, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentFocusCardProps {
  variant?: "intro" | "checkin";
  className?: string;
}

export function AssessmentFocusCard({ variant = "intro", className }: AssessmentFocusCardProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-wealth-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_wealth_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !profile) return null;

  const poorType = profile.dominant_poor as keyof typeof fourPoorInfo;
  const emotionType = profile.dominant_emotion as keyof typeof emotionBlockInfo;
  const beliefType = profile.dominant_belief as keyof typeof beliefBlockInfo;

  const poorInfo = poorType ? fourPoorInfo[poorType] : null;
  const emotionInfo = emotionType ? emotionBlockInfo[emotionType] : null;
  const beliefInfo = beliefType ? beliefBlockInfo[beliefType] : null;

  if (!poorInfo && !emotionInfo && !beliefInfo) return null;

  // 构建训练重点
  const focusAreas = [
    poorInfo && {
      layer: "行为层",
      icon: Target,
      name: poorInfo.name,
      description: poorInfo.description,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    emotionInfo && {
      layer: "情绪层",
      icon: Heart,
      name: emotionInfo.name,
      description: emotionInfo.description,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/30",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
    beliefInfo && {
      layer: "信念层",
      icon: Brain,
      name: beliefInfo.name,
      description: beliefInfo.description,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
      borderColor: "border-violet-200 dark:border-violet-800",
    },
  ].filter(Boolean);

  if (variant === "checkin") {
    return (
      <div className={cn(
        "p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              📍 基于你的测评结果，今日重点练习：
            </p>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area, index) => (
                <span 
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    area!.bgColor,
                    area!.borderColor,
                    "border"
                  )}
                >
                  <span className="text-foreground">{area!.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Intro variant - 更详细的展示
  return (
    <div className={cn(
      "rounded-2xl overflow-hidden border border-amber-200",
      className
    )}>
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            🎯 基于你的测评结果，我们将重点练习：
          </span>
        </div>
      </div>
      
      <div className="p-4 bg-white/80 dark:bg-background/80 space-y-3">
        {focusAreas.map((area, index) => {
          const Icon = area!.icon;
          return (
            <div 
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                area!.bgColor,
                area!.borderColor,
                "border"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                area!.color
              )}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground">{area!.layer}</span>
                  <span className="text-sm font-semibold text-foreground">{area!.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {area!.description}
                </p>
              </div>
            </div>
          );
        })}
        
        <p className="text-xs text-center text-muted-foreground pt-2">
          财富觉醒训练营将帮助你逐层觉醒，突破这些卡点
        </p>
      </div>
    </div>
  );
}
