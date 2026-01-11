import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppointmentCard } from "@/components/human-coach/AppointmentCard";
import { ReviewDialog } from "@/components/human-coach/ReviewDialog";
import { useCoachCallContext } from "@/components/coach-call/CoachCallProvider";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

export default function MyAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startCall, isInCall } = useCoachCallContext();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    appointmentId: string;
    coachId: string;
    coachName: string;
  } | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('coaching_appointments')
        .select(`
          *,
          human_coaches (
            name,
            title,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase.functions.invoke('cancel-appointment', {
        body: { appointmentId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast.success('预约已取消');
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    },
    onError: (error: any) => {
      toast.error(error.message || '取消失败');
    },
  });

  const handleCancel = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
      cancelMutation.mutate(appointmentToCancel);
    }
  };

  const handleJoinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  const handleReview = (appointmentId: string, coachId: string, coachName: string) => {
    setReviewTarget({ appointmentId, coachId, coachName });
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
  };

  const handleCall = async (coachUserId: string, coachName: string, appointmentId: string) => {
    try {
      // 需要通过coach_id获取user_id
      const { data: coachData } = await supabase
        .from('human_coaches')
        .select('user_id')
        .eq('id', coachUserId)
        .single();
      
      if (coachData?.user_id) {
        await startCall(coachData.user_id, coachName, appointmentId);
      } else {
        toast.error('无法获取教练信息');
      }
    } catch (error: any) {
      toast.error(error.message || '发起通话失败');
    }
  };

  const filterAppointments = (status: string) => {
    if (!appointments) return [];
    switch (status) {
      case 'upcoming':
        return appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
      case 'completed':
        return appointments.filter(a => a.status === 'completed');
      case 'cancelled':
        return appointments.filter(a => a.status === 'cancelled');
      default:
        return appointments;
    }
  };

  const upcomingCount = filterAppointments('upcoming').length;
  const completedCount = filterAppointments('completed').length;
  const cancelledCount = filterAppointments('cancelled').length;

  return (
    <>
      <Helmet>
        <title>我的预约 - 有劲AI</title>
        <meta name="description" content="管理你的教练预约和咨询记录" />
        <meta property="og:title" content="有劲AI｜我的预约" />
        <meta property="og:description" content="一对一真人教练咨询预约管理" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/my-appointments" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">我的预约</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="upcoming">
              待进行 {upcomingCount > 0 && `(${upcomingCount})`}
            </TabsTrigger>
            <TabsTrigger value="completed">
              已完成 {completedCount > 0 && `(${completedCount})`}
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              已取消 {cancelledCount > 0 && `(${cancelledCount})`}
            </TabsTrigger>
          </TabsList>

          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filterAppointments(tab).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无预约</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => navigate('/human-coaches')}
                  >
                    浏览教练
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filterAppointments(tab).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onCancel={handleCancel}
                      onJoinMeeting={handleJoinMeeting}
                      onReview={handleReview}
                      onCall={handleCall}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消预约？</AlertDialogTitle>
            <AlertDialogDescription>
              取消后可能需要重新预约时间段，且部分费用可能无法退还。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review dialog */}
      {reviewTarget && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          appointmentId={reviewTarget.appointmentId}
          coachId={reviewTarget.coachId}
          coachName={reviewTarget.coachName}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
    </>
  );
}
