import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mic, Tent, Bell, Users, MessageSquare, Activity, Clock, AlertTriangle, GraduationCap, Share2, Bot, Copy, Save, Pencil } from "lucide-react";
import { CoachTemplate, useUpdateCoachTemplate } from "@/hooks/useCoachTemplates";
import { useState } from "react";
import { toast } from "sonner";

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
  const [selectedPrompt, setSelectedPrompt] = useState<{
    template: CoachTemplate;
    isEditing: boolean;
    editedPrompt: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleOpenPrompt = (template: CoachTemplate) => {
    setSelectedPrompt({
      template,
      isEditing: false,
      editedPrompt: template.system_prompt || ''
    });
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    setIsSaving(true);
    try {
      await updateTemplate.mutateAsync({
        id: selectedPrompt.template.id,
        data: { system_prompt: selectedPrompt.editedPrompt }
      });
      setSelectedPrompt(prev => prev ? { ...prev, isEditing: false } : null);
      toast.success('Prompt 已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPrompt = () => {
    if (selectedPrompt?.editedPrompt) {
      navigator.clipboard.writeText(selectedPrompt.editedPrompt);
      toast.success('已复制到剪贴板');
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 text-xs px-2 ${template.system_prompt ? 'text-primary hover:text-primary' : 'text-muted-foreground'}`}
                      onClick={() => handleOpenPrompt(template)}
                    >
                      <Bot className="h-3 w-3 mr-1" />
                      Prompt
                    </Button>
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

      {/* Prompt Dialog */}
      <Dialog open={!!selectedPrompt} onOpenChange={(open) => !open && setSelectedPrompt(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedPrompt?.template.emoji}</span>
              <span>{selectedPrompt?.template.title} - AI Prompt</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPrompt?.template.system_prompt || selectedPrompt?.isEditing ? (
              <>
                {selectedPrompt?.isEditing ? (
                  <Textarea
                    value={selectedPrompt.editedPrompt}
                    onChange={(e) => setSelectedPrompt(prev => prev ? { ...prev, editedPrompt: e.target.value } : null)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="输入 AI Prompt..."
                  />
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedPrompt?.editedPrompt}
                    </pre>
                  </ScrollArea>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    字符数: {selectedPrompt?.editedPrompt.length || 0}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                      <Copy className="h-4 w-4 mr-1" />
                      复制
                    </Button>
                    {selectedPrompt?.isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedPrompt(prev => prev ? { 
                            ...prev, 
                            isEditing: false, 
                            editedPrompt: prev.template.system_prompt || '' 
                          } : null)}
                        >
                          取消
                        </Button>
                        <Button size="sm" onClick={handleSavePrompt} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                          保存
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedPrompt(prev => prev ? { ...prev, isEditing: true } : null)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">该教练的 Prompt 存储在 Edge Function 中</p>
                <p className="text-xs mt-1">或点击下方按钮添加数据库配置</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setSelectedPrompt(prev => prev ? { ...prev, isEditing: true } : null)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  添加 Prompt
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
