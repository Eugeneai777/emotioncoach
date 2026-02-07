import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface CommentSectionProps {
  postId: string;
  onUpdate?: () => void;
}

const COMMENTS_PER_PAGE = 10;

const CommentSection = ({ postId, onUpdate }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
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

      if (append) {
        const merged = [...comments, ...newComments];
        setComments(merged);
        fetchProfiles(merged);
      } else {
        setComments(newComments);
        fetchProfiles(newComments);
      }
      setHasMore(newComments.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error("加载评论失败:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, comments.length, fetchProfiles]);

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
          {comments.map((comment) => {
            const profile = profiles.get(comment.user_id);
            const displayName = comment.is_anonymous
              ? "匿名用户"
              : (profile?.display_name || `用户${comment.user_id.slice(0, 6)}`);
            const avatarUrl = comment.is_anonymous ? null : profile?.avatar_url;

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback className="text-xs bg-secondary">
                    {comment.is_anonymous ? "匿" : displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
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
                </div>
              </div>
            );
          })}
          
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
