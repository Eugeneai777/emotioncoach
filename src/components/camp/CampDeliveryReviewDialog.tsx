import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star } from "lucide-react";
import { useCreateCampReview } from "@/hooks/useCampCoachAssignments";
import { useReviewQuickTags } from "@/hooks/useHumanCoaches";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CampDeliveryReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  campId: string;
  coachId: string;
  coachName: string;
  onSuccess?: () => void;
}

export function CampDeliveryReviewDialog({
  open,
  onOpenChange,
  assignmentId,
  campId,
  coachId,
  coachName,
  onSuccess,
}: CampDeliveryReviewDialogProps) {
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingHelpfulness, setRatingHelpfulness] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: quickTags } = useReviewQuickTags();
  const createReview = useCreateCampReview();

  const handleSubmit = async () => {
    try {
      await createReview.mutateAsync({
        assignmentId,
        campId,
        coachId,
        ratingOverall,
        ratingProfessionalism,
        ratingCommunication,
        ratingHelpfulness,
        comment: comment || undefined,
        quickTags: selectedTags.length > 0 ? selectedTags : undefined,
        isAnonymous,
      });
      toast.success('感谢您的评价！');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('提交失败，请重试');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const RatingStars = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 focus:outline-none"
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>评价您的训练营体验</DialogTitle>
          <DialogDescription>
            请为教练 {coachName} 的训练营服务打分
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 评分 */}
          <div className="space-y-3">
            <RatingStars
              value={ratingOverall}
              onChange={setRatingOverall}
              label="整体评分"
            />
            <RatingStars
              value={ratingProfessionalism}
              onChange={setRatingProfessionalism}
              label="专业程度"
            />
            <RatingStars
              value={ratingCommunication}
              onChange={setRatingCommunication}
              label="沟通表达"
            />
            <RatingStars
              value={ratingHelpfulness}
              onChange={setRatingHelpfulness}
              label="帮助程度"
            />
          </div>

          {/* 快捷标签 */}
          {quickTags && quickTags.length > 0 && (
            <div className="space-y-2">
              <Label>快捷标签（可选）</Label>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag.tag_name)}
                  >
                    {tag.tag_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 评价内容 */}
          <div className="space-y-2">
            <Label>详细评价（可选）</Label>
            <Textarea
              placeholder="分享您在训练营中的收获和感受..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* 匿名选项 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">匿名评价</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            稍后再说
          </Button>
          <Button onClick={handleSubmit} disabled={createReview.isPending}>
            {createReview.isPending ? '提交中...' : '提交评价'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
