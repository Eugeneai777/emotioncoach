import { useState } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import qiWeiQR from "@/assets/qiwei-service-qr.jpg";
import { isWeChatMiniProgram } from "@/utils/platform";

const QIWEI_ID = "youjin-service";

export function QiWeiQRCard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const inMiniProgram = typeof window !== "undefined" && isWeChatMiniProgram();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(QIWEI_ID);
      toast.success("企微号已复制，请到企业微信添加");
    } catch {
      toast.info(`请手动复制企微号：${QIWEI_ID}`);
    }
  };

  return (
    <div className="mt-2 ml-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <span>紧急问题？点此联系企微客服</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-2 p-3 bg-muted/30 rounded-xl border border-border/50 inline-block">
          <img
            src={qiWeiQR}
            alt="企微客服二维码"
            className="w-40 h-40 rounded-lg"
          />
          {inMiniProgram ? (
            <div className="mt-2 space-y-2 max-w-[160px]">
              <p className="text-[11px] text-muted-foreground text-center leading-snug">
                小程序内无法长按识别，请截屏保存后在企业微信扫码
              </p>
              <button
                onClick={handleCopyId}
                className="w-full text-xs bg-primary/10 text-primary rounded-md px-2 py-1.5 flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors"
              >
                <Copy className="w-3 h-3" />
                复制企微号
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              扫码添加企微客服，获取即时帮助
            </p>
          )}
        </div>
      )}
    </div>
  );
}
