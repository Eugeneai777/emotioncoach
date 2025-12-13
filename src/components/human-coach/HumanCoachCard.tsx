import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoachBadge } from "./CoachBadge";
import { CoachRatingDisplay } from "./CoachRatingDisplay";
import { type HumanCoach } from "@/hooks/useHumanCoaches";
import { Clock, Users, CheckCircle } from "lucide-react";

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
        <div className="flex gap-4">
          {/* 头像 */}
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-background shadow-md">
              <AvatarImage src={coach.avatar_url || undefined} alt={coach.name} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                {coach.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            {coach.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                <CheckCircle className="w-4 h-4 text-teal-500" />
              </div>
            )}
          </div>
          
          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{coach.name}</h3>
                  <CoachBadge badgeType={coach.badge_type} size="sm" showLabel={false} />
                </div>
                <p className="text-sm text-muted-foreground">{coach.title}</p>
              </div>
            </div>
            
            {/* 评分 */}
            <div className="mt-2">
              <CoachRatingDisplay 
                rating={Number(coach.rating)} 
                totalReviews={coach.total_reviews}
                size="sm"
              />
            </div>
            
            {/* 专业领域 */}
            <div className="mt-2 flex flex-wrap gap-1">
              {coach.specialties?.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
            
            {/* 统计 */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {coach.experience_years}年经验
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {coach.total_sessions}次咨询
              </span>
              <span className="text-teal-600 font-medium">
                {Number(coach.positive_rate).toFixed(0)}%好评
              </span>
            </div>
          </div>
        </div>
        
        {/* 简介 */}
        {coach.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {coach.bio}
          </p>
        )}
        
        {/* 操作按钮 */}
        <div className="mt-4 flex justify-end">
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
