import { ArrowDown } from "lucide-react";
import { useEffect, useState, RefObject } from "react";

interface ScrollToBottomButtonProps {
  scrollRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  primaryColor?: string;
}

export const ScrollToBottomButton = ({ 
  scrollRef, 
  messagesEndRef,
  primaryColor = "primary"
}: ScrollToBottomButtonProps) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowButton(distanceFromBottom > 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!showButton) return null;

  const colorMap: Record<string, string> = {
    green: 'bg-emerald-500 hover:bg-emerald-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    rose: 'bg-rose-500 hover:bg-rose-600',
    red: 'bg-rose-500 hover:bg-rose-600',
    teal: 'bg-teal-500 hover:bg-teal-600',
    primary: 'bg-primary hover:bg-primary/90',
  };

  const bgColor = colorMap[primaryColor] || colorMap.primary;

  return (
    <button
      onClick={scrollToBottom}
      className={`fixed bottom-28 right-4 z-30 w-10 h-10 rounded-full 
        ${bgColor} text-white shadow-lg 
        flex items-center justify-center
        animate-in fade-in slide-in-from-bottom-2
        active:scale-95 transition-all duration-200`}
      aria-label="滚动到底部"
    >
      <ArrowDown className="w-5 h-5" />
    </button>
  );
};
