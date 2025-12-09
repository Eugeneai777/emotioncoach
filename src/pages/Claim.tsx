import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Gift, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Claim() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get("partner");
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-partner'>('loading');
  const [message, setMessage] = useState("");
  const [quotaAmount, setQuotaAmount] = useState(10);

  useEffect(() => {
    if (!partnerId) {
      setStatus('no-partner');
      setMessage("缺少合伙人信息");
      return;
    }
    
    claimEntry();
  }, [partnerId]);

  const claimEntry = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return URL
        navigate(`/auth?redirect=/claim?partner=${partnerId}`);
        return;
      }

      // Call edge function to process free claim
      const { data, error } = await supabase.functions.invoke('claim-partner-entry', {
        body: { partner_id: partnerId }
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');
        setQuotaAmount(data.quota_amount || 10);
        setMessage(data.message || "领取成功！");
        toast.success("🎉 领取成功！");
      } else {
        setStatus('error');
        setMessage(data.message || "领取失败");
      }
    } catch (error: any) {
      console.error("Claim error:", error);
      setStatus('error');
      setMessage(error.message || "领取失败，请稍后重试");
    }
  };

  const handleStartJourney = () => {
    navigate('/camps');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-3">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                <span className="text-lg text-teal-700">正在领取...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <span className="text-xl text-teal-700">🎉 领取成功！</span>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <span className="text-xl text-red-600">领取失败</span>
              </>
            )}
            {status === 'no-partner' && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <span className="text-xl text-amber-600">无效链接</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'success' && (
            <>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-teal-600">
                  <Gift className="w-6 h-6" />
                  <span>+{quotaAmount} 次对话额度</span>
                </div>
                <p className="text-muted-foreground">
                  现在就开始你的情绪梳理之旅吧！
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleStartJourney}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
            </>
          )}
          
          {(status === 'error' || status === 'no-partner') && (
            <>
              <p className="text-center text-muted-foreground">{message}</p>
              <Button 
                onClick={handleGoHome}
                className="w-full"
                variant="outline"
              >
                返回首页
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
