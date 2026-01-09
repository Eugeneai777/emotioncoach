import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Gift, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Claim() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get("partner");
  const posterId = searchParams.get("poster");
  const type = searchParams.get("type"); // wealth_camp for camp invites
  const ref = searchParams.get("ref"); // inviter user id for camp invites
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-partner'>('loading');
  const [message, setMessage] = useState("");
  const [quotaAmount, setQuotaAmount] = useState(50);
  const [durationDays, setDurationDays] = useState(365);

  // Track poster scan on page load
  useEffect(() => {
    if (partnerId && posterId) {
      trackPosterScan();
    }
  }, [partnerId, posterId]);

  const trackPosterScan = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-poster-scan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poster_id: posterId,
            partner_id: partnerId,
            referrer: document.referrer || null,
          }),
        }
      );
    } catch (e) {
      console.error('Failed to track poster scan:', e);
    }
  };

  // Handle camp invite referral
  const processCampInvite = async (userId: string, inviterUserId: string) => {
    try {
      // Check if already referred
      const { data: existing } = await supabase
        .from('camp_invite_referrals')
        .select('id')
        .eq('referred_user_id', userId)
        .eq('inviter_user_id', inviterUserId)
        .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
        .maybeSingle();

      if (existing) {
        console.log('Camp invite referral already exists');
        return;
      }

      // Prevent self-referral
      if (userId === inviterUserId) {
        console.log('Cannot refer yourself');
        return;
      }

      // Create referral record
      const { error } = await supabase
        .from('camp_invite_referrals')
        .insert({
          inviter_user_id: inviterUserId,
          referred_user_id: userId,
          camp_type: 'wealth_block_7',
          status: 'pending',
        });

      if (error) {
        console.error('Failed to create camp invite referral:', error);
      } else {
        console.log('Camp invite referral created successfully');
      }
    } catch (e) {
      console.error('Error processing camp invite:', e);
    }
  };

  useEffect(() => {
    // Handle camp invite type
    if (type === 'wealth_camp' && ref) {
      handleCampInvite();
      return;
    }
    
    // Handle partner claim
    if (!partnerId) {
      setStatus('no-partner');
      setMessage("缺少合伙人信息");
      return;
    }
    
    claimEntry();
  }, [partnerId, type, ref]);

  const handleCampInvite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in, redirect to camp intro with referral stored
        localStorage.setItem('camp_invite_ref', ref!);
        navigate('/wealth-camp-intro');
        return;
      }

      // Process the referral
      await processCampInvite(user.id, ref!);
      
      // Redirect to camp intro
      navigate('/wealth-camp-intro');
    } catch (error) {
      console.error('Error handling camp invite:', error);
      navigate('/wealth-camp-intro');
    }
  };

  const claimEntry = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // 不再跳转，显示 loading 状态提示用户先购买套餐
        setStatus('no-partner');
        setMessage("请先购买套餐后再领取");
        return;
      }

      // Call edge function to process free claim
      const { data, error } = await supabase.functions.invoke('claim-partner-entry', {
        body: { partner_id: partnerId }
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');
        setQuotaAmount(data.quota_amount || 50);
        setDurationDays(data.duration_days || 365);
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
                <span className="text-xl text-teal-700">🎉 已获得体验套餐！</span>
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
                {/* Package benefits */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-lg font-bold text-teal-600">
                    <Sparkles className="w-5 h-5" />
                    <span>体验套餐权益</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4 text-teal-500" />
                      <span className="font-medium">{quotaAmount} 点 AI 额度</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-teal-500">✓</span>
                      <span>{durationDays} 天有效期</span>
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
