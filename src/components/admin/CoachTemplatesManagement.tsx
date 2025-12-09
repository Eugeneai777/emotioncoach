import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, BookOpen, Sparkles, ExternalLink, Bell, Users, MessageSquare, Mic, Tent } from "lucide-react";
import { CoachStepsEditor } from "./CoachStepsEditor";
import { AICoachCreator } from "./AICoachCreator";
import {
  useCoachTemplates,
  useCreateCoachTemplate,
  useUpdateCoachTemplate,
  useDeleteCoachTemplate,
  useToggleCoachTemplate,
  useUpdateCoachOrder,
  CoachTemplate,
  CoachStep
} from "@/hooks/useCoachTemplates";

const gradientOptions = [
  { value: 'from-primary via-emerald-500 to-teal-500', label: '绿色渐变', preview: 'bg-gradient-to-r from-primary via-emerald-500 to-teal-500' },
  { value: 'from-orange-500 to-amber-500', label: '橙色渐变', preview: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { value: 'from-blue-500 to-indigo-500', label: '蓝色渐变', preview: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  { value: 'from-purple-500 to-pink-500', label: '紫色渐变', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'from-rose-500 to-red-500', label: '红色渐变', preview: 'bg-gradient-to-r from-rose-500 to-red-500' },
];

const colorOptions = ['green', 'blue', 'purple', 'orange', 'pink', 'red'];

// Feature badge component
const FeatureBadge = ({ enabled, icon: Icon, label }: { enabled: boolean; icon: any; label: string }) => (
  <Badge variant={enabled ? "default" : "outline"} className={`gap-1 ${enabled ? '' : 'opacity-50'}`}>
    <Icon className="h-3 w-3" />
    {label}
  </Badge>
);

export function CoachTemplatesManagement() {
  const { data: templates, isLoading } = useCoachTemplates();
  const createTemplate = useCreateCoachTemplate();
  const updateTemplate = useUpdateCoachTemplate();
  const deleteTemplate = useDeleteCoachTemplate();
  const toggleTemplate = useToggleCoachTemplate();
  const updateOrder = useUpdateCoachOrder();

  const [editingTemplate, setEditingTemplate] = useState<Partial<CoachTemplate> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStepsEditorOpen, setIsStepsEditorOpen] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<CoachStep[]>([]);
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);

  const handleCreate = () => {
    setEditingTemplate({
      coach_key: '',
      emoji: '💚',
      title: '',
      subtitle: '',
      description: '',
      gradient: gradientOptions[0].value,
      primary_color: 'green',
      steps: [],
      steps_title: '四部曲',
      steps_emoji: '🌱',
      page_route: '/',
      history_route: '/history',
      history_label: '我的日记',
      placeholder: '分享你的想法...',
      enable_voice_control: true,
      enable_training_camp: false,
      enable_notifications: false,
      enable_community: false,
      enable_scenarios: false,
      is_active: true,
      is_system: false,
      display_order: (templates?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: CoachTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    if (editingTemplate.id) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        data: editingTemplate
      });
    } else {
      await createTemplate.mutateAsync(editingTemplate);
    }
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      alert('系统内置教练不能删除');
      return;
    }
    if (confirm('确定要删除这个教练模板吗？')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await toggleTemplate.mutateAsync({ id, is_active: !currentState });
  };

  const handleMoveUp = async (index: number) => {
    if (!templates || index === 0) return;
    const newTemplates = [...templates];
    [newTemplates[index - 1], newTemplates[index]] = [newTemplates[index], newTemplates[index - 1]];
    const updates = newTemplates.map((t, i) => ({ id: t.id, display_order: i + 1 }));
    await updateOrder.mutateAsync(updates);
  };

  const handleMoveDown = async (index: number) => {
    if (!templates || index === templates.length - 1) return;
    const newTemplates = [...templates];
    [newTemplates[index], newTemplates[index + 1]] = [newTemplates[index + 1], newTemplates[index]];
    const updates = newTemplates.map((t, i) => ({ id: t.id, display_order: i + 1 }));
    await updateOrder.mutateAsync(updates);
  };

  const handleEditSteps = () => {
    setCurrentSteps(editingTemplate?.steps || []);
    setIsStepsEditorOpen(true);
  };

  const handleSaveSteps = (steps: CoachStep[]) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, steps });
    }
  };

  const handleAITemplateCreated = (template: any) => {
    setEditingTemplate({
      coach_key: template.coach_key || '',
      emoji: template.emoji || '💚',
      title: template.title || '',
      subtitle: template.subtitle || '',
      description: template.description || '',
      primary_color: template.primary_color || 'green',
      gradient: template.gradient || gradientOptions[0].value,
      placeholder: template.placeholder || '分享你的想法...',
      history_label: template.history_label || '我的日记',
      history_route: `/coach/${template.coach_key}/history` || '/history',
      page_route: `/coach/${template.coach_key}` || '/',
      more_info_route: '',
      steps_emoji: template.steps?.[0]?.icon || '🌱',
      steps_title: '四部曲',
      steps: template.steps || [],
      edge_function_name: `${template.coach_key}-coach` || '',
      briefing_table_name: `${template.coach_key}_briefings` || '',
      enable_scenarios: false,
      enable_community: false,
      enable_notifications: false,
      enable_training_camp: false,
      enable_voice_control: true,
      is_active: true,
      is_system: false,
      display_order: (templates?.length || 0) + 1,
      system_prompt: template.system_prompt || '',
      briefing_tool_config: template.briefing_tool_config || {},
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (route: string) => {
    window.open(route, '_blank');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">加载中...</div>;
  }

  // Calculate feature statistics
  const stats = {
    total: templates?.length || 0,
    active: templates?.filter(t => t.is_active).length || 0,
    withTrainingCamp: templates?.filter(t => t.enable_training_camp).length || 0,
    withNotifications: templates?.filter(t => t.enable_notifications).length || 0,
    withCommunity: templates?.filter(t => t.enable_community).length || 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">教练模板管理</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAICreatorOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI智能创建
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            手动创建
          </Button>
        </div>
      </div>

      {/* Feature Statistics */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总教练数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">已启用</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.withTrainingCamp}</div>
              <div className="text-sm text-muted-foreground">有训练营</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.withNotifications}</div>
              <div className="text-sm text-muted-foreground">有通知</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.withCommunity}</div>
              <div className="text-sm text-muted-foreground">有社区</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {templates?.map((template, index) => (
          <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{template.emoji}</span>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.title}
                      {!template.is_active && <Badge variant="secondary">已禁用</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{template.subtitle}</p>
                  </div>
                  {template.is_system && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">系统内置</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => handleToggle(template.id, template.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === templates.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePreview(template.page_route)}
                    title="预览教练页面"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setCurrentSteps(template.steps as CoachStep[] || []);
                      setIsStepsEditorOpen(true);
                      setEditingTemplate(template);
                    }}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id, template.is_system)}
                    disabled={template.is_system}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2">
                <FeatureBadge enabled={template.enable_training_camp} icon={Tent} label="训练营" />
                <FeatureBadge enabled={template.enable_notifications} icon={Bell} label="通知" />
                <FeatureBadge enabled={template.enable_community} icon={Users} label="社区" />
                <FeatureBadge enabled={template.enable_scenarios} icon={MessageSquare} label="场景" />
                <FeatureBadge enabled={template.enable_voice_control} icon={Mic} label="语音" />
              </div>
              
              {/* Routes and Config */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">标识：</span>
                  <span className="font-mono">{template.coach_key}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">页面：</span>
                  <span className="font-mono text-blue-600">{template.page_route}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Edge Function：</span>
                  <span className="font-mono">{template.edge_function_name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">简报表：</span>
                  <span className="font-mono">{template.briefing_table_name || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? '编辑教练模板' : '新建教练模板'}</DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>教练标识 *</Label>
                  <Input
                    value={editingTemplate.coach_key}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, coach_key: e.target.value })}
                    placeholder="emotion"
                    disabled={!!editingTemplate.id}
                  />
                </div>
                <div>
                  <Label>Emoji *</Label>
                  <Input
                    value={editingTemplate.emoji}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, emoji: e.target.value })}
                    placeholder="💚"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>教练名称 *</Label>
                  <Input
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    placeholder="情绪觉醒教练"
                  />
                </div>
                <div>
                  <Label>副标题</Label>
                  <Input
                    value={editingTemplate.subtitle || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subtitle: e.target.value })}
                    placeholder="日常情绪觉察与记录"
                  />
                </div>
              </div>

              <div>
                <Label>描述</Label>
                <Textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="通过对话梳理情绪，生成情绪简报"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>渐变色</Label>
                  <Select
                    value={editingTemplate.gradient}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, gradient: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gradientOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-4 rounded ${opt.preview}`}></div>
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>主题色</Label>
                  <Select
                    value={editingTemplate.primary_color}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, primary_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>四部曲配置</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={editingTemplate.steps_emoji || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, steps_emoji: e.target.value })}
                    placeholder="🌱"
                    className="w-20"
                  />
                  <Input
                    value={editingTemplate.steps_title || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, steps_title: e.target.value })}
                    placeholder="四部曲"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleEditSteps}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    编辑步骤 ({editingTemplate.steps?.length || 0})
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>页面路由 *</Label>
                  <Input
                    value={editingTemplate.page_route}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, page_route: e.target.value })}
                    placeholder="/emotion-coach"
                  />
                </div>
                <div>
                  <Label>历史路由 *</Label>
                  <Input
                    value={editingTemplate.history_route}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, history_route: e.target.value })}
                    placeholder="/emotion-history"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>历史按钮文案</Label>
                  <Input
                    value={editingTemplate.history_label || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, history_label: e.target.value })}
                    placeholder="我的日记"
                  />
                </div>
                <div>
                  <Label>输入框占位文案</Label>
                  <Input
                    value={editingTemplate.placeholder || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, placeholder: e.target.value })}
                    placeholder="分享你的想法..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Edge Function 名称</Label>
                  <Input
                    value={editingTemplate.edge_function_name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, edge_function_name: e.target.value })}
                    placeholder="chat"
                  />
                </div>
                <div>
                  <Label>简报表名</Label>
                  <Input
                    value={editingTemplate.briefing_table_name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, briefing_table_name: e.target.value })}
                    placeholder="briefings"
                  />
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <Label>功能开关</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">语音控制</span>
                    <Switch
                      checked={editingTemplate.enable_voice_control}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enable_voice_control: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">训练营</span>
                    <Switch
                      checked={editingTemplate.enable_training_camp}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enable_training_camp: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">通知</span>
                    <Switch
                      checked={editingTemplate.enable_notifications}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enable_notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">社区</span>
                    <Switch
                      checked={editingTemplate.enable_community}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enable_community: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">场景库</span>
                    <Switch
                      checked={editingTemplate.enable_scenarios}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enable_scenarios: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CoachStepsEditor
        open={isStepsEditorOpen}
        onOpenChange={setIsStepsEditorOpen}
        steps={currentSteps}
        onSave={handleSaveSteps}
      />

      <AICoachCreator
        open={isAICreatorOpen}
        onOpenChange={setIsAICreatorOpen}
        onTemplateCreated={handleAITemplateCreated}
      />
    </div>
  );
}