import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { VoiceInputButton } from "@/components/coach/VoiceInputButton";

interface GratitudeQuickAddProps {
  userId?: string;
  onAdded: () => void;
  onLocalAdd?: (content: string) => number;
}

export const GratitudeQuickAdd = ({ userId, onAdded, onLocalAdd }: GratitudeQuickAddProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      if (userId) {
        // Logged in: save to database
        const { error } = await supabase
          .from("gratitude_entries")
          .insert({
            user_id: userId,
            content: content.trim(),
            category: "other",
            themes: [],
            date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "记录成功 ✨",
          description: "标签将自动分析，或点击「同步分析」立即生成"
        });
      } else {
        // Not logged in: save to local storage
        if (onLocalAdd) {
          onLocalAdd(content.trim());
          toast({
            title: "记录成功 ✨",
            description: "点击「同步」按钮可保存到云端"
          });
        }
      }

      setContent("");
      onAdded();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "保存失败",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setContent(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-card/98 backdrop-blur-xl z-50 safe-bottom">
      <form onSubmit={handleSubmit} className="px-3 py-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <VoiceInputButton 
            onTranscript={handleVoiceTranscript}
            disabled={loading}
          />
          <div className="flex-1">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今天感恩什么？"
              className="bg-muted/50 border-muted h-9 text-sm"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!content.trim() || loading}
            className="bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 shrink-0 h-9 w-9"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </footer>
  );
};
