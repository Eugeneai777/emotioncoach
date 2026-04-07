import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SuggestionCard } from "./SuggestionCard";
import { ActionCard } from "./ActionCard";
import { FollowUpCard } from "./FollowUpCard";
import { ServiceLinkCard } from "./ServiceLinkCard";
import { ExpenseCard } from "./ExpenseCard";
import { ExpenseReportCard } from "./ExpenseReportCard";
import { ClipboardCheck, ChevronRight } from "lucide-react";

interface ExpenseReportData {
  month: string;
  totalAmount: number;
  categories: { category: string; total: number; count: number }[];
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onRefine?: () => void;
  onExpense?: (data: { amount: number; category: string; note: string }) => void;
  onExpenseQuery?: (data: { type: string; month: string }) => void;
  expenseReport?: ExpenseReportData | null;
}

// Parse special card markers from AI response
function parseCards(content: string) {
  const parts: { type: "text" | "suggestion" | "action" | "followup" | "servicelink" | "expense" | "expense_query" | "assessment"; data?: any; text?: string }[] = [];
  
  const suggestionMatch = content.match(/\[SUGGESTION\]([\s\S]*?)\[\/SUGGESTION\]/);
  const actionMatch = content.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/);
  const followupMatch = content.match(/\[FOLLOWUP\]/);
  const serviceLinkMatch = content.match(/\[SERVICE_LINK\]([\s\S]*?)\[\/SERVICE_LINK\]/);
  const expenseMatch = content.match(/\[EXPENSE\]([\s\S]*?)\[\/EXPENSE\]/);
  const expenseQueryMatch = content.match(/\[EXPENSE_QUERY\]([\s\S]*?)\[\/EXPENSE_QUERY\]/);
  const assessmentMatch = content.match(/\[ASSESSMENT\]([\s\S]*?)\[\/ASSESSMENT\]/);
  
  let textContent = content
    .replace(/\[SUGGESTION\][\s\S]*?\[\/SUGGESTION\]/g, "")
    .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, "")
    .replace(/\[FOLLOWUP\]/g, "")
    .replace(/\[SERVICE_LINK\][\s\S]*?\[\/SERVICE_LINK\]/g, "")
    .replace(/\[EXPENSE\][\s\S]*?\[\/EXPENSE\]/g, "")
    .replace(/\[EXPENSE_QUERY\][\s\S]*?\[\/EXPENSE_QUERY\]/g, "")
    .replace(/\[ASSESSMENT\][\s\S]*?\[\/ASSESSMENT\]/g, "")
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

  if (serviceLinkMatch) {
    try {
      const data = JSON.parse(serviceLinkMatch[1]);
      parts.push({ type: "servicelink", data });
    } catch {}
  }

  if (expenseMatch) {
    try {
      const data = JSON.parse(expenseMatch[1]);
      parts.push({ type: "expense", data });
    } catch {}
  }

  if (expenseQueryMatch) {
    try {
      const data = JSON.parse(expenseQueryMatch[1]);
      parts.push({ type: "expense_query", data });
    } catch {}
  }

  if (assessmentMatch) {
    try {
      const data = JSON.parse(assessmentMatch[1]);
      parts.push({ type: "assessment", data });
    } catch {}
  }

  if (followupMatch) {
    parts.push({ type: "followup" });
  }

  return parts.length > 0 ? parts : [{ type: "text" as const, text: content }];
}

function AssessmentInlineCard({ title, desc, route, price }: { title: string; desc: string; route: string; price?: string }) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(route)}
      className="w-full rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-3.5 flex items-center gap-3 text-left active:bg-primary/15 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <ClipboardCheck className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {price && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{price}</span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
}

export function ChatBubble({ role, content, isStreaming, onRefine, onExpense, onExpenseQuery, expenseReport }: ChatBubbleProps) {
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
          if (part.type === "servicelink" && part.data) {
            return <ServiceLinkCard key={i} services={part.data} />;
          }
          if (part.type === "expense" && part.data) {
            if (onExpense) onExpense(part.data);
            return <ExpenseCard key={i} amount={part.data.amount} category={part.data.category} note={part.data.note} />;
          }
          if (part.type === "expense_query" && part.data) {
            if (onExpenseQuery) onExpenseQuery(part.data);
            if (expenseReport) {
              return <ExpenseReportCard key={i} month={expenseReport.month} totalAmount={expenseReport.totalAmount} categories={expenseReport.categories} />;
            }
            return null;
          }
          if (part.type === "assessment" && part.data) {
            return <AssessmentInlineCard key={i} title={part.data.title} desc={part.data.desc} route={part.data.route} price={part.data.price} />;
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
