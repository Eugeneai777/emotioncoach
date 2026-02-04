import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users, MapPin, Video } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TeamCoachingSession } from "@/hooks/useTeamCoaching";

interface TeamCoachingCardProps {
  session: TeamCoachingSession;
  onClick?: () => void;
}

export function TeamCoachingCard({ session, onClick }: TeamCoachingCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(price);
  };

  const isFull = (session.current_count || 0) >= session.max_participants;
  const partnerProfile = session.partner?.profiles;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* 封面图 */}
      {session.cover_image_url && (
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={session.cover_image_url} 
            alt={session.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          {isFull && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">已满员</span>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{session.title}</h3>
          {session.is_free ? (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 shrink-0">
              免费
            </Badge>
          ) : (
            <span className="text-primary font-bold shrink-0">
              ¥{formatPrice(session.price || 0)}
            </span>
          )}
        </div>
        
        {session.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {session.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 主持人信息 */}
        {partnerProfile && (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={partnerProfile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {partnerProfile.display_name?.[0] || 'P'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {partnerProfile.display_name || '合伙人'}
            </span>
          </div>
        )}

        {/* 时间和地点 */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(session.session_date), 'M月d日', { locale: zhCN })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{session.start_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-1">
            {session.location_type === 'online' ? (
              <>
                <Video className="w-4 h-4" />
                <span>线上</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>线下</span>
              </>
            )}
          </div>
        </div>

        {/* 人数进度 */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(((session.current_count || 0) / session.max_participants) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {session.current_count || 0}/{session.max_participants}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
