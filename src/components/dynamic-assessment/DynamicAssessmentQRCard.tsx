import { Card, CardContent } from "@/components/ui/card";

interface DynamicAssessmentQRCardProps {
  qrImageUrl?: string | null;
  qrTitle?: string | null;
  /** 强调样式：放大二维码、强化标题；用于高转化测评（如 male_unspoken_check） */
  emphasize?: boolean;
  /** 强调样式下的副标题，默认引导备注「有劲」+ 颜色档 */
  emphasizeHint?: string;
}

export function DynamicAssessmentQRCard({
  qrImageUrl,
  qrTitle,
  emphasize = false,
  emphasizeHint,
}: DynamicAssessmentQRCardProps) {
  if (!qrImageUrl) return null;

  if (emphasize) {
    return (
      <Card className="mb-4 border-2 border-amber-500/40 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/20 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="text-center mb-3">
            <p className="text-base font-bold text-foreground leading-snug">
              {qrTitle || "男人有劲状态评估 · 加顾问微信"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {emphasizeHint || "备注「有劲」+ 你的颜色档（绿/黄/橙/红），优先安排回复"}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="p-2 bg-white rounded-2xl shadow-md border border-amber-200/60">
              <img
                src={qrImageUrl}
                alt="加顾问微信二维码"
                className="w-44 h-44 sm:w-48 sm:h-48 object-cover rounded-xl"
                loading="eager"
              />
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            📱 长按识别二维码 · 或截图保存后微信扫一扫
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-4">
        <img
          src={qrImageUrl}
          alt="二维码"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-sm text-foreground">
            {qrTitle || "扫码获取更多指导"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            长按识别二维码，获取专属服务
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
