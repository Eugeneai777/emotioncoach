import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import { useState, useEffect } from "react";
import { MessageCircle, Star, Pencil, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  if (!post) return null;

  const { session } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 检查是否已关注
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session || !post || session.user.id === post.user_id || post.is_anonymous) return;
      
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", session.user.id)
        .eq("following_id", post.user_id)
        .maybeSingle();
      
      setIsFollowing(!!data);
    };

    const fetchFollowersCount = async () => {
      if (!post || post.is_anonymous) return;
      
      const { count } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", post.user_id);
      
      setFollowersCount(count || 0);
    };

    checkFollowStatus();
    fetchFollowersCount();
  }, [session, post?.user_id, post?.is_anonymous]);

  // 检查是否已点赞
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!session?.user || !post) return;

      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      setLiked(!!data);
    };

    checkIfLiked();
    setLikesCount(post?.likes_count || 0);
  }, [session, post?.id]);

  // 关注/取消关注
  const handleFollowToggle = async () => {
    if (!session) {
      toast.error("请先登录");
      return;
    }

    if (post.is_anonymous) {
      toast.error("无法关注匿名用户");
      return;
    }

    if (session.user.id === post.user_id) {
      toast.error("不能关注自己");
      return;
    }

    setIsLoadingFollow(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", session.user.id)
          .eq("following_id", post.user_id);

        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success("已取消关注");
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: session.user.id,
            following_id: post.user_id,
          });

        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success("关注成功");
      }
    } catch (error) {
      console.error("关注操作失败:", error);
      toast.error("操作失败，请重试");
    } finally {
      setIsLoadingFollow(false);
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!session?.user) {
      toast.error("请先登录");
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", session.user.id);

        await supabase
          .from("community_posts")
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq("id", post.id);
        
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: post.id, user_id: session.user.id });

        await supabase
          .from("community_posts")
          .update({ likes_count: likesCount + 1 })
          .eq("id", post.id);
        
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("点赞失败:", error);
      toast.error("操作失败");
    }
  };

  // 处理评论提交
  const handleSubmitComment = async () => {
    if (!session?.user) {
      toast.error("请先登录");
      return;
    }

    if (!newComment.trim()) {
      toast.error("评论不能为空");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: session.user.id,
        content: newComment.trim(),
        is_anonymous: false,
      });

      if (error) throw error;

      // 更新评论数
      const { data: postData } = await supabase
        .from("community_posts")
        .select("comments_count")
        .eq("id", post.id)
        .single();

      if (postData) {
        await supabase
          .from("community_posts")
          .update({ comments_count: postData.comments_count + 1 })
          .eq("id", post.id);
      }

      setNewComment("");
      toast.success("评论成功");
      
      // 刷新评论区
      window.location.reload();
    } catch (error) {
      console.error("发表评论失败:", error);
      toast.error("评论失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

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

            {/* 评论区 */}
            <div className="mt-6 pb-24">
              <CommentSection
                postId={post.id}
                onUpdate={() => {}}
              />
            </div>
          </div>
        </ScrollArea>

        {/* 底部固定互动栏 - 小红书风格 */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 flex items-center gap-3 z-50">
          {/* 评论输入框 */}
          {session ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="说点什么..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm outline-none focus:bg-muted/70 transition-colors"
              />
              {newComment.trim() && (
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "发送中..." : "发送"}
                </button>
              )}
            </div>
          ) : (
            <div 
              className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2.5 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => toast.error("请先登录")}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">说点什么...</span>
            </div>
          )}
          
          {/* 点赞 */}
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5 min-w-[48px] hover:scale-110 transition-transform"
          >
            <Heart className={cn(
              "h-6 w-6 transition-colors",
              liked ? "fill-red-500 text-red-500" : "text-foreground"
            )} />
            <span className="text-xs text-muted-foreground">{likesCount}</span>
          </button>
          
          {/* 关注 - 星星图标 */}
          {!post.is_anonymous && session?.user?.id !== post.user_id && (
            <button 
              onClick={handleFollowToggle}
              disabled={isLoadingFollow}
              className="flex flex-col items-center gap-0.5 min-w-[48px] hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Star className={cn(
                "h-6 w-6 transition-colors",
                isFollowing ? "fill-yellow-400 text-yellow-400" : "text-foreground"
              )} />
              <span className="text-xs text-muted-foreground">{followersCount}</span>
            </button>
          )}
          
          {/* 评论 */}
          <button 
            className="flex flex-col items-center gap-0.5 min-w-[48px] hover:scale-110 transition-transform"
            onClick={() => {
              const commentSection = document.querySelector('[data-comment-section]');
              commentSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <MessageCircle className="h-6 w-6 text-foreground" />
            <span className="text-xs text-muted-foreground">{post.comments_count || 0}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PostDetailSheet;
