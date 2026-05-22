import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye, Check, X, Loader2 } from "lucide-react";
import { CoachApplicationDetail } from "./CoachApplicationDetail";

interface CoachApplicationsListProps {
  status: "pending" | "rejected";
}

export function CoachApplicationsList({ status }: CoachApplicationsListProps) {
  const queryClient = useQueryClient();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  const { data: coaches, isLoading } = useQuery({
    queryKey: ["human-coaches", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select(`
          *,
          coach_certifications(*),
          coach_services(*)
        `)
        .eq("status", status)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      coachId,
      certificationIds,
      finalTierId,
    }: {
      coachId: string;
      certificationIds: string[];
      finalTierId: string;
    }) => {
      const { error } = await supabase.rpc("approve_coach_application", {
        p_coach_id: coachId,
        p_certification_ids: certificationIds,
        p_final_tier_id: finalTierId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["human-coaches-stats"] });
      queryClient.invalidateQueries({ queryKey: ["human-coach-detail"] });
      toast.success("教练申请已通过，资质已批量核验，服务价格已同步");
      setSelectedCoachId(null);
    },
    onError: (error: any) => {
      toast.error("通过失败: " + (error?.message ?? "未知错误"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ coachId, reason }: { coachId: string; reason: string }) => {
      const { error } = await supabase.rpc("reject_coach_application", {
        p_coach_id: coachId,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["human-coaches-stats"] });
      toast.success("教练申请已拒绝");
      setSelectedCoachId(null);
    },
    onError: (error: any) => {
      toast.error("拒绝失败: " + (error?.message ?? "未知错误"));
    },
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coaches || coaches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {status === "pending" ? "暂无待审核的申请" : "暂无被拒绝的申请"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {coaches.map((coach) => (
        <Card key={coach.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                <AspectRatio ratio={3 / 4}>
                  {coach.avatar_url ? (
                    <img src={coach.avatar_url} alt={coach.name || ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                      {coach.name?.charAt(0) || "教"}
                    </div>
                  )}
                </AspectRatio>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-foreground">{coach.name}</h3>
                  <Badge variant={status === "pending" ? "secondary" : "destructive"}>
                    {status === "pending" ? "待审核" : "已拒绝"}
                  </Badge>
                  {status === "pending" && (() => {
                    const isEdited = coach.updated_at && coach.created_at &&
                      new Date(coach.updated_at).getTime() - new Date(coach.created_at).getTime() > 1000;
                    return isEdited ? (
                      <Badge
                        variant="outline"
                        className="text-xs border-blue-500 text-blue-600 cursor-help"
                        title={`✅ 此修改来自原教练账号（user_id: ${coach.user_id?.slice(0, 8) ?? "—"}…），系统已校验身份一致`}
                      >
                        ✏️ 修改申请
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">
                        🆕 新申请
                      </Badge>
                    );
                  })()}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{coach.title}</p>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {coach.specialties?.slice(0, 3).map((specialty: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {(coach.specialties?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{coach.specialties.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{coach.experience_years || 0}年经验</span>
                  <span>|</span>
                  <span>{coach.coach_certifications?.length || 0}个证书</span>
                  <span>|</span>
                  <span>{coach.coach_services?.length || 0}项服务</span>
                  <span>|</span>
                  <span>申请于 {format(new Date(coach.created_at), "MM月dd日 HH:mm", { locale: zhCN })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCoachId(coach.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  查看详情
                </Button>
                
                {status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCoachId(coach.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    审核
                  </Button>
                )}
                
                {status === "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCoachId(coach.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    重新审核
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedCoachId && (
        <CoachApplicationDetail
          coachId={selectedCoachId}
          onClose={() => setSelectedCoachId(null)}
          onApprove={(coachId, adminNote, priceTierId) => 
            updateStatusMutation.mutate({ coachId, newStatus: "approved", adminNote, priceTierId })
          }
          onReject={(coachId, adminNote) => 
            updateStatusMutation.mutate({ coachId, newStatus: "rejected", adminNote })
          }
          isPending={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}
