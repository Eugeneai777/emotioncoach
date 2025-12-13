import { useState } from "react";
import { useCoachAppointments, useUpdateAppointment } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Video,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { CoachAppointment } from "@/hooks/useCoachDashboard";

interface CoachAppointmentManagementProps {
  coachId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_payment: { label: '待支付', variant: 'outline' },
  confirmed: { label: '已确认', variant: 'default' },
  in_progress: { label: '进行中', variant: 'secondary' },
  completed: { label: '已完成', variant: 'default' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

export function CoachAppointmentManagement({ coachId }: CoachAppointmentManagementProps) {
  const [activeTab, setActiveTab] = useState("confirmed");
  const [selectedAppointment, setSelectedAppointment] = useState<CoachAppointment | null>(null);
  const [coachNotes, setCoachNotes] = useState("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  const { data: appointments, isLoading } = useCoachAppointments(coachId);
  const updateAppointment = useUpdateAppointment();

  const filteredAppointments = appointments?.filter(apt => {
    if (activeTab === 'all') return true;
    return apt.status === activeTab;
  }) || [];

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        updates: { status },
      });
      toast.success("状态更新成功");
    } catch (error) {
      toast.error("更新失败，请重试");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        updates: { coach_notes: coachNotes },
      });
      toast.success("备注保存成功");
      setNotesDialogOpen(false);
    } catch (error) {
      toast.error("保存失败，请重试");
    }
  };

  const openNotesDialog = (apt: CoachAppointment) => {
    setSelectedAppointment(apt);
    setCoachNotes(apt.coach_notes || '');
    setNotesDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">预约管理</h1>
        <p className="text-muted-foreground">管理您的所有预约</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="confirmed">待进行</TabsTrigger>
          <TabsTrigger value="in_progress">进行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <Card key={apt.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* User info and appointment details */}
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={apt.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {apt.profiles?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{apt.profiles?.display_name || '用户'}</p>
                            <Badge variant={statusConfig[apt.status || '']?.variant || 'outline'}>
                              {statusConfig[apt.status || '']?.label || apt.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {apt.service_name || '咨询服务'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(apt.appointment_date), 'MM月dd日 EEEE', { locale: zhCN })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          {apt.user_notes && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">用户备注：</span>{apt.user_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 ml-16 md:ml-0">
                        {apt.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              开始咨询
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          </>
                        )}
                        {apt.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            完成咨询
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNotesDialog(apt)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          备注
                        </Button>
                      </div>
                    </div>

                    {/* Coach notes */}
                    {apt.coach_notes && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg ml-16">
                        <p className="text-sm">
                          <span className="font-medium">我的备注：</span>
                          {apt.coach_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无{activeTab === 'all' ? '' : statusConfig[activeTab]?.label || ''}预约
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加备注</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>咨询备注（仅自己可见）</Label>
              <Textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="记录咨询要点、用户情况等..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveNotes} disabled={updateAppointment.isPending}>
                {updateAppointment.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
