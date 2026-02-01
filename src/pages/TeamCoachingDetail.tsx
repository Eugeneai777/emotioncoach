import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Video, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useSessionDetail } from "@/hooks/useTeamCoaching";
import { EnrollButton } from "@/components/team-coaching/EnrollButton";
import { toast } from "sonner";

export default function TeamCoachingDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useSessionDetail(id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(price);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: session?.title || '团队教练课程',
          text: session?.description || '',
          url,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-5 w-24" />
            <div className="w-10" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">课程不存在</p>
          <Button variant="link" onClick={() => navigate('/team-coaching')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const partnerProfile = session.partner?.profiles;
  const isFull = (session.current_count || 0) >= session.max_participants;
  const progress = ((session.current_count || 0) / session.max_participants) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-sm truncate max-w-[200px]">
            {session.title}
          </h1>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 封面图 */}
      {session.cover_image_url && (
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={session.cover_image_url} 
            alt={session.title}
            className="w-full h-full object-cover"
          />
          {isFull && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold text-xl">已满员</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* 标题和价格 */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold flex-1">{session.title}</h1>
            {session.is_free ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-base px-3 py-1">
                免费
              </Badge>
            ) : (
              <span className="text-xl font-bold text-primary">
                ¥{formatPrice(session.price || 0)}
              </span>
            )}
          </div>
          {session.description && (
            <p className="text-muted-foreground">{session.description}</p>
          )}
        </div>

        {/* 主持人信息 */}
        {partnerProfile && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="w-10 h-10">
              <AvatarImage src={partnerProfile.avatar_url || undefined} />
              <AvatarFallback>
                {partnerProfile.display_name?.[0] || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{partnerProfile.display_name || '合伙人'}</p>
              <p className="text-sm text-muted-foreground">课程主持人</p>
            </div>
          </div>
        )}

        {/* 时间地点信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {format(new Date(session.session_date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
              </p>
              <p className="text-sm text-muted-foreground">课程日期</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
              </p>
              <p className="text-sm text-muted-foreground">
                {session.duration_minutes ? `约${session.duration_minutes}分钟` : '课程时间'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {session.location_type === 'online' ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <MapPin className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {session.location_type === 'online' ? '线上直播' : session.location_info || '线下活动'}
              </p>
              <p className="text-sm text-muted-foreground">
                {session.location_type === 'online' ? '报名后获取直播链接' : '详细地址'}
              </p>
            </div>
          </div>

          {/* 人数进度 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {session.current_count || 0}/{session.max_participants}人
                </p>
                {isFull && (
                  <span className="text-sm text-destructive">已满</span>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 课程内容 */}
        {session.content && (
          <div className="space-y-2">
            <h2 className="font-semibold">课程内容</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {session.content}
            </div>
          </div>
        )}
      </div>

      {/* 底部固定报名按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <EnrollButton session={session} className="w-full h-12 text-base" />
      </div>
    </div>
  );
}
