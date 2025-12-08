import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw } from "lucide-react";
import { forwardRef, useState } from "react";

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
  // Scenario chips (optional)
  scenarioChips?: React.ReactNode;
  messagesCount?: number;
}

export const CoachInputFooter = forwardRef<HTMLTextAreaElement, CoachInputFooterProps>(({
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

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20 safe-bottom">
      <div className="container max-w-xl mx-auto px-3 md:px-4 pt-2 pb-2">
        {/* Scenario Chips - 键盘弹出时隐藏 */}
        {!isFocused && scenarioChips && (messagesCount === undefined || messagesCount <= 1) && (
          <div className="mb-2">
            {scenarioChips}
          </div>
        )}
        
        {/* 微信式单行输入 */}
        <div className="flex gap-2 items-end">
          {/* 新对话按钮 */}
          {hasMessages && onNewConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              disabled={isLoading}
              title="开始新对话"
              className="h-10 w-10 flex-shrink-0 rounded-full"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          
          {/* 输入框 */}
          <div className="flex-1 relative">
            <Textarea
              ref={ref}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="resize-none min-h-[40px] max-h-[100px] w-full py-2.5 px-3 text-base rounded-2xl leading-relaxed"
              style={{ fontSize: '16px' }}
              disabled={isLoading}
              rows={1}
            />
          </div>

          {/* 发送按钮 */}
          <Button
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className={`h-10 w-10 min-w-[40px] flex-shrink-0 rounded-full bg-gradient-to-r ${gradient} text-white shadow-md`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </footer>
  );
});

CoachInputFooter.displayName = "CoachInputFooter";
