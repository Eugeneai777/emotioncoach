import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { isWeChatMiniProgram } from "@/utils/platform";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import qrPlaceholder from "@/assets/coach-wechat-placeholder.jpg";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachName?: string;
  qrUrl?: string | null;
  wechatId?: string | null;
}

/**
 * 教练企业微信弹窗
 * 二维码图片为占位图，后续由运营上传教练专属企微名片后替换
 * （可通过 coach.wechat_qr_url 字段覆盖；目前未配置时显示占位图）
 */
export function CoachWeChatDialog({ open, onOpenChange, coachName, qrUrl, wechatId }: Props) {
  const inMiniProgram = typeof window !== "undefined" && isWeChatMiniProgram();
  const finalQr = qrUrl || qrPlaceholder;

  const handleCopyId = async () => {
    if (!wechatId) return;
    try {
      await navigator.clipboard.writeText(wechatId);
      toast.success("企微号已复制");
    } catch {
      toast.info(`请手动复制：${wechatId}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto p-0">
        <div className="px-5 pt-5 pb-3">
          <SheetHeader>
            <SheetTitle className="text-left text-base">
              添加{coachName ? `「${coachName}」` : "教练"}企业微信
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-6 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            添加教练企微，沟通预约更顺畅。备注「咨询」可优先安排回复。
          </p>

          <div className="flex justify-center py-2">
            <img
              src={finalQr}
              alt="教练企业微信二维码"
              className="w-60 h-60 object-cover rounded-xl border border-border/50 bg-white shadow-md"
              loading="eager"
            />
          </div>

          {inMiniProgram ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground leading-snug">
                小程序内无法长按识别，请截屏保存后在企业微信扫码
              </p>
              {wechatId && (
                <button
                  onClick={handleCopyId}
                  className="w-full text-sm bg-primary/10 text-primary rounded-md px-2 py-2 flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  复制企微号
                </button>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              长按识别二维码 · 在企业微信中扫码添加
            </p>
          )}

          <Button variant="outline" className="w-full h-11" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
