import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CampCoachCardProps {
  coach: {
    id: string;
    name: string;
    avatar_url: string | null;
    title: string | null;
    specialties: string[] | null;
    rating: number | null;
    total_sessions: number | null;
  };
}

export function CampCoachCard({ coach }: CampCoachCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-pink-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={coach.avatar_url || ''} alt={coach.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {coach.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
              <Award className="h-3 w-3" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{coach.name}</h4>
              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs">
                您的专属教练
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {coach.title || '情绪教练'}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {coach.rating && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {Number(coach.rating).toFixed(1)}
                </span>
              )}
              {coach.total_sessions && coach.total_sessions > 0 && (
                <span>{coach.total_sessions}次服务</span>
              )}
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/human-coach/${coach.id}`)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            联系
          </Button>
        </div>

        {coach.specialties && coach.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {coach.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
