import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Search, 
  Edit, 
  Star, 
  Loader2,
  CheckCircle,
  Eye
} from "lucide-react";
import { CoachEditDialog } from "./CoachEditDialog";
import { CoachApplicationDetail } from "./CoachApplicationDetail";

export function ApprovedCoachesList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [viewingCoachId, setViewingCoachId] = useState<string | null>(null);

  const { data: coaches, isLoading } = useQuery({
    queryKey: ["human-coaches", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select(`
          *,
          coach_certifications(*),
          coach_services(*),
          appointment_reviews(count)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ coachId, isAccepting }: { coachId: string; isAccepting: boolean }) => {
      const { error } = await supabase
        .from("human_coaches")
        .update({ 
          is_accepting_new: isAccepting,
          updated_at: new Date().toISOString()
        })
        .eq("id", coachId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isAccepting }) => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      toast.success(isAccepting ? "教练已开始接单" : "教练已暂停接单");
    },
    onError: (error) => {
      toast.error("操作失败: " + error.message);
    }
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ coachId, isVerified }: { coachId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("human_coaches")
        .update({ 
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq("id", coachId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isVerified }) => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      toast.success(isVerified ? "教练已认证" : "已取消认证");
    },
    onError: (error) => {
      toast.error("操作失败: " + error.message);
    }
  });

  const filteredCoaches = coaches?.filter(coach => 
    coach.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialties?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索教练姓名、头衔或擅长领域..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCoaches?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? "未找到匹配的教练" : "暂无已通过的教练"}
          </CardContent>
        </Card>
      ) : (
        filteredCoaches?.map((coach) => (
          <Card key={coach.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* 头像 */}
                <div className="w-14 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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
                
                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">{coach.name}</h3>
                    {coach.is_verified && (
                      <Badge className="bg-blue-500 text-xs px-1.5">
                        <CheckCircle className="h-3 w-3 mr-0.5" />
                        认证
                      </Badge>
                    )}
                    <Badge variant={coach.is_accepting_new ? "default" : "secondary"} className="text-xs">
                      {coach.is_accepting_new ? "接单中" : "暂停"}
                    </Badge>
                  </div>
                  
                  {coach.title && (
                    <p className="text-sm text-muted-foreground mb-1.5 truncate">{coach.title}</p>
                  )}
                  
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      {coach.rating?.toFixed(1) || "5.0"}
                      <span className="hidden sm:inline">({coach.total_reviews || 0}评价)</span>
                    </span>
                    <span>{coach.total_sessions || 0}次咨询</span>
                    <span>{coach.experience_years || 0}年经验</span>
                  </div>
                </div>
              </div>

              {/* 操作区 - 移动端堆叠 */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-xs text-muted-foreground">接单</span>
                    <Switch
                      checked={coach.is_accepting_new}
                      onCheckedChange={(checked) => 
                        toggleStatusMutation.mutate({ coachId: coach.id, isAccepting: checked })
                      }
                      disabled={toggleStatusMutation.isPending}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-xs text-muted-foreground">认证</span>
                    <Switch
                      checked={coach.is_verified}
                      onCheckedChange={(checked) => 
                        toggleVerifiedMutation.mutate({ coachId: coach.id, isVerified: checked })
                      }
                      disabled={toggleVerifiedMutation.isPending}
                    />
                  </label>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewingCoachId(coach.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingCoachId(coach.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {editingCoachId && (
        <CoachEditDialog
          coachId={editingCoachId}
          onClose={() => setEditingCoachId(null)}
        />
      )}

      {viewingCoachId && (
        <CoachApplicationDetail
          coachId={viewingCoachId}
          onClose={() => setViewingCoachId(null)}
          onApprove={() => {}}
          onReject={() => {}}
          isPending={false}
        />
      )}
    </div>
  );
}
