import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/coach-application/BasicInfoStep";
import { CertificationsStep } from "@/components/coach-application/CertificationsStep";
import { ServicesStep } from "@/components/coach-application/ServicesStep";
import { SubmitStep } from "@/components/coach-application/SubmitStep";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

type Step = "basic" | "certifications" | "services" | "submit" | "success";

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

const STEPS: { key: Step; label: string }[] = [
  { key: "basic", label: "基本信息" },
  { key: "certifications", label: "资质证书" },
  { key: "services", label: "服务项目" },
  { key: "submit", label: "确认提交" },
];

export default function BecomeCoach() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    displayName: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    specialties: [],
    yearsExperience: 0,
  });

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const getCurrentStepIndex = () =>
    STEPS.findIndex((s) => s.key === currentStep);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "请先登录", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create human_coaches record
      const { data: coachData, error: coachError } = await supabase
        .from("human_coaches")
        .insert({
          user_id: user.id,
          name: basicInfo.displayName,
          bio: basicInfo.bio,
          avatar_url: basicInfo.avatarUrl,
          specialties: basicInfo.specialties,
          experience_years: basicInfo.yearsExperience,
          status: "pending",
          is_accepting_new: false,
          is_verified: false,
        })
        .select()
        .single();

      if (coachError) throw coachError;

      // Create certifications
      if (certifications.length > 0) {
        const certRecords = certifications.map((cert) => ({
          coach_id: coachData.id,
          cert_type: cert.certType,
          cert_name: cert.certName,
          issuing_authority: cert.issuingAuthority || null,
          cert_number: cert.certNumber || null,
          image_url: cert.imageUrl,
          verification_status: "pending",
        }));

        const { error: certError } = await supabase
          .from("coach_certifications")
          .insert(certRecords);

        if (certError) throw certError;
      }

      // Create services
      if (services.length > 0) {
        const serviceRecords = services.map((service, index) => ({
          coach_id: coachData.id,
          service_name: service.serviceName,
          description: service.description || null,
          duration_minutes: service.durationMinutes,
          price: service.price,
          is_active: true,
          display_order: index,
        }));

        const { error: serviceError } = await supabase
          .from("coach_services")
          .insert(serviceRecords);

        if (serviceError) throw serviceError;
      }

      setCurrentStep("success");
      toast({ title: "申请提交成功！" });
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "提交失败",
        description: "请稍后重试或联系客服",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">请先登录</h2>
          <p className="text-muted-foreground">登录后即可申请成为教练</p>
          <Button onClick={() => navigate("/auth")}>前往登录</Button>
        </div>
      </div>
    );
  }

  if (currentStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">申请已提交</h2>
          <p className="text-muted-foreground">
            感谢您申请成为有劲教练！我们将在1-3个工作日内审核您的申请，
            审核结果将通过微信/短信通知您。
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/human-coaches")}>
              浏览其他教练
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              返回首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="becomeCoach" />
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">申请成为教练</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => {
            const currentIndex = getCurrentStepIndex();
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((step) => (
            <span key={step.key} className="w-16 text-center">
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
          {currentStep === "basic" && (
            <BasicInfoStep
              data={basicInfo}
              onChange={setBasicInfo}
              onNext={() => setCurrentStep("certifications")}
            />
          )}

          {currentStep === "certifications" && (
            <CertificationsStep
              data={certifications}
              onChange={setCertifications}
              onNext={() => setCurrentStep("services")}
              onBack={() => setCurrentStep("basic")}
            />
          )}

          {currentStep === "services" && (
            <ServicesStep
              data={services}
              onChange={setServices}
              onNext={() => setCurrentStep("submit")}
              onBack={() => setCurrentStep("certifications")}
            />
          )}

          {currentStep === "submit" && (
            <SubmitStep
              basicInfo={basicInfo}
              certifications={certifications}
              services={services}
              onSubmit={handleSubmit}
              onBack={() => setCurrentStep("services")}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
    </>
  );
}
