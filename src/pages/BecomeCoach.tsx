import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/coach-application/BasicInfoStep";
import { CertificationsStep } from "@/components/coach-application/CertificationsStep";
import { SubmitStep } from "@/components/coach-application/SubmitStep";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Skeleton } from "@/components/ui/skeleton";

type Step = "basic" | "certifications" | "submit" | "success";

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
  description: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "basic", label: "基本信息" },
  { key: "certifications", label: "资质证书" },
  { key: "submit", label: "确认提交" },
];

export default function BecomeCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invitation validation
  const inviteToken = searchParams.get("invite");
  const [inviteStatus, setInviteStatus] = useState<"loading" | "valid" | "invalid" | "none">(
    inviteToken ? "loading" : "none"
  );
  const [invitationData, setInvitationData] = useState<any>(null);

  useEffect(() => {
    if (!inviteToken) {
      setInviteStatus("none");
      return;
    }

    const validateInvite = async () => {
      const { data, error } = await supabase
        .from("coach_invitations")
        .select("id, token, invitee_name, note, status, expires_at, default_service_name, default_certifications")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .single();

      if (error || !data) {
        setInviteStatus("invalid");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setInviteStatus("invalid");
        return;
      }

      setInvitationData(data);
      setInviteStatus("valid");

      // Pre-fill certifications from invitation
      const presetCerts = (data as any).default_certifications;
      if (Array.isArray(presetCerts) && presetCerts.length > 0) {
        setCertifications(presetCerts.map((c: any) => ({
          certType: c.certType,
          certName: c.certName,
          issuingAuthority: "",
          certNumber: "",
          imageUrl: "",
          description: "",
        })));
      }
    };

    validateInvite();
  }, [inviteToken]);

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    displayName: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    specialties: [],
    yearsExperience: 0,
  });

  const [certifications, setCertifications] = useState<Certification[]>([]);

  const getCurrentStepIndex = () =>
    STEPS.findIndex((s) => s.key === currentStep);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "请先登录", variant: "destructive" });
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (inviteStatus !== "valid" || !invitationData) {
      toast({ title: "邀请链接无效", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) Check existing application for this user
      const { data: existing, error: existingError } = await supabase
        .from("human_coaches")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      // Already approved -> block & redirect
      if (existing?.status === "approved") {
        toast({
          title: "您已通过审核",
          description: "请前往教练后台编辑资料",
        });
        navigate("/coach-dashboard");
        return;
      }

      let coachData: { id: string };

      const coachPayload = {
        name: basicInfo.displayName,
        bio: basicInfo.bio,
        avatar_url: basicInfo.avatarUrl,
        specialties: basicInfo.specialties,
        experience_years: basicInfo.yearsExperience,
        status: "pending",
        is_accepting_new: false,
        is_verified: false,
      };

      if (existing) {
        // 2) Pending or rejected -> UPDATE existing record (latest submission wins)
        const { data: updated, error: updateError } = await supabase
          .from("human_coaches")
          .update(coachPayload)
          .eq("id", existing.id)
          .select("id")
          .single();

        if (updateError) throw updateError;
        if (!updated) throw new Error("更新失败：无权限或记录不存在");
        coachData = updated;

        // Wipe old certs & services so latest submission fully replaces them
        const { error: delCertError } = await supabase
          .from("coach_certifications")
          .delete()
          .eq("coach_id", coachData.id)
          .select("id");
        if (delCertError) throw delCertError;

        const { error: delSvcError } = await supabase
          .from("coach_services")
          .delete()
          .eq("coach_id", coachData.id)
          .select("id");
        if (delSvcError) throw delSvcError;
      } else {
        // 3) First-time application -> INSERT
        const { data: inserted, error: coachError } = await supabase
          .from("human_coaches")
          .insert({ user_id: user.id, ...coachPayload })
          .select("id")
          .single();

        if (coachError) throw coachError;
        coachData = inserted;
      }

      // Create certifications
      if (certifications.length > 0) {
        const certRecords = certifications.map((cert) => ({
          coach_id: coachData.id,
          cert_type: cert.certType,
          cert_name: cert.certName,
          issuing_authority: cert.issuingAuthority || null,
          cert_number: cert.certNumber || null,
          image_url: cert.imageUrl,
          description: cert.description || null,
          verification_status: "pending",
        }));

        const { error: certError } = await supabase
          .from("coach_certifications")
          .insert(certRecords);

        if (certError) throw certError;
      }

      // Auto-create default service (60 min)
      const serviceName = invitationData.default_service_name || `${basicInfo.displayName} 咨询`;
      const { error: serviceError } = await supabase
        .from("coach_services")
        .insert({
          coach_id: coachData.id,
          service_name: serviceName,
          description: null,
          duration_minutes: 60,
          price: 0,
          is_active: true,
          display_order: 0,
        });

      if (serviceError) throw serviceError;

      // Increment invitation usage count
      await supabase.rpc('increment_coach_invitation_count', { p_invitation_id: invitationData.id });

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

  // Loading invitation validation
  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // No invite token or invalid
  if (inviteStatus === "none" || inviteStatus === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            {inviteStatus === "invalid" ? "邀请链接已失效" : "需要邀请链接"}
          </h2>
          <p className="text-muted-foreground">
            {inviteStatus === "invalid"
              ? "该邀请链接已过期或已被使用，请联系管理员获取新的邀请链接。"
              : "成为教练需要通过邀请链接申请，请联系管理员获取邀请链接。"}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/human-coaches")}>
              浏览教练列表
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              返回首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Need login
  if (!user) {
    const currentUrl = `/become-coach?invite=${inviteToken}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-5xl">✨</div>
          <h2 className="text-xl font-semibold">您已收到教练入驻邀请</h2>
          <p className="text-muted-foreground">请先登录或注册账号，然后填写教练资料</p>
          <Button
            onClick={() =>
              navigate(`/auth?redirect=${encodeURIComponent(currentUrl)}`)
            }
          >
            登录 / 注册
          </Button>
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
      <div
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <PageHeader title="申请成为教练" showBack />

        {invitationData && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">
              ✨ 您已收到教练入驻邀请
              {invitationData.invitee_name && `（${invitationData.invitee_name}）`}
              ，请填写以下资料完成申请
            </div>
          </div>
        )}

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
                      className={`w-16 h-0.5 mx-1 ${
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
              <span key={step.key} className="w-20 text-center">
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
                onNext={() => setCurrentStep("submit")}
                onBack={() => setCurrentStep("basic")}
                presetCertTypes={
                  Array.isArray((invitationData as any)?.default_certifications)
                    ? (invitationData as any).default_certifications.map((c: any) => c.certType)
                    : []
                }
              />
            )}

            {currentStep === "submit" && (
              <SubmitStep
                basicInfo={basicInfo}
                certifications={certifications}
                defaultServiceName={invitationData?.default_service_name}
                onSubmit={handleSubmit}
                onBack={() => setCurrentStep("certifications")}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
