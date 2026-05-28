import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Phone } from "lucide-react";
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

  const handleNext = () => {
    if (!data.coachName.trim()) {
      toast({ title: "请填写教练姓名", variant: "destructive" });
      return;
    }
    if (!/^\d{11}$/.test(data.coachPhone)) {
      toast({ title: "请输入11位手机号", variant: "destructive" });
      return;
    }
    onChange({ ...data, verified: true });
    onNext();
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCog className="h-5 w-5 text-primary" />
          教练基本信息
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          请填写被代申请教练的真实姓名与手机号，提交后由管理员审核教练资质。
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
              onChange({ ...data, coachPhone: e.target.value.replace(/\D/g, "").slice(0, 11) })
            }
            placeholder="请输入11位手机号（仅支持 +86）"
            className="mt-1"
            type="tel"
            inputMode="numeric"
          />
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

        <Button onClick={handleNext} className="w-full">
          下一步
        </Button>

        <p className="text-xs text-muted-foreground">
          ⚠️ 同一教练手机号在「待审核 / 已通过」状态下不可被两个账号同时申请。
        </p>
      </CardContent>
    </Card>
  );
}
