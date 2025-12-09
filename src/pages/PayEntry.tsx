import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Gift, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WechatPayDialog } from "@/components/WechatPayDialog";

export default function PayEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get("partner");
  
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    
    fetchPartnerInfo();
  }, [partnerId]);

  const fetchPartnerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, default_entry_type, default_entry_price, default_quota_amount')
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
      navigate(`/auth?redirect=/pay-entry?partner=${partnerId}`);
      return;
    }
    
    setShowPayDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    toast.success("🎉 支付成功！已获得50次对话额度");
    
    // Create referral relationship
    try {
      await supabase.functions.invoke('process-referral', {
        body: { partner_code: partnerId }
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

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-teal-100">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-xl text-teal-700">🎉 支付成功！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-teal-600">
                <Gift className="w-6 h-6" />
                <span>+50 次对话额度</span>
              </div>
              <p className="text-muted-foreground">
                现在就开始你的情绪梳理之旅吧！
              </p>
            </div>
            
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
            仅需 ¥9.9，获得50次AI对话额度
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-orange-800">🎁 你将获得</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                <span>50次AI情绪梳理对话</span>
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

      <WechatPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: 'partner_entry_paid',
          name: '有劲AI · 入门体验包',
          price: 9.9,
          quota: 50
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
