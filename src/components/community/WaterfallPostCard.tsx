import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const WaterfallPostCard = ({ post }: WaterfallPostCardProps) => {
  const navigate = useNavigate();
  
  // 获取第一张图片作为封面
  const coverImage = post.image_urls && post.image_urls.length > 0 
    ? post.image_urls[0] 
    : null;

  // 截取标题，最多显示两行
  const displayTitle = post.title || post.content || "无标题";
  
  // 显示用户名或匿名
  const displayName = post.is_anonymous ? "匿名用户" : `用户${post.user_id.slice(0, 6)}`;

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
          <img 
            src={coverImage} 
            alt={displayTitle}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
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

          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-xs">{post.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WaterfallPostCard;
