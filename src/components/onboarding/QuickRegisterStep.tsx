import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickRegisterStepProps {
  orderNo: string;
  paymentOpenId?: string;
  onSuccess: (userId: string) => void;
  onSkip?: () => void;
}

export function QuickRegisterStep({
  orderNo,
  paymentOpenId,
  onSuccess,
  onSkip
}: QuickRegisterStepProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  // 自动创建账号（使用微信openid）
  const handleAutoCreate = async () => {
    if (!paymentOpenId) {
      toast.error('无法获取微信信息，请手动注册');
      return;
    }

    setIsAutoCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-from-payment', {
        body: {
          orderNo,
          openId: paymentOpenId,
          nickname: nickname || undefined
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '创建账号失败');

      // 自动登录
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast.success('账号创建成功！');
      onSuccess(data.userId);
    } catch (error: any) {
      console.error('Auto create error:', error);
      toast.error(error.message || '创建失败，请重试');
    } finally {
      setIsAutoCreating(false);
    }
  };

  // 手动输入手机号注册
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!phone || phone.length !== 11) {
      toast.error('请输入正确的手机号');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms-code', {
        body: { phone }
      });

      if (error) throw error;

      setCodeSent(true);
      setCountdown(60);
      toast.success('验证码已发送');

      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRegister = async () => {
    if (!phone || !verifyCode) {
      toast.error('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-from-payment', {
        body: {
          orderNo,
          phone,
          verifyCode,
          nickname: nickname || undefined
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '注册失败');

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      toast.success('注册成功！');
      onSuccess(data.userId);
    } catch (error: any) {
      console.error('Phone register error:', error);
      toast.error(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold">支付成功！</h3>
        <p className="text-sm text-muted-foreground">
          完成注册后即可开始使用
        </p>
      </div>

      {/* 如果有微信openid，优先使用微信一键注册 */}
      {paymentOpenId ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">设置昵称（可选）</Label>
            <div className="flex gap-2">
              <User className="w-5 h-5 text-muted-foreground mt-2" />
              <Input
                id="nickname"
                placeholder="输入你的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleAutoCreate}
            disabled={isAutoCreating}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:opacity-90"
          >
            {isAutoCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在创建...
              </>
            ) : (
              '微信一键注册'
            )}
          </Button>
        </div>
      ) : (
        /* 手机号注册 */
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nickname">昵称（可选）</Label>
            <Input
              id="nickname"
              placeholder="输入你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="nickname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex gap-3">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                autoComplete="tel"
              />
              <Button
                variant="outline"
                onClick={sendCode}
                disabled={isLoading || countdown > 0}
                className="shrink-0 min-w-[100px]"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </div>

          {codeSent && (
            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                inputMode="numeric"
                placeholder="输入验证码"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
          )}

          <Button
            onClick={handlePhoneRegister}
            disabled={isLoading || !phone || !verifyCode}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '完成注册'
            )}
          </Button>
        </div>
      )}

      {onSkip && (
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          稍后完善
        </Button>
      )}
    </div>
  );
}
