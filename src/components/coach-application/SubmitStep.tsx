import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, FileCheck, Coins, Send, Loader2 } from "lucide-react";
import { useState } from "react";

interface BasicInfoData {
  displayName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  yearsExperience: number;
}

interface Certification {
  certType: string;
  certName: string;
  issuingAuthority: string;
  certNumber: string;
  imageUrl: string;
}

interface Service {
  serviceName: string;
  description: string;
  durationMinutes: number;
  price: number;
}

interface SubmitStepProps {
  basicInfo: BasicInfoData;
  certifications: Certification[];
  services: Service[];
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function SubmitStep({
  basicInfo,
  certifications,
  services,
  onSubmit,
  onBack,
  isSubmitting,
}: SubmitStepProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">确认提交</h2>
        <p className="text-sm text-muted-foreground mt-1">
          请确认以下信息无误后提交申请
        </p>
      </div>

      {/* Basic Info Summary */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-medium">
          <User className="h-4 w-4" />
          基本信息
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={basicInfo.avatarUrl} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{basicInfo.displayName}</div>
            <div className="text-sm text-muted-foreground">
              {basicInfo.yearsExperience > 0
                ? `${basicInfo.yearsExperience}年从业经验`
                : "新人教练"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {basicInfo.specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{basicInfo.bio}</p>
      </Card>

      {/* Certifications Summary */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-medium">
          <FileCheck className="h-4 w-4" />
          资质证书 ({certifications.length}项)
        </div>
        <div className="space-y-2">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div>
                <div className="text-sm font-medium">{cert.certName}</div>
                {cert.issuingAuthority && (
                  <div className="text-xs text-muted-foreground">
                    {cert.issuingAuthority}
                  </div>
                )}
              </div>
              {cert.imageUrl && (
                <img
                  src={cert.imageUrl}
                  alt="证书"
                  className="h-10 w-14 object-cover rounded"
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Services Summary */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Coins className="h-4 w-4" />
          服务项目 ({services.length}项)
        </div>
        <div className="space-y-2">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div>
                <div className="text-sm font-medium">{service.serviceName}</div>
                <div className="text-xs text-muted-foreground">
                  {service.durationMinutes}分钟
                </div>
              </div>
              <div className="text-primary font-medium">¥{service.price}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agreement */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="agreement"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
        />
        <label htmlFor="agreement" className="text-sm text-muted-foreground">
          我已阅读并同意《教练入驻协议》和《服务条款》，保证所填信息真实有效，
          承诺遵守平台规则，为用户提供专业、负责的服务。
        </label>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
          提交后的流程
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>• 平台将在1-3个工作日内审核您的申请</li>
          <li>• 审核通过后，您将收到通知并可以开始接单</li>
          <li>• 审核未通过会告知原因，您可以修改后重新提交</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!agreed || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              提交申请
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
