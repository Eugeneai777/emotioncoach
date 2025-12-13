import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CoachTimeSlot } from "@/hooks/useHumanCoaches";

interface DateTimeSelectorProps {
  coachId: string;
  advanceBookingDays?: number;
  selectedSlot: CoachTimeSlot | null;
  onSelect: (slot: CoachTimeSlot) => void;
}

export function DateTimeSelector({ 
  coachId, 
  advanceBookingDays = 1,
  selectedSlot, 
  onSelect 
}: DateTimeSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeSlots, setTimeSlots] = useState<CoachTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const minDate = addDays(new Date(), advanceBookingDays);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate, coachId]);

  const fetchTimeSlots = async (date: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_time_slots')
        .select('*')
        .eq('coach_id', coachId)
        .eq('slot_date', date)
        .eq('status', 'available')
        .order('start_time');

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(minDate));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground">选择时间</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            locale={zhCN}
            className="rounded-md border"
          />
        </div>

        <div className="space-y-2">
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              请先选择日期
            </p>
          ) : loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              该日期暂无可用时段
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelect(slot)}
                >
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
