import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
    likes_count: number;
    created_at: string;
  };
}

const WaterfallPostCard = memo(({ post }: WaterfallPostCardProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 获取第一张图片作为封面
  const coverImage = post.image_urls && post.image_urls.length > 0 
    ? post.image_urls[0] 
    : null;

  // 截取标题，最多显示两行
  const displayTitle = post.title || post.content || "无标题";
  
  // 显示用户名或匿名
  const displayName = post.is_anonymous ? "匿名用户" : `用户${post.user_id.slice(0, 6)}`;

  // 检查是否已点赞
  useEffect(() => {
    checkIfLiked();
  }, [post.id, session]);

  const checkIfLiked = async () => {
    if (!session?.user) return;

    try {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      setLiked(!!data);
    } catch (error) {
      // 未点赞，忽略错误
    }
  };

  // 处理点赞
  const handleLike = async (e: React.MouseEvent) => {
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
        // 取消点赞
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", session.user.id);

        // 更新计数
        await supabase
          .from("community_posts")
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq("id", post.id);

        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // 点赞
        await supabase
          .from("post_likes")
          .insert({
            post_id: post.id,
            user_id: session.user.id,
          });

        // 更新计数
        await supabase
          .from("community_posts")
          .update({ likes_count: likesCount + 1 })
          .eq("id", post.id);

        setLiked(true);
        setLikesCount((prev) => prev + 1);
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
  };

  const handleClick = () => {
    navigate("/community");
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group mb-3"
      onClick={handleClick}
    >
      {/* 图片区域 */}
      {coverImage ? (
        <div className="relative w-full overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="w-full h-40 bg-gradient-to-br from-muted/50 to-muted animate-pulse" />
          )}
          <img 
            src={coverImage} 
            alt={displayTitle}
            className={cn(
              "w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300",
              !imageLoaded && "hidden"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      ) : (
        <div className="relative w-full h-40 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
          <span className="text-4xl opacity-30">
            {post.post_type === 'story' ? '🌸' : 
             post.post_type === 'checkin' ? '📅' :
             post.post_type === 'achievement' ? '🏆' :
             post.post_type === 'reflection' ? '💭' : '✨'}
          </span>
        </div>
      )}

      {/* 标题区域 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 leading-relaxed">
          {displayTitle}
        </h3>

        {/* 用户信息和点赞 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs bg-primary/10">
                {post.is_anonymous ? '?' : displayName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {displayName}
            </span>
          </div>

          {/* 快速点赞按钮 */}
          <button
            onClick={handleLike}
            disabled={loading}
            className={cn(
              "flex items-center gap-1 transition-all duration-200",
              liked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500",
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
