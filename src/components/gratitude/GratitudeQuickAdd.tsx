import { useState } from "react";
import { Send, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { VoiceInputButton } from "@/components/coach/VoiceInputButton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useWeChatBindStatus } from "@/hooks/useWeChatBindStatus";
import { triggerFollowReminder } from "@/hooks/useFollowReminder";

interface GratitudeQuickAddProps {
  userId?: string;
  onAdded: () => void;
  onLocalAdd?: (content: string) => number;
  onOfflineAdd?: (content: string, userId: string) => void;
  isOnline?: boolean;
}

export const GratitudeQuickAdd = ({ 
  userId, 
  onAdded, 
  onLocalAdd,
  onOfflineAdd,
  isOnline: isOnlineProp 
}: GratitudeQuickAddProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const networkOnline = useOnlineStatus();
  const isOnline = isOnlineProp ?? networkOnline;
  
  // 微信绑定状态（用于关键时刻提示）
  const { isBound, isEmailUser } = useWeChatBindStatus();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      if (userId && isOnline) {
        // Logged in AND online: save to database
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
        
        // 关键时刻：感恩日记记录后，每10次提示一次绑定微信
        if (isEmailUser && !isBound) {
          const recordCount = parseInt(localStorage.getItem('gratitude_record_count') || '0') + 1;
          localStorage.setItem('gratitude_record_count', String(recordCount));
          
          if (recordCount % 10 === 0) {
            setTimeout(() => {
              triggerFollowReminder('after_journal');
            }, 1500);
          }
        }
      } else if (userId && !isOnline) {
        // Logged in but offline: save to pending queue
        if (onOfflineAdd) {
          onOfflineAdd(content.trim(), userId);
          toast({
            title: "已离线保存 📴",
            description: "网络恢复后自动同步到云端"
          });
        }
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
      // If save failed due to network, try offline save
      if (userId && onOfflineAdd) {
        onOfflineAdd(content.trim(), userId);
        setContent("");
        toast({
          title: "已离线保存 📴",
          description: "网络恢复后自动同步到云端"
        });
        onAdded();
      } else {
        toast({
          title: "保存失败",
          variant: "destructive"
        });
      }
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
            showSuccessToast={false}
          />
          <div className="flex-1 relative">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isOnline ? "今天感恩什么？" : "离线记录，稍后同步..."}
              className="bg-muted/50 border-muted h-9 text-sm pr-8"
              disabled={loading}
            />
            {!isOnline && (
              <WifiOff className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            )}
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
