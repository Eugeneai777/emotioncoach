import { useState } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import assistantQR from "@/assets/qiwei-assistant-qr.jpg";
import { isWeChatMiniProgram } from "@/utils/platform";

const ASSISTANT_ID = "youjin-assistant";

interface AssistantQRCardProps {
  defaultOpen?: boolean;
  title?: string;
  hint?: string;
}

export function AssistantQRCard({
  defaultOpen = false,
  title = "添加助教企微，获取你的个性化情绪疏导方案",
  hint = "扫描二维码，添加我的企业微信",
}: AssistantQRCardProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const inMiniProgram = typeof window !== "undefined" && isWeChatMiniProgram();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(ASSISTANT_ID);
      toast.success("助教企微号已复制，请到企业微信添加");
    } catch {
      toast.info(`请手动复制助教企微号：${ASSISTANT_ID}`);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-rose-50/50 via-white to-purple-50/50 dark:from-rose-950/20 dark:via-background dark:to-purple-950/20 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">点击{expanded ? "收起" : "展开"}二维码</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="mt-3 flex flex-col items-center">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <img
              src={assistantQR}
              alt="助教企微二维码"
              className="w-44 h-44 rounded-lg object-contain"
            />
          </div>
          {inMiniProgram ? (
            <div className="mt-2 space-y-2 max-w-[180px]">
              <p className="text-[11px] text-muted-foreground text-center leading-snug">
                小程序内无法长按识别，请截屏保存后用企业微信扫码
              </p>
              <button
                onClick={handleCopyId}
                className="w-full text-xs bg-primary/10 text-primary rounded-md px-2 py-1.5 flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors"
              >
                <Copy className="w-3 h-3" />
                复制助教企微号
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 text-center">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
