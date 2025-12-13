import { useState } from "react";
import { useCoachReviews, useReplyReview } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, MessageSquare, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { CoachReview } from "@/hooks/useCoachDashboard";

interface CoachReviewManagementProps {
  coachId: string;
}

export function CoachReviewManagement({ coachId }: CoachReviewManagementProps) {
  const [selectedReview, setSelectedReview] = useState<CoachReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: reviews, isLoading } = useCoachReviews(coachId);
  const replyReview = useReplyReview();

  const unrepliedReviews = reviews?.filter(r => !r.coach_reply) || [];
  const repliedReviews = reviews?.filter(r => r.coach_reply) || [];

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      toast.error("请输入回复内容");
      return;
    }

    try {
      await replyReview.mutateAsync({
        reviewId: selectedReview.id,
        reply: replyText.trim(),
      });
      toast.success("回复成功");
      setDialogOpen(false);
      setReplyText("");
    } catch (error) {
      toast.error("回复失败，请重试");
    }
  };

  const openReplyDialog = (review: CoachReview) => {
    setSelectedReview(review);
    setReplyText(review.coach_reply || '');
    setDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review, showReply = true }: { review: CoachReview; showReply?: boolean }) => (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {review.is_anonymous ? (
                  <AvatarFallback>匿</AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={review.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {review.profiles?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div>
                <p className="font-medium">
                  {review.is_anonymous ? '匿名用户' : (review.profiles?.display_name || '用户')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at || ''), 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(review.rating_overall)}
              <span className="font-medium">{review.rating_overall}</span>
            </div>
          </div>

          {/* Tags */}
          {review.quick_tags && review.quick_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.quick_tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-sm">{review.comment}</p>
          )}

          {/* Dimension ratings */}
          {(review.rating_professionalism || review.rating_communication || review.rating_helpfulness) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {review.rating_professionalism && (
                <span>专业度: {review.rating_professionalism}</span>
              )}
              {review.rating_communication && (
                <span>沟通: {review.rating_communication}</span>
              )}
              {review.rating_helpfulness && (
                <span>帮助度: {review.rating_helpfulness}</span>
              )}
            </div>
          )}

          {/* Coach reply */}
          {review.coach_reply ? (
            <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">教练回复</span>
                <span className="text-xs text-muted-foreground">
                  {review.coach_replied_at && format(new Date(review.coach_replied_at), 'MM/dd HH:mm')}
                </span>
              </div>
              <p className="text-sm">{review.coach_reply}</p>
            </div>
          ) : showReply && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openReplyDialog(review)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              回复评价
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">评价管理</h1>
        <p className="text-muted-foreground">查看和回复用户评价</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{reviews?.length || 0}</p>
            <p className="text-sm text-muted-foreground">总评价数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{unrepliedReviews.length}</p>
            <p className="text-sm text-muted-foreground">待回复</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{repliedReviews.length}</p>
            <p className="text-sm text-muted-foreground">已回复</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <p className="text-3xl font-bold">
                {reviews?.length 
                  ? (reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length).toFixed(1)
                  : '5.0'
                }
              </p>
            </div>
            <p className="text-sm text-muted-foreground">平均评分</p>
          </CardContent>
        </Card>
      </div>

      {/* Unreplied reviews */}
      {unrepliedReviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="destructive">{unrepliedReviews.length}</Badge>
            待回复评价
          </h2>
          {unrepliedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Replied reviews */}
      {repliedReviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">已回复评价</h2>
          {repliedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} showReply={false} />
          ))}
        </div>
      )}

      {reviews?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无评价
          </CardContent>
        </Card>
      )}

      {/* Reply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回复评价</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedReview && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating_overall)}
                </div>
                <p className="text-sm">{selectedReview.comment || '(无文字评价)'}</p>
              </div>
            )}
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="输入您的回复..."
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleReply} disabled={replyReview.isPending}>
                {replyReview.isPending ? "提交中..." : "提交回复"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
