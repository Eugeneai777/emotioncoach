import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import PostEditDialog from "./PostEditDialog";
import ShareCard from "./ShareCard";
import ShareCardExport from "./ShareCardExport";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Star, Pencil, Heart, Trash2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCoachSpaceInfo } from "@/utils/coachSpaceUtils";
import { useNavigate } from "react-router-dom";
import { generateCardBlob } from "@/utils/shareCardConfig";
import { handleShareWithFallback, getShareEnvironment } from "@/utils/shareUtils";
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
    camp_id?: string;
    camp_type?: string;
    camp_name?: string;
    template_id?: string;
  } | null;
}
const PostDetailSheet = ({
  open,
  onOpenChange,
  post
}: PostDetailSheetProps) => {
  if (!post) return null;
  const navigate = useNavigate();
  const {
    session
  } = useAuth();
  const {
    partner,
    isPartner
  } = usePartner();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const partnerInfo = {
    isPartner,
    partnerId: partner?.id
  };
  
  const { isWeChat } = getShareEnvironment();

  // 获取教练空间信息
  const coachSpace = getCoachSpaceInfo(post.camp_type, post.camp_name, post.template_id);

  // 获取作者资料
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (!post || post.is_anonymous) {
        setAuthorProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", post.user_id)
        .maybeSingle();
      setAuthorProfile(data);
    };
    fetchAuthorProfile();
  }, [post?.user_id, post?.is_anonymous]);

  // 检查是否已关注
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session || !post || session.user.id === post.user_id || post.is_anonymous) return;
      const {
        data
      } = await supabase.from("user_follows").select("id").eq("follower_id", session.user.id).eq("following_id", post.user_id).maybeSingle();
      setIsFollowing(!!data);
    };
    const fetchFollowersCount = async () => {
      if (!post || post.is_anonymous) return;
      const {
        count
      } = await supabase.from("user_follows").select("*", {
        count: "exact",
        head: true
      }).eq("following_id", post.user_id);
      setFollowersCount(count || 0);
    };
    checkFollowStatus();
    fetchFollowersCount();
  }, [session, post?.user_id, post?.is_anonymous]);

  // 检查是否已点赞并同步点赞数
  useEffect(() => {
    if (!open || !post) return;
    
    const checkIfLiked = async () => {
      if (!session?.user) return;
      const {
        data
      } = await supabase.from("post_likes").select("id").eq("post_id", post.id).eq("user_id", session.user.id).maybeSingle();
      setLiked(!!data);
    };
    
    checkIfLiked();
    setLikesCount(post.likes_count || 0);
    setNewComment("");
  }, [open, session, post?.id, post?.likes_count]);

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
        const {
          error
        } = await supabase.from("user_follows").delete().eq("follower_id", session.user.id).eq("following_id", post.user_id);
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success("已取消关注");
      } else {
        const {
          error
        } = await supabase.from("user_follows").insert({
          follower_id: session.user.id,
          following_id: post.user_id
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
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.user.id);
        await supabase.from("community_posts").update({
          likes_count: Math.max(0, likesCount - 1)
        }).eq("id", post.id);
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: session.user.id
        });
        await supabase.from("community_posts").update({
          likes_count: likesCount + 1
        }).eq("id", post.id);
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("点赞失败:", error);
      toast.error("操作失败");
    }
  };

  // 处理删除帖子 - 触发回调而非刷新页面
  const handleDeletePost = async () => {
    if (!session?.user || session.user.id !== post.user_id) return;
    setDeleting(true);
    try {
      // 1. 删除关联的点赞记录
      await supabase.from("post_likes").delete().eq("post_id", post.id);

      // 2. 删除关联的评论
      await supabase.from("post_comments").delete().eq("post_id", post.id);

      // 3. 删除帖子本身
      const {
        error
      } = await supabase.from("community_posts").delete().eq("id", post.id);
      if (error) throw error;
      toast.success("帖子已删除");
      onOpenChange(false);
      // 触发自定义事件通知父组件刷新
      window.dispatchEvent(new CustomEvent('post-deleted', { detail: { postId: post.id } }));
    } catch (error) {
      console.error("删除帖子失败:", error);
      toast.error("删除失败，请稍后重试");
    } finally {
      setDeleting(false);
    }
  };

  // 处理分享
  const handleShare = () => {
    setShowShareDialog(true);
  };

  // Handle closing image preview
  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  };

  // 生成分享图片 - 使用专用导出组件确保完美渲染
  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    
    try {
      // 使用统一的卡片生成函数
      const blob = await generateCardBlob(cardRef, { isWeChat });
      
      if (!blob) {
        throw new Error("生成图片失败");
      }
      
      // Use unified share handler with proper WeChat/iOS fallback
      const result = await handleShareWithFallback(
        blob,
        "分享卡片.png",
        {
          title: post.title || "我的分享",
          text: post.content?.slice(0, 100) || "",
          onShowPreview: (blobUrl) => {
            setPreviewImageUrl(blobUrl);
            setShowImagePreview(true);
            setShowShareDialog(false);
          },
          onDownload: () => {
            toast.success("图片已保存，可分享至微信");
            setShowShareDialog(false);
          },
        }
      );

      // Only show success and close for Web Share API
      if (result.method === 'webshare' && result.success && !result.cancelled) {
        toast.success("分享成功");
        setShowShareDialog(false);
        
        // 更新分享数
        await supabase.from("community_posts").update({
          shares_count: (post.shares_count || 0) + 1
        }).eq("id", post.id);
      } else if (result.success) {
        // Also update share count for preview/download methods
        await supabase.from("community_posts").update({
          shares_count: (post.shares_count || 0) + 1
        }).eq("id", post.id);
      }
      
    } catch (error) {
      console.error("生成图片失败:", error);
      toast.error("生成图片失败，请稍后重试");
    } finally {
      setSharing(false);
    }
  };

  // 处理评论提交 - 触发事件刷新评论区而非整页刷新
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
      const {
        error
      } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: session.user.id,
        content: newComment.trim(),
        is_anonymous: false
      });
      if (error) throw error;

      // 更新评论数
      await supabase.from("community_posts").update({
        comments_count: (post.comments_count || 0) + 1
      }).eq("id", post.id);

      setNewComment("");
      toast.success("评论成功");

      // 触发评论区刷新事件
      window.dispatchEvent(new CustomEvent('comment-added', { detail: { postId: post.id } }));
    } catch (error) {
      console.error("发表评论失败:", error);
      toast.error("评论失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };
  const displayName = post.is_anonymous 
    ? "匿名用户" 
    : (authorProfile?.display_name || `用户${post.user_id.slice(0, 6)}`);
  
  // 处理头像/用户名点击跳转
  const handleAuthorClick = () => {
    if (!post.is_anonymous) {
      navigate(`/user/${post.user_id}`);
      onOpenChange(false);
    }
  };
  const getTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      story: "🌸",
      checkin: "📅",
      achievement: "🏆",
      reflection: "💭",
      milestone: "🎯"
    };
    return emojiMap[type] || "✨";
  };
  const getTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      story: "成长故事",
      checkin: "每日打卡",
      achievement: "成就分享",
      reflection: "深度反思",
      milestone: "里程碑"
    };
    return labelMap[type] || "分享";
  };

  // 生成来源标签（仅 AI 故事智能体内容显示）
  const getSourceLabel = (postType: string, campName?: string, badges?: any): {
    label: string;
    emoji: string;
  } | null => {
    // 只有 story 类型（AI 故事智能体生成）才显示来源标签
    if (postType !== 'story') return null;

    // 优先使用 camp_name，其次从 badges 中获取
    const displayCampName = campName || badges?.campName;
    if (displayCampName) {
      return {
        label: `${displayCampName}·今日成长故事`,
        emoji: '🌸'
      };
    }

    // 没有训练营信息时的默认标签
    return {
      label: '今日成长故事',
      emoji: '🌸'
    };
  };
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 pb-20">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Avatar 
                  className={cn(
                    "w-10 h-10",
                    !post.is_anonymous && "cursor-pointer hover:opacity-80"
                  )}
                  onClick={handleAuthorClick}
                >
                  {authorProfile?.avatar_url && !post.is_anonymous && (
                    <AvatarImage src={authorProfile.avatar_url} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary/10">
                    {post.is_anonymous ? "?" : displayName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div 
                    className={cn(
                      "font-medium text-foreground",
                      !post.is_anonymous && "cursor-pointer hover:underline"
                    )}
                    onClick={handleAuthorClick}
                  >
                    {displayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  
                  {/* 教练空间标注（可点击跳转） */}
                  {coachSpace && <Badge variant="outline" className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${coachSpace.bgClass} ${coachSpace.colorClass} border-0`} onClick={() => {
                  navigate(coachSpace.routePath);
                  onOpenChange(false);
                }}>
                      {coachSpace.emoji} {coachSpace.name}
                    </Badge>}
                </div>
              </div>
            </SheetHeader>

            {/* 标题 */}
            {post.title && <SheetTitle className="text-xl font-bold mb-4 text-foreground">
                {post.title}
              </SheetTitle>}

            {/* 图片展示 */}
            {post.image_urls && post.image_urls.length > 0 && <div className="grid grid-cols-2 gap-2 mb-4">
                {post.image_urls.map((url, index) => <img key={index} src={url} alt={`图片 ${index + 1}`} className="w-full rounded-lg object-cover" loading="lazy" />)}
              </div>}

            {/* 来源标签 - 左对齐，仅 AI 故事显示 */}
            {(() => {
              const sourceLabel = getSourceLabel(post.post_type, post.camp_name, post.badges);
              return sourceLabel ? (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 font-medium text-sm shadow-sm">
                    <span>{sourceLabel.emoji}</span>
                    <span>{sourceLabel.label}</span>
                  </span>
                </div>
              ) : null;
            })()}

            {/* 内容 */}
            {post.content && <div className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                {post.content}
              </div>}

            {/* 情绪信息 */}
            {post.emotion_theme && <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">情绪主题</span>
                  <Badge variant="secondary">{post.emotion_theme}</Badge>
                  {post.emotion_intensity && <Badge variant="outline">强度: {post.emotion_intensity}</Badge>}
                </div>
                {post.insight && <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">💡 觉察：</span>
                    {post.insight}
                  </div>}
                {post.action && <div className="text-sm text-muted-foreground">
                    <span className="font-medium">🎯 行动：</span>
                    {post.action}
                  </div>}
              </div>}

            {/* 训练营信息 */}
            {post.camp_day && <Badge variant="outline" className="mb-4">
                训练营第 {post.camp_day} 天
              </Badge>}

            {/* 成就徽章 */}
            {post.badges && <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(post.badges) && post.badges.map((badge: any, index: number) => <Badge key={index} variant="secondary">
                      {badge.icon} {badge.name}
                    </Badge>)}
              </div>}

            {/* 编辑/删除按钮区域 - 移到内容底部 */}
            {session?.user?.id === post.user_id && <div className="flex items-center gap-2 pt-4 pb-4 mt-4 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)} className="flex items-center gap-1">
                  <Pencil className="h-4 w-4" />
                  编辑
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-1 text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                      删除
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
                      <AlertDialogAction onClick={handleDeletePost} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleting ? "删除中..." : "确认删除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>}

            {/* 评论区 */}
            <div className="mt-6 pb-24">
              <CommentSection postId={post.id} onUpdate={() => {}} />
            </div>
          </div>
        </ScrollArea>

        {/* 底部固定互动栏 - 优化移动端布局 */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 sm:p-3 flex items-center gap-1.5 sm:gap-3 z-50">
          {/* 评论输入框 - 限制最大宽度防止溢出 */}
          {session ? <div className="flex-1 flex items-center gap-1.5 min-w-0 max-w-[calc(100%-180px)] sm:max-w-none">
              <input type="text" placeholder="说点什么..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }} className="flex-1 min-w-0 bg-muted/50 rounded-full px-3 py-2 text-sm outline-none focus:bg-muted/70 transition-colors" />
              {newComment.trim() && <button onClick={handleSubmitComment} disabled={submitting} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {submitting ? "..." : "发送"}
                </button>}
            </div> : <div className="flex-1 flex items-center gap-1.5 min-w-0 max-w-[calc(100%-180px)] sm:max-w-none bg-muted/50 rounded-full px-3 py-2 cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => toast.error("请先登录")}>
              <Pencil className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground text-sm truncate">说点什么...</span>
            </div>}
          
          {/* 点赞 */}
          <button onClick={handleLike} className="flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[48px] hover:scale-110 transition-transform flex-shrink-0">
            <Heart className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-colors", liked ? "fill-red-500 text-red-500" : "text-foreground")} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{likesCount}</span>
          </button>
          
          {/* 关注 - 星星图标 */}
          <button onClick={handleFollowToggle} disabled={isLoadingFollow || post.is_anonymous || !session || session?.user?.id === post.user_id} className={cn("flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[48px] transition-transform flex-shrink-0", !(post.is_anonymous || !session || session?.user?.id === post.user_id) && "hover:scale-110", (isLoadingFollow || post.is_anonymous || !session || session?.user?.id === post.user_id) && "opacity-50 cursor-not-allowed")}>
            <Star className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-colors", isFollowing ? "fill-yellow-400 text-yellow-400" : "text-foreground")} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{followersCount}</span>
          </button>
          
          {/* 评论 */}
          <button className="flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[48px] hover:scale-110 transition-transform flex-shrink-0" onClick={() => {
          const commentSection = document.querySelector('[data-comment-section]');
          commentSection?.scrollIntoView({
            behavior: 'smooth'
          });
        }}>
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{post.comments_count || 0}</span>
          </button>
          
          {/* 分享 */}
          <button onClick={handleShare} className="flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[48px] hover:scale-110 transition-transform flex-shrink-0">
            <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{post.shares_count || 0}</span>
          </button>
        </div>
        </SheetContent>
      </Sheet>

      {/* 编辑对话框 - 移到 Sheet 外部解决层叠冲突 */}
      <PostEditDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        post={post} 
        onUpdate={() => {
          onOpenChange(false);
          // 触发帖子更新事件
          window.dispatchEvent(new CustomEvent('post-updated', { detail: { postId: post.id } }));
        }} 
      />

      {/* 分享对话框 - 移到 Sheet 外部解决层叠冲突 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分享到微信</DialogTitle>
            <DialogDescription>预览并生成分享图片</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 预览卡片 - 响应式显示 */}
            <div className="bg-secondary/20 p-3 rounded-lg max-h-[50vh] overflow-auto">
              <ShareCard post={post} partnerInfo={partnerInfo} isPreview />
            </div>
            
            {/* 导出用卡片 - 使用纯内联样式版本 */}
            <div className="fixed -left-[9999px] top-0">
              <ShareCardExport ref={cardRef} post={post} partnerInfo={partnerInfo} />
            </div>
            
            <Button onClick={handleGenerateImage} disabled={sharing} className="w-full">
              {sharing ? "生成中..." : isWeChat ? "生成图片" : "生成分享图片"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {isWeChat ? "生成图片后长按保存，然后分享给朋友" : "生成图片后可保存并分享至微信朋友圈"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={handleCloseImagePreview}
        imageUrl={previewImageUrl}
      />
    </>
  );
};
export default PostDetailSheet;