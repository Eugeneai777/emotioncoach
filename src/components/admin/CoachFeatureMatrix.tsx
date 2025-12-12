import { Fragment, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Mic, Tent, Bell, Users, MessageSquare, Activity, Clock, AlertTriangle, GraduationCap, Share2, Bot, Copy, Save, Pencil, ArrowUp, ArrowDown, History, RotateCcw, CheckCircle2, AlertCircle, Circle, Layers } from "lucide-react";
import { CoachTemplate, StagePrompts, useUpdateCoachTemplate } from "@/hooks/useCoachTemplates";
import { usePromptVersions, useCreatePromptVersion, useRestorePromptVersion, PromptVersion } from "@/hooks/usePromptVersions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { StagePromptsEditor } from "./StagePromptsEditor";

// 获取同步状态
type SyncStatus = 'synced' | 'modified' | 'pending' | 'empty';
const getSyncStatus = (template: CoachTemplate, versions: PromptVersion[]): { status: SyncStatus; icon: string; label: string; color: string } => {
  if (!template.system_prompt) return { status: 'empty', icon: '🔴', label: '未配置', color: 'text-destructive' };
  if (versions.length === 0) return { status: 'pending', icon: '🟡', label: '待保存', color: 'text-amber-500' };
  const latestVersion = versions[0];
  const isInSync = latestVersion.system_prompt === template.system_prompt;
  return isInSync 
    ? { status: 'synced', icon: '🟢', label: '已同步', color: 'text-emerald-500' }
    : { status: 'modified', icon: '🟠', label: '有修改', color: 'text-orange-500' };
};

interface CoachFeatureMatrixProps {
  templates: CoachTemplate[];
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
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

export function CoachFeatureMatrix({ templates, onMoveUp, onMoveDown }: CoachFeatureMatrixProps) {
  const updateTemplate = useUpdateCoachTemplate();
  const createPromptVersion = useCreatePromptVersion();
  const restorePromptVersion = useRestorePromptVersion();
  
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<{
    template: CoachTemplate;
    isEditing: boolean;
    editedPrompt: string;
    changeNote: string;
    editedStagePrompts: StagePrompts | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStagePrompts, setIsSavingStagePrompts] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<PromptVersion | null>(null);

  // Fetch versions for selected template
  const { data: versions = [], isLoading: isLoadingVersions } = usePromptVersions(selectedPrompt?.template.id);
  
  // Fetch all versions for all templates to show sync status
  const { data: allVersions = [] } = useQuery({
    queryKey: ['all-prompt-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_prompt_versions')
        .select('*')
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as PromptVersion[];
    },
  });
  
  // Group versions by template
  const versionsByTemplate = useMemo(() => {
    const map = new Map<string, PromptVersion[]>();
    allVersions.forEach(v => {
      const existing = map.get(v.coach_template_id) || [];
      existing.push(v);
      map.set(v.coach_template_id, existing);
    });
    return map;
  }, [allVersions]);
  
  // Get sync status for each template
  const templateSyncStatus = useMemo(() => {
    const statuses = new Map<string, ReturnType<typeof getSyncStatus>>();
    templates.forEach(t => {
      const versions = versionsByTemplate.get(t.id) || [];
      statuses.set(t.id, getSyncStatus(t, versions));
    });
    return statuses;
  }, [templates, versionsByTemplate]);
  
  // Check if any templates need saving
  const templatesNeedingSave = useMemo(() => {
    return templates.filter(t => {
      const status = templateSyncStatus.get(t.id);
      return status?.status === 'pending' || status?.status === 'modified';
    });
  }, [templates, templateSyncStatus]);
  
