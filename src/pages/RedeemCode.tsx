import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, CheckCircle2, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { CampJoinSelector } from "@/components/camp/CampJoinSelector";

interface CodeInfo {
  entry_type: string;
  entry_price: number;
  quota_amount: number;
}

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

export default function RedeemCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [quotaReceived, setQuotaReceived] = useState(50);
  const [showCampSelector, setShowCampSelector] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);
  
  // 兑换码信息
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null);
  
  // 支付对话框
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentPackageInfo, setPaymentPackageInfo] = useState<PackageInfo | null>(null);
  
  // 自动兑换状态
  const [autoRedeeming, setAutoRedeeming] = useState(false);
  const [autoRedeemAttempted, setAutoRedeemAttempted] = useState(false);

  // 初始化：检查兑换码
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
      checkCodeInfo(codeParam);
    }
  }, [searchParams]);

  // 自动兑换：当用户已登录且有兑换码时自动执行
  useEffect(() => {
    const codeParam = searchParams.get('code');
    
    // 条件：有兑换码、用户已登录、有兑换码信息、是免费码、未尝试过自动兑换、未成功
    if (codeParam && user && codeInfo && codeInfo.entry_type === 'free' && !autoRedeemAttempted && !success) {
      handleAutoRedeem(codeParam);
    }
  }, [user, codeInfo, autoRedeemAttempted, success]);

  // 自动兑换逻辑
  const handleAutoRedeem = async (codeValue: string) => {
    if (!user) return;
    
    setAutoRedeemAttempted(true);
    setAutoRedeeming(true);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code: codeValue.toUpperCase(), user_id: user.id }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setAutoRedeeming(false);
        return;
      }

      setQuotaReceived(data.quota_amount || 10);
      if (data.referral_id) {
        setReferralId(data.referral_id);
      }
      setSuccess(true);
      setShowCampSelector(true);
      toast.success(data.message || '兑换成功！');

    } catch (error: any) {
      console.error('Auto redeem error:', error);
      toast.error(error.message || '自动兑换失败，请手动兑换');
    } finally {
      setAutoRedeeming(false);
    }
  };

  // 检查兑换码信息
  const checkCodeInfo = async (codeValue: string) => {
    if (!codeValue || codeValue.length !== 6) return;
    
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('partner_redemption_codes')
        .select('entry_type, entry_price, quota_amount, status')
        .eq('code', codeValue.toUpperCase())
        .single();
      
      if (error || !data) {
        setCodeInfo(null);
        return;
      }
      
      if (data.status !== 'available') {
        setCodeInfo(null);
        return;
      }
      
      setCodeInfo({
        entry_type: data.entry_type || 'free',
        entry_price: data.entry_price || 0,
        quota_amount: data.quota_amount || 10
      });
    } catch (error) {
      console.error('Check code error:', error);
      setCodeInfo(null);
    } finally {
      setChecking(false);
    }
  };

  // 当用户输入兑换码时检查
  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setCode(upperValue);
    if (upperValue.length === 6) {
      checkCodeInfo(upperValue);
    } else {
      setCodeInfo(null);
    }
  };

  // 免费兑换
  const handleFreeRedeem = async () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/auth?redirect=/redeem?code=' + code);
      return;
    }

    if (!code || code.length !== 6) {
      toast.error('请输入6位兑换码');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code: code.toUpperCase(), user_id: user.id }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setQuotaReceived(data.quota_amount || 10);
      if (data.referral_id) {
        setReferralId(data.referral_id);
      }
      setSuccess(true);
      setShowCampSelector(true);
      toast.success(data.message || '兑换成功！');

    } catch (error: any) {
      console.error('Redeem error:', error);
      toast.error(error.message || '兑换失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 付费兑换 - 设置支付信息并打开对话框
  const handlePaidRedeem = () => {
    if (!user) {
      toast.error('请先登录');
      navigate('/auth?redirect=/redeem?code=' + code);
      return;
    }

    if (!code || code.length !== 6) {
      toast.error('请输入6位兑换码');
      return;
    }

    // 设置支付包信息
    setPaymentPackageInfo({
      key: `trial_${code.toUpperCase()}`,
      name: '有劲AI·情绪日记 体验包',
      price: displayPrice,
      quota: displayQuota
    });
    setShowPayDialog(true);
  };

  // 支付成功后兑换
  const handlePaymentSuccess = async () => {
    setShowPayDialog(false);
    
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-code', {
        body: { code: code.toUpperCase(), user_id: user.id }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setQuotaReceived(data.quota_amount || 50);
      if (data.referral_id) {
        setReferralId(data.referral_id);
      }
      setSuccess(true);
      setShowCampSelector(true);
      toast.success(data.message || '兑换成功！');

    } catch (error: any) {
      console.error('Redeem after payment error:', error);
      toast.error(error.message || '兑换失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 根据入口类型处理兑换
  const handleRedeem = () => {
    if (codeInfo?.entry_type === 'paid') {
      handlePaidRedeem();
    } else {
      handleFreeRedeem();
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/20 to-amber-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* 兑换成功卡片 */}
          <Card className="border-green-200">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">兑换成功！</h2>
                <p className="text-muted-foreground">
                  已获得 <span className="font-semibold text-green-600">{quotaReceived}次</span> AI对话额度
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 训练营选择 */}
          {showCampSelector && (
            <Card className="border-orange-200">
              <CardContent className="pt-6 pb-6">
                <CampJoinSelector 
                  referralId={referralId || undefined}
                  onJoinComplete={(campId) => {
                    navigate(`/camp/${campId}/checkin`);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* 跳过按钮 */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              跳过，直接进入首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 获取显示信息
  const displayPrice = codeInfo?.entry_price ?? 9.9;
  const displayQuota = codeInfo?.quota_amount ?? 50;
  const isFree = codeInfo?.entry_type === 'free';
  
  // 判断是否从URL获取到有效兑换码
  const hasCodeFromUrl = searchParams.get('code')?.length === 6;

  // 显示自动兑换中的加载状态
  if (autoRedeeming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/20 to-amber-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">正在为您兑换...</h2>
              <p className="text-muted-foreground">请稍候，马上就好</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/20 to-amber-50/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 mx-auto flex items-center justify-center">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {isFree ? '🎁 免费体验包' : '恭喜获得体验包！'}
            </CardTitle>
            <CardDescription className="mt-2">
              {isFree 
                ? `免费兑换即可获得${displayQuota}次AI对话额度`
                : `支付¥${displayPrice}即可获得${displayQuota}次AI对话额度`
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 体验包详情 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-center">有劲AI·情绪日记 体验包</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">价值</span>
              <span className={`font-semibold ${isFree ? 'text-green-600' : 'text-orange-600'}`}>
                {isFree ? '免费' : `¥${displayPrice}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">对话额度</span>
              <span className="font-semibold">{displayQuota}次</span>
            </div>
            {isFree && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700 text-center">
                🎉 这是一个免费体验码，直接兑换即可使用！
              </div>
            )}
          </div>

          {/* 兑换码输入 - 只有在URL没有带兑换码时才显示 */}
          {!hasCodeFromUrl && (
            <div className="space-y-2">
              <Label htmlFor="code">兑换码</Label>
              <Input
                id="code"
                placeholder="请输入6位兑换码"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider"
                disabled={loading || checking}
              />
              <p className="text-xs text-muted-foreground text-center">
                {checking ? '正在检查兑换码...' : '兑换码由有劲合伙人提供'}
              </p>
            </div>
          )}

          {/* 兑换按钮 */}
          {user ? (
            <Button 
              onClick={handleRedeem} 
              className={`w-full gap-2 ${
                isFree 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
              }`}
              size="lg"
              disabled={loading || checking || !code || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : isFree ? (
                <>
                  <Gift className="w-4 h-4" />
                  免费兑换
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  支付 ¥{displayPrice} 兑换
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/auth?redirect=/redeem?code=' + code)}
              className="w-full gap-2"
              size="lg"
              variant="outline"
            >
              登录后兑换
            </Button>
          )}

          {/* 说明文字 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 兑换后即可获得{displayQuota}次AI对话额度</p>
            <p>• 与推荐您的合伙人建立长期关系</p>
            <p>• 未来购买有劲产品可享优惠</p>
          </div>
        </CardContent>
      </Card>

      {/* 微信支付对话框 */}
      <WechatPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={paymentPackageInfo}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
