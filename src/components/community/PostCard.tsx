import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import ShareButton from "./ShareButton";
import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    post_type: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    camp_day: number | null;
    badges: any;
    is_anonymous: boolean;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
  };
  onUpdate: () => void;
}

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  // 实时监听点赞和评论变化
  useEffect(() => {
    console.log(`[PostCard] Setting up realtime for post ${post.id}`);

    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_posts",
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          console.log(`[PostCard] Received update for post ${post.id}:`, payload);
          if (payload.eventType === "UPDATE" && payload.new) {
            const newData = payload.new as any;
            setLikesCount(newData.likes_count);
            setCommentsCount(newData.comments_count);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[PostCard] Subscription status for post ${post.id}:`, status);
      });

    return () => {
      console.log(`[PostCard] Cleaning up realtime for post ${post.id}`);
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "story":
        return "🌸";
      case "checkin":
        return "📅";
      case "achievement":
        return "🏆";
      case "reflection":
        return "💭";
      default:
        return "✨";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "story":
        return "今日绽放";
      case "checkin":
        return "打卡记录";
      case "achievement":
        return "成就解锁";
      case "reflection":
        return "深度反思";
      default:
        return "分享";
    }
  };

  const displayName = post.is_anonymous ? "匿名用户" : "用户";

  return (
    <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.is_anonymous ? "匿" : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                locale: zhCN,
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {getTypeEmoji(post.post_type)} {getTypeLabel(post.post_type)}
        </Badge>
      </div>

      {/* 副标题：训练营信息（兼容新旧数据） */}
      {(() => {
        const campSubtitle = post.badges?.campInfo || 
          (post.badges?.campName && post.badges?.day !== undefined 
            ? `${post.badges.campName} - 第${post.badges.day}天打卡` 
            : null);
        
        return campSubtitle ? (
          <p className="text-sm text-muted-foreground mb-1">
            {campSubtitle}
          </p>
        ) : null;
      })()}

      {/* 主标题：用户自定义标题 */}
      {post.title && (
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          {post.title}
        </h3>
      )}

      {/* 内容 */}
      {post.content && (
        <p className="text-foreground/80 mb-4 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {post.image_urls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`分享图片 ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* 情绪主题 */}
      {post.emotion_theme && (
        <div className="mb-3">
          <Badge variant="outline" className="text-sm">
            情绪: {post.emotion_theme}
            {post.emotion_intensity && ` · 强度 ${post.emotion_intensity}/10`}
          </Badge>
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div className="space-y-2 mb-4 p-3 bg-secondary/30 rounded-lg">
          {post.insight && (
            <p className="text-sm">
              <span className="font-medium text-primary">💡 洞察：</span>
              {post.insight}
            </p>
          )}
          {post.action && (
            <p className="text-sm">
              <span className="font-medium text-primary">🎯 行动：</span>
              {post.action}
            </p>
          )}
        </div>
      )}

      {/* 打卡天数 */}
      {post.camp_day && (
        <Badge variant="secondary" className="mb-3">
          第 {post.camp_day} 天打卡
        </Badge>
      )}

      {/* 勋章 */}
      {post.badges && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(post.badges).map(([key, badge]: [string, any]) => (
            <Badge key={key} variant="outline">
              {badge.icon} {badge.name}
            </Badge>
          ))}
        </div>
      )}

      {/* 互动按钮 */}
      <div className="flex items-center gap-6 pt-3 border-t">
        <LikeButton
          postId={post.id}
          initialLikesCount={likesCount}
          onUpdate={onUpdate}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">{commentsCount}</span>
        </button>
        <ShareButton post={post} />
      </div>

      {/* 评论区 */}
      {showComments && (
        <CommentSection postId={post.id} onUpdate={onUpdate} />
      )}
    </Card>
  );
};

export default PostCard;
