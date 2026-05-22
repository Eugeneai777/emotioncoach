import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProxyVerifyData {
  coachName: string;
  coachPhone: string;
  coachCountryCode: string;
  relation: string;
  verified: boolean;
}

interface Props {
  data: ProxyVerifyData;
  onChange: (d: ProxyVerifyData) => void;
  onNext: () => void;
}

export function ProxyVerifyStep({ data, onChange, onNext }: Props) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const startCountdown = () => {
    setCountdown(60);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!/^\d{11}$/.test(data.coachPhone)) {
      toast({ title: "请输入有效的11位教练手机号", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms-code", {
        body: {
          phone: data.coachPhone,
          countryCode: data.coachCountryCode || "+86",
          purpose: "coach_proxy_verify",
        },
      });
      if (error) throw error;
      toast({ title: "验证码已发送至教练手机" });
      startCountdown();
    } catch (e: any) {
      toast({
        title: "发送失败",
        description: e?.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyAndNext = async () => {
    if (!data.coachName.trim()) {
      toast({ title: "请填写教练姓名", variant: "destructive" });
      return;
    }
    if (!/^\d{11}$/.test(data.coachPhone)) {
      toast({ title: "请输入有效的11位教练手机号", variant: "destructive" });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "请输入6位验证码", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("verify-sms-code", {
        body: {
          phone: data.coachPhone,
          code,
          purpose: "coach_proxy_verify",
        },
      });
      if (error) throw error;
      if (!res?.success) throw new Error(res?.error || "验证码不正确");
      onChange({ ...data, verified: true });
      toast({ title: "✓ 教练身份已验证" });
      onNext();
    } catch (e: any) {
      toast({
        title: "验证失败",
        description: e?.message || "验证码不正确",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          代申请身份核验
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          为防止冒用，需通过<span className="text-foreground font-medium">教练本人手机</span>接收短信验证码。
          代理人完成核验后方可继续填写。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="coach-name">教练姓名 *</Label>
          <Input
            id="coach-name"
            value={data.coachName}
            onChange={(e) => onChange({ ...data, coachName: e.target.value })}
            placeholder="教练真实姓名"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="coach-phone" className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            教练手机号 *
          </Label>
          <Input
            id="coach-phone"
            value={data.coachPhone}
            onChange={(e) =>
              onChange({ ...data, coachPhone: e.target.value.replace(/\D/g, "").slice(0, 11), verified: false })
            }
            placeholder="11位手机号（仅支持 +86）"
            className="mt-1"
            type="tel"
            inputMode="numeric"
          />
        </div>

        <div>
          <Label htmlFor="proxy-code" className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            短信验证码 *
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="proxy-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6位验证码"
              type="tel"
              inputMode="numeric"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSendCode}
              disabled={sending || countdown > 0}
              className="shrink-0 w-32"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : countdown > 0 ? (
                `${countdown}s 后重发`
              ) : (
                "获取验证码"
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="relation">您与教练的关系（选填）</Label>
          <Input
            id="relation"
            value={data.relation}
            onChange={(e) => onChange({ ...data, relation: e.target.value })}
            placeholder="如：助理、合作伙伴、学员"
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleVerifyAndNext}
          disabled={verifying}
          className="w-full"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          验证并继续
        </Button>

        <p className="text-xs text-muted-foreground">
          ⚠️ 同一教练手机号在「待审核 / 已通过」状态下不可被两个账号同时申请。
        </p>
      </CardContent>
    </Card>
  );
}
