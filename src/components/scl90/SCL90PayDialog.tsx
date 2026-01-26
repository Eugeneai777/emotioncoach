import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, QrCode, Smartphone, Copy, ExternalLink } from "lucide-react";
import { QuickRegisterStep } from "@/components/onboarding/QuickRegisterStep";
import QRCode from "qrcode";
import { isWeChatMiniProgram, isWeChatBrowser } from "@/utils/platform";
import { usePackages, getPackagePrice } from "@/hooks/usePackages";
import { SCL90Result } from "./scl90Data";

// 声明 WeixinJSBridge 类型
declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke: (api: string, params: Record<string, string>, callback: (res: { err_msg: string }) => void) => void;
    };
  }
}

interface SCL90PayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string) => void;
  userId?: string;
  pendingAnswers: Record<number, number>;
  pendingResult: SCL90Result;
}

type PaymentStatus = "idle" | "creating" | "pending" | "polling" | "paid" | "registering" | "error";

// 从多个来源获取 openId
const getPaymentOpenId = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlOpenId = urlParams.get("payment_openid") || urlParams.get("openid") || urlParams.get("mp_openid");
  if (urlOpenId) return urlOpenId;
  
  const cachedOpenId = sessionStorage.getItem("wechat_payment_openid");
  if (cachedOpenId) return cachedOpenId;
  
  return undefined;
};

