import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface Props {
  qrImageUrl?: string | null;
  qrTitle?: string | null;
  /** 点击行为(常驻 sticky 按钮也会触发同一弹窗) */
  onClick?: () => void;
}

/**
 * 加微卡 · 软前置(屏 2,紧贴认知盲区下方)
 * 文案按用户最新口径,不承诺无法兑现的赠品
 */
export function InlineWechatLeadCard({ qrImageUrl, qrTitle, onClick }: Props) {
  if (!qrImageUrl) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="border-teal-300/50 bg-gradient-to-br from-teal-50/80 via-card to-emerald-50/40 dark:from-teal-950/25 dark:to-emerald-950/15 shadow-md overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              加顾问微信,拿你的专属本周方案
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 ml-8">
            读完上面的盲区,你大概率想问"那我接下来该怎么办"——这正是顾问能帮你的地方。
          </p>

          <ul className="space-y-1.5 mb-3">
            {[
              "专属本周行动方案 · 基于你这次的状态写",
              "未说透的盲区,我们逐条给你拆解",
              "私聊提问 · 不打扰 · 不推销",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed">
                <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-teal-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-stretch gap-3 p-3 rounded-xl bg-white/85 dark:bg-card/80 border border-teal-200/50 dark:border-teal-800/40">
            <img
              src={qrImageUrl}
              alt={qrTitle || "顾问微信"}
              className="w-24 h-24 object-cover rounded-lg shrink-0 bg-white"
              loading="lazy"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="text-xs font-semibold text-foreground leading-snug">
                  长按识别二维码 · 加顾问微信
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  备注「有劲」,优先安排回复
                </div>
              </div>
              {onClick && (
                <button
                  type="button"
                  onClick={onClick}
                  className="self-start text-[11px] text-teal-700 dark:text-teal-300 underline underline-offset-2 decoration-dotted hover:text-teal-600"
                >
                  无法识别?查看更多方式
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
