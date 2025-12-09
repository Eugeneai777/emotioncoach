import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw } from "lucide-react";
import { forwardRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachInputFooterProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onNewConversation?: () => void;
  placeholder: string;
  isLoading: boolean;
  hasMessages: boolean;
  gradient: string;
  scenarioChips?: React.ReactNode;
  messagesCount?: number;
}

export const CoachInputFooter = forwardRef<HTMLTextAreaElement | HTMLInputElement, CoachInputFooterProps>(({
  input,
  onInputChange,
  onSend,
  onKeyPress,
  onNewConversation,
  placeholder,
  isLoading,
  hasMessages,
  gradient,
  scenarioChips,
  messagesCount
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const isMobile = useIsMobile();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20 safe-bottom">
      <div className="container max-w-xl mx-auto px-3 md:px-4 pt-2 pb-2">
        {/* Scenario Chips - 键盘弹出时隐藏 */}
        {!isFocused && scenarioChips && (messagesCount === undefined || messagesCount <= 1) && (
          <div className="mb-2">
            {scenarioChips}
          </div>
        )}
        
        {/* 输入区域 */}
        <div className="flex gap-2 items-end">
          {/* 新对话按钮 */}
          {hasMessages && onNewConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              disabled={isLoading}
              title="开始新对话"
              className="h-11 w-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-full active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          
          {/* 输入框 - 移动端单行，桌面端多行 */}
          <div className="flex-1 relative">
            {isMobile ? (
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="分享你的想法..."
                className="w-full h-11 px-4 text-base rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ fontSize: '16px' }}
                disabled={isLoading}
                enterKeyHint="send"
              />
            ) : (
              <Textarea
                ref={ref as React.Ref<HTMLTextAreaElement>}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyPress={onKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="resize-none min-h-[44px] max-h-[100px] w-full py-2.5 px-3 text-base rounded-2xl leading-relaxed"
                style={{ fontSize: '16px' }}
                disabled={isLoading}
                rows={1}
                enterKeyHint="send"
                inputMode="text"
              />
            )}
          </div>

          {/* 发送按钮 */}
          <Button
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className={`h-11 w-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-full bg-gradient-to-r ${gradient} text-white shadow-md active:scale-95 transition-transform`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </footer>
  );
});

CoachInputFooter.displayName = "CoachInputFooter";
