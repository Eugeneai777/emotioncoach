import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Check,
  X,
  Loader2,
  Phone,
  Briefcase,
  Clock,
  Crown,
  FileText,
  ExternalLink,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useCoachPriceTiers } from "@/hooks/useCoachPriceTiers";
import { suggestTierLevel, type ExperienceBucket } from "@/components/coach-application/ExperienceTierStep";
import { AdminCertificationUploader } from "./AdminCertificationUploader";

interface CoachApplicationDetailProps {
  coachId: string;
  onClose: () => void;
  onApprove: (
    coachId: string,
    certificationIds: string[],
    finalTierId: string,
  ) => void;
  onReject: (coachId: string, reason: string) => void;
  isPending: boolean;
}

const BUCKET_LABEL: Record<string, string> = {
  lt3: "3年以下",
  "3to5": "3-5年",
  "5to10": "5-10年",
  gte10: "10年以上",
};

export function CoachApplicationDetail({
  coachId,
  onClose,
  onApprove,
  onReject,
  isPending,
}: CoachApplicationDetailProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [reviewedCertIds, setReviewedCertIds] = useState<Set<string>>(new Set());

  const { data: priceTiers } = useCoachPriceTiers();

  const { data: coach, isLoading } = useQuery({
    queryKey: ["human-coach-detail", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select(`*, coach_certifications(*), coach_services(*)`)
        .eq("id", coachId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  // 系统推荐档位（基于经验+持证）
  const suggestedTier = useMemo(() => {
    if (!coach || !priceTiers) return undefined;
    const bucket = (coach.experience_years_bucket as ExperienceBucket | null) || "";
    const hasCert = (coach.coach_certifications?.length || 0) > 0;
    if (!bucket) return undefined;
    const level = suggestTierLevel(bucket, hasCert);
    return priceTiers.find((t) => t.tier_level === level);
  }, [coach, priceTiers]);

  const preferredTier = useMemo(
    () => priceTiers?.find((t) => t.id === coach?.preferred_tier_id),
    [priceTiers, coach?.preferred_tier_id],
  );

  // 默认选中：申请人期望 > 系统推荐
  useEffect(() => {
    if (!selectedTierId) {
      if (preferredTier) setSelectedTierId(preferredTier.id);
      else if (suggestedTier) setSelectedTierId(suggestedTier.id);
    }
  }, [preferredTier, suggestedTier, selectedTierId]);

  const certifications: any[] = coach?.coach_certifications || [];
  const allCertsReviewed =
    certifications.length === 0 ||
    certifications.every((c) => reviewedCertIds.has(c.id));
  const canApprove = !!selectedTierId && allCertsReviewed;

  const toggleCertReviewed = (id: string, checked: boolean) => {
    setReviewedCertIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleApprove = () => {
    if (!canApprove) {
      toast.error(
        !selectedTierId
          ? "请先选择最终档位"
          : "请先勾选每张证书的「已审阅」",
      );
      return;
    }
    onApprove(coachId, certifications.map((c) => c.id), selectedTierId);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("请填写拒绝原因");
      return;
    }
    onReject(coachId, rejectReason.trim());
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent size="xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!coach) return null;

  const isPendingStatus = coach.status === "pending";
  const isProxy =
    coach.submitted_by_user_id &&
    coach.user_id &&
    coach.submitted_by_user_id !== coach.user_id
      ? true
      : !coach.user_id && coach.submitted_by_user_id
        ? true
        : false;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              <AspectRatio ratio={3 / 4}>
                {coach.avatar_url ? (
                  <img src={coach.avatar_url} alt={coach.name || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold text-muted-foreground">
                    {coach.name?.charAt(0) || "教"}
                  </div>
                )}
              </AspectRatio>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{coach.name}</span>
                <Badge
                  variant={
                    coach.status === "pending"
                      ? "secondary"
                      : coach.status === "approved"
                        ? "default"
                        : "destructive"
                  }
                >
                  {coach.status === "pending"
                    ? "待审核"
                    : coach.status === "approved"
                      ? "已通过"
                      : "已拒绝"}
                </Badge>
                <Badge variant="outline" className={isProxy ? "border-amber-500 text-amber-600" : "border-emerald-500 text-emerald-600"}>
                  {isProxy ? "代申请" : "自助申请"}
                </Badge>
                {isProxy && coach.proxy_verified_at && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">
                    ✓ 短信已验证
                  </Badge>
                )}
              </div>
              <p className="text-xs font-normal text-muted-foreground mt-1">
                {coach.experience_years_bucket
                  ? `经验区间：${BUCKET_LABEL[coach.experience_years_bucket]}`
                  : "未填写经验区间"}
                {" · "}
                {certifications.length} 张证书
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="certifications">
              资质审阅
              {isPendingStatus && certifications.length > 0 && (
                <span className="ml-1 text-xs">
                  ({reviewedCertIds.size}/{certifications.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="services">服务项目</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">手机：</span>
                  {coach.claim_phone || coach.phone || "未填写"}
                  {coach.claim_country_code && coach.claim_phone && (
                    <span className="text-muted-foreground"> ({coach.claim_country_code})</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  专业背景
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">擅长领域</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coach.specialties?.map((s: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">个人简介</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{coach.bio || "未填写"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  申请信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请时间</span>
                  <span>{format(new Date(coach.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    提交者 user_id
                  </span>
                  <span className="font-mono text-xs">
                    {coach.submitted_by_user_id?.slice(0, 8) || "—"}…
                  </span>
                </div>
                {coach.rejected_reason && (
                  <div>
                    <Label className="text-xs text-muted-foreground">上次拒绝原因</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{coach.rejected_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="mt-4 space-y-3">
            {isPendingStatus && (
              <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded p-2">
                ⚠️ 通过审核前需逐一勾选「已审阅」，作为法律意义上的人工核验留痕。管理员可代上传/替换/删除证书。
              </p>
            )}
            <AdminCertificationUploader
              coachId={coachId}
              reviewedCertIds={isPendingStatus ? reviewedCertIds : undefined}
              onToggleReviewed={isPendingStatus ? toggleCertReviewed : undefined}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-3 mt-4">
            {coach.coach_services?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  通过审核后将自动创建默认 60 分钟服务
                </CardContent>
              </Card>
            ) : (
              coach.coach_services?.map((service: any) => (
                <Card key={service.id}>
                  <CardContent className="p-4 flex justify-between">
                    <div>
                      <h4 className="font-medium">{service.service_name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.duration_minutes} 分钟 · ¥{service.price ?? "待设定"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {isPendingStatus && (
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  档位决策
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground">申请人期望</div>
                    <div className="font-medium">
                      {preferredTier ? `${preferredTier.tier_name} ¥${preferredTier.price}` : "未填写"}
                    </div>
                    {coach.preferred_tier_reason && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {coach.preferred_tier_reason}
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded bg-primary/5 border border-primary/30">
                    <div className="text-xs text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      系统推荐
                    </div>
                    <div className="font-medium">
                      {suggestedTier ? `${suggestedTier.tier_name} ¥${suggestedTier.price}` : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">基于经验+持证自动计算</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">最终档位 *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {priceTiers?.map((tier) => {
                      const isSel = selectedTierId === tier.id;
                      const isSuggested = suggestedTier?.id === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedTierId(tier.id)}
                          className={`text-left p-3 rounded-lg border-2 transition ${
                            isSel
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{tier.tier_name}</span>
                            {isSuggested && (
                              <Badge variant="secondary" className="text-xs">推荐</Badge>
                            )}
                          </div>
                          <div className="text-primary font-semibold mt-1">¥{tier.price}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tier.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {showRejectInput && (
              <div>
                <Label>拒绝原因 *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请告知申请人具体原因，将通过短信/系统消息送达"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>关闭</Button>
          {isPendingStatus && (
            <>
              {showRejectInput ? (
                <>
                  <Button variant="ghost" onClick={() => setShowRejectInput(false)} disabled={isPending}>
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isPending || !rejectReason.trim()}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                    确认拒绝
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="destructive" onClick={() => setShowRejectInput(true)} disabled={isPending}>
                    <X className="h-4 w-4 mr-1" />
                    拒绝申请
                  </Button>
                  <Button onClick={handleApprove} disabled={isPending || !canApprove}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    通过申请
                    {!canApprove && certifications.length > 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({reviewedCertIds.size}/{certifications.length})
                      </span>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
