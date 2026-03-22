import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Lock, ShoppingCart } from "lucide-react";
import { format, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCampPurchase } from "@/hooks/useCampPurchase";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useQueryClient } from "@tanstack/react-query";

interface StartCampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campTemplate: {
    camp_type: string;
    camp_name: string;
    duration_days: number;
    icon?: string;
    price?: number;
    original_price?: number;
    price_note?: string;
  };
  onSuccess?: (campId: string) => void;
  /** Override internal purchase check (e.g. when purchase was verified externally via orders table) */
  isPurchased?: boolean;
}

export function StartCampDialog({ open, onOpenChange, campTemplate, onSuccess, isPurchased }: StartCampDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [bundleWithIdentity, setBundleWithIdentity] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 检查用户购买状态（外部传入的 isPurchased 优先级最高）
  const { data: purchaseRecord } = useCampPurchase(campTemplate.camp_type);
  const isFree = campTemplate.price === 0 || campTemplate.price === undefined || campTemplate.price === null;
  const hasPurchased = isPurchased || !!purchaseRecord;
  const needsPurchase = !isFree && !hasPurchased;

  // 如果需要购买但未购买，显示购买提示
  if (needsPurchase && open) {
    return (
      <>
        <Dialog open={open && !showPayDialog} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-teal-50/95 via-cyan-50/80 to-blue-50/60
            dark:from-teal-950/95 dark:via-cyan-950/80 dark:to-blue-950/60 border-teal-200/50 dark:border-teal-800/50">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2 text-teal-800 dark:text-teal-200">
                <Lock className="w-5 h-5 text-amber-600" />
                需要购买此训练营
              </DialogTitle>
              <DialogDescription className="text-left space-y-3 pt-2">
                <p>该训练营需要购买后才能开启。</p>
                <div className="bg-teal-100/50 dark:bg-teal-900/30 p-4 rounded-lg space-y-2 border border-teal-200/50 dark:border-teal-800/50">
                  <div className="flex items-end gap-2">
                    {campTemplate.original_price && campTemplate.original_price > (campTemplate.price || 0) && (
                      <span className="text-muted-foreground line-through">
                        ¥{campTemplate.original_price.toLocaleString()}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      ¥{campTemplate.price?.toLocaleString() || '0'}
                    </span>
                  </div>
                  {campTemplate.price_note && (
                    <p className="text-sm text-teal-700 dark:text-teal-300">{campTemplate.price_note}</p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="flex-1 border-teal-300/50 text-teal-700 hover:bg-teal-50/50 dark:border-teal-700/50 dark:text-teal-400"
              >
                取消
              </Button>
              <Button 
                onClick={() => {
                  if (!user) {
                    onOpenChange(false);
                    navigate('/auth');
                    return;
                  }
                  setShowPayDialog(true);
                }} 
                className="flex-1 gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <ShoppingCart className="w-4 h-4" />
                立即购买
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <UnifiedPayDialog
          open={showPayDialog}
          onOpenChange={(v) => {
            setShowPayDialog(v);
            if (!v) onOpenChange(false);
          }}
          packageInfo={{
            key: `camp-${campTemplate.camp_type}`,
            name: campTemplate.camp_name,
            price: campTemplate.price || 0,
          }}
          onSuccess={async () => {
            // 记录购买到 user_camp_purchases
            if (user) {
              try {
                await supabase.from('user_camp_purchases').insert({
                  user_id: user.id,
                  camp_type: campTemplate.camp_type,
                  camp_name: campTemplate.camp_name,
                  purchase_price: campTemplate.price || 0,
                  payment_status: 'completed',
                });
              } catch (e) {
                console.error('Insert camp purchase error:', e);
              }
            }
            setShowPayDialog(false);
            // 刷新购买状态
            queryClient.invalidateQueries({ queryKey: ['camp-purchase'] });
            toast({
              title: "购买成功！",
              description: "请选择开始日期开启训练营",
            });
          }}
        />
      </>
    );
  }

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
        onOpenChange(false);
        navigate('/auth');
        return;
      }

      // 检查是否已有该类型的活跃训练营
      const { data: existingCamp } = await supabase
        .from('training_camps')
        .select('id')
        .eq('user_id', user.id)
        .eq('camp_type', campTemplate.camp_type)
        .eq('status', 'active')
        .maybeSingle();

      if (existingCamp) {
        toast({
          title: "已有进行中的训练营",
          description: "该类型训练营已开启，请先完成或结束后再开启新的",
          variant: "destructive"
        });
        onOpenChange(false);
        onSuccess?.(existingCamp.id);
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
        // 先检查身份绽放是否已有活跃营
        const { data: existingIdentityCamp } = await supabase
          .from('training_camps')
          .select('id')
          .eq('user_id', user.id)
          .eq('camp_type', 'identity_bloom')
          .eq('status', 'active')
          .maybeSingle();

        if (!existingIdentityCamp) {
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
      }

      const { data: insertedCamps, error } = await supabase
        .from('training_camps')
        .insert(campsToCreate)
        .select('id');

      if (error) {
        // 处理唯一索引冲突
        if (error.code === '23505') {
          toast({
            title: "已有进行中的训练营",
            description: "该类型训练营已开启，请先完成或结束后再开启新的",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // 处理邀请人通知 - 检查 localStorage 中存储的邀请人
      const storedRef = localStorage.getItem('camp_invite_ref');
      if (storedRef && (campTemplate.camp_type === 'wealth_block_7' || campTemplate.camp_type === 'wealth_block_21')) {
        try {
          // 确保不是自己邀请自己
          if (storedRef !== user.id) {
            // 检查是否已有邀请记录
            const { data: existingRef } = await supabase
              .from('camp_invite_referrals')
              .select('id')
              .eq('referred_user_id', user.id)
              .eq('inviter_user_id', storedRef)
              .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
              .maybeSingle();

            if (!existingRef) {
              // 创建邀请记录
              await supabase
                .from('camp_invite_referrals')
                .insert({
                  inviter_user_id: storedRef,
                  referred_user_id: user.id,
                  camp_type: 'wealth_block_7',
                  status: 'pending',
                });
            }
          }
          localStorage.removeItem('camp_invite_ref');
        } catch (e) {
          console.error('Error processing stored camp invite:', e);
        }
      }

      // 触发邀请成功通知
      if ((campTemplate.camp_type === 'wealth_block_7' || campTemplate.camp_type === 'wealth_block_21') && insertedCamps?.[0]?.id) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-camp-invite-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referred_user_id: user.id,
              camp_id: insertedCamps[0].id,
              camp_type: campTemplate.camp_type,
            }),
          });
        } catch (e) {
          console.error('Error sending invite notification:', e);
        }
      }

      // 根据训练营类型更新用户偏好教练
      const coachTypeMap: Record<string, string> = {
        'wealth_block_7': 'wealth',
        'wealth_block_21': 'wealth',
        'wealth_awakening_21': 'wealth',
        'emotion_bloom': 'emotion',
        'identity_bloom': 'emotion',
        'emotion_stress_7': 'emotion',
        'emotion_journal_21': 'emotion',
        'parent_emotion_21': 'parent',
      };
      
      const preferredCoach = coachTypeMap[campTemplate.camp_type];
      if (preferredCoach) {
        try {
          await supabase
            .from('profiles')
            .update({ preferred_coach: preferredCoach })
            .eq('id', user.id);
          console.log(`✅ 用户偏好教练已更新为 ${preferredCoach}`);
        } catch (e) {
          console.error('更新用户偏好教练失败:', e);
        }
      }

      toast({
        title: "训练营已开启！",
        description: bundleWithIdentity && campTemplate.camp_type === 'emotion_bloom' 
          ? "已同时开启情感绽放和身份绽放训练营！" 
          : "开始你的成长之旅吧！"
      });

      onOpenChange(false);
      onSuccess?.(insertedCamps[0].id);
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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-teal-50/95 via-cyan-50/80 to-blue-50/60
        dark:from-teal-950/95 dark:via-cyan-950/80 dark:to-blue-950/60 border-teal-200/50 dark:border-teal-800/50">
        <DialogHeader>
          <DialogTitle className="text-xl text-teal-800 dark:text-teal-200">
            {campTemplate.icon || '🏕️'} 开启{campTemplate.duration_days}天训练营
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>{campTemplate.camp_name}将帮助你开启深度成长之旅</p>
            <div className="bg-teal-100/50 dark:bg-teal-900/30 p-3 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
              <p className="text-sm font-medium mb-2 text-teal-700 dark:text-teal-400">训练营规则：</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>每天完成相应练习即为打卡</li>
                <li>达成里程碑可获得专属徽章</li>
                <li>完成{campTemplate.duration_days}天获得毕业证书</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-teal-700 dark:text-teal-400">选择开始日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-teal-300/50 dark:border-teal-700/50",
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
            <div className="flex items-center gap-3 p-4 bg-teal-100/50 dark:bg-teal-900/30 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 border-teal-300/50 text-teal-700 hover:bg-teal-50/50 dark:border-teal-700/50 dark:text-teal-400"
          >
            取消
          </Button>
          <Button 
            onClick={handleStart} 
            disabled={loading} 
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          >
            {loading ? "开启中..." : "开启训练营"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}