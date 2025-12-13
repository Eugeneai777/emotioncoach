import { useState, useMemo } from "react";
import { useCoachAppointments, useUpdateAppointment, CoachAppointment } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User,
  Video,
  CheckCircle,
  XCircle,
  CalendarDays
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoachAppointmentCalendarProps {
  coachId: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: '待支付', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  confirmed: { label: '已确认', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  in_progress: { label: '进行中', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: '已完成', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  cancelled: { label: '已取消', color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

export function CoachAppointmentCalendar({ coachId }: CoachAppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<CoachAppointment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: appointments = [], isLoading } = useCoachAppointments(coachId);
  const updateAppointment = useUpdateAppointment();

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // 按日期分组预约
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, CoachAppointment[]> = {};
    appointments.forEach(apt => {
      const dateKey = apt.appointment_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(apt);
    });
    // 按时间排序
    Object.values(map).forEach(list => {
      list.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return map;
  }, [appointments]);

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAppointmentClick = (apt: CoachAppointment) => {
    setSelectedAppointment(apt);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedAppointment) return;
    try {
      await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        updates: { status },
      });
      toast.success("状态更新成功");
      setDetailDialogOpen(false);
    } catch (error) {
      toast.error("更新失败，请重试");
    }
  };

  // 统计当月预约
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let total = 0, confirmed = 0, completed = 0;
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointment_date);
      if (aptDate >= monthStart && aptDate <= monthEnd) {
        total++;
        if (apt.status === 'confirmed' || apt.status === 'in_progress') confirmed++;
        if (apt.status === 'completed') completed++;
      }
    });
    
    return { total, confirmed, completed };
  }, [appointments, currentMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">预约日历</h1>
          <p className="text-muted-foreground">可视化管理您的预约安排</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            <CalendarDays className="h-4 w-4 mr-1" />
            今天
          </Button>
        </div>
      </div>

      {/* 月度统计 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{monthStats.total}</p>
            <p className="text-sm text-muted-foreground">本月预约</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{monthStats.confirmed}</p>
            <p className="text-sm text-muted-foreground">待进行</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{monthStats.completed}</p>
            <p className="text-sm text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* 日历主体 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {/* 星期标题 */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 日期网格 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasAppointments = dayAppointments.length > 0;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors",
                      !isCurrentMonth && "opacity-40",
                      isSelected && "ring-2 ring-primary",
                      isToday(day) && "bg-primary/5",
                      "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday(day) && "text-primary",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* 预约指示器 */}
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 2).map((apt, i) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(apt);
                          }}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate",
                            statusConfig[apt.status || '']?.bgColor || 'bg-muted',
                            statusConfig[apt.status || '']?.color || 'text-foreground',
                            "hover:opacity-80 cursor-pointer"
                          )}
                        >
                          <span className="hidden sm:inline">{apt.start_time?.slice(0, 5)} </span>
                          {apt.profiles?.display_name?.slice(0, 4) || '用户'}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayAppointments.length - 2} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 右侧: 选中日期详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate 
                ? format(selectedDate, 'M月d日 EEEE', { locale: zhCN })
                : '选择日期查看详情'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <ScrollArea className="h-[400px] pr-4">
                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={apt.profiles?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {apt.profiles?.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {apt.profiles?.display_name || '用户'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              statusConfig[apt.status || '']?.color
                            )}
                          >
                            {statusConfig[apt.status || '']?.label}
                          </Badge>
                        </div>
                        {apt.service_name && (
                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {apt.service_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    当日暂无预约
                  </p>
                )}
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                点击日历上的日期查看预约详情
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 预约详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAppointment.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {selectedAppointment.profiles?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedAppointment.profiles?.display_name || '用户'}</p>
                  <Badge 
                    variant="outline"
                    className={statusConfig[selectedAppointment.status || '']?.color}
                  >
                    {statusConfig[selectedAppointment.status || '']?.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedAppointment.appointment_date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedAppointment.start_time?.slice(0, 5)} - {selectedAppointment.end_time?.slice(0, 5)}
                    （{selectedAppointment.duration_minutes}分钟）
                  </span>
                </div>
                {selectedAppointment.service_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedAppointment.service_name}</span>
                  </div>
                )}
              </div>

              {selectedAppointment.user_notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">用户备注：</span>
                    {selectedAppointment.user_notes}
                  </p>
                </div>
              )}

              {selectedAppointment.coach_notes && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">我的备注：</span>
                    {selectedAppointment.coach_notes}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updateAppointment.isPending}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      开始咨询
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={updateAppointment.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      取消预约
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'in_progress' && (
                  <Button 
                    size="sm"
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={updateAppointment.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    完成咨询
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
