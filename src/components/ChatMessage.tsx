interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";
  
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
          <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
};