  // Batch save all modified/pending prompts
  const handleSaveAllVersions = async () => {
    if (templatesNeedingSave.length === 0) {
      toast.info('所有 Prompt 已同步');
      return;
    }
    
    setIsSavingAll(true);
    try {
      for (const template of templatesNeedingSave) {
        if (template.system_prompt) {
          await createPromptVersion.mutateAsync({
            coachTemplateId: template.id,
            systemPrompt: template.system_prompt,
            changeNote: '批量同步版本',
          });
        }
      }
      toast.success(`已保存 ${templatesNeedingSave.length} 个教练的版本`);
    } catch (error) {
      toast.error('批量保存失败');
    } finally {
      setIsSavingAll(false);
    }
  };

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
      editedPrompt: template.system_prompt || '',
      changeNote: '',
      editedStagePrompts: template.stage_prompts || null
    });
    setViewingVersion(null);
  };

  const handleSaveStagePrompts = async () => {
    if (!selectedPrompt) return;
    setIsSavingStagePrompts(true);
    try {
      await updateTemplate.mutateAsync({
        id: selectedPrompt.template.id,
        data: { stage_prompts: selectedPrompt.editedStagePrompts as any }
      });
      setSelectedPrompt(prev => prev ? { 
        ...prev, 
        template: { ...prev.template, stage_prompts: prev.editedStagePrompts as StagePrompts }
      } : null);
      toast.success('阶段提示词已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSavingStagePrompts(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    setIsSaving(true);
    try {
      // Save to coach_templates
      await updateTemplate.mutateAsync({
        id: selectedPrompt.template.id,
        data: { system_prompt: selectedPrompt.editedPrompt }
      });
      
      // Create version record
      await createPromptVersion.mutateAsync({
        coachTemplateId: selectedPrompt.template.id,
        systemPrompt: selectedPrompt.editedPrompt,
        changeNote: selectedPrompt.changeNote || undefined,
      });
      
      setSelectedPrompt(prev => prev ? { 
        ...prev, 
        isEditing: false,
        changeNote: '',
        template: { ...prev.template, system_prompt: prev.editedPrompt }
      } : null);
      toast.success('Prompt 已保存并记录版本');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!selectedPrompt) return;
    
    await restorePromptVersion.mutateAsync({
      coachTemplateId: selectedPrompt.template.id,
      versionId: String(version.id),
      versionNumber: version.version_number,
      systemPrompt: version.system_prompt,
      stagePrompts: version.stage_prompts,
    });
    
    setSelectedPrompt(prev => prev ? {
      ...prev,
      editedPrompt: version.system_prompt,
      template: { ...prev.template, system_prompt: version.system_prompt }
    } : null);
    setViewingVersion(null);
  };

  const handleCopyPrompt = () => {
    const textToCopy = viewingVersion?.system_prompt || selectedPrompt?.editedPrompt;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success('已复制到剪贴板');
    }
  };

  const getFeatureValue = (template: CoachTemplate, featureKey: string): boolean => {
    return (template as any)[featureKey] ?? false;
  };

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
              {templates.map((template, index) => (
                <TableHead key={template.id} className="text-center min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    {/* Sorting buttons */}
                    {(onMoveUp || onMoveDown) && (
                      <div className="flex gap-1 mb-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onMoveUp?.(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onMoveDown?.(index)}
                          disabled={index === templates.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 text-xs px-2 ${template.system_prompt ? 'text-primary hover:text-primary' : 'text-muted-foreground'}`}
                            onClick={() => handleOpenPrompt(template)}
                          >
                            <Bot className="h-3 w-3 mr-1" />
                            Prompt
                            <span className="ml-1">{templateSyncStatus.get(template.id)?.icon}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{templateSyncStatus.get(template.id)?.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {featureGroups.map((group, groupIndex) => (
              <Fragment key={`group-${groupIndex}`}>
                <TableRow className="bg-muted/30">
                  <TableCell 
                    colSpan={templates.length + 1} 
                    className="font-medium text-sm py-2 sticky left-0"
                  >
                    {group.label}
                  </TableCell>
                </TableRow>
                
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
              </Fragment>
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
          <span className="border-l pl-4 flex items-center gap-2">
            <span>🟢 已同步</span>
            <span>🟠 有修改</span>
            <span>🟡 待保存</span>
            <span>🔴 未配置</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>共 {templates.length} 个教练 · {featureGroups.flatMap(g => g.features).length} 项功能</span>
          {templatesNeedingSave.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={handleSaveAllVersions}
              disabled={isSavingAll}
            >
              {isSavingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              保存全部版本 ({templatesNeedingSave.length})
            </Button>
          )}
        </div>
      </div>

      {/* Prompt Dialog with Version History */}
      <Dialog open={!!selectedPrompt} onOpenChange={(open) => !open && setSelectedPrompt(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedPrompt?.template.emoji}</span>
              <span>{selectedPrompt?.template.title} - AI Prompt</span>
            </DialogTitle>
            {/* 显示当前版本号和更新时间 */}
            {versions.length > 0 && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className="font-mono">
                  当前版本: v{versions[0].version_number}
                </Badge>
                <span>
                  最后更新: {format(new Date(versions[0].created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
                {versions[0].change_note && (
                  <span className="text-xs truncate max-w-[200px]" title={versions[0].change_note}>
                    ({versions[0].change_note})
                  </span>
                )}
              </div>
            )}
          </DialogHeader>
          
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">基础 Prompt</TabsTrigger>
              <TabsTrigger value="stages" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                阶段提示词
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                历史版本 ({versions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4 mt-4">
              {selectedPrompt?.template.system_prompt || selectedPrompt?.isEditing ? (
                <>
                  {selectedPrompt?.isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={selectedPrompt.editedPrompt}
                        onChange={(e) => setSelectedPrompt(prev => prev ? { ...prev, editedPrompt: e.target.value } : null)}
                        className="min-h-[350px] font-mono text-sm"
                        placeholder="输入 AI Prompt..."
                      />
                      <div>
                        <Input
                          value={selectedPrompt.changeNote}
                          onChange={(e) => setSelectedPrompt(prev => prev ? { ...prev, changeNote: e.target.value } : null)}
                          placeholder="变更说明（可选）例如：优化了共情语气"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[380px] rounded-md border p-4">
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
                              editedPrompt: prev.template.system_prompt || '',
                              changeNote: ''
                            } : null)}
                          >
                            取消
                          </Button>
                          <Button size="sm" onClick={handleSavePrompt} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            保存并记录版本
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
            </TabsContent>
            
            <TabsContent value="stages" className="mt-4">
              <StagePromptsEditor
                stagePrompts={selectedPrompt?.editedStagePrompts}
                onChange={(newStagePrompts) => setSelectedPrompt(prev => prev ? { ...prev, editedStagePrompts: newStagePrompts } : null)}
                onSave={handleSaveStagePrompts}
                isSaving={isSavingStagePrompts}
              />
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              {isLoadingVersions ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">暂无历史版本</p>
                  <p className="text-xs mt-1">保存 Prompt 后将自动记录版本</p>
                </div>
              ) : viewingVersion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewingVersion(null)}>
                        ← 返回列表
                      </Button>
                      <Badge variant="outline">v{viewingVersion.version_number}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(viewingVersion.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button size="sm" onClick={() => handleRestoreVersion(viewingVersion)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        恢复此版本
                      </Button>
                    </div>
                  </div>
                  {viewingVersion.change_note && (
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                      变更说明：{viewingVersion.change_note}
                    </div>
                  )}
                  <ScrollArea className="h-[320px] rounded-md border p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {viewingVersion.system_prompt}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2">
                    {versions.map(version => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">v{version.version_number}</Badge>
                          <div>
                            <div className="text-sm">
                              {format(new Date(version.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </div>
                            {version.change_note && (
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {version.change_note}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setViewingVersion(version)}>
                            查看
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRestoreVersion(version)}>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            恢复
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
