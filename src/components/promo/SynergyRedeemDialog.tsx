import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ExternalLink, Gift, ShoppingBag, Info, LogIn } from "lucide-react";
import { detectPlatform } from "@/lib/platformDetector";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import youzanMiniQr from "@/assets/youzan-miniprogram-qr.png";

const YOUZAN_URL = "https://tuicashier.youzan.com/pay/wscgoods_order?scan=1&activity=none&from=kdt&qr=directgoods_5625577765&shopAutoEnter=1&alias=36c1wn65vbtllos";

interface SynergyRedeemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isLoggedIn: boolean;
  onNeedLogin: (code: string) => void;
}

export function SynergyRedeemDialog({ open, onOpenChange, onSuccess, isLoggedIn, onNeedLogin }: SynergyRedeemDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const isMiniProgram = detectPlatform() === 'mini_program';

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("请输入兑换码");
      return;
    }

    if (!isLoggedIn) {
      onNeedLogin(trimmed);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-synergy-code", {
        body: { code: trimmed },
      });

      // 优先读业务错误（后端返回的中文提示）
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (error) {
        const msg = await extractEdgeFunctionError(data, error, "网络错误，请稍后重试");
        toast.error(msg);
        return;
      }

      if (data?.success) {
        toast.success("🎉 兑换成功！", { description: "训练营已开通，即将进入" });
        setCode("");
        onOpenChange(false);
        onSuccess();
      }
    } catch (e) {
      toast.error("系统错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-center text-slate-800 flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            兑换训练营
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            输入您在有赞商城获取的兑换码
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 未登录提示横幅 */}
          {!isLoggedIn && (
            <div className="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-200/60 px-3 py-2.5">
              <span className="text-sm text-orange-700">🔒 请先登录后再兑换</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-orange-300 text-orange-700 hover:bg-orange-100/60 text-xs"
                onClick={() => onNeedLogin(code.trim())}
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                去登录
              </Button>
            </div>
          )}

          {/* 兑换码输入 */}
          <div className="flex gap-2">
            <Input
              placeholder="请输入兑换码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isLoggedIn && handleRedeem()}
              className="flex-1"
              disabled={loading || !isLoggedIn}
            />
            <Button
              onClick={handleRedeem}
              disabled={loading || !code.trim() || !isLoggedIn}
              className="shrink-0 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white border-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "兑换"}
            </Button>
          </div>

          {/* 如何获取兑换码 */}
          <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-semibold text-amber-800">如何获取兑换码？</h4>
            </div>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>1. 前往有赞商城下单购买训练营套餐</p>
              <p>2. 支付成功后，您将获得专属兑换码</p>
              <p>3. 返回此页面输入兑换码完成激活</p>
            </div>

            {isMiniProgram ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <img
                  src={youzanMiniQr}
                  alt="有赞商品小程序码"
                  className="w-40 h-40 rounded-lg"
                />
                <p className="text-xs text-amber-700 font-medium">长按识别小程序码前往下单</p>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-10 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-100/60 font-medium text-sm"
                onClick={() => window.open(YOUZAN_URL, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                前往有赞商城下单
              </Button>
            )}

            <p className="text-[11px] text-slate-400 text-center">下单后请返回此页面输入兑换码完成激活</p>
          </div>

          {/* 购买须知 */}
          <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">购买须知</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              • 本产品为实物+服务商品，兑换码不支持退订、转赠、退换
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              • 如需开票，发票将分两张开具，金额合计为实付套餐总价
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
