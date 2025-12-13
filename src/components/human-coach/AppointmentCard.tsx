import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MessageSquare, X, Star } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Appointment {
  id: string;
  coach_id: string;
  service_name: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  amount_paid: number;
  status: string | null;
  meeting_link: string | null;
  user_notes: string | null;
  reviewed_at: string | null;
  human_coaches?: {
    name: string;
    title: string | null;
    avatar_url: string | null;
  };
}

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  onJoinMeeting?: (link: string) => void;
  onReview?: (appointmentId: string, coachId: string, coachName: string) => void;
}

export function AppointmentCard({ 
  appointment, 
  onCancel, 
  onJoinMeeting,
  onReview 
}: AppointmentCardProps) {
  const coach = appointment.human_coaches;
  
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'confirmed':
        return <Badge className="bg-green-500">已确认</Badge>;
      case 'pending':
        return <Badge variant="secondary">待确认</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">已完成</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="outline">{appointment.status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'M月d日 EEEE', { locale: zhCN });
  };

  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canJoin = appointment.status === 'confirmed' && appointment.meeting_link;
  const canReview = appointment.status === 'completed' && !appointment.reviewed_at;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Coach avatar */}
        <Avatar className="w-12 h-12">
          <AvatarImage src={coach?.avatar_url || ''} alt={coach?.name} />
          <AvatarFallback>{coach?.name?.slice(0, 1) || '教'}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium">{coach?.name || '教练'}</h4>
              <p className="text-sm text-muted-foreground">{coach?.title}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Service */}
          {appointment.service_name && (
            <p className="text-sm mt-2">{appointment.service_name}</p>
          )}

          {/* Date & Time */}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(appointment.appointment_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
            </span>
          </div>

          {/* Notes */}
          {appointment.user_notes && (
            <div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{appointment.user_notes}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {canJoin && (
              <Button
                size="sm"
                onClick={() => onJoinMeeting?.(appointment.meeting_link!)}
              >
                <Video className="w-4 h-4 mr-1" />
                进入通话
              </Button>
            )}
            {canReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview?.(appointment.id, appointment.coach_id, coach?.name || '教练')}
              >
                <Star className="w-4 h-4 mr-1" />
                评价
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onCancel?.(appointment.id)}
              >
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