export function SCL90PayDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  userId,
  pendingAnswers,
  pendingResult 
}: SCL90PayDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [orderNo, setOrderNo] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [payUrl, setPayUrl] = useState<string>("");
  const [payType, setPayType] = useState<"h5" | "native" | "jsapi">("native");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const cachedOpenId = getPaymentOpenId();
  const [userOpenId, setUserOpenId] = useState<string | undefined>(cachedOpenId);
  const [openIdResolved, setOpenIdResolved] = useState<boolean>(false);
  const [paymentOpenId, setPaymentOpenId] = useState<string | undefined>();

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number>(0);

  const { data: packages } = usePackages();
  const reportPrice = getPackagePrice(packages, 'scl90_report', 9.9);

  const isWechat = isWeChatBrowser();
  const isMiniProgram = isWeChatMiniProgram();
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 清理轮询
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 获取 openId
  useEffect(() => {
    const fetchOpenId = async () => {
      if (!open) return;
      
      if (cachedOpenId) {
        setUserOpenId(cachedOpenId);
        setOpenIdResolved(true);
        return;
      }

      if (isMiniProgram) {
        const mpOpenId = new URLSearchParams(window.location.search).get("mp_openid") 
          || sessionStorage.getItem("wechat_mp_openid");
        if (mpOpenId) {
          setUserOpenId(mpOpenId);
        }
        setOpenIdResolved(true);
        return;
      }

      if (userId) {
        try {
          const { data: mapping } = await supabase
            .from("wechat_user_mappings")
            .select("openid")
            .eq("system_user_id", userId)
            .maybeSingle();
          
          if (mapping?.openid) {
            setUserOpenId(mapping.openid);
          }
        } catch (err) {
          console.error("[SCL90Pay] Failed to fetch openId:", err);
        }
      }
      setOpenIdResolved(true);
    };

    fetchOpenId();
  }, [open, userId, cachedOpenId, isMiniProgram]);

  // 轮询订单状态
  const startPolling = useCallback((orderNumber: string) => {
    pollingStartTimeRef.current = Date.now();
    
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-order-status", {
          body: { orderNo: orderNumber }
        });

        if (error) {
          console.error("[SCL90Pay] Polling error:", error);
          return;
        }

        if (data?.status === "paid") {
          stopPolling();
          setPaymentOpenId(data.openId || userOpenId);
          
          if (userId) {
            // 已登录用户：保存测评结果
            await saveSCL90Assessment(userId, orderNumber);
            setStatus("paid");
            toast.success("支付成功！");
            setTimeout(() => onSuccess(userId), 1000);
          } else {
            // 未登录：进入注册流程
            setStatus("registering");
          }
        }

        // 5分钟超时
        if (Date.now() - pollingStartTimeRef.current > 5 * 60 * 1000) {
          stopPolling();
          setStatus("error");
          setErrorMessage("支付超时，请重试");
        }
      } catch (err) {
        console.error("[SCL90Pay] Polling exception:", err);
      }
    }, 2000);
  }, [stopPolling, userId, userOpenId, onSuccess]);

  // 保存测评结果
  const saveSCL90Assessment = async (uid: string, orderId: string) => {
    try {
      await supabase.from('scl90_assessments').insert({
        user_id: uid,
        answers: pendingAnswers,
        somatization_score: pendingResult.factorScores.somatization,
        obsessive_score: pendingResult.factorScores.obsessive,
        interpersonal_score: pendingResult.factorScores.interpersonal,
        depression_score: pendingResult.factorScores.depression,
        anxiety_score: pendingResult.factorScores.anxiety,
        hostility_score: pendingResult.factorScores.hostility,
        phobic_score: pendingResult.factorScores.phobic,
        paranoid_score: pendingResult.factorScores.paranoid,
        psychoticism_score: pendingResult.factorScores.psychoticism,
        other_score: pendingResult.factorScores.other,
        total_score: pendingResult.totalScore,
        positive_count: pendingResult.positiveCount,
        positive_score_avg: pendingResult.positiveScoreAvg,
        gsi: pendingResult.gsi,
        severity_level: pendingResult.severityLevel,
        primary_symptom: pendingResult.primarySymptom,
        secondary_symptom: pendingResult.secondarySymptom,
        is_paid: true,
        paid_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[SCL90Pay] Failed to save assessment:", err);
    }
  };

  // 创建订单
  const createOrder = async () => {
    setStatus("creating");
    setErrorMessage("");

    try {
      let selectedPayType: "jsapi" | "h5" | "native" | "miniprogram";

      if (isMiniProgram) {
        if (!userOpenId) {
          toast.error("请在微信小程序中完成支付");
          setStatus("idle");
          return;
        }
        selectedPayType = "miniprogram";
      } else if (isWechat && !!userOpenId) {
        selectedPayType = "jsapi";
      } else if (isMobile && !isWechat) {
        selectedPayType = "h5";
      } else {
        selectedPayType = "native";
      }

      setPayType(selectedPayType === "miniprogram" ? "jsapi" : selectedPayType);

      const { data, error } = await supabase.functions.invoke("create-wechat-order", {
        body: {
          packageKey: "scl90_report",
          packageName: "SCL-90心理测评报告",
          amount: reportPrice,
          userId: userId || "guest",
          payType: selectedPayType,
          openId: (selectedPayType === "jsapi" || selectedPayType === "miniprogram") ? userOpenId : undefined,
          isMiniProgram: isMiniProgram,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "创建订单失败");

      if (data.alreadyPaid) {
        toast.success("您已购买过测评报告！");
        if (userId) {
          onSuccess(userId);
          onOpenChange(false);
        } else {
          setPaymentOpenId(data.openId || userOpenId);
          setStatus("registering");
        }
        return;
      }

      setOrderNo(data.orderNo);

      if (selectedPayType === "miniprogram" && data.miniprogramPayParams) {
        setStatus("polling");
        startPolling(data.orderNo);
        // 触发小程序原生支付
        const mp = window.wx?.miniProgram;
        if (mp?.navigateTo) {
          const successUrl = new URL(window.location.href);
          successUrl.searchParams.set("payment_success", "1");
          successUrl.searchParams.set("order", data.orderNo);
          const payPageUrl = `/pages/pay/index?orderNo=${encodeURIComponent(data.orderNo)}&params=${encodeURIComponent(JSON.stringify(data.miniprogramPayParams))}&callback=${encodeURIComponent(successUrl.toString())}`;
          mp.navigateTo({ url: payPageUrl });
        }
      } else if (selectedPayType === "jsapi" && data.jsapiPayParams) {
        setStatus("polling");
        startPolling(data.orderNo);
        // 调用 JSAPI 支付
        if (window.WeixinJSBridge) {
          window.WeixinJSBridge.invoke("getBrandWCPayRequest", data.jsapiPayParams, (res) => {
            if (res.err_msg === "get_brand_wcpay_request:ok") {
              console.log("[SCL90Pay] JSAPI pay success");
            }
          });
        }
      } else if (selectedPayType === "h5" && data.payUrl) {
        setStatus("polling");
        startPolling(data.orderNo);
        setPayUrl(data.payUrl);
        window.location.href = data.payUrl;
      } else if (data.qrCodeUrl || data.payUrl) {
        // Native 扫码支付
        if (!isMiniProgram) {
          const qrDataUrl = await QRCode.toDataURL(data.qrCodeUrl || data.payUrl, {
            width: 200,
            margin: 2,
          });
          setQrCodeDataUrl(qrDataUrl);
        }
        setPayUrl(data.qrCodeUrl || data.payUrl);
        setStatus("pending");
        startPolling(data.orderNo);
      }
    } catch (err: any) {
      console.error("[SCL90Pay] Create order error:", err);
      setStatus("error");
      setErrorMessage(err?.message || "创建订单失败，请重试");
      toast.error(err?.message || "创建订单失败");
    }
  };

  // 注册成功回调
  const handleRegisterSuccess = async (registeredUserId: string) => {
    // 保存测评结果到新注册的用户
    await saveSCL90Assessment(registeredUserId, orderNo);
    setStatus("paid");
    toast.success("注册成功！");
    setTimeout(() => onSuccess(registeredUserId), 500);
  };

  // 复制链接
  const copyPayUrl = async () => {
    if (payUrl) {
      await navigator.clipboard.writeText(payUrl);
      toast.success("已复制支付链接");
    }
  };

  // 渲染内容
  const renderContent = () => {
    if (status === "registering") {
      return (
        <div className="py-4">
          <div className="text-center mb-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-lg">支付成功！</h3>
            <p className="text-sm text-muted-foreground">请完成注册以查看您的测评报告</p>
          </div>
          <QuickRegisterStep
            orderNo={orderNo}
            paymentOpenId={paymentOpenId}
            onSuccess={handleRegisterSuccess}
          />
        </div>
      );
    }

    if (status === "paid") {
      return (
        <div className="py-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">支付成功</h3>
          <p className="text-muted-foreground">正在为您生成报告...</p>
        </div>
      );
    }

    if (status === "creating" || status === "polling") {
      return (
        <div className="py-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {status === "creating" ? "正在创建订单..." : "等待支付完成..."}
          </p>
        </div>
      );
    }

    if (status === "pending" && qrCodeDataUrl) {
      return (
        <div className="py-4 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">请使用微信扫码支付</p>
            <div className="inline-block p-3 bg-white rounded-lg shadow">
              <img src={qrCodeDataUrl} alt="支付二维码" className="w-48 h-48" />
            </div>
            <p className="text-lg font-bold text-primary mt-2">¥{reportPrice.toFixed(2)}</p>
          </div>
          
          {isMobile && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyPayUrl}>
                <Copy className="w-4 h-4 mr-1" />
                复制链接
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.open(payUrl, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-1" />
                打开支付
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h3 className="font-semibold mb-2">支付遇到问题</h3>
          <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
          <Button onClick={() => setStatus("idle")}>重新支付</Button>
        </div>
      );
    }

    // 默认：显示支付按钮
    return (
      <div className="py-4 space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">解锁完整测评报告</h3>
          <p className="text-sm text-muted-foreground">包含10维度详细分析 + AI智能解读</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">特惠价</p>
          <p className="text-3xl font-bold text-primary">¥{reportPrice.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground line-through">原价 ¥29.9</p>
        </div>

        <Button 
          className="w-full h-12 text-base font-semibold"
          onClick={createOrder}
        >
          {isWechat ? (
            <>
              <Smartphone className="w-5 h-5 mr-2" />
              微信支付
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              立即支付
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          支付即表示同意《服务协议》和《隐私政策》
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {status === "registering" ? "完成注册" : "SCL-90 测评报告"}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
