import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onOptionClick?: (option: string) => void;
}

export const ChatMessage = ({ role, content, onOptionClick }: ChatMessageProps) => {
  const isUser = role === "user";
  const [clickedOption, setClickedOption] = useState<string | null>(null);
  
  // 检测是否包含编号选项（如 "1. 选项" 或 "1、选项"）
  const optionRegex = /^(\d+)[.、]\s*(.+)$/gm;
  const matches = Array.from(content.matchAll(optionRegex));
  const hasOptions = matches.length >= 2 && role === "assistant";
  
  // 如果有选项，分离文本和选项
  let textContent = content;
  let options: { number: string; text: string }[] = [];
  
  if (hasOptions) {
    const lines = content.split('\n');
    const optionLines: number[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(\d+)[.、]\s*(.+)$/);
      if (match) {
        options.push({ number: match[1], text: match[2].trim() });
        optionLines.push(index);
      }
    });
    
    // 移除选项行，保留其他文本
    if (optionLines.length >= 2) {
      textContent = lines
        .filter((_, index) => !optionLines.includes(index))
        .join('\n')
        .trim();
    } else {
      // 如果选项少于2个，不视为选项
      options = [];
    }
  }
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 md:mb-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500`}>
      <div className={`max-w-[85%] md:max-w-[80%] ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 transition-all duration-300 ${
            isUser
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
          }`}
        >
          {textContent && (
            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {textContent}
            </p>
          )}
          
          {options.length > 0 && onOptionClick && (
            <div className="flex flex-col gap-2.5 mt-4">
              {options.map((option, index) => {
                const isClicked = clickedOption === option.text;
                const isDisabled = clickedOption !== null;
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isDisabled) {
                        setClickedOption(option.text);
                        onOptionClick(option.text);
                      }
                    }}
                    disabled={isDisabled}
                    className={`group relative w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300 border overflow-hidden ${
                      isClicked
                        ? "bg-primary/20 border-primary/60 scale-[0.98]"
                        : isDisabled
                        ? "bg-muted/50 border-muted opacity-50 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {/* 背景光效 */}
                    {!isDisabled && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                    
                    <div className="relative flex items-center gap-3">
                      {/* 编号图标或加载动画 */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                        isClicked
                          ? "bg-primary shadow-lg shadow-primary/50 animate-pulse"
                          : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40"
                      }`}>
                        {isClicked ? (
                          <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                        ) : (
                          <span className="text-primary-foreground">{option.number}</span>
                        )}
                      </div>
                      
                      {/* 文本 */}
                      <span className={`flex-1 text-xs md:text-sm font-medium transition-colors ${
                        isClicked
                          ? "text-primary"
                          : isDisabled
                          ? "text-muted-foreground"
                          : "text-foreground group-hover:text-primary"
                      }`}>
                        {option.text}
                      </span>
                      
                      {/* 装饰图标 */}
                      {isClicked ? (
                        <div className="w-4 h-4 rounded-full bg-primary/20 animate-ping" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
