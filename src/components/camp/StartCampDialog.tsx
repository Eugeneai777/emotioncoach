import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StartCampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campTemplate: {
    camp_type: string;
    camp_name: string;
    duration_days: number;
    icon?: string;
  };
  onSuccess?: () => void;
}

export function StartCampDialog({ open, onOpenChange, campTemplate, onSuccess }: StartCampDialogProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [bundleWithIdentity, setBundleWithIdentity] = useState(false);
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

      const endDate = addDays(startDate, campTemplate.duration_days - 1);

      // 准备要创建的训练营记录
      const campsToCreate = [{
        user_id: user.id,
        camp_name: campTemplate.camp_name,
        camp_type: campTemplate.camp_type,
        duration_days: campTemplate.duration_days,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        current_day: 0,
        completed_days: 0,
        check_in_dates: [],
        status: 'active'
      }];

      // 如果是情感绽放训练营且选择了联合报名，添加身份绽放训练营
      if (campTemplate.camp_type === 'emotion_bloom' && bundleWithIdentity) {
        // 获取身份绽放训练营模板
        const { data: identityTemplate } = await supabase
          .from('camp_templates')
          .select('*')
          .eq('camp_type', 'identity_bloom')
          .single();

        if (identityTemplate) {
          const identityEndDate = addDays(startDate, identityTemplate.duration_days - 1);
          campsToCreate.push({
            user_id: user.id,
            camp_name: identityTemplate.camp_name,
            camp_type: identityTemplate.camp_type,
            duration_days: identityTemplate.duration_days,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(identityEndDate, 'yyyy-MM-dd'),
            current_day: 0,
            completed_days: 0,
            check_in_dates: [],
            status: 'active'
          });
        }
      }

      const { error } = await supabase
        .from('training_camps')
        .insert(campsToCreate);

      if (error) throw error;

      toast({
        title: "训练营已开启！",
        description: bundleWithIdentity && campTemplate.camp_type === 'emotion_bloom' 
          ? "已同时开启情感绽放和身份绽放训练营！" 
          : "开始你的成长之旅吧！"
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
          <DialogTitle className="text-xl">
            {campTemplate.icon || '🏕️'} 开启{campTemplate.duration_days}天训练营
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>{campTemplate.camp_name}将帮助你开启深度成长之旅</p>
            <div className="bg-primary/5 p-3 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">训练营规则：</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>每天完成相应练习即为打卡</li>
                <li>达成里程碑可获得专属徽章</li>
                <li>完成{campTemplate.duration_days}天获得毕业证书</li>
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
              结束日期：{format(addDays(startDate, campTemplate.duration_days - 1), 'PPP', { locale: zhCN })}
            </p>
          </div>

          {campTemplate.camp_type === 'emotion_bloom' && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Checkbox 
                id="bundle-camps"
                checked={bundleWithIdentity} 
                onCheckedChange={(checked) => setBundleWithIdentity(checked as boolean)}
              />
              <Label 
                htmlFor="bundle-camps"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                同时开启身份绽放训练营（推荐）
              </Label>
            </div>
          )}
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
