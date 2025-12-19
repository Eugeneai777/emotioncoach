import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ coachId, newStatus, adminNote, priceTierId }: { 
      coachId: string; 
      newStatus: "approved" | "rejected";
      adminNote?: string;
      priceTierId?: string;
    }) => {
      // If approving, we need a price tier
      if (newStatus === "approved" && !priceTierId) {
        throw new Error("审核通过必须选择收费档次");
      }

      let tierPrice: number | null = null;

      // Get tier price if approving
      if (newStatus === "approved" && priceTierId) {
        const { data: tier, error: tierError } = await supabase
          .from("coach_price_tiers")
          .select("price")
          .eq("id", priceTierId)
          .single();
        
        if (tierError) throw tierError;
        tierPrice = tier.price;
      }

      // Update coach status and price tier
      const updateData: Record<string, unknown> = {
        status: newStatus,
        admin_note: adminNote,
        updated_at: new Date().toISOString()
      };

      if (priceTierId) {
        updateData.price_tier_id = priceTierId;
        updateData.price_tier_set_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("human_coaches")
        .update(updateData)
        .eq("id", coachId);
      
      if (error) throw error;

      // Sync service prices if approving
      if (newStatus === "approved" && tierPrice !== null) {
        const { error: servicesError } = await supabase
          .from("coach_services")
          .update({ price: tierPrice })
          .eq("coach_id", coachId);
        
        if (servicesError) {
          console.error("Failed to sync service prices:", servicesError);
        }
      }
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["human-coaches-stats"] });
      toast.success(newStatus === "approved" ? "教练申请已通过，服务价格已同步" : "教练申请已拒绝");
      setSelectedCoachId(null);
    },
    onError: (error) => {
      toast.error("操作失败: " + error.message);
    }
  });

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
              <Avatar className="h-16 w-16">
                <AvatarImage src={coach.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {coach.name?.charAt(0) || "教"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{coach.name}</h3>
                  <Badge variant={status === "pending" ? "secondary" : "destructive"}>
                    {status === "pending" ? "待审核" : "已拒绝"}
                  </Badge>
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
