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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    </div>
  );
};

export default CommentSection;
