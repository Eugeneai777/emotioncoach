import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { addDays, format } from "date-fns";
import { getTodayCST } from "@/utils/dateUtils";

interface CampTemplate {
  id: string;
  camp_type: string;
  camp_name: string;
  camp_subtitle: string | null;
  description: string | null;
  duration_days: number;
  icon: string | null;
  gradient: string | null;
  price: number | null;
}

interface CampJoinSelectorProps {
  referralId?: string;
  onJoinComplete?: (campId: string) => void;
}

export function CampJoinSelector({ referralId, onJoinComplete }: CampJoinSelectorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CampTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadFreeCamps();
  }, []);

  const loadFreeCamps = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('id, camp_type, camp_name, camp_subtitle, description, duration_days, icon, gradient, price')
        .eq('is_active', true)
        .or('price.is.null,price.eq.0')
        .order('display_order');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Load camps error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCamp = async (template: CampTemplate) => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    setJoining(template.camp_type);
    try {
      const today = getTodayCST();
      const endDate = format(addDays(new Date(today), template.duration_days - 1), 'yyyy-MM-dd');

      // 创建训练营
      const { data: camp, error: campError } = await supabase
        .from('training_camps')
        .insert({
          user_id: user.id,
          camp_type: template.camp_type,
          camp_name: template.camp_name,
          template_id: template.id,
          duration_days: template.duration_days,
          start_date: today,
          end_date: endDate,
          status: 'active'
        })
        .select()
        .single();

      if (campError) throw campError;

      // 更新推荐关系（如果有）
      if (referralId) {
        await supabase
          .from('partner_referrals')
          .update({
            joined_camp_id: camp.id,
            joined_camp_at: new Date().toISOString(),
            conversion_status: 'in_camp'
          })
          .eq('id', referralId);
      }

      toast.success(`成功加入「${template.camp_name}」！`);
      onJoinComplete?.(camp.id);
      
      // 跳转到训练营打卡页
      navigate(`/camp-checkin/${camp.id}`);
    } catch (error: any) {
      console.error("Join camp error:", error);
      toast.error(error.message || "加入训练营失败");
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          加入免费训练营
        </h3>
        <p className="text-sm text-muted-foreground">
          选择一个训练营，开始你的情绪管理之旅
        </p>
      </div>

      <div className="grid gap-3">
        {templates.map(template => (
          <Card 
            key={template.id}
            className={`border-2 hover:shadow-lg transition-all cursor-pointer ${
              joining === template.camp_type ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleJoinCamp(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.gradient || 'from-orange-500 to-amber-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <span className="text-2xl">{template.icon || '📝'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{template.camp_name}</h4>
                    <Badge className="bg-green-100 text-green-700 border-0 h-5">免费</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.camp_subtitle || template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{template.duration_days}天</span>
                    <span>•</span>
                    <span>每日打卡</span>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500"
                  disabled={joining !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinCamp(template);
                  }}
                >
                  {joining === template.camp_type ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      加入
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        💡 训练营期间每日完成情绪对话即可打卡
      </p>
    </div>
  );
}
