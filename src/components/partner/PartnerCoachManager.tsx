import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Plus, Loader2, Bot } from "lucide-react";
import { usePartnerCoaches, useCreatePartnerCoach, useTogglePartnerCoach } from "@/hooks/usePartnerCoaches";
import { AICoachCreator } from "@/components/admin/AICoachCreator";
import type { CoachTemplate } from "@/hooks/useCoachTemplates";

interface PartnerCoachManagerProps {
  partnerId: string;
  partnerCode: string;
}

const MAX_COACHES = 3;

export function PartnerCoachManager({ partnerId, partnerCode }: PartnerCoachManagerProps) {
  const { data: coaches = [], isLoading } = usePartnerCoaches(partnerId);
  const createCoach = useCreatePartnerCoach();
  const toggleCoach = useTogglePartnerCoach();
  const [showCreator, setShowCreator] = useState(false);

  const handleTemplateCreated = async (template: any) => {
    const coachKey = template.coach_key || `partner_${Date.now()}`;
    const routePrefix = `/coach/ind_${partnerCode.toLowerCase()}_${coachKey}`;

    await createCoach.mutateAsync({
      created_by_partner_id: partnerId,
      coach_key: `ind_${partnerCode.toLowerCase()}_${coachKey}`,
      emoji: template.emoji || "🤖",
      title: template.title,
      subtitle: template.subtitle || null,
      description: template.description || null,
      gradient: template.gradient || "from-blue-500 to-cyan-500",
      primary_color: template.primary_color || "blue",
      steps: template.steps || [],
      steps_title: "四步曲",
      steps_emoji: "📋",
      page_route: routePrefix,
      history_route: `${routePrefix}/history`,
      history_label: template.history_label || "对话记录",
      placeholder: template.placeholder || "说说你的感受...",
      system_prompt: template.system_prompt || null,
      scenarios: template.scenarios || null,
      briefing_tool_config: template.briefing_tool_config || null,
      is_active: true,
      is_system: false,
      display_order: 999,
      partner_coach_status: "active",
      enable_voice_control: false,
      enable_training_camp: false,
      enable_notifications: false,
      enable_community: false,
      enable_scenarios: !!(template.scenarios?.length),
      disable_option_buttons: false,
      enable_intensity_tracking: false,
      enable_daily_reminder: false,
      enable_emotion_alert: false,
      enable_onboarding: false,
      enable_briefing_share: true,
    } as any);
  };

  const canCreate = coaches.length < MAX_COACHES;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            我的 AI 教练
          </h3>
          <p className="text-sm text-muted-foreground">
            已创建 {coaches.length}/{MAX_COACHES} 个教练
          </p>
        </div>
        <Button
          onClick={() => setShowCreator(true)}
          disabled={!canCreate}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 创建教练
        </Button>
      </div>

      {coaches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">还没有创建 AI 教练</h4>
            <p className="text-sm text-muted-foreground mb-4">
              使用 AI 快速创建专属于你的教练，为你的用户提供专业服务
            </p>
            <Button onClick={() => setShowCreator(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              立即创建
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {coaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{coach.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{coach.title}</h4>
                      <Badge variant={coach.is_active ? "default" : "secondary"} className="shrink-0 text-xs">
                        {coach.is_active ? "已上线" : "已停用"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {coach.description || coach.subtitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      路由: {coach.page_route}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={coach.is_active}
                      onCheckedChange={(checked) => 
                        toggleCoach.mutate({ id: coach.id, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!canCreate && (
        <p className="text-xs text-muted-foreground text-center">
          已达到最大创建数量（{MAX_COACHES}个），如需更多请联系管理员
        </p>
      )}

      <AICoachCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        onTemplateCreated={handleTemplateCreated}
      />
    </div>
  );
}
