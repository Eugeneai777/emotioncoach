import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrImageUrl?: string | null;
  qrTitle?: string | null;
}

/**
 * 男人有劲 · 结果页"加顾问"轻量弹窗
 * 仅展示企微二维码 + 引导文案,不再使用领取码 / 凭证海报
 */
export function MaleVitalityWeChatSheet({ open, onOpenChange, qrImageUrl, qrTitle }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[92vh] overflow-y-auto p-0"
      >
        <div className="px-5 pt-5 pb-3">
          <SheetHeader>
            <SheetTitle className="text-left text-base">
              🎯 加顾问微信 · 拆解你的盲区
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-6 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            读完结果里的盲区,你大概率想问"那我接下来该怎么办"——这正是顾问能帮你的地方。
            长按下方二维码加微信,备注「有劲」,我们会优先安排回复。
          </p>

          <div className="flex justify-center py-2">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt={qrTitle || "顾问微信二维码"}
                className="w-60 h-60 object-cover rounded-xl border border-border/50 bg-white shadow-md"
                loading="eager"
              />
            ) : (
              <div className="w-60 h-60 rounded-xl border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                二维码加载中…
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            长按识别二维码 · 备注「有劲」优先回复
          </p>

          <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
