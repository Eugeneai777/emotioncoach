import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { HumanCoach, CoachService, CoachTimeSlot } from "@/hooks/useHumanCoaches";

interface BookingConfirmationProps {
  coach: HumanCoach;
  service: CoachService;
  slot: CoachTimeSlot;
  userNotes: string;
}

export function BookingConfirmation({ coach, service, slot, userNotes }: BookingConfirmationProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'yyyy年M月d日 EEEE', { locale: zhCN });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground">确认预约信息</h3>

      <Card className="p-4 space-y-4">
        {/* Coach info */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <Avatar className="w-12 h-12">
            <AvatarImage src={coach.avatar_url || ''} alt={coach.name} />
            <AvatarFallback>{coach.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{coach.name}</h4>
            <p className="text-sm text-muted-foreground">{coach.title}</p>
          </div>
        </div>

        {/* Service info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">服务项目</p>
              <p className="font-medium">{service.service_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">预约日期</p>
              <p className="font-medium">{formatDate(slot.slot_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">预约时间</p>
              <p className="font-medium">
                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                <span className="text-muted-foreground ml-2">({service.duration_minutes}分钟)</span>
              </p>
            </div>
          </div>

          {userNotes && (
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">咨询留言</p>
                <p className="text-sm">{userNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-muted-foreground">应付金额</span>
          <span className="text-xl font-semibold text-primary">¥{service.price}</span>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        点击"确认支付"后将跳转至支付页面
      </p>
    </div>
  );
}
