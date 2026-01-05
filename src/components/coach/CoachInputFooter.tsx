import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, RotateCcw, Phone } from "lucide-react";
import { forwardRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VoiceInputButton } from "./VoiceInputButton";

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
  primaryColor?: string;
  scenarioChips?: React.ReactNode | any[];
  scenarioOnSelect?: (prompt: string) => void;
  scenarioPrimaryColor?: string;
  messagesCount?: number;
  intensitySelector?: React.ReactNode;
  enableVoiceChat?: boolean;
  onVoiceChatClick?: () => void;
  enableVoiceInput?: boolean;
  embedded?: boolean;
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
  primaryColor = 'teal',
  scenarioChips,
  scenarioOnSelect,
  scenarioPrimaryColor,
  messagesCount,
  intensitySelector,
  enableVoiceChat = false,
  onVoiceChatClick,
  enableVoiceInput = false,
  embedded = false
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const isMobile = useIsMobile();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 如果正在使用输入法组合，不处理回车
    if (isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  // 自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    onInputChange(e.target.value);
  };

  // 根据主题色获取输入框样式
  const getInputStyles = () => {
    if (primaryColor === 'pink') {
      return {
        border: 'border-pink-200',
        focus: 'focus:ring-pink-400/50 focus:border-pink-400',
        bg: 'bg-pink-50/50'
      };
    }
    return {
      border: 'border-teal-200',
      focus: 'focus:ring-teal-400/50 focus:border-teal-400',
      bg: 'bg-white/80'
    };
  };

  const inputStyles = getInputStyles();

  return (
    <footer 
      className={embedded 
        ? "border-t border-border bg-card/98 backdrop-blur-xl"
        : "fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-50 safe-bottom"
      }
    >
      <div className={embedded 
        ? "px-3 pt-2 pb-2"
        : "container max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-3 md:px-6 lg:px-8 pt-2 pb-2"
      }>
        {/* Intensity Selector - 键盘弹出时隐藏 */}
        {!isFocused && intensitySelector && (
          <div className="mb-2 animate-in slide-in-from-bottom-2 duration-300">
            {intensitySelector}
          </div>
        )}
        
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

          {/* 语音输入按钮 */}
          {enableVoiceInput && (
            <VoiceInputButton
              onTranscript={(text) => onInputChange(input ? `${input} ${text}` : text)}
              disabled={isLoading}
              primaryColor={primaryColor}
            />
          )}
          
          {/* 输入框 - 移动端单行，桌面端多行 */}
          <div className="flex-1 relative">
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={isMobile ? "分享你的想法..." : placeholder}
            className={`resize-none min-h-[44px] max-h-[150px] w-full py-2.5 px-4 text-base rounded-2xl leading-relaxed border ${inputStyles.border} ${inputStyles.bg} ${inputStyles.focus} transition-all duration-200`}
            style={{ fontSize: '16px' }}
            disabled={isLoading}
            rows={1}
            enterKeyHint="send"
            inputMode="text"
          />
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

          {/* 语音对话按钮 */}
          {enableVoiceChat && onVoiceChatClick && (
            <Button
              onClick={onVoiceChatClick}
              disabled={isLoading}
              size="icon"
              variant="outline"
              title="语音对话"
              className="h-11 w-11 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-full border-rose-300 text-rose-500 hover:bg-rose-50 active:scale-95 transition-transform"
            >
              <Phone className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
});

CoachInputFooter.displayName = "CoachInputFooter";
