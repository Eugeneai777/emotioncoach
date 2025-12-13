import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CoachRatingDisplay } from "./CoachRatingDisplay";
import { type AppointmentReview } from "@/hooks/useHumanCoaches";
import { MessageSquare } from "lucide-react";

interface ReviewCardProps {
  review: AppointmentReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const displayName = review.is_anonymous ? "匿名用户" : `用户${review.user_id.slice(0, 4)}`;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700">
              {review.is_anonymous ? "匿" : displayName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "yyyy年M月d日", { locale: zhCN })}
              </span>
            </div>
            
            {/* 评分 */}
            <div className="mt-1">
              <CoachRatingDisplay 
                rating={review.rating_overall} 
                size="sm" 
                showCount={false}
              />
            </div>
            
            {/* 快捷标签 */}
            {review.quick_tags && review.quick_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {review.quick_tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* 评价内容 */}
            {review.comment && (
              <p className="mt-2 text-sm text-foreground">
                {review.comment}
              </p>
            )}
            
            {/* 教练回复 */}
            {review.coach_reply && (
              <div className="mt-3 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MessageSquare className="w-3 h-3" />
                  教练回复
                </div>
                <p className="text-sm">{review.coach_reply}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
