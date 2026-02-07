import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, KeyRound, CheckCircle, Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PENDING_CODE_KEY = 'pending_camp_activation_code';

const WealthCampActivate = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [pendingCode, setPendingCode] = useState('');

  // Check if user already has camp access
  useEffect(() => {
    const checkExistingAccess = async () => {
      if (!user) return;

      const { data: existingPurchase } = await supabase
        .from('user_camp_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('camp_type', 'wealth_block_7')
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (existingPurchase) {
        toast.success('您已拥有训练营权限');
        navigate('/wealth-camp-intro');
      }
    };

    checkExistingAccess();
  }, [user, navigate]);

  // After login, check if there's a pending activation
  useEffect(() => {
    if (user && pendingCode) {
      performActivation(pendingCode);
      setPendingCode('');
    }
  }, [user, pendingCode]);

  // Check for pending code from localStorage after login
  useEffect(() => {
    if (user && !authLoading) {
      const savedCode = localStorage.getItem(PENDING_CODE_KEY);
      if (savedCode) {
        localStorage.removeItem(PENDING_CODE_KEY);
        setCode(savedCode);
        performActivation(savedCode);
      }
    }
  }, [user, authLoading]);

  const handleActivate = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast.error('请输入兑换码');
      return;
    }

    if (!user) {
      setPendingCode(trimmedCode);
      setShowLoginPrompt(true);
      return;
    }

    await performActivation(trimmedCode);
  };

  const performActivation = async (activationCode: string) => {
    setIsActivating(true);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-camp-activation-code', {
        body: { code: activationCode }
      });

      if (error) {
        console.error('[CampActivate] Error:', error);
        toast.error(error.message || '兑换失败，请重试');
        setIsActivating(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || '兑换失败');
        if (data.alreadyActivated) {
          setTimeout(() => navigate('/wealth-camp-intro'), 1500);
        }
        setIsActivating(false);
        return;
      }

      setActivationSuccess(true);
      toast.success('兑换成功！');

      setTimeout(() => {
        navigate('/wealth-camp-intro');
      }, 2000);

    } catch (err) {
      console.error('[CampActivate] Unexpected error:', err);
      toast.error('系统错误，请稍后重试');
      setIsActivating(false);
    }
  };

  const handleGoToLogin = () => {
    if (code.trim()) {
      localStorage.setItem(PENDING_CODE_KEY, code.trim());
    }
    navigate('/auth?redirect=/wealth-camp-activate');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (activationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-4">
        <Card className="w-full max-w-md text-center border-amber-200 shadow-lg">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900">兑换成功！</h2>
            <p className="text-amber-700">正在为您跳转到训练营页面...</p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900">财富觉醒训练营</h1>
          <p className="text-amber-700">输入兑换码，开启7天财富觉醒之旅</p>
        </div>

        {/* Activation Form */}
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <KeyRound className="w-5 h-5 text-amber-600" />
              兑换训练营
            </CardTitle>
            <CardDescription>
              请输入您收到的兑换码
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="请输入兑换码"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-lg tracking-widest font-mono h-12 border-amber-300 focus:border-amber-500"
              maxLength={20}
              disabled={isActivating}
            />

            <Button
              onClick={handleActivate}
              disabled={!code.trim() || isActivating}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  兑换中...
                </>
              ) : (
                <>
                  立即兑换
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                点击兑换后需要登录/注册账号
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="pt-4 pb-4">
            <h3 className="font-medium text-amber-900 mb-2">训练营包含哪些内容？</h3>
            <ul className="text-sm text-amber-700 space-y-1.5">
              <li>• 7天系统化财富觉醒练习</li>
              <li>• AI 财富教练 1对1 对话</li>
              <li>• 每日冥想与财富信念重塑</li>
              <li>• 社区打卡与成长见证</li>
              <li>• 个性化财富卡点突破方案</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>如有问题，请联系客服获取帮助</p>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">请先登录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              兑换训练营需要先登录或注册账号
            </p>
            <Button
              onClick={handleGoToLogin}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <LogIn className="w-4 h-4" />
              前往登录/注册
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              登录后将自动继续兑换流程
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WealthCampActivate;
