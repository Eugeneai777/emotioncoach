import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/coach-application/BasicInfoStep";
import { CertificationsStep } from "@/components/coach-application/CertificationsStep";
import { SubmitStep } from "@/components/coach-application/SubmitStep";
import {
  ExperienceTierStep,
  suggestTierLevel,
  type ExperienceTierData,
} from "@/components/coach-application/ExperienceTierStep";
import {
  ProxyVerifyStep,
  type ProxyVerifyData,
} from "@/components/coach-application/ProxyVerifyStep";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoachPriceTiers } from "@/hooks/useCoachPriceTiers";
import { MyApplicationsCard } from "@/components/coach-application/MyApplicationsCard";
import { useCoachProfile } from "@/hooks/useCoachDashboard";


type Step = "proxy_verify" | "basic" | "certifications" | "experience" | "submit" | "success";

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

const SELF_STEPS: { key: Step; label: string }[] = [
  { key: "basic", label: "基本信息" },
  { key: "certifications", label: "资质证书" },
  { key: "experience", label: "经验档位" },
  { key: "submit", label: "确认提交" },
];

const PROXY_STEPS: { key: Step; label: string }[] = [
  { key: "proxy_verify", label: "身份核验" },
  ...SELF_STEPS,
];


export default function BecomeCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const mode: "self" | "proxy" = searchParams.get("mode") === "proxy" ? "proxy" : "self";
  const editId = searchParams.get("edit");
  const STEPS = mode === "proxy" ? PROXY_STEPS : SELF_STEPS;
  // 编辑代申请记录时跳过身份核验（首次申请已完成）
  const [currentStep, setCurrentStep] = useState<Step>(
    mode === "proxy" && !editId ? "proxy_verify" : "basic"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proxyData, setProxyData] = useState<ProxyVerifyData>({
    coachName: "",
    coachPhone: "",
    coachCountryCode: "+86",
    relation: "",
    verified: false,
  });


  // Invitation validation
  const inviteToken = searchParams.get("invite");
  const { data: myCoachProfile, isLoading: isCoachLoading } = useCoachProfile();
  const isApprovedCoach = myCoachProfile?.status === "approved";
  // 已通过审核的教练在 proxy 模式且无 invite 时，可绕过邀请校验
  const coachBypass = mode === "proxy" && !inviteToken && isApprovedCoach;

  const [inviteStatus, setInviteStatus] = useState<"loading" | "valid" | "invalid" | "none">(
    inviteToken || mode === "proxy" ? "loading" : "none"
  );
  const [invitationData, setInvitationData] = useState<any>(null);

  useEffect(() => {
    if (!inviteToken) {
      // 教练自主代申请：等教练资料加载完再决定
      if (mode === "proxy" && isCoachLoading) return;
      if (coachBypass) {
        setInvitationData({
          source: "coach_self_initiated",
          invitee_name: null,
          default_certifications: [],
        });
        setInviteStatus("valid");
      } else {
        setInviteStatus("none");
      }
      return;
    }

    const validateInvite = async () => {
      const { data, error } = await supabase
        .rpc("lookup_coach_invitation", { p_token: inviteToken });

      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) {
        setInviteStatus("invalid");
        return;
      }

      if (new Date(row.expires_at) < new Date()) {
        setInviteStatus("invalid");
        return;
      }

      setInvitationData(row);
      setInviteStatus("valid");

      // Pre-fill certifications from invitation
      const presetCerts = (row as any).default_certifications;
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
  }, [inviteToken, coachBypass, isCoachLoading, mode, user?.id]);

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    displayName: "",
    phone: "",
    bio: "",
    avatarUrl: "",
    specialties: [],
    yearsExperience: 0,
  });

  const [certifications, setCertifications] = useState<Certification[]>([]);

  const [experienceTier, setExperienceTier] = useState<ExperienceTierData>({
    experienceBucket: "",
    preferredTierId: "",
    preferredTierReason: "",
  });

  const { data: priceTiers = [] } = useCoachPriceTiers();

  // Existing coach record (for edit-mode prefill + status banner)
  const [existingCoach, setExistingCoach] = useState<{
    id: string;
    status: string;
    admin_note: string | null;
  } | null>(null);
  const [, setPrefillLoading] = useState(false);


  // Prefill form when user already has a human_coaches record (self-mode only, no editId)
  useEffect(() => {
    if (!user || mode === "proxy" || editId) return;

    let cancelled = false;
    const loadExisting = async () => {
      setPrefillLoading(true);
      const { data: coach } = await supabase
        .from("human_coaches")
        .select("id, status, admin_note, name, bio, avatar_url, specialties, experience_years, experience_years_bucket, preferred_tier_id, preferred_tier_reason")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (coach) {
        setExistingCoach({ id: coach.id, status: coach.status, admin_note: coach.admin_note });
        setBasicInfo((prev) => ({
          ...prev,
          displayName: coach.name || prev.displayName,
          bio: coach.bio || prev.bio,
          avatarUrl: coach.avatar_url || prev.avatarUrl,
          specialties: coach.specialties || prev.specialties,
          yearsExperience: coach.experience_years || prev.yearsExperience,
        }));
        setExperienceTier({
          experienceBucket: (coach.experience_years_bucket as any) || "",
          preferredTierId: coach.preferred_tier_id || "",
          preferredTierReason: coach.preferred_tier_reason || "",
        });


        // Prefill certifications from existing record
        const { data: certs } = await supabase
          .from("coach_certifications")
          .select("cert_type, cert_name, issuing_authority, cert_number, image_url, description")
          .eq("coach_id", coach.id);
        if (!cancelled && certs && certs.length > 0) {
          setCertifications(certs.map((c) => ({
            certType: c.cert_type,
            certName: c.cert_name,
            issuingAuthority: c.issuing_authority || "",
            certNumber: c.cert_number || "",
            imageUrl: c.image_url || "",
            description: c.description || "",
          })));
        }
      }
      setPrefillLoading(false);
    };
    loadExisting();
    return () => { cancelled = true; };
  }, [user, mode, editId]);

  // Edit-mode prefill: load specific record by id (typically proxy applications)
  useEffect(() => {
    if (!user || !editId) return;
    let cancelled = false;
    (async () => {
      const { data: coach } = await supabase
        .from("human_coaches")
        .select("id, status, admin_note, name, phone, bio, avatar_url, specialties, experience_years, experience_years_bucket, preferred_tier_id, preferred_tier_reason, claim_phone, claim_country_code, submitted_by_user_id")
        .eq("id", editId)
        .maybeSingle();
      if (cancelled || !coach) return;
      if (coach.submitted_by_user_id !== user.id) {
        toast({ title: "无权限编辑该申请", variant: "destructive" });
        navigate("/become-coach" + (inviteToken ? `?invite=${inviteToken}` : ""));
        return;
      }
      setExistingCoach({ id: coach.id, status: coach.status, admin_note: coach.admin_note });
      setBasicInfo((prev) => ({
        ...prev,
        displayName: coach.name || prev.displayName,
        phone: coach.phone || coach.claim_phone || prev.phone,
        bio: coach.bio || prev.bio,
        avatarUrl: coach.avatar_url || prev.avatarUrl,
        specialties: coach.specialties || prev.specialties,
        yearsExperience: coach.experience_years || prev.yearsExperience,
      }));
      setExperienceTier({
        experienceBucket: (coach.experience_years_bucket as any) || "",
        preferredTierId: coach.preferred_tier_id || "",
        preferredTierReason: coach.preferred_tier_reason || "",
      });
      if (mode === "proxy") {
        setProxyData({
          coachName: coach.name || "",
          coachPhone: coach.claim_phone || coach.phone || "",
          coachCountryCode: coach.claim_country_code || "+86",
          relation: "",
          verified: true,
        });
      }
      const { data: certs } = await supabase
        .from("coach_certifications")
        .select("cert_type, cert_name, issuing_authority, cert_number, image_url, description")
        .eq("coach_id", coach.id);
      if (!cancelled && certs && certs.length > 0) {
        setCertifications(certs.map((c) => ({
          certType: c.cert_type,
          certName: c.cert_name,
          issuingAuthority: c.issuing_authority || "",
          certNumber: c.cert_number || "",
          imageUrl: c.image_url || "",
          description: c.description || "",
        })));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, editId]);

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

    if (mode === "proxy" && !proxyData.verified) {
      toast({ title: "请先完成代申请身份核验", variant: "destructive" });
      setCurrentStep("proxy_verify");
      return;
    }

    // 最终兜底校验（自申请模式）
    if (mode !== "proxy") {
      const { validateBasicInfo } = await import("@/lib/coachApplicationTemplates");
      const err = validateBasicInfo({
        displayName: basicInfo.displayName,
        phone: basicInfo.phone,
        bio: basicInfo.bio,
        avatarUrl: basicInfo.avatarUrl,
        specialties: basicInfo.specialties,
      });
      if (err) {
        toast({ title: err.message, variant: "destructive" });
        setCurrentStep("basic");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 推荐档位（系统按经验+持证计算）
      const hasCert = certifications.length > 0;
      const suggestedLevel = experienceTier.experienceBucket
        ? suggestTierLevel(experienceTier.experienceBucket as any, hasCert)
        : null;
      const suggestedTier = suggestedLevel != null
        ? priceTiers.find((t) => t.tier_level === suggestedLevel)
        : undefined;

      const isProxy = mode === "proxy";
      const effectiveName = isProxy ? proxyData.coachName : basicInfo.displayName;
      const effectivePhone = isProxy ? proxyData.coachPhone : basicInfo.phone;

      const coachPayload: Record<string, any> = {
        name: effectiveName,
        phone: effectivePhone,
        bio: basicInfo.bio,
        avatar_url: basicInfo.avatarUrl,
        specialties: basicInfo.specialties,
        experience_years: basicInfo.yearsExperience,
        experience_years_bucket: experienceTier.experienceBucket || null,
        preferred_tier_id: experienceTier.preferredTierId || null,
        preferred_tier_reason: experienceTier.preferredTierReason || null,
        suggested_tier_id: suggestedTier?.id || null,
        submitted_by_user_id: user.id,
        status: "pending",
        is_accepting_new: false,
        is_verified: false,
      };

      if (isProxy) {
        // 代申请：教练手机收码已校验，不绑定 user_id（待教练后续认领）
        coachPayload.user_id = null;
        coachPayload.claim_phone = proxyData.coachPhone;
        coachPayload.claim_country_code = proxyData.coachCountryCode;
        coachPayload.proxy_verified_at = new Date().toISOString();
        coachPayload.admin_note = proxyData.relation
          ? `代申请关系：${proxyData.relation}`
          : null;
      }

      let coachData: { id: string };

      // 查找已有记录：编辑模式锁 editId；代申请按 submitter+claim_phone 复用 pending/rejected；自助按 user_id
      const { data: existing } = editId
        ? await supabase
            .from("human_coaches")
            .select("id, status")
            .eq("id", editId)
            .eq("submitted_by_user_id", user.id)
            .maybeSingle()
        : isProxy
        ? await supabase
            .from("human_coaches")
            .select("id, status")
            .eq("submitted_by_user_id", user.id)
            .eq("claim_phone", proxyData.coachPhone)
            .eq("claim_country_code", proxyData.coachCountryCode)
            .is("user_id", null)
            .in("status", ["pending", "rejected"])
            .maybeSingle()
        : await supabase
            .from("human_coaches")
            .select("id, status")
            .eq("user_id", user.id)
            .maybeSingle();

      if (existing) {
        const { data: updated, error: updateError } = await supabase
          .from("human_coaches")
          .update(coachPayload)
          .eq("id", existing.id)
          .select("id");
        if (updateError) throw updateError;
        if (!updated || updated.length === 0) {
          throw new Error("更新失败：无权限或记录已被他人占用");
        }
        coachData = updated[0];

        await supabase.from("coach_certifications").delete().eq("coach_id", coachData.id);
        await supabase.from("coach_services").delete().eq("coach_id", coachData.id);
      } else {
        // 自助模式做姓名+手机号防重；代申请已由 DB 唯一索引拦截
        if (!isProxy) {
          const { data: dupByName } = await supabase
            .from("human_coaches")
            .select("id, user_id, name, phone, status")
            .eq("phone", basicInfo.phone)
            .eq("name", basicInfo.displayName)
            .maybeSingle();

          if (dupByName && dupByName.user_id !== user.id) {
            toast({
              title: "该姓名+手机号已被其他账号申请",
              description: "请使用首次申请时的账号登录，或联系客服合并账号。",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }

        const insertPayload = isProxy ? coachPayload : { user_id: user.id, ...coachPayload };
        const { data: inserted, error: coachError } = await supabase
          .from("human_coaches")
          .insert(insertPayload as any)
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

      // Auto-create default service (60 min) — 兜底确保后台审核可见
      const serviceName = invitationData.default_service_name || `${effectiveName} 咨询`;
      const { data: existingService } = await supabase
        .from("coach_services")
        .select("id")
        .eq("coach_id", coachData.id)
        .limit(1)
        .maybeSingle();

      if (!existingService) {
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
        // 默认服务可由管理员审核时补建，失败不阻断主流程
        if (serviceError) {
          console.warn("默认服务创建失败（管理员审核时会自动补建）:", serviceError);
        }
      }

      // Increment invitation usage count (skip for coach-self-initiated proxy without invite)
      if (invitationData.id && invitationData.source !== "coach_self_initiated") {
        await supabase.rpc('increment_coach_invitation_count', { p_invitation_id: invitationData.id });
      }

      setCurrentStep("success");
      toast({ title: "申请提交成功！" });
    } catch (error: any) {
      console.error("Submit error:", error);
      const raw = error?.message || error?.error_description || "";
      let description = "请稍后重试或联系客服";
      if (raw.includes("coach_application_throttle_24h")) {
        description = "24 小时内最多提交 5 份待审核申请，请稍后再试";
      } else if (raw.includes("coach_application_throttle_total")) {
        description = "您累计待审核申请已达 10 份，请等待审核后再提交";
      } else if (raw.includes("human_coaches_claim_phone_unique") || raw.includes("duplicate key")) {
        description = "该手机号已有一份待审核或已通过的申请，请等待审核或联系客服";
      } else if (raw.toLowerCase().includes("row-level security") || raw.toLowerCase().includes("permission")) {
        description = "当前账号无权限提交，请联系客服";
      } else if (raw) {
        description = raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
      }
      toast({
        title: "提交失败",
        description,
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
    const currentUrl = inviteToken
      ? `/become-coach?invite=${inviteToken}`
      : `/become-coach${mode === "proxy" ? "?mode=proxy" : ""}`;
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

        {invitationData && !existingCoach && invitationData.source !== "coach_self_initiated" && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">
              ✨ 您已收到教练入驻邀请
              {invitationData.invitee_name && `（${invitationData.invitee_name}）`}
              ，请填写以下资料完成申请
            </div>
          </div>
        )}

        {coachBypass && myCoachProfile && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-700">
              👥 您正以教练 <b>{myCoachProfile.name}</b> 的身份代他人申请，提交后将进入管理员审核队列
            </div>
          </div>
        )}

        {user && !editId && (
          <MyApplicationsCard userId={user.id} inviteToken={inviteToken} />
        )}

        {existingCoach?.status === "pending" && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⏳ 您的申请正在审核中，编辑后将重新排队，预计 1-2 个工作日反馈。
            </div>
          </div>
        )}

        {existingCoach?.status === "approved" && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              ✅ 您已通过认证。修改资料需重新审核，期间已上线的预约不受影响。
            </div>
          </div>
        )}

        {existingCoach?.status === "rejected" && (
          <div className="max-w-lg mx-auto px-4 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              ❌ 上次审核未通过{existingCoach.admin_note ? `：${existingCoach.admin_note}` : ""}，请补充资料后重新提交。
            </div>
          </div>
        )}

        {user && (
          <div className="max-w-lg mx-auto px-4 pt-3">
            <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <span>🪪</span>
              <span>
                当前以「<span className="font-medium text-foreground">
                  {user.phone
                    ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
                    : user.email || "当前账号"}
                </span>」身份{existingCoach ? "编辑资料" : "申请"}。
                <span className="block mt-0.5">下次编辑请使用<strong>同一账号</strong>登录，否则系统会视为新申请。</span>
              </span>
            </div>
            {mode === "self" && !existingCoach && !editId && (
              <div className="mt-2 text-xs text-muted-foreground text-right">
                不是为自己申请？
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (inviteToken) params.set("invite", inviteToken);
                    params.set("mode", "proxy");
                    navigate(`/become-coach?${params.toString()}`);
                  }}
                  className="text-primary underline-offset-4 hover:underline ml-1"
                >
                  切换为代他人申请 →
                </button>
              </div>
            )}
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
            {currentStep === "proxy_verify" && (
              <ProxyVerifyStep
                data={proxyData}
                onChange={setProxyData}
                onNext={() => {
                  // 把代申请填入的姓名/手机号同步到 basicInfo，方便后续步骤展示
                  setBasicInfo((prev) => ({
                    ...prev,
                    displayName: proxyData.coachName,
                    phone: proxyData.coachPhone,
                  }));
                  setCurrentStep("basic");
                }}
              />
            )}

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
                onNext={() => setCurrentStep("experience")}
                onBack={() => setCurrentStep("basic")}
                presetCertTypes={
                  Array.isArray((invitationData as any)?.default_certifications)
                    ? (invitationData as any).default_certifications.map((c: any) => c.certType)
                    : []
                }
              />
            )}

            {currentStep === "experience" && (
              <ExperienceTierStep
                data={experienceTier}
                onChange={setExperienceTier}
                onNext={() => setCurrentStep("submit")}
                onBack={() => setCurrentStep("certifications")}
                hasCertifications={certifications.length > 0}
              />
            )}


            {currentStep === "submit" && (
              <SubmitStep
                basicInfo={basicInfo}
                certifications={certifications}
                defaultServiceName={invitationData?.default_service_name}
                onSubmit={handleSubmit}
                onBack={() => setCurrentStep("experience")}
                isSubmitting={isSubmitting}
                submitLabel={existingCoach ? "保存并重新提交审核" : "提交申请"}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
