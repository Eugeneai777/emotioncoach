import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachRecommendations, type RecommendedCoach } from "@/hooks/useCoachRecommendations";
import { CoachBadge } from "./CoachBadge";
import { CoachRatingDisplay } from "./CoachRatingDisplay";
import { Sparkles, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

interface CoachRecommendationsProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function CoachRecommendations({ 
  limit = 3, 
  showTitle = true,
  className = "" 
}: CoachRecommendationsProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useCoachRecommendations(limit);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">为你推荐</h3>
          </div>
        )}
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">智能推荐</h3>
            {data.has_user_profile && (
              <Badge variant="secondary" className="text-xs">
                基于你的情绪画像
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => navigate("/human-coaches")}
          >
            查看全部
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {data.recommendations.map((coach, index) => (
          <RecommendedCoachCard 
            key={coach.id} 
            coach={coach} 
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendedCoachCardProps {
  coach: RecommendedCoach;
  rank: number;
}

function RecommendedCoachCard({ coach, rank }: RecommendedCoachCardProps) {
  const navigate = useNavigate();

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: "最佳匹配", className: "bg-amber-100 text-amber-700 border-amber-200" };
    if (rank === 2) return { text: "高度推荐", className: "bg-teal-100 text-teal-700 border-teal-200" };
    return { text: "推荐", className: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const rankBadge = getRankBadge(rank);

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group border-l-4 border-l-teal-400"
      onClick={() => navigate(`/human-coaches/${coach.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
              <AvatarImage src={coach.avatar_url || undefined} alt={coach.name} />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                {coach.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            {coach.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-semibold text-sm">{coach.name}</h4>
                <CoachBadge badgeType={coach.badge_type} size="sm" showLabel={false} />
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0 ${rankBadge.className}`}
                >
                  {rankBadge.text}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>{coach.match_score.toFixed(0)}分</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">{coach.title}</p>

            {/* Rating */}
            <div className="mt-1.5">
              <CoachRatingDisplay 
                rating={Number(coach.rating)} 
                totalReviews={coach.total_reviews}
                size="sm"
              />
            </div>

            {/* Match reasons */}
            <div className="mt-2 flex flex-wrap gap-1">
              {coach.match_reasons.map((reason, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-xs bg-teal-50 text-teal-700 border-0"
                >
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Action hint */}
        <div className="mt-3 flex justify-end">
          <span className="text-xs text-muted-foreground group-hover:text-teal-600 transition-colors">
            点击查看详情 →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
