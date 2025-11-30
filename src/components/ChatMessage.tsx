import { Sparkles, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VideoRecommendations } from "./VideoRecommendations";
import { CommunicationCourseRecommendations } from "./communication/CommunicationCourseRecommendations";
import { useCommunicationCourseRecommendations } from "@/hooks/useCommunicationCourseRecommendations";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onOptionClick?: (option: string) => void;
  onOptionSelect?: (option: string) => void;
  videoRecommendations?: any[];
  isLastMessage?: boolean;
  communicationBriefingId?: string | null;
}

export const ChatMessage = ({ role, content, onOptionClick, onOptionSelect, videoRecommendations, isLastMessage, communicationBriefingId }: ChatMessageProps) => {
  const isUser = role === "user";
  const navigate = useNavigate();
  const [clickedOption, setClickedOption] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Show emotion recommendations on the last assistant message if it contains a briefing
  const showRecommendations = isLastMessage && 
    role === "assistant" && 
    videoRecommendations && 
    videoRecommendations.length > 0 &&
    (content.includes("情绪主题") || content.includes("简报"));

  // Communication course recommendations
  const { courseRecommendations, campRecommendations, loading: commRecsLoading } = useCommunicationCourseRecommendations(
    isLastMessage && content.includes("《卡内基沟通简报》") ? communicationBriefingId || undefined : undefined
  );
  
  const showCommunicationRecommendations = isLastMessage && 
    role === "assistant" && 
    content.includes("《卡内基沟通简报》") &&
    (courseRecommendations.length > 0 || campRecommendations.length > 0);

  // Extract communication theme and difficulty from briefing content
  const extractBriefingData = () => {
    if (!content.includes("《卡内基沟通简报》")) return null;
    
    const themeMatch = content.match(/💬 沟通主题\n(.+)/);
    const difficultyMatch = content.match(/沟通难度[：:]\s*(\d+)/);
    
    return {
      communication_theme: themeMatch?.[1]?.trim() || "沟通练习",
      communication_difficulty: difficultyMatch ? parseInt(difficultyMatch[1]) : undefined,
    };
  };

  const handleWatchCourse = (videoUrl: string, courseId: string) => {
    window.open(videoUrl, '_blank');
  };
  
  // 检测是否包含编号选项（如 "1. 选项"、"1、选项" 或 "A. 选项"）
  const optionRegex = /^\s*([A-Da-d]|\d+)[.、]\s*(.+)$/gm;
  const matches = Array.from(content.matchAll(optionRegex));
  
  // 检测单个"生成简报"或"分享"选项的特殊情况
  const isBriefingOnlyOption = matches.length === 1 && 
    (matches[0]?.[2]?.includes("生成简报") || matches[0]?.[2]?.includes("简报"));
  const isShareOnlyOption = matches.length === 1 && 
    (matches[0]?.[2]?.includes("分享") || matches[0]?.[2]?.includes("社区"));
  
  const hasOptions = (matches.length >= 2 || isBriefingOnlyOption || isShareOnlyOption) && role === "assistant";
  
  // 如果有选项，分离文本和选项
  let textContent = content;
  let options: { number: string; text: string }[] = [];
  
  if (hasOptions) {
    const lines = content.split('\n');
    const optionLines: number[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^\s*([A-Da-d]|\d+)[.、]\s*(.+)$/);
      if (match) {
        options.push({ number: match[1], text: match[2].trim() });
        optionLines.push(index);
      }
    });
    
    // 移除选项行，保留其他文本
    // 如果有至少1个选项且是特殊按钮（简报/分享），或者有2个以上选项，则显示按钮
    const shouldShowOptions = optionLines.length >= 2 || 
      (optionLines.length >= 1 && options.some(opt => 
        opt.text.includes("生成简报") || opt.text.includes("简报") || 
        opt.text.includes("分享") || opt.text.includes("社区")
      ));
    
    if (shouldShowOptions) {
      textContent = lines
        .filter((_, index) => !optionLines.includes(index))
        .join('\n')
        .trim();
    } else {
      // 如果选项不符合显示条件，不视为选项
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
          
          {options.length > 0 && (onOptionClick || onOptionSelect) && (
            <div className="flex flex-col gap-3 mt-4">
              {options.map((option, index) => {
                const isClicked = clickedOption === option.text;
                const isSelected = selectedOption === option.text;
                const isDisabled = clickedOption !== null;
                const isBriefingButton = option.text.includes("生成简报") || option.text.includes("简报");
                const isShareButton = option.text.includes("去社区分享") || option.text.includes("分享到社区");
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isShareButton) {
                        // 分享按钮直接跳转到社区
                        navigate("/community");
                      } else if (isBriefingButton) {
                        // 简报按钮：禁用其他按钮，立即发送
                        if (!isDisabled) {
                          setClickedOption(option.text);
                          onOptionClick?.(option.text);
                        }
                      } else {
                        // 普通选项：填入输入框，不禁用按钮
                        setSelectedOption(option.text);
                        onOptionSelect?.(option.text);
                      }
                    }}
                    disabled={isDisabled && !isSelected}
                    className={`group relative w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 border overflow-hidden ${
                      isClicked
                        ? "bg-primary/20 border-primary/60 scale-[0.98]"
                        : isSelected
                        ? "bg-primary/15 border-primary/50 scale-[1.01]"
                        : isDisabled
                        ? "bg-muted/50 border-muted opacity-50 cursor-not-allowed"
                        : isShareButton
                        ? "bg-gradient-to-br from-orange-500/90 via-pink-500/90 to-rose-500/90 hover:from-orange-500 hover:via-pink-500 hover:to-rose-500 border-orange-400/50 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-[1.03] active:scale-[0.98]"
                        : isBriefingButton
                        ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 border-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.98] animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
                        : "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {/* 背景光效 */}
                    {!isDisabled && !isClicked && (
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                        isBriefingButton || isShareButton
                          ? "via-white/10 to-transparent" 
                          : "via-primary/5 to-transparent"
                      } translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`} />
                    )}
                    
                    {/* 动态背景粒子效果（简报和分享按钮） */}
                    {(isBriefingButton || isShareButton) && !isDisabled && !isClicked && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
                        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white/25 rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
                      </div>
                    )}
                    
                    <div className="relative flex items-center gap-3">
                      {/* 编号图标或加载动画 */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all ${
                        isClicked
                          ? "bg-primary shadow-lg shadow-primary/50 animate-pulse"
                          : isShareButton
                          ? "bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                          : isBriefingButton
                          ? "bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
                          : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 group-hover:shadow-lg group-hover:shadow-primary/40"
                      }`}>
                        {isClicked ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                          </div>
                        ) : isShareButton ? (
                          <Share2 className="w-5 h-5 text-white" />
                        ) : (
                          <span className={isBriefingButton ? "text-white font-extrabold" : "text-primary-foreground"}>
                            {isBriefingButton ? "📝" : option.number}
                          </span>
                        )}
                      </div>
                      
                      {/* 文本 */}
                      <span className={`flex-1 text-sm md:text-base font-semibold transition-all ${
                        isClicked
                          ? "text-primary"
                          : isDisabled
                          ? "text-muted-foreground"
                          : isShareButton || isBriefingButton
                          ? "text-white drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                          : "text-foreground group-hover:text-primary"
                      }`}>
                        {isClicked && isBriefingButton ? "正在生成简报..." : option.text}
                      </span>
                      
                      {/* 装饰图标 */}
                      {isClicked ? (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <Sparkles className={`w-5 h-5 transition-all ${
                          isShareButton || isBriefingButton
                            ? "text-white/80 group-hover:text-white group-hover:scale-125 group-hover:rotate-12 opacity-100"
                            : "text-primary/40 group-hover:text-primary group-hover:scale-110 opacity-0 group-hover:opacity-100"
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Emotion Video Recommendations */}
        {showRecommendations && (
          <VideoRecommendations recommendations={videoRecommendations} />
        )}
        
        {/* Communication Course Recommendations */}
        {showCommunicationRecommendations && extractBriefingData() && (
          <CommunicationCourseRecommendations
            briefing={extractBriefingData()!}
            courseRecommendations={courseRecommendations}
            campRecommendations={campRecommendations}
            loading={commRecsLoading}
            onWatchCourse={handleWatchCourse}
          />
        )}
      </div>
    </div>
  );
};
