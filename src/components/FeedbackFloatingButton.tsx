import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackFloatingButtonProps {
  className?: string;
}

export default function FeedbackFloatingButton({ className }: FeedbackFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("请输入您的建议");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("user_feedback")
        .insert({
          user_id: user?.id || null,
          feedback_type: "suggestion",
          content: content.trim(),
          contact_info: contactInfo.trim() || null,
          page_url: window.location.pathname,
        });

      if (error) throw error;

      toast.success("感谢您的宝贵建议！我们会认真阅读每一条反馈 💚");
      setContent("");
      setContactInfo("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("提交失败，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={`fixed z-50 ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 px-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Lightbulb className="w-5 h-5 mr-2" />
          <span className="font-medium">提建议</span>
        </Button>
      </motion.div>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              提交您的建议
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              💡 您的每一条建议都很重要！无论是功能需求、体验优化还是问题反馈，都欢迎告诉我们。
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-content">建议内容 *</Label>
              <Textarea
                id="feedback-content"
                placeholder="请详细描述您的建议或遇到的问题..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {content.length}/1000
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-info">联系方式（选填）</Label>
              <Input
                id="contact-info"
                placeholder="微信号/手机号，方便我们回访"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                maxLength={50}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  提交建议
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
