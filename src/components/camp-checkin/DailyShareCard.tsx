import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyShareCardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 第几天，1-based */
  dayNumber: number;
  /** 训练营总天数，默认 7 */
  totalDays?: number;
  /** 用户今天写下的那句话（来自反思 / 简报） */
  userQuote?: string;
  /** 教练的一句回应 */
  coachReply?: string;
  /** 用户昵称 */
  userName?: string;
  /** 是否解锁第 7 天烫金款 */
  isFinaleEdition?: boolean;
}

const C = {
  bgNormal: "linear-gradient(160deg, #1a1a1a 0%, #2a201a 60%, #3a2a1a 100%)",
  bgFinale: "linear-gradient(160deg, #0a0a0a 0%, #1f1208 50%, #4a3416 100%)",
  gold: "#d4b481",
  goldStrong: "#e9c98a",
  text: "#ece7dc",
  textMute: "#8a8478",
};

const serif = { fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' };

export default function DailyShareCard({
  open,
  onOpenChange,
  dayNumber,
  totalDays = 7,
  userQuote,
  coachReply,
  userName,
  isFinaleEdition = false,
}: DailyShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const isFinale = isFinaleEdition || dayNumber >= totalDays;

  const handleSave = async () => {
    if (!cardRef.current) return;
    try {
      setBusy(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `当日卡片_第${dayNumber}天.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "已保存到相册 / 下载", description: "可以发给一个你信得过的人。" });
    } catch (e) {
      console.error(e);
      toast({ title: "保存失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const finaleHeadline = "这 7 天，你是唯一一个真的走完的人。";
  const normalHeadline = "这一格，你今天动过了。";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 bg-background border-border overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base">看看今天的卡片</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: isFinale ? C.bgFinale : C.bgNormal,
              border: `1.5px solid ${isFinale ? C.goldStrong : C.gold}`,
              padding: "28px 24px",
              color: C.text,
              minHeight: 480,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span
                  className="text-[10px] tracking-[0.3em]"
                  style={{ color: isFinale ? C.goldStrong : C.gold }}
                >
                  {isFinale ? "FINALE · 七日款" : "DAILY CARD"}
                </span>
                <span className="text-[11px] font-mono" style={{ color: C.gold }}>
                  第 {dayNumber} / {totalDays} 天
                </span>
              </div>

              <h3
                className="text-[20px] leading-[1.5] font-semibold mb-6"
                style={{ ...serif, color: isFinale ? C.goldStrong : C.text }}
              >
                {isFinale ? finaleHeadline : normalHeadline}
              </h3>

              {userQuote && (
                <div className="mb-5">
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: C.gold }}>
                    你今天写下的
                  </p>
                  <p
                    className="text-[15px] leading-[1.85] italic"
                    style={{ ...serif, color: C.text }}
                  >
                    「{userQuote}」
                  </p>
                </div>
              )}

              {coachReply && (
                <div>
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: C.gold }}>
                    教练的一句回应
                  </p>
                  <p
                    className="text-[13px] leading-[1.85]"
                    style={{ color: C.textMute }}
                  >
                    {coachReply}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5" style={{ borderTop: `1px dashed rgba(212,180,129,0.3)` }}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px]" style={{ color: C.gold }}>
                    {userName || "有劲学员"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: C.textMute }}>
                    7 天有劲训练营 · 有劲AI
                  </p>
                </div>
                <p
                  className="text-[10px] tracking-[0.15em]"
                  style={{ color: C.textMute }}
                >
                  YOUJIN.AI
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center mt-4 text-muted-foreground leading-relaxed">
            存到手机，或者发给一个你信得过的人。
          </p>

          <Button
            onClick={handleSave}
            disabled={busy}
            className="w-full mt-3 h-11"
            style={{
              background: C.gold,
              color: "#1a1a1a",
            }}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                保存这张卡片
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
