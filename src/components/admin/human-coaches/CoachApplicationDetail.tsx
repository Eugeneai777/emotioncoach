import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  Check, 
  X, 
  Loader2, 
  Phone, 
  Award, 
  Briefcase, 
  FileCheck,
  Clock
} from "lucide-react";
import { CertificationReview } from "./CertificationReview";

interface CoachApplicationDetailProps {
  coachId: string;
  onClose: () => void;
  onApprove: (coachId: string, adminNote?: string) => void;
  onReject: (coachId: string, adminNote?: string) => void;
  isPending: boolean;
}

export function CoachApplicationDetail({
  coachId,
  onClose,
  onApprove,
  onReject,
  isPending
}: CoachApplicationDetailProps) {
  const [adminNote, setAdminNote] = useState("");

  const { data: coach, isLoading } = useQuery({
    queryKey: ["human-coach-detail", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select(`
          *,
          coach_certifications(*),
          coach_services(*)
        `)
        .eq("id", coachId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!coach) return null;

  const isPendingStatus = coach.status === "pending";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={coach.avatar_url || ""} />
              <AvatarFallback>{coach.name?.charAt(0) || "教"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{coach.name}</span>
                <Badge variant={
                  coach.status === "pending" ? "secondary" :
                  coach.status === "approved" ? "default" : "destructive"
                }>
                  {coach.status === "pending" ? "待审核" :
                   coach.status === "approved" ? "已通过" : "已拒绝"}
                </Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground">{coach.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="certifications">资质证书</TabsTrigger>
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
              <CardContent>
                <p className="text-sm">{(coach as any).phone || "未填写"}</p>
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
                  <Label className="text-xs text-muted-foreground">从业年限</Label>
                  <p className="text-sm">{coach.experience_years || 0} 年</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">擅长领域</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coach.specialties?.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
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
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">申请时间</span>
                  <span>{format(new Date(coach.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}</span>
                </div>
                {(coach as any).admin_note && (
                  <div>
                    <Label className="text-xs text-muted-foreground">审核备注</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{(coach as any).admin_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="mt-4">
            <CertificationReview 
              coachId={coachId}
              certifications={coach.coach_certifications || []}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-3 mt-4">
            {coach.coach_services?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂未设置服务项目
                </CardContent>
              </Card>
            ) : (
              coach.coach_services?.map((service: any) => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{service.service_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description || "暂无描述"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">¥{service.price}</p>
                        <p className="text-xs text-muted-foreground">{service.duration_minutes}分钟</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {isPendingStatus && (
          <div className="mt-4 space-y-3">
            <div>
              <Label>审核备注（可选）</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="填写审核意见或拒绝原因..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          {isPendingStatus && (
            <>
              <Button
                variant="destructive"
                onClick={() => onReject(coachId, adminNote)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
                拒绝申请
              </Button>
              <Button
                onClick={() => onApprove(coachId, adminNote)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                通过申请
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
