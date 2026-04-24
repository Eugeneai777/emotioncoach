import { Copy, MessageSquare, Ticket, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SupportTicketCardProps {
  ticket_no: string;
  subject?: string;
  ticket_id?: string;
  onContactQiWei?: () => void;
}

/**
 * 工单创建后的可视化卡片：可复制单号 + 一键联系企微
 * 替代原本仅在 AI 文本里口播工单号的弱反馈
 */
export const SupportTicketCard = ({ ticket_no, subject, ticket_id, onContactQiWei }: SupportTicketCardProps) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticket_no);
      setCopied(true);
      toast.success("工单号已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 微信小程序 WebView 可能不支持 clipboard API，降级提示
      toast.info(`请手动复制：${ticket_no}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">工单已创建</p>
          {subject && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subject}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <code className="text-xs bg-white/70 px-2 py-1 rounded border border-amber-200/50 font-mono">
              {ticket_no}
            </code>
            <button
              onClick={handleCopy}
              className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() =>
                ticket_id ? navigate(`/my-tickets/${ticket_id}`) : navigate(`/my-tickets`)
              }
            >
              查看进度
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
            {onContactQiWei && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={onContactQiWei}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                联系企微人工
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
