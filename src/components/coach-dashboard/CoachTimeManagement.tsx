import { useState } from "react";
import { useCoachTimeSlots, useCreateTimeSlots, useDeleteTimeSlot } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";

interface CoachTimeManagementProps {
  coachId: string;
}

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function CoachTimeManagement({ coachId }: CoachTimeManagementProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  
  // Single slot form
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  
  // Batch form
  const [batchStartTime, setBatchStartTime] = useState("09:00");
  const [batchEndTime, setBatchEndTime] = useState("18:00");
  const [slotDuration, setSlotDuration] = useState("60");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeksToGenerate, setWeeksToGenerate] = useState("2");

  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const { data: timeSlots, isLoading } = useCoachTimeSlots(
    coachId,
    format(startOfCurrentWeek, 'yyyy-MM-dd'),
    format(addDays(endOfCurrentWeek, 14), 'yyyy-MM-dd')
  );
  
  const createSlots = useCreateTimeSlots();
  const deleteSlot = useDeleteTimeSlot();

  const handleCreateSlot = async () => {
    if (startTime >= endTime) {
      toast.error("结束时间必须晚于开始时间");
      return;
    }

    try {
      await createSlots.mutateAsync([{
        coach_id: coachId,
        slot_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        status: 'available',
        appointment_id: null,
      }]);
      toast.success("时间段创建成功");
      setDialogOpen(false);
    } catch (error) {
      toast.error("创建失败，请重试");
    }
  };

  const handleBatchCreate = async () => {
    if (selectedDays.length === 0) {
      toast.error("请至少选择一个工作日");
      return;
    }

    const duration = parseInt(slotDuration);
    const weeks = parseInt(weeksToGenerate);
    const slots: any[] = [];

    for (let week = 0; week < weeks; week++) {
      for (const dayIndex of selectedDays) {
        const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex - 1 + week * 7);
        if (date < new Date()) continue;

        let currentTime = batchStartTime;
        while (currentTime < batchEndTime) {
          const [hours, minutes] = currentTime.split(':').map(Number);
          const endMinutes = hours * 60 + minutes + duration;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          const slotEnd = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
          
          if (slotEnd > batchEndTime) break;

          slots.push({
            coach_id: coachId,
            slot_date: format(date, 'yyyy-MM-dd'),
            start_time: currentTime,
            end_time: slotEnd,
            status: 'available',
            appointment_id: null,
          });

          currentTime = slotEnd;
        }
      }
    }

    if (slots.length === 0) {
      toast.error("没有可创建的时间段");
      return;
    }

    try {
      await createSlots.mutateAsync(slots);
      toast.success(`成功创建 ${slots.length} 个时间段`);
      setBatchDialogOpen(false);
    } catch (error) {
      toast.error("批量创建失败，请重试");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot.mutateAsync(slotId);
      toast.success("时间段已删除");
    } catch (error) {
      toast.error("删除失败，只能删除未被预约的时间段");
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const slotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeSlots?.filter(slot => slot.slot_date === dateStr) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">时间管理</h1>
          <p className="text-muted-foreground">管理您的可预约时间段</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加时间段
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加时间段</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>选择日期</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>开始时间</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>结束时间</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateSlot} className="w-full" disabled={createSlots.isPending}>
                  {createSlots.isPending ? "创建中..." : "确认添加"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                批量生成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>批量生成时间段</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>选择工作日</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {weekDays.map((day, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={selectedDays.includes(index)}
                          onCheckedChange={() => toggleDay(index)}
                        />
                        <label htmlFor={`day-${index}`} className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>每日开始</Label>
                    <Select value={batchStartTime} onValueChange={setBatchStartTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>每日结束</Label>
                    <Select value={batchEndTime} onValueChange={setBatchEndTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>每段时长</Label>
                    <Select value={slotDuration} onValueChange={setSlotDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30分钟</SelectItem>
                        <SelectItem value="45">45分钟</SelectItem>
                        <SelectItem value="60">60分钟</SelectItem>
                        <SelectItem value="90">90分钟</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>生成周数</Label>
                    <Select value={weeksToGenerate} onValueChange={setWeeksToGenerate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1周</SelectItem>
                        <SelectItem value="2">2周</SelectItem>
                        <SelectItem value="4">4周</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleBatchCreate} className="w-full" disabled={createSlots.isPending}>
                  {createSlots.isPending ? "生成中..." : "批量生成"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px,1fr] gap-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={zhCN}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Time slots */}
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })} 的时间段
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : slotsForDate(selectedDate).length > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {slotsForDate(selectedDate).map(slot => (
                  <div 
                    key={slot.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      slot.status === 'booked' ? 'bg-muted/50' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={slot.status === 'booked' ? 'secondary' : 'outline'}>
                        {slot.status === 'booked' ? '已预约' : '可预约'}
                      </Badge>
                      {slot.status === 'available' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                该日期暂无时间段，点击上方按钮添加
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
