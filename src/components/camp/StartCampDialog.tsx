import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StartCampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StartCampDialog({ open, onOpenChange, onSuccess }: StartCampDialogProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStart = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "请先登录",
          description: "开启训练营需要登录账号",
          variant: "destructive"
        });
        return;
      }

      const endDate = addDays(startDate, 20); // 21 days total (including start date)

      const { error } = await supabase
        .from('training_camps')
        .insert({
          user_id: user.id,
          camp_name: '21天情绪日记训练营',
          camp_type: 'emotion_journal_21',
          duration_days: 21,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          current_day: 0,
          completed_days: 0,
          check_in_dates: [],
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "训练营已开启！",
        description: "开始你的21天情绪日记之旅吧！"
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error starting camp:', error);
      toast({
        title: "开启失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">🏕️ 开启21天训练营</DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>21天情绪日记训练营将帮助你：</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>建立规律的情绪记录习惯</li>
              <li>提升情绪觉察能力</li>
              <li>获得个性化成长洞察</li>
            </ul>
            <div className="bg-primary/5 p-3 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">训练营规则：</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>每天完成1次情绪日记即为打卡</li>
                <li>达成里程碑可获得专属徽章</li>
                <li>完成21天获得毕业证书</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>选择开始日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: zhCN }) : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  locale={zhCN}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              结束日期：{format(addDays(startDate, 20), 'PPP', { locale: zhCN })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            取消
          </Button>
          <Button onClick={handleStart} disabled={loading} className="flex-1">
            {loading ? "开启中..." : "开启训练营"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
