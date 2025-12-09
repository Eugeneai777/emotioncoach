import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Tent, Bell, Users, MessageSquare, Activity, Clock, AlertTriangle, GraduationCap, Share2 } from "lucide-react";
import { CoachTemplate, useUpdateCoachTemplate } from "@/hooks/useCoachTemplates";
import { useState } from "react";

interface CoachFeatureMatrixProps {
  templates: CoachTemplate[];
}

const featureGroups = [
  {
    label: '基础功能',
    features: [
      { key: 'enable_voice_control', icon: Mic, label: '语音控制', emoji: '🎙️' },
      { key: 'enable_training_camp', icon: Tent, label: '训练营', emoji: '🏕️' },
      { key: 'enable_notifications', icon: Bell, label: '通知推送', emoji: '🔔' },
      { key: 'enable_community', icon: Users, label: '社区模块', emoji: '👥' },
      { key: 'enable_scenarios', icon: MessageSquare, label: '场景选择', emoji: '🎯' },
    ]
  },
  {
    label: '扩展功能',
    features: [
      { key: 'enable_intensity_tracking', icon: Activity, label: '强度追踪', emoji: '📊' },
      { key: 'enable_daily_reminder', icon: Clock, label: '每日提醒', emoji: '⏰' },
      { key: 'enable_emotion_alert', icon: AlertTriangle, label: '情绪预警', emoji: '⚠️' },
      { key: 'enable_onboarding', icon: GraduationCap, label: '新手引导', emoji: '🎓' },
      { key: 'enable_briefing_share', icon: Share2, label: '简报分享', emoji: '🔗' },
    ]
  }
];

export function CoachFeatureMatrix({ templates }: CoachFeatureMatrixProps) {
  const updateTemplate = useUpdateCoachTemplate();
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const handleToggle = async (templateId: string, featureKey: string, currentValue: boolean) => {
    const cellKey = `${templateId}-${featureKey}`;
    setUpdatingCell(cellKey);
    
    try {
      await updateTemplate.mutateAsync({
        id: templateId,
        data: { [featureKey]: !currentValue }
      });
    } finally {
      setUpdatingCell(null);
    }
  };

  const getFeatureValue = (template: CoachTemplate, featureKey: string): boolean => {
    return (template as any)[featureKey] ?? false;
  };

  // Count enabled features per coach
  const getEnabledCount = (template: CoachTemplate) => {
    return featureGroups.flatMap(g => g.features).filter(f => getFeatureValue(template, f.key)).length;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px] sticky left-0 bg-muted/50 z-10 font-semibold">
                功能配置
              </TableHead>
              {templates.map(template => (
                <TableHead key={template.id} className="text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{template.emoji}</span>
                    <span className="text-xs font-medium truncate max-w-[100px]">{template.title}</span>
                    <Badge 
                      variant={template.is_active ? "default" : "secondary"} 
                      className="text-[10px] h-4"
                    >
                      {template.is_active ? '启用' : '禁用'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {getEnabledCount(template)}/10
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {featureGroups.map((group, groupIndex) => (
              <>
                {/* Group Header Row */}
                <TableRow key={`group-${groupIndex}`} className="bg-muted/30">
                  <TableCell 
                    colSpan={templates.length + 1} 
                    className="font-medium text-sm py-2 sticky left-0"
                  >
                    {group.label}
                  </TableCell>
                </TableRow>
                
                {/* Feature Rows */}
                {group.features.map(feature => (
                  <TableRow key={feature.key} className="hover:bg-muted/20">
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{feature.emoji}</span>
                        <feature.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{feature.label}</span>
                      </div>
                    </TableCell>
                    {templates.map(template => {
                      const cellKey = `${template.id}-${feature.key}`;
                      const isUpdating = updatingCell === cellKey;
                      const value = getFeatureValue(template, feature.key);
                      
                      return (
                        <TableCell key={template.id} className="text-center">
                          <div className="flex justify-center items-center">
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Switch
                                checked={value}
                                onCheckedChange={() => handleToggle(template.id, feature.key, value)}
                                disabled={!template.is_active}
                                className="data-[state=checked]:bg-primary"
                              />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Legend */}
      <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-8 h-4 rounded-full bg-primary" /> 已启用
          </span>
          <span className="flex items-center gap-1">
            <div className="w-8 h-4 rounded-full bg-muted border" /> 未启用
          </span>
        </div>
        <span>共 {templates.length} 个教练 · {featureGroups.flatMap(g => g.features).length} 项功能</span>
      </div>
    </div>
  );
}
