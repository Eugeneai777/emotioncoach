import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, KeyRound, CheckCircle, Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const WealthBlockActivate = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [pendingCode, setPendingCode] = useState('');

  // Check if user already has access
  useEffect(() => {
    const checkExistingAccess = async () => {
      if (!user) return;
      
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_key', 'wealth_block_assessment')
        .eq('status', 'paid')
        .maybeSingle();

      if (existingOrder) {
        toast.success('您已拥有测评权限');
        navigate('/wealth-block');
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

  const handleActivate = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast.error('请输入激活码');
      return;
    }

    // If not logged in, show login prompt
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
      const { data, error } = await supabase.functions.invoke('redeem-activation-code', {
        body: { code: activationCode }
      });

      if (error) {
        console.error('[Activate] Error:', error);
        toast.error(error.message || '激活失败，请重试');
        setIsActivating(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || '激活失败');
        if (data.alreadyActivated) {
          setTimeout(() => navigate('/wealth-block'), 1500);
        }
        setIsActivating(false);
        return;
      }

      // Success!
      setActivationSuccess(true);
      toast.success('激活成功！');
      
      // Redirect to assessment after a brief delay
      setTimeout(() => {
        navigate('/wealth-block');
      }, 2000);

    } catch (err) {
      console.error('[Activate] Unexpected error:', err);
      toast.error('系统错误，请稍后重试');
      setIsActivating(false);
    }
  };

  const handleGoToLogin = () => {
    // Save the code to localStorage for after login
    if (code.trim()) {
      localStorage.setItem('pending_activation_code', code.trim());
    }
    navigate('/auth?redirect=/wealth-block-activate');
  };

  // Check for pending code from localStorage after login
  useEffect(() => {
    if (user && !authLoading) {
      const savedCode = localStorage.getItem('pending_activation_code');
      if (savedCode) {
        localStorage.removeItem('pending_activation_code');
        setCode(savedCode);
        performActivation(savedCode);
      }
    }
  }, [user, authLoading]);

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
            <h2 className="text-2xl font-bold text-amber-900">激活成功！</h2>
            <p className="text-amber-700">正在为您跳转到测评页面...</p>
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
          <h1 className="text-2xl font-bold text-amber-900">财富卡点测评</h1>
          <p className="text-amber-700">输入激活码，开启财富觉醒之旅</p>
        </div>

        {/* Activation Form */}
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <KeyRound className="w-5 h-5 text-amber-600" />
              激活测评
            </CardTitle>
            <CardDescription>
              请输入您收到的激活码
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="请输入激活码"
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
                  激活中...
                </>
              ) : (
                <>
                  立即激活
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                点击激活后需要登录/注册账号
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="pt-4 pb-4">
            <h3 className="font-medium text-amber-900 mb-2">什么是财富卡点测评？</h3>
            <ul className="text-sm text-amber-700 space-y-1.5">
              <li>• 深度探索你的财富潜意识信念</li>
              <li>• 发现阻碍财富流入的核心卡点</li>
              <li>• 获得个性化的财富觉醒建议</li>
              <li>• 开启财富意识转化之旅</li>
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
              激活测评需要先登录或注册账号
            </p>
            <Button 
              onClick={handleGoToLogin} 
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <LogIn className="w-4 h-4" />
              前往登录/注册
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              登录后将自动继续激活流程
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WealthBlockActivate;
