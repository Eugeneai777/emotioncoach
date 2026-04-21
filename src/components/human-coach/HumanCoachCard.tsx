import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CoachBadge } from "./CoachBadge";
import { CoachRatingDisplay } from "./CoachRatingDisplay";
import { type HumanCoach } from "@/hooks/useHumanCoaches";
import { Clock, Users, CheckCircle, User } from "lucide-react";

interface HumanCoachCardProps {
  coach: HumanCoach;
}

export function HumanCoachCard({ coach }: HumanCoachCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/human-coaches/${coach.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3 sm:gap-4">
          {/* 3:4 照片 */}
          <div className="relative w-[72px] sm:w-20 shrink-0">
            <AspectRatio ratio={3 / 4}>
              <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-muted">
                {coach.avatar_url ? (
                  <img 
                    src={coach.avatar_url} 
                    alt={coach.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500">
                    <span className="text-2xl font-bold text-white">
                      {coach.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </AspectRatio>
            {coach.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
            )}
          </div>
          
          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-semibold text-base sm:text-lg">{coach.name}</h3>
              <CoachBadge badgeType={coach.badge_type} size="sm" showLabel={false} />
            </div>
            {coach.title && (
              <p className="text-sm text-muted-foreground truncate">{coach.title}</p>
            )}
            
            {/* 评分 */}
            <div className="mt-1.5">
              <CoachRatingDisplay 
                rating={Number(coach.rating)} 
                totalReviews={coach.total_reviews}
                size="sm"
              />
            </div>
            
            {/* 专业领域 */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {coach.specialties?.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs px-1.5 py-0">
                  {specialty}
                </Badge>
              ))}
            </div>
            
            {/* 统计 */}
            <div className="mt-2 flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {coach.experience_years}年
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {coach.total_sessions}次
              </span>
              <span className="text-teal-600 font-medium">
                {Number(coach.positive_rate).toFixed(0)}%好评
              </span>
            </div>
          </div>
        </div>
        
        {/* 简介 */}
        {coach.bio && (
          <p className="mt-2.5 text-sm text-muted-foreground line-clamp-2">
            {coach.bio}
          </p>
        )}
        
        {/* 操作按钮 */}
        <div className="mt-3 flex justify-end">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/human-coaches/${coach.id}`);
            }}
          >
            查看详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
