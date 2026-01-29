import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Flower2, CheckCircle, AlertCircle, Sparkles, Users, GraduationCap, Heart } from "lucide-react";
import { toast } from "sonner";

export default function PartnerInvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [invitation, setInvitation] = useState<{
    invite_code: string;
    invitee_name: string | null;
    status: string;
    order_amount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkInvitation = async () => {
      if (!code) {
        setError("邀请码无效");
        setLoading(false);
        return;
      }

      try {
        // Check invitation status
        const { data, error: fetchError } = await supabase
          .from('partner_invitations')
          .select('invite_code, invitee_name, status, order_amount')
          .eq('invite_code', code.toUpperCase())
          .maybeSingle();

        if (fetchError || !data) {
          setError("邀请码不存在或无效");
          setLoading(false);
          return;
        }

        if (data.status === 'claimed') {
          setError("该邀请码已被使用");
          setLoading(false);
          return;
        }

        if (data.status === 'expired') {
          setError("该邀请码已过期");
          setLoading(false);
          return;
        }

        setInvitation(data);

        // Check if user is logged in
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Store invite code for post-login claim
        if (!currentUser) {
          localStorage.setItem('pending_partner_invite', code.toUpperCase());
        }

      } catch (err) {
        console.error('Error checking invitation:', err);
        setError("系统错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [code]);

  const handleClaim = async () => {
    if (!user) {
      // Store invite code and redirect to auth
      localStorage.setItem('pending_partner_invite', code?.toUpperCase() || '');
      navigate('/auth?redirect=/invite/' + code);
      return;
    }

    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-partner-invitation', {
        body: { invite_code: code }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || "恭喜您成为绽放合伙人！");
      localStorage.removeItem('pending_partner_invite');
      
      // Redirect to partner dashboard
      setTimeout(() => {
        navigate('/partner');
      }, 1500);

    } catch (err) {
      console.error('Claim error:', err);
      toast.error("领取失败，请稍后重试");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">邀请无效</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg">
            <Flower2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            绽放合伙人邀请
          </h1>
          {invitation?.invitee_name && (
            <p className="text-lg text-muted-foreground">
              亲爱的 <span className="font-semibold text-foreground">{invitation.invitee_name}</span>
            </p>
          )}
        </div>

        {/* Benefits */}
        <Card className="border-rose-100">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-rose-500" />
              成为绽放合伙人，您将获得
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/50">
                <GraduationCap className="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <div className="font-medium">三大训练营权益</div>
                  <div className="text-sm text-muted-foreground">
                    情绪管理 · 自我探索 · 生命愿景
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-50/50">
                <Users className="h-5 w-5 text-pink-500 mt-0.5" />
                <div>
                  <div className="font-medium">1对1 真人教练辅导</div>
                  <div className="text-sm text-muted-foreground">
                    专属教练全程陪伴成长
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50">
                <Heart className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium">合伙人分销权益</div>
                  <div className="text-sm text-muted-foreground">
                    一级 30% · 二级 10% 佣金比例
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center text-sm text-muted-foreground mb-1">
                邀请码
              </div>
              <div className="text-center font-mono text-2xl font-bold text-rose-600">
                {invitation?.invite_code}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3">
          <Button 
            className="w-full h-12 text-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                处理中...
              </>
            ) : user ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                立即成为绽放合伙人
              </>
            ) : (
              "微信登录并领取"
            )}
          </Button>
          
          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              点击按钮后将跳转至微信登录
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
