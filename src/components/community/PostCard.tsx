import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import ShareButton from "./ShareButton";
import { useState, useEffect } from "react";
import { MessageCircle, UserPlus, UserCheck, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PostEditDialog from "./PostEditDialog";
import { getCoachSpaceInfo } from "@/utils/coachSpaceUtils";
import { useNavigate } from "react-router-dom";

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
    camp_id?: string;
    camp_type?: string;
    camp_name?: string;
    template_id?: string;
  };
  onUpdate: () => void;
}

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  // 处理删除帖子
  const handleDeletePost = async () => {
    if (!session?.user || session.user.id !== post.user_id) return;
    setDeleting(true);
    try {
      // 1. 删除关联的点赞记录
      await supabase.from("post_likes").delete().eq("post_id", post.id);
      // 2. 删除关联的评论
      await supabase.from("post_comments").delete().eq("post_id", post.id);
      // 3. 删除帖子本身
      const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
      if (error) throw error;
      toast({ title: "帖子已删除" });
      // 触发自定义事件通知父组件刷新
      window.dispatchEvent(new CustomEvent('post-deleted', { detail: { postId: post.id } }));
      onUpdate();
    } catch (error) {
      console.error("删除帖子失败:", error);
      toast({ title: "删除失败，请稍后重试", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };
  
  // 获取教练空间信息
  const coachSpace = getCoachSpaceInfo(
    post.camp_type,
    post.camp_name,
    post.template_id
  );

  // 检查是否已关注
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session || session.user.id === post.user_id) return;

      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", session.user.id)
        .eq("following_id", post.user_id)
        .maybeSingle();

      setIsFollowing(!!data);
    };

    checkFollowStatus();
  }, [session, post.user_id]);

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

  const handleFollowToggle = async () => {
    if (!session) {
      toast({
        title: "请先登录",
        description: "登录后才能关注其他用户",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // 取消关注
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", session.user.id)
          .eq("following_id", post.user_id);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "已取消关注",
        });
      } else {
        // 关注
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: session.user.id,
            following_id: post.user_id,
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "关注成功",
        });
      }
    } catch (error) {
      console.error("关注操作失败:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollow(false);
    }
  };

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
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.is_anonymous ? "匿" : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{displayName}</p>
              {session && session.user.id !== post.user_id && !post.is_anonymous && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  className="h-7 px-3 text-xs"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      已关注
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      关注
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                locale: zhCN,
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user?.id === post.user_id && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEditDialog(true)}
                className="h-8 px-2"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作无法撤销，该帖子及所有评论、点赞将被永久删除。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeletePost} 
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "删除中..." : "确认删除"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          <Badge variant="secondary">
            {getTypeEmoji(post.post_type)} {getTypeLabel(post.post_type)}
          </Badge>
          {/* 教练空间标注 */}
          {coachSpace && (
            <Badge 
              variant="outline" 
              className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${coachSpace.bgClass} ${coachSpace.colorClass} border-0`}
              onClick={() => navigate(coachSpace.routePath)}
            >
              {coachSpace.emoji} {coachSpace.name}
            </Badge>
          )}
        </div>
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

      {/* 编辑弹窗 */}
      <PostEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        post={post}
        onUpdate={onUpdate}
      />
    </Card>
  );
};

export default PostCard;
