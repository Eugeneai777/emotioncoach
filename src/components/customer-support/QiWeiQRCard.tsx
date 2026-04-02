import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import qiWeiQR from "@/assets/qiwei-service-qr.jpg";

export function QiWeiQRCard() {
  const [expanded, setExpanded] = useState(false);

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
          <p className="text-xs text-muted-foreground mt-2 text-center">
            扫码添加企微客服，获取即时帮助
          </p>
        </div>
      )}
    </div>
  );
}
