import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Shield, Loader2 } from 'lucide-react';

/**
 * 微信用户绑定手机号引导弹窗
 * 仅对微信临时邮箱用户（@temp.youjin365.com）且未绑定手机号的用户显示
 * 延迟 4 秒显示，避免与其他引导弹窗冲突
 */
export function PhoneBindOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'prompt' | 'verify'>('prompt');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [needsBind, setNeedsBind] = useState(false);

  // 检查是否需要绑定
  const checkNeedsBind = useCallback(async () => {
    if (!user) return;
    const email = user.email || '';
    // 仅微信临时邮箱用户
    if (!email.includes('@temp.youjin365.com')) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, phone_bind_prompted')
      .eq('id', user.id)
      .single();

    if (!profile) return;
    // 已绑定手机号或已永久关闭提示
    if (profile.phone || profile.phone_bind_prompted) return;

    setNeedsBind(true);
  }, [user]);

  useEffect(() => {
    checkNeedsBind();
  }, [checkNeedsBind]);

  // 延迟显示，避免与其他弹窗冲突
  useEffect(() => {
    if (!needsBind) return;
    const timer = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(timer);
  }, [needsBind]);

  // 倒计时
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
      if (data?.error) throw new Error(data.error);
      if (error) throw error;
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
      if (data?.error) throw new Error(data.error);
      if (error) throw error;
      toast({ title: '🎉 手机号绑定成功' });
      setOpen(false);
      setNeedsBind(false);
    } catch (e: any) {
      toast({ title: e.message || '绑定失败，请稍后重试', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSkip = async () => {
    // 标记已提示，不再弹出
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone_bind_prompted: true })
        .eq('id', user.id);
    }
    setOpen(false);
    setNeedsBind(false);
  };

  // 自动提交
  useEffect(() => {
    if (code.length === 6 && step === 'verify') {
      handleVerify(code);
    }
  }, [code]);

  if (!needsBind) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
      <DialogContent className="sm:max-w-md">
        {step === 'prompt' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                绑定手机号
              </DialogTitle>
              <DialogDescription className="text-center">
                绑定手机号后可使用手机号登录，避免更换设备后无法找回账号
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">为什么需要绑定？</p>
                  <ul className="mt-1 text-muted-foreground space-y-1">
                    <li>• 支持手机号登录，多端无缝切换</li>
                    <li>• 避免微信环境变化导致账号丢失</li>
                    <li>• 保障您的数据和权益安全</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep('verify')} className="w-full">
                  立即绑定
                </Button>
                <Button variant="ghost" onClick={handleSkip} className="text-sm text-muted-foreground">
                  暂不绑定
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-lg">验证手机号</DialogTitle>
              <DialogDescription className="text-center">
                请输入您的手机号并验证
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
                <Button variant="ghost" onClick={handleSkip} className="flex-1 text-muted-foreground">
                  暂不绑定
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
