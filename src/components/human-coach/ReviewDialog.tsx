import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReviewQuickTags, useCreateReview } from "@/hooks/useHumanCoaches";
import { toast } from "sonner";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  coachId: string;
  coachName: string;
  onSuccess?: () => void;
}

function StarRating({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-16">{label}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star 
              className={cn(
                "w-6 h-6 transition-colors",
                (hover || value) >= star 
                  ? "fill-amber-400 text-amber-400" 
                  : "text-gray-200"
              )} 
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium">{value > 0 ? value : "-"}</span>
    </div>
  );
}

export function ReviewDialog({
  open,
  onOpenChange,
  appointmentId,
  coachId,
  coachName,
  onSuccess,
}: ReviewDialogProps) {
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingHelpfulness, setRatingHelpfulness] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const { data: quickTags = [] } = useReviewQuickTags();
  const createReview = useCreateReview();
  
  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };
  
  const handleSubmit = async () => {
    if (ratingOverall === 0) {
      toast.error("请选择总体评分");
      return;
    }
    
    try {
      await createReview.mutateAsync({
        appointment_id: appointmentId,
        coach_id: coachId,
        rating_overall: ratingOverall,
        rating_professionalism: ratingProfessionalism || undefined,
        rating_communication: ratingCommunication || undefined,
        rating_helpfulness: ratingHelpfulness || undefined,
        comment: comment || undefined,
        quick_tags: selectedTags,
        is_anonymous: isAnonymous,
      });
      
      toast.success("评价提交成功！");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("提交失败，请重试");
    }
  };
  
  const positiveTags = quickTags.filter((t) => t.tag_type === "positive");
  const otherTags = quickTags.filter((t) => t.tag_type !== "positive");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>评价 {coachName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 总体评分 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">总体评分 *</Label>
            <StarRating 
              value={ratingOverall} 
              onChange={setRatingOverall}
              label="满意度"
            />
          </div>
          
          {/* 多维度评分 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">详细评分（可选）</Label>
            <div className="space-y-2">
              <StarRating 
                value={ratingProfessionalism} 
                onChange={setRatingProfessionalism}
                label="专业度"
              />
              <StarRating 
                value={ratingCommunication} 
                onChange={setRatingCommunication}
                label="沟通力"
              />
              <StarRating 
                value={ratingHelpfulness} 
                onChange={setRatingHelpfulness}
                label="帮助度"
              />
            </div>
          </div>
          
          {/* 快捷标签 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">快捷标签</Label>
            <div className="flex flex-wrap gap-2">
              {positiveTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag.tag_name)
                      ? "bg-teal-500 hover:bg-teal-600"
                      : "hover:bg-teal-50"
                  )}
                  onClick={() => handleTagToggle(tag.tag_name)}
                >
                  {tag.tag_name}
                </Badge>
              ))}
            </div>
            {otherTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {otherTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTags.includes(tag.tag_name)
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "hover:bg-amber-50 text-amber-700 border-amber-200"
                    )}
                    onClick={() => handleTagToggle(tag.tag_name)}
                  >
                    {tag.tag_name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* 文字评价 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">详细评价（可选）</Label>
            <Textarea
              placeholder="分享您的咨询体验..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* 匿名选项 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous" className="text-sm text-muted-foreground">
              匿名评价
            </Label>
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={handleSubmit}
            disabled={createReview.isPending || ratingOverall === 0}
          >
            {createReview.isPending ? "提交中..." : "提交评价"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
