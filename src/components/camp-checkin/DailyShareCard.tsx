import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type CardTier = 1 | 2 | 3;

interface DailyShareCardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dayNumber: number;
  totalDays?: number;
  tier: CardTier;
  /** 用户今天写下的那句话（来自简报） */
  userQuote?: string;
  /** 教练的一句回应 */
  coachReply?: string;
  /** 是否完成了反思分享 */
  hasReflection?: boolean;
  /** 反思分享的内容（可选，没有就用默认手写体一句） */
  reflectionText?: string;
  userName?: string;
}

const PALETTE = {
  // tier 1
  bg1: "linear-gradient(160deg, #1a1a1a 0%, #221f1b 100%)",
  border1: "#a8895a",
  // tier 2
  bg2: "linear-gradient(160deg, #1a1a1a 0%, #2a201a 60%, #3a2a1a 100%)",
  border2: "#d4b481",
  // tier 3 烫金
  bg3: "linear-gradient(160deg, #0a0a0a 0%, #1f1208 45%, #4a3416 100%)",
  border3: "#e9c98a",
  gold: "#d4b481",
  goldStrong: "#e9c98a",
  text: "#ece7dc",
  textMute: "#8a8478",
};

const serif = { fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' };
const handwriting = { fontFamily: '"Ma Shan Zheng", "Kaiti SC", "STKaiti", cursive' };

const TIER_HEADLINE: Record<CardTier, string> = {
  1: "今天，你动了一下。",
  2: "这一格，你今天动过了。",
  3: "这 7 天，你是唯一一个真的走完的人。",
};

const TIER_EYEBROW: Record<CardTier, string> = {
  1: "DAILY · 起步款",
  2: "DAILY · 进阶款",
  3: "FINALE · 七日烫金款",
};

export default function DailyShareCard({
  open,
  onOpenChange,
  dayNumber,
  totalDays = 7,
  tier,
  userQuote,
  coachReply,
  hasReflection = false,
  reflectionText,
  userName,
}: DailyShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const bg = tier === 3 ? PALETTE.bg3 : tier === 2 ? PALETTE.bg2 : PALETTE.bg1;
  const border = tier === 3 ? PALETTE.border3 : tier === 2 ? PALETTE.border2 : PALETTE.border1;
  const headlineColor = tier === 3 ? PALETTE.goldStrong : PALETTE.text;
  const showQuoteBlock = tier >= 2;

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
      a.download = `当日卡片_第${dayNumber}天${tier === 3 ? "_七日款" : ""}.png`;
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

  const reflectionLine =
    reflectionText && reflectionText.length > 0
      ? reflectionText
      : "今天的反思已经发到学员群。";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 bg-background border-border overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base flex items-center gap-2">
            {tier === 3 && <Sparkles className="w-4 h-4 text-amber-500" />}
            {tier === 1 ? "先看一眼今天的卡片" : tier === 2 ? "看看今天的卡片" : "收下你的七日卡"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: bg,
              border: `${tier === 3 ? 2 : 1.5}px solid ${border}`,
              padding: tier === 3 ? "32px 26px" : "28px 24px",
              color: PALETTE.text,
              minHeight: tier === 1 ? 360 : 480,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: tier === 3 ? `0 0 40px rgba(233,201,138,0.18) inset` : undefined,
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span
                  className="text-[10px] tracking-[0.3em]"
                  style={{ color: tier === 3 ? PALETTE.goldStrong : PALETTE.gold }}
                >
                  {TIER_EYEBROW[tier]}
                </span>
                <span className="text-[11px] font-mono" style={{ color: PALETTE.gold }}>
                  第 {dayNumber} / {totalDays} 天
                </span>
              </div>

              <h3
                className="text-[20px] leading-[1.5] font-semibold mb-6"
                style={{ ...serif, color: headlineColor }}
              >
                {TIER_HEADLINE[tier]}
              </h3>

              {/* tier 2/3 显示 quote + coachReply */}
              {showQuoteBlock && userQuote && (
                <div className="mb-5">
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: PALETTE.gold }}>
                    你今天写下的
                  </p>
                  <p
                    className="text-[15px] leading-[1.85] italic"
                    style={{ ...serif, color: PALETTE.text }}
                  >
                    「{userQuote}」
                  </p>
                </div>
              )}

              {showQuoteBlock && coachReply && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: PALETTE.gold }}>
                    教练的一句回应
                  </p>
                  <p className="text-[13px] leading-[1.85]" style={{ color: PALETTE.textMute }}>
                    {coachReply}
                  </p>
                </div>
              )}

              {/* tier 1 文案兜底 */}
              {tier === 1 && (
                <p
                  className="text-[13px] leading-[1.9]"
                  style={{ color: PALETTE.textMute }}
                >
                  你今天没硬扛，挑了一件先做。
                  <br />
                  这一步，已经比昨天多了。
                </p>
              )}

              {/* 反思分享加厚行：tier 2/3 + 已分享 */}
              {showQuoteBlock && hasReflection && (
                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: `1px dashed rgba(212,180,129,0.25)` }}
                >
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: PALETTE.gold }}>
                    今日反思
                  </p>
                  <p
                    className="text-[15px] leading-[1.7]"
                    style={{ ...handwriting, color: PALETTE.text }}
                  >
                    {reflectionLine}
                  </p>
                </div>
              )}

              {/* tier 3 七日勋章 */}
              {tier === 3 && (
                <div className="mt-5 flex items-center justify-center">
                  <div
                    className="px-4 py-2 rounded-full text-[11px] tracking-[0.3em]"
                    style={{
                      background: "linear-gradient(135deg, #d4b481, #e9c98a, #d4b481)",
                      color: "#1a1208",
                      fontWeight: 600,
                    }}
                  >
                    7 DAYS · 走完了
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5" style={{ borderTop: `1px dashed rgba(212,180,129,0.3)` }}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px]" style={{ color: PALETTE.gold }}>
                    {userName || "有劲学员"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: PALETTE.textMute }}>
                    7 天有劲训练营 · 有劲AI
                  </p>
                </div>
                <p className="text-[10px] tracking-[0.15em]" style={{ color: PALETTE.textMute }}>
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
              background: tier === 3 ? PALETTE.goldStrong : PALETTE.gold,
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
                {tier === 3 ? "收下七日卡" : "保存这张卡片"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
