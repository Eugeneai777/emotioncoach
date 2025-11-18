import { Sparkles } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onOptionClick?: (option: string) => void;
}

export const ChatMessage = ({ role, content, onOptionClick }: ChatMessageProps) => {
  const isUser = role === "user";
  
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
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onOptionClick(option.text)}
                  className="group relative w-full text-left px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 transition-all duration-300 border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                >
                  {/* 背景光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="relative flex items-center gap-3">
                    {/* 编号图标 */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40 transition-shadow">
                      {option.number}
                    </div>
                    
                    {/* 文本 */}
                    <span className="flex-1 text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {option.text}
                    </span>
                    
                    {/* 装饰图标 */}
                    <Sparkles className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
