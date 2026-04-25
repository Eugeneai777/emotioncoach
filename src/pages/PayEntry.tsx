import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Gift, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";

export default function PayEntry() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get("partner");

  // 微信静默授权回调参数
  const paymentAuthCode = searchParams.get('code');
  const paymentRedirect = searchParams.get('payment_redirect');
  const payFlow = searchParams.get('pay_flow');
  const authState = searchParams.get('state'); // 微信回调的 state 参数
  const isPaymentAuthCallback =
    searchParams.get('payment_auth_callback') === '1' &&
    !!paymentAuthCode &&
    !!paymentRedirect;

  // 支付恢复参数
  const isPaymentResume = searchParams.get('payment_resume') === '1';
  const resumeOpenId = searchParams.get('payment_openid') || undefined;
  const resumeTokenHash = searchParams.get('payment_token_hash') || undefined;
  
  const [cachedOpenId, setCachedOpenId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const redirectBackWithAuthFallback = () => {
    if (!paymentRedirect) return;
    const target = new URL(paymentRedirect);
    target.searchParams.set('payment_auth_error', '1');
    target.searchParams.set('payment_resume', '1');
    target.searchParams.set('assessment_pay_resume', '1');
    window.location.replace(target.toString());
  };

  // 优先处理静默授权回调（使用新的 wechat-pay-auth 函数）
  useEffect(() => {
    if (!isPaymentAuthCallback) return;

    // 防重入：同一个微信 code 只处理一次，避免重复换码触发 code been used
    const authCodeLockKey = `wechat_payauth_lock_${paymentAuthCode}`;
    const now = Date.now();
    const lockedAt = Number(sessionStorage.getItem(authCodeLockKey) || 0);
    if (lockedAt && now - lockedAt < 30_000) {
      console.log('[PayEntry] Duplicate callback detected, skip re-processing code');
      return;
    }
    sessionStorage.setItem(authCodeLockKey, String(now));

    const run = async () => {
      console.log('[PayEntry] Processing payment auth callback...');
      console.log('[PayEntry] code:', paymentAuthCode);
      console.log('[PayEntry] paymentRedirect:', paymentRedirect);
      console.log('[PayEntry] payFlow:', payFlow);
      console.log('[PayEntry] authState:', authState);

      try {
        // 调用新的 wechat-pay-auth 函数换取 openId + tokenHash（自动登录/注册）
        // 传递 state 参数以便识别是否是注册场景（用于获取用户头像昵称）
        const { data, error } = await supabase.functions.invoke('wechat-pay-auth', {
          body: { code: paymentAuthCode, state: authState },
        });

        console.log('[PayEntry] wechat-pay-auth response:', data, error);

        // 构建回跳 URL
        const target = new URL(paymentRedirect!);
        
        // 清理原有的授权相关参数
        target.searchParams.delete('code');
        target.searchParams.delete('state');
        target.searchParams.delete('payment_auth_callback');
        target.searchParams.delete('payment_redirect');

        if (error || !data?.openId) {
          console.error('[PayEntry] Error from wechat-pay-auth:', error || data);
          target.searchParams.set('payment_auth_error', '1');
          // 通用支付恢复标记
          target.searchParams.set('payment_resume', '1');
          target.searchParams.set('assessment_pay_resume', '1');
          window.location.replace(target.toString());
          return;
        }

        const { openId, tokenHash, isNewUser } = data;

        // 添加新参数
        target.searchParams.set('payment_openid', openId);
        if (tokenHash) {
          target.searchParams.set('payment_token_hash', tokenHash);
        }
        if (payFlow) {
          target.searchParams.set('pay_flow', payFlow);
        }
        // 通用支付恢复标记
        target.searchParams.set('payment_resume', '1');
        target.searchParams.set('assessment_pay_resume', '1');
        if (isNewUser) {
          target.searchParams.set('is_new_user', '1');
        }

        console.log('[PayEntry] Redirecting to:', target.toString());
        
        // 使用 replace 防止回退导致重复触发
        window.location.replace(target.toString());
      } catch (e) {
        console.error('[PayEntry] Exception in payment auth callback:', e);
        const target = new URL(paymentRedirect!);
        target.searchParams.set('payment_auth_error', '1');
        target.searchParams.set('assessment_pay_resume', '1');
        window.location.replace(target.toString());
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      console.warn('[PayEntry] Payment auth exchange timeout, redirecting back with fallback');
      redirectBackWithAuthFallback();
    }, 8000);

    run();

    return () => window.clearTimeout(fallbackTimer);
  }, [isPaymentAuthCallback, paymentAuthCode, paymentRedirect, payFlow, authState]);

  useEffect(() => {
    if (isPaymentAuthCallback) return;

    if (!partnerId) {
      setLoading(false);
      return;
    }
    
    fetchPartnerInfo();
  }, [partnerId, isPaymentAuthCallback]);

  // 支付恢复：授权回跳后自动打开支付对话框
  useEffect(() => {
    if (!isPaymentResume || !partner || isPaymentAuthCallback) return;
    
    const resumePayment = async () => {
      console.log('[PayEntry] Payment resume detected. openId:', resumeOpenId, 'tokenHash:', resumeTokenHash ? 'present' : 'none');
      
      // Bug fix 1: Auto-login with tokenHash before opening pay dialog
      if (resumeTokenHash) {
        try {
          console.log('[PayEntry] Auto-login with tokenHash...');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: resumeTokenHash,
            type: 'magiclink',
          });
          if (error) {
            console.error('[PayEntry] Auto-login failed:', error);
          } else {
            console.log('[PayEntry] Auto-login successful');
          }
        } catch (e) {
          console.error('[PayEntry] Auto-login exception:', e);
        }
      }
      
      // Bug fix 2: Cache openId in state BEFORE clearing URL params
      if (resumeOpenId) {
        setCachedOpenId(resumeOpenId);
      }
      
      setShowPayDialog(true);
      
      // Clean URL params to prevent duplicate triggers
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('payment_resume');
      newParams.delete('payment_openid');
      newParams.delete('payment_token_hash');
      newParams.delete('assessment_pay_resume');
      newParams.delete('payment_auth_error');
      newParams.delete('is_new_user');
      newParams.delete('pay_flow');
      setSearchParams(newParams, { replace: true });
    };
    
    resumePayment();
  }, [isPaymentResume, partner, isPaymentAuthCallback]);

  const fetchPartnerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, prepurchase_count, default_entry_type, default_entry_price, default_quota_amount')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      setPartner(data);
    } catch (error) {
      console.error("Fetch partner error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/pay-entry?partner=${partnerId}`)}`);
      return;
    }
    
    setShowPayDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    toast.success("🎉 支付成功！已获得体验套餐");
    
    // Process referral and deduct partner quota
    try {
      await supabase.functions.invoke('claim-partner-entry', {
        body: { partner_id: partnerId, is_paid: true }
      });
    } catch (error) {
      console.error("Process referral error:", error);
    }
  };

  const handleStartJourney = () => {
    navigate('/camps');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // 如果正在处理支付授权回调，显示步骤化进度，避免用户误以为卡死
  if (isPaymentAuthCallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-teal-100">
          <CardContent className="p-8 text-center space-y-5">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-teal-800">正在完成微信授权</h3>
              <p className="text-sm text-muted-foreground">即将自动登录并打开支付，无需手动操作</p>
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-teal-700">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">✓</span>
                <span>微信授权已通过</span>
              </div>
              <div className="flex items-center gap-2 text-teal-700">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center animate-pulse">2</span>
                <span>正在换取登录凭证...</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">3</span>
                <span>返回页面打开支付</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70">通常需 3–5 秒，首次授权稍长</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!partnerId || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <CardTitle>无效链接</CardTitle>
            <CardDescription>缺少合伙人信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if partner has quota
  if (!partner.prepurchase_count || partner.prepurchase_count < 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <CardTitle>名额已满</CardTitle>
            <CardDescription>该推广链接的体验名额已用完</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-teal-100">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-xl text-teal-700">🎉 已获得体验套餐！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package benefits */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-lg font-bold text-teal-600">
                <Sparkles className="w-5 h-5" />
                <span>体验套餐权益</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4 text-teal-500" />
                  <span className="font-medium">50 点 AI 额度</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-teal-500">✓</span>
                  <span>365 天有效期</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-teal-500">✓</span>
                  <span>免费参加21天训练营</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-teal-500">✓</span>
                  <span>解锁全部情绪工具</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-muted-foreground">
              现在就开始你的情绪梳理之旅吧！
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleStartJourney}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
              >
                🏕️ 开始免费训练营
              </Button>
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                进入首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">开启你的成长之旅</CardTitle>
          <CardDescription>
            仅需 ¥9.9，获得完整体验套餐
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-orange-800">🎁 体验套餐权益</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span><strong>50点</strong> AI情绪梳理额度</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span><strong>365天</strong> 有效期</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span>免费参加21天训练营</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span>加入专属学员社群</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span>解锁全部情绪工具</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              ¥9.9
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              原价 ¥99 · 限时特惠
            </p>
          </div>

          {/* CTA */}
          <Button 
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-lg py-6"
          >
            立即支付 ¥9.9
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            支付即表示同意《用户服务协议》
          </p>
        </CardContent>
      </Card>

      <UnifiedPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: 'partner_entry_paid',
          name: '有劲AI · 体验套餐',
          price: 9.9,
          quota: 50
        }}
        onSuccess={handlePaymentSuccess}
        openId={cachedOpenId || resumeOpenId}
      />
    </div>
  );
}
