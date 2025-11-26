import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import CommentSection from "./CommentSection";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface PostDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  } | null;
}

const PostDetailSheet = ({ open, onOpenChange, post }: PostDetailSheetProps) => {
  const [showComments, setShowComments] = useState(false);

  if (!post) return null;

  const displayName = post.is_anonymous ? "匿名用户" : `用户${post.user_id.slice(0, 6)}`;

  const getTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      story: "🌸",
      checkin: "📅",
      achievement: "🏆",
      reflection: "💭",
      milestone: "🎯",
    };
    return emojiMap[type] || "✨";
  };

  const getTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      story: "成长故事",
      checkin: "每日打卡",
      achievement: "成就分享",
      reflection: "深度反思",
      milestone: "里程碑",
    };
    return labelMap[type] || "分享";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 pb-20">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10">
                    {post.is_anonymous ? "?" : displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <span>{getTypeEmoji(post.post_type)}</span>
                  {getTypeLabel(post.post_type)}
                </Badge>
              </div>
            </SheetHeader>

            {/* 标题 */}
            {post.title && (
              <SheetTitle className="text-xl font-bold mb-4 text-foreground">
                {post.title}
              </SheetTitle>
            )}

            {/* 图片展示 */}
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`图片 ${index + 1}`}
                    className="w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* 内容 */}
            {post.content && (
              <div className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* 情绪信息 */}
            {post.emotion_theme && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">情绪主题</span>
                  <Badge variant="secondary">{post.emotion_theme}</Badge>
                  {post.emotion_intensity && (
                    <Badge variant="outline">强度: {post.emotion_intensity}</Badge>
                  )}
                </div>
                {post.insight && (
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">💡 觉察：</span>
                    {post.insight}
                  </div>
                )}
                {post.action && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">🎯 行动：</span>
                    {post.action}
                  </div>
                )}
              </div>
            )}

            {/* 训练营信息 */}
            {post.camp_day && (
              <Badge variant="outline" className="mb-4">
                训练营第 {post.camp_day} 天
              </Badge>
            )}

            {/* 成就徽章 */}
            {post.badges && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(post.badges) &&
                  post.badges.map((badge: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {badge.icon} {badge.name}
                    </Badge>
                  ))}
              </div>
            )}

            {/* 互动按钮 */}
            <div className="flex items-center gap-4 py-4 border-y border-border">
              <LikeButton postId={post.id} initialLikesCount={post.likes_count} />
              
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{post.comments_count || 0}</span>
              </button>

              <ShareButton post={post} />
            </div>

            {/* 评论区 */}
            <div className="mt-6">
              <CommentSection
                postId={post.id}
                onUpdate={() => {}}
              />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default PostDetailSheet;
