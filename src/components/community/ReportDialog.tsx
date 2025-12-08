import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

const reportReasons = [
  { value: "spam", label: "垃圾信息/广告" },
  { value: "harassment", label: "骚扰或欺凌" },
  { value: "inappropriate", label: "不当内容" },
  { value: "misinformation", label: "虚假信息" },
  { value: "violence", label: "暴力或危险内容" },
  { value: "other", label: "其他" },
];

const reportSchema = z.object({
  reason: z.string().min(1, "请选择举报原因"),
  description: z.string().trim().max(500, "描述不能超过500字").optional(),
});

const ReportDialog = ({ open, onOpenChange, postId }: ReportDialogProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // 当 dialog 打开时重置表单状态
  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!session?.user) {
      toast({
        title: "请先登录",
        description: "登录后才能举报内容",
        variant: "destructive",
      });
      return;
    }

    try {
      // 验证输入
      const validated = reportSchema.parse({ reason, description });

      setLoading(true);

      const { error } = await supabase.from("post_reports").insert({
        post_id: postId,
        reporter_id: session.user.id,
        reason: validated.reason,
        description: validated.description || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "举报已提交",
        description: "感谢您的反馈，我们会尽快处理",
      });

      onOpenChange(false);
      setReason("");
      setDescription("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "验证失败",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("举报失败:", error);
        toast({
          title: "举报失败",
          description: "请稍后重试",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>举报内容</DialogTitle>
          <DialogDescription>
            请选择举报原因，我们会认真审核每一份举报
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>举报原因 *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">详细描述（可选）</Label>
            <Textarea
              id="description"
              placeholder="请描述具体情况..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason}>
            {loading ? "提交中..." : "提交举报"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
