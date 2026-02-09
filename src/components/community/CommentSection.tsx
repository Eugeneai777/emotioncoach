import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2, Reply } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  parent_id: string | null;
}

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface CommentSectionProps {
  postId: string;
  onUpdate?: () => void;
  onReply?: (comment: { id: string; userName: string }) => void;
}

const COMMENTS_PER_PAGE = 10;

const CommentSection = ({ postId, onUpdate, onReply }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Map<string, Comment[]>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProfiles = useCallback(async (commentList: Comment[]) => {
    const userIds = [
      ...new Set(
        commentList
          .filter((c) => !c.is_anonymous)
          .map((c) => c.user_id)
      ),
    ];

    if (userIds.length === 0) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    if (error) {
      console.error("加载用户资料失败:", error);
      return;
    }

    setProfiles((prev) => {
      const next = new Map(prev);
      for (const p of data || []) {
        next.set(p.id, {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        });
      }
      return next;
    });
  }, []);

  const loadReplies = useCallback(async (parentIds: string[]) => {
    if (parentIds.length === 0) return;

    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .in("parent_id", parentIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("加载回复失败:", error);
      return;
    }

    const replyMap = new Map<string, Comment[]>();
    for (const reply of data || []) {
      const pid = reply.parent_id!;
      if (!replyMap.has(pid)) replyMap.set(pid, []);
      replyMap.get(pid)!.push(reply);
    }
    setReplies(replyMap);

    if (data && data.length > 0) {
      fetchProfiles(data);
    }
  }, [postId, fetchProfiles]);

  const loadComments = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const offset = append ? comments.length : 0;
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: true })
        .range(offset, offset + COMMENTS_PER_PAGE - 1);

      if (error) throw error;

      const newComments = data || [];

      let allComments: Comment[];
      if (append) {
        allComments = [...comments, ...newComments];
      } else {
        allComments = newComments;
      }
      setComments(allComments);
      fetchProfiles(allComments);

      // Load replies for all top-level comments
      const parentIds = allComments.map(c => c.id);
      loadReplies(parentIds);

      setHasMore(newComments.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error("加载评论失败:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, comments.length, fetchProfiles, loadReplies]);

  useEffect(() => {
    loadComments();
  }, [postId]);

  // 监听评论添加事件
  useEffect(() => {
    const handleCommentAdded = (e: CustomEvent<{ postId: string }>) => {
      if (e.detail.postId === postId) {
        loadComments();
      }
    };
    window.addEventListener('comment-added', handleCommentAdded as EventListener);
    return () => {
      window.removeEventListener('comment-added', handleCommentAdded as EventListener);
    };
  }, [postId, loadComments]);

  const getDisplayName = (comment: Comment) => {
    if (comment.is_anonymous) return "匿名用户";
    const profile = profiles.get(comment.user_id);
    return profile?.display_name || `用户${comment.user_id.slice(0, 6)}`;
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const displayName = getDisplayName(comment);
    const avatarUrl = comment.is_anonymous ? null : profiles.get(comment.user_id)?.avatar_url;

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? "ml-11" : ""}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={displayName} />
          )}
          <AvatarFallback className="text-xs bg-secondary">
            {comment.is_anonymous ? "匿" : displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                locale: zhCN,
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm text-foreground/80">{comment.content}</p>
          {/* 回复按钮 */}
          {onReply && !isReply && (
            <button
              onClick={() => onReply({ id: comment.id, userName: displayName })}
              className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation"
            >
              <Reply className="h-3 w-3" />
              回复
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-4" data-comment-section>
      {/* 评论列表 */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          暂无评论，快来抢沙发吧！
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id}>
              {renderComment(comment)}
              {/* 子评论 */}
              {replies.get(comment.id)?.map((reply) => renderComment(reply, true))}
            </div>
          ))}
          
          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadComments(true)}
                disabled={loadingMore}
                className="text-muted-foreground"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    加载中...
                  </>
                ) : (
                  "加载更多评论"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
