import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Lock, Users, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, memo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getCoachSpaceInfo } from "@/utils/coachSpaceUtils";
import ProgressiveImage from "./ProgressiveImage";

interface WaterfallPostCardProps {
  post: {
    id: string;
    user_id: string;
    post_type: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    is_anonymous: boolean;
    visibility?: string;
    likes_count: number;
    created_at: string;
    camp_id?: string;
    camp_type?: string;
    camp_name?: string;
    template_id?: string;
    badges?: {
      coachType?: 'emotion' | 'communication' | 'parent' | 'vibrant_life';
      coachLabel?: string;
      coachEmoji?: string;
      campName?: string;
      [key: string]: unknown;
    };
    author_display_name?: string | null;
    author_avatar_url?: string | null;
    is_pinned?: boolean;
  };
  isLiked?: boolean;
  onCardClick?: (postId: string) => void;
  onLikeChange?: (postId: string, isLiked: boolean) => void;
}

const WaterfallPostCard = memo(({ post, isLiked = false, onCardClick, onLikeChange }: WaterfallPostCardProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [loading, setLoading] = useState(false);

  // 同步 isLiked prop 到本地状态
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);
  
  // 获取第一张图片作为封面
  const coverImage = post.image_urls && post.image_urls.length > 0 
    ? post.image_urls[0] 
    : null;

  // 截取标题，最多显示两行
  const displayTitle = post.title || post.content || "无标题";
  
  // 显示用户名或匿名
  const displayName = post.is_anonymous 
    ? "匿名用户" 
    : (post.author_display_name || `用户${post.user_id.slice(0, 6)}`);

  // 处理头像点击跳转
  const handleAvatarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.is_anonymous) {
      navigate(`/user/${post.user_id}`);
    }
  }, [post.is_anonymous, post.user_id, navigate]);
  
  // 获取教练空间信息 - 传入 badges
  const coachSpace = getCoachSpaceInfo(
    post.camp_type,
    post.camp_name,
    post.template_id,
    post.badges
  );

  // 处理点赞
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止卡片点击事件

    if (!session?.user) {
      toast({
        title: "请先登录",
        description: "登录后才能点赞",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", session.user.id);

        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
        onLikeChange?.(post.id, false);
      } else {
        await supabase
          .from("post_likes")
          .insert({
            post_id: post.id,
            user_id: session.user.id,
          });

        setLiked(true);
        setLikesCount((prev) => prev + 1);
        onLikeChange?.(post.id, true);
      }
    } catch (error) {
      console.error("点赞操作失败:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session, loading, liked, likesCount, post.id, toast, onLikeChange]);

  const handleClick = useCallback(() => {
    if (onCardClick) {
      onCardClick(post.id);
    } else {
      navigate("/community");
    }
  }, [onCardClick, post.id, navigate]);

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 group mb-4 touch-manipulation bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-white/50 dark:border-gray-700/40 hover:bg-white/90 dark:hover:bg-gray-800/70 shadow-sm hover:shadow-teal-100/50 dark:hover:shadow-teal-900/30"
      onClick={handleClick}
    >
      {/* 置顶标记 */}
      {post.is_pinned && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-0.5 bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
          <Pin className="h-3 w-3" />
          <span>置顶</span>
        </div>
      )}
      {/* 图片区域 - 使用渐进式加载组件 */}
      {coverImage ? (
        <div className="relative w-full overflow-hidden">
          <ProgressiveImage
            src={coverImage}
            alt={displayTitle}
            className="group-hover:scale-105 transition-transform duration-300 max-h-[280px]"
          />
          {/* 教练空间标签 */}
          {coachSpace && (
            <div className={cn(
              "absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium z-10",
              "flex items-center gap-1 backdrop-blur-md shadow-sm bg-white/80 dark:bg-gray-800/80",
              coachSpace.colorClass
            )}>
              <span>{coachSpace.emoji}</span>
              <span>{coachSpace.shortName}</span>
            </div>
          )}
        </div>
      ) : null}
      {/* 标题区域 */}
      <div className={cn("p-3", !coverImage && "pt-4")}>
        {/* 无图帖子在文字区域显示教练空间标签 */}
        {!coverImage && coachSpace && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2",
            "backdrop-blur-md shadow-sm bg-white/80 dark:bg-gray-800/80",
            coachSpace.colorClass
          )}>
            <span>{coachSpace.emoji}</span>
            <span>{coachSpace.shortName}</span>
          </div>
        )}
        <h3 className={cn(
          "text-sm font-medium text-foreground mb-2 leading-relaxed flex items-start gap-1",
          coverImage ? "line-clamp-2" : "line-clamp-4"
        )}>
          {post.visibility === 'private' && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />}
          {post.visibility === 'followers_only' && <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />}
          {displayTitle}
        </h3>

        {/* 用户信息和点赞 */}
        <div className="flex items-center justify-between">
          <div 
            className={cn(
              "flex items-center gap-1.5",
              !post.is_anonymous && "cursor-pointer hover:opacity-80"
            )}
            onClick={handleAvatarClick}
          >
            <Avatar className="w-5 h-5 ring-1 ring-teal-200/50">
              {post.author_avatar_url && !post.is_anonymous && (
                <AvatarImage src={post.author_avatar_url} alt={displayName} />
              )}
              <AvatarFallback className="text-xs bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700">
                {post.is_anonymous ? '?' : displayName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {displayName}
            </span>
          </div>

          {/* 快速点赞按钮 - 增加触摸区域 */}
          <button
            onClick={handleLike}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={loading}
            className={cn(
              "flex items-center gap-1 p-2 -m-2 min-w-[44px] min-h-[44px] justify-center active:scale-95 transition-all duration-150 touch-manipulation rounded-full",
              liked
                ? "text-rose-500"
                : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50/50",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-all",
                liked && "fill-current scale-110"
              )}
            />
            <span className="text-xs">{likesCount || 0}</span>
          </button>
        </div>
      </div>
    </Card>
  );
});

WaterfallPostCard.displayName = 'WaterfallPostCard';

export default WaterfallPostCard;
