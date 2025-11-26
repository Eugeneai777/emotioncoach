import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  onUpdate?: () => void;
}

const LikeButton = ({ postId, initialLikesCount, onUpdate }: LikeButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    checkIfLiked();
  }, [postId, session]);

  const checkIfLiked = async () => {
    if (!session?.user) return;

    try {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", session.user.id)
        .single();

      setLiked(!!data);
    } catch (error) {
      // 未点赞，忽略错误
    }
  };

  const handleLike = async () => {
    if (!session?.user) {
      toast({
        title: "请先登录",
        description: "登录后才能点赞",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      if (liked) {
        // 取消点赞
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", session.user.id);

        if (error) throw error;

        // 更新计数
        const { data: postData } = await supabase
          .from("community_posts")
          .select("likes_count")
          .eq("id", postId)
          .single();

        if (postData) {
          await supabase
            .from("community_posts")
            .update({ likes_count: Math.max(0, postData.likes_count - 1) })
            .eq("id", postId);
        }

        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // 点赞
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: session.user.id,
          });

        if (error) throw error;

        // 更新计数
        const { error: updateError } = await supabase
          .from("community_posts")
          .update({ likes_count: likesCount + 1 })
          .eq("id", postId);

        if (updateError) throw updateError;

        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      onUpdate?.();
    } catch (error) {
      console.error("点赞操作失败:", error);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 transition-colors",
        liked
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Heart
        className={cn("h-5 w-5 transition-all", liked && "fill-current scale-110")}
      />
      <span className="text-sm">{likesCount}</span>
    </button>
  );
};

export default LikeButton;
