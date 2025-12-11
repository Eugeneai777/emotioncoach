import { useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GratitudeQuickAddProps {
  userId: string;
  onAdded: () => void;
}

export const GratitudeQuickAdd = ({ userId, onAdded }: GratitudeQuickAddProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const { data: insertedData, error } = await supabase
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
        title: "记录成功 ❤️",
        description: "感恩的心，让生活更美好"
      });

      setContent("");
      
      // Auto analyze with AI and wait for completion
      if (insertedData) {
        try {
          const { error: analyzeError } = await supabase.functions.invoke("analyze-gratitude-entry", {
            body: { entryId: insertedData.id, content: content.trim() },
          });
          if (analyzeError) {
            console.error("分析失败:", analyzeError);
          }
        } catch (err) {
          console.error("分析出错:", err);
        }
      }

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

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天感恩什么？按 Enter 记录..."
            className="pr-10 bg-white/80 dark:bg-gray-700/50"
            disabled={loading}
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || loading}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        AI 会自动分析标签 ✨
      </p>
    </form>
  );
};
