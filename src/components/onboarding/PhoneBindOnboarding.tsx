import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractEdgeFunctionError } from '@/lib/edgeFunctionError';
import { Phone, Shield, Loader2, AlertTriangle, LogOut } from 'lucide-react';

/**
 * 微信临时账号强制绑定手机号弹窗
 *
 * 策略（B + C 混合）：
 *  - 仅对 @temp.youjin365.com 微信临时账号生效
 *  - 强制阻断：不可关闭、不可跳过，必须绑定手机号才能继续使用
 *  - 已存在对应手机号账号 → 自动合并资产到手机号主账号（由后端 bind-phone-to-wechat 处理）
 *  - 不愿意绑定的用户只能退出登录
 */
export function PhoneBindOnboarding() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'prompt' | 'verify'>('prompt');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [needsBind, setNeedsBind] = useState(false);

  const checkNeedsBind = useCallback(async () => {
    if (!user) {
      setNeedsBind(false);
      return;
    }
    const email = user.email || '';
    if (!email.includes('@temp.youjin365.com')) {
      setNeedsBind(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single() as any;

    // 强制策略：只要是临时微信账号且未绑定手机号，立即弹出且不可关闭
    if (profile && !profile.phone) {
      setNeedsBind(true);
    } else {
      setNeedsBind(false);
    }
  }, [user]);

  useEffect(() => {
    checkNeedsBind();
  }, [checkNeedsBind]);

  // 强制立即弹出（无延迟）
  useEffect(() => {
    if (needsBind) setOpen(true);
  }, [needsBind]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!/^\d{11}$/.test(phone)) {
      toast({ title: '请输入有效的11位手机号', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-code', {
        body: { phone, countryCode: '+86' },
      });
      if (data?.error || error) {
        const msg = await extractEdgeFunctionError(data, error, '发送失败，请稍后重试');
        throw new Error(msg);
      }
      toast({ title: '验证码已发送' });
      setCountdown(60);
    } catch (e: any) {
      toast({ title: e.message || '发送失败，请稍后重试', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (codeValue: string) => {
    if (codeValue.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('bind-phone-to-wechat', {
        body: { phone, code: codeValue, countryCode: '+86' },
      });
      if (data?.error || error) {
        const msg = await extractEdgeFunctionError(data, error, '绑定失败，请稍后重试');
        throw new Error(msg);
      }

      if (data?.merged && data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast({ title: '🎉 手机号绑定成功，权益已合并到手机号账号' });
      } else if (data?.merged && data?.needRelogin) {
        toast({ title: '权益已合并到手机号账号，请用手机号重新登录' });
        await supabase.auth.signOut();
      } else {
        toast({ title: '🎉 手机号绑定成功' });
      }
      setOpen(false);
      setNeedsBind(false);
    } catch (e: any) {
      toast({ title: e.message || '绑定失败，请稍后重试', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    setNeedsBind(false);
  };

  useEffect(() => {
    if (code.length === 6 && step === 'verify') {
      handleVerify(code);
    }
  }, [code]);

  if (!needsBind) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* 强制阻断：不允许通过遮罩或 ESC 关闭 */ }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        hideClose
      >
        {step === 'prompt' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                请绑定手机号以继续使用
              </DialogTitle>
              <DialogDescription className="text-center">
                平台已升级为「手机号唯一主账号」，您当前的微信临时账号需要绑定手机号才能继续使用
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-medium">为什么必须绑定？</p>
                  <ul className="mt-1 space-y-1">
                    <li>• 微信临时账号在更换设备/微信升级后可能丢失</li>
                    <li>• 绑定后您的所有订单、权益、记录将自动合并到手机号账号</li>
                    <li>• 之后可用手机号或微信任意一种方式登录同一账号</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  若该手机号已注册过本平台账号，本次微信账号下的权益将自动迁移合并到对应手机号主账号。
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep('verify')} className="w-full">
                  立即绑定手机号
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="text-sm text-muted-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  暂不绑定，退出登录
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-lg">验证手机号</DialogTitle>
              <DialogDescription className="text-center">
                绑定后权益将自动合并到手机号账号
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="请输入11位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="flex-1"
                  type="tel"
                  inputMode="numeric"
                />
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={sending || countdown > 0 || phone.length !== 11}
                  className="shrink-0 min-w-[100px]"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">输入6位验证码</p>
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  绑定中...
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep('prompt'); setCode(''); }} className="flex-1">
                  返回
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="flex-1 text-muted-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
