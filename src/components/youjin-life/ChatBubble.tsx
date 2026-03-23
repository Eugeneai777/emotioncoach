import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { SuggestionCard } from "./SuggestionCard";
import { ActionCard } from "./ActionCard";
import { FollowUpCard } from "./FollowUpCard";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onRefine?: () => void;
}

// Parse special card markers from AI response
function parseCards(content: string) {
  const parts: { type: "text" | "suggestion" | "action" | "followup"; data?: any; text?: string }[] = [];
  
  // Simple marker detection for structured cards
  const suggestionMatch = content.match(/\[SUGGESTION\]([\s\S]*?)\[\/SUGGESTION\]/);
  const actionMatch = content.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/);
  const followupMatch = content.match(/\[FOLLOWUP\]/);
  
  let textContent = content
    .replace(/\[SUGGESTION\][\s\S]*?\[\/SUGGESTION\]/g, "")
    .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, "")
    .replace(/\[FOLLOWUP\]/g, "")
    .trim();

  if (textContent) {
    parts.push({ type: "text", text: textContent });
  }

  if (suggestionMatch) {
    try {
      const data = JSON.parse(suggestionMatch[1]);
      parts.push({ type: "suggestion", data });
    } catch {}
  }

  if (actionMatch) {
    try {
      const data = JSON.parse(actionMatch[1]);
      parts.push({ type: "action", data });
    } catch {}
  }

  if (followupMatch) {
    parts.push({ type: "followup" });
  }

  return parts.length > 0 ? parts : [{ type: "text" as const, text: content }];
}

export function ChatBubble({ role, content, isStreaming, onRefine }: ChatBubbleProps) {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-md bg-gray-900 text-white text-sm leading-relaxed">
          {content}
        </div>
      </motion.div>
    );
  }

  const parts = parseCards(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-[88%] space-y-3">
        {parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="px-4 py-3 rounded-2xl rounded-tl-md bg-gray-50 border border-gray-100">
                <div className="prose prose-sm prose-gray max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{part.text || ""}</ReactMarkdown>
                </div>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 rounded-full" />
                )}
              </div>
            );
          }
          if (part.type === "suggestion" && part.data) {
            return <SuggestionCard key={i} suggestions={part.data} />;
          }
          if (part.type === "action" && part.data) {
            return <ActionCard key={i} actions={part.data} />;
          }
          if (part.type === "followup") {
            return <FollowUpCard key={i} onRefine={onRefine} />;
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}
