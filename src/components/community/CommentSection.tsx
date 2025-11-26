import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
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

interface CommentSectionProps {
  postId: string;
  onUpdate?: () => void;
}

const CommentSection = ({ postId, onUpdate }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("加载评论失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      toast({
        title: "请先登录",
        description: "登录后才能评论",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "评论不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: session.user.id,
        content: newComment.trim(),
        is_anonymous: false,
      });

      if (error) throw error;

      // 更新评论数
      const { data: postData } = await supabase
        .from("community_posts")
        .select("comments_count")
        .eq("id", postId)
        .single();

      if (postData) {
        await supabase
          .from("community_posts")
          .update({ comments_count: postData.comments_count + 1 })
          .eq("id", postId);
      }

      setNewComment("");
      loadComments();
      onUpdate?.();

      toast({
        title: "评论成功",
      });
    } catch (error) {
      console.error("发表评论失败:", error);
      toast({
        title: "评论失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
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
            const displayName = comment.is_anonymous ? "匿名用户" : "用户";

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
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
        </div>
      )}

      {/* 评论输入 */}
      {session && (
        <div className="space-y-2">
          <Textarea
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              size="sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发表中...
                </>
              ) : (
                "发表评论"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
