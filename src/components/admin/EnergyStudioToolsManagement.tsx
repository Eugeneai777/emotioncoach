import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Tool {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  detailed_description: string | null;
  icon_name: string;
  category: string;
  gradient: string;
  usage_scenarios: string[];
  is_available: boolean;
  is_system: boolean;
  display_order: number;
}

const categoryLabels = {
  emotion: "情绪工具",
  exploration: "探索工具",
  management: "管理工具"
};

const iconOptions = [
  'Wind', 'Timer', 'HeartPulse', 'Sparkles', 'Target', 'Eye', 'ImageIcon', 'BookHeart',
  'Calendar', 'Battery', 'Moon', 'Dumbbell', 'DollarSign', 'Clock', 'Heart', 'Megaphone',
  'Plus', 'Star', 'Zap', 'Coffee', 'Music', 'Palette', 'Compass', 'Brain', 'Sun'
];

export function EnergyStudioToolsManagement() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    tool_id: "",
    title: "",
    description: "",
    detailed_description: "",
    icon_name: "Sparkles",
    category: "emotion",
    gradient: "from-primary to-primary",
    usage_scenarios: [""],
    is_available: true,
    display_order: 0
  });

  const { data: tools, isLoading } = useQuery({
    queryKey: ['energy-studio-tools-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_studio_tools')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as Tool[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('energy_studio_tools')
        .insert({
          ...data,
          usage_scenarios: data.usage_scenarios.filter(s => s.trim())
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-studio-tools-admin'] });
      toast.success("工具已添加");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "添加失败");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tool> }) => {
      const { error } = await supabase
        .from('energy_studio_tools')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-studio-tools-admin'] });
      toast.success("工具已更新");
      setIsEditDialogOpen(false);
      setEditingTool(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "更新失败");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('energy_studio_tools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-studio-tools-admin'] });
      toast.success("工具已删除");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "删除失败");
    }
  });

  const toggleAvailability = async (tool: Tool) => {
    updateMutation.mutate({
      id: tool.id,
      data: { is_available: !tool.is_available }
    });
  };

  const moveOrder = async (tool: Tool, direction: 'up' | 'down') => {
    if (!tools) return;
    
    const currentIndex = tools.findIndex(t => t.id === tool.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= tools.length) return;
    
    const targetTool = tools[targetIndex];
    
    await Promise.all([
      updateMutation.mutateAsync({
        id: tool.id,
        data: { display_order: targetTool.display_order }
      }),
      updateMutation.mutateAsync({
        id: targetTool.id,
        data: { display_order: tool.display_order }
      })
    ]);
  };

  const resetForm = () => {
    setFormData({
      tool_id: "",
      title: "",
      description: "",
      detailed_description: "",
      icon_name: "Sparkles",
      category: "emotion",
      gradient: "from-primary to-primary",
      usage_scenarios: [""],
      is_available: true,
      display_order: tools?.length || 0
    });
  };

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      tool_id: tool.tool_id,
      title: tool.title,
      description: tool.description,
      detailed_description: tool.detailed_description || "",
      icon_name: tool.icon_name,
      category: tool.category,
      gradient: tool.gradient,
      usage_scenarios: tool.usage_scenarios.length > 0 ? tool.usage_scenarios : [""],
      is_available: tool.is_available,
      display_order: tool.display_order
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingTool) {
      updateMutation.mutate({
        id: editingTool.id,
        data: {
          ...formData,
          usage_scenarios: formData.usage_scenarios.filter(s => s.trim())
        }
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">生活馆工具管理</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              添加工具
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加新工具</DialogTitle>
            </DialogHeader>
            <ToolForm formData={formData} setFormData={setFormData} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>添加</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>顺序</TableHead>
            <TableHead>工具ID</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools?.map((tool, index) => (
            <TableRow key={tool.id}>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(tool, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(tool, 'down')}
                    disabled={index === tools.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{tool.tool_id}</TableCell>
              <TableCell>{tool.title}</TableCell>
              <TableCell>{categoryLabels[tool.category as keyof typeof categoryLabels]}</TableCell>
              <TableCell>{tool.icon_name}</TableCell>
              <TableCell>
                <Switch
                  checked={tool.is_available}
                  onCheckedChange={() => toggleAvailability(tool)}
                />
              </TableCell>
              <TableCell>
                {tool.is_system && (
                  <Badge variant="secondary">系统内置</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(tool)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(tool)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑工具</DialogTitle>
          </DialogHeader>
          <ToolForm formData={formData} setFormData={setFormData} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteTarget?.is_system && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.is_system ? (
                <>
                  <p className="text-yellow-600 font-medium mb-2">
                    ⚠️ 这是一个系统内置工具！
                  </p>
                  <p>
                    删除系统内置工具"{deleteTarget?.title}"可能导致应用功能异常。
                    如果只是想临时隐藏，建议使用"启用/禁用"开关。
                  </p>
                </>
              ) : (
                <p>确定要删除工具"{deleteTarget?.title}"吗？此操作不可恢复。</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ToolForm({ formData, setFormData }: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const addScenario = () => {
    setFormData({
      ...formData,
      usage_scenarios: [...formData.usage_scenarios, ""]
    });
  };

  const updateScenario = (index: number, value: string) => {
    const newScenarios = [...formData.usage_scenarios];
    newScenarios[index] = value;
    setFormData({ ...formData, usage_scenarios: newScenarios });
  };

  const removeScenario = (index: number) => {
    setFormData({
      ...formData,
      usage_scenarios: formData.usage_scenarios.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>工具ID *</Label>
        <Input
          value={formData.tool_id}
          onChange={(e) => setFormData({ ...formData, tool_id: e.target.value })}
          placeholder="如: breathing"
        />
      </div>

      <div>
        <Label>工具名称 *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="如: 呼吸练习"
        />
      </div>

      <div>
        <Label>简短描述 *</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="一句话描述"
        />
      </div>

      <div>
        <Label>详细介绍</Label>
        <Textarea
          value={formData.detailed_description}
          onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
          placeholder="详细的工具介绍"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>分类 *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emotion">情绪工具</SelectItem>
              <SelectItem value="exploration">探索工具</SelectItem>
              <SelectItem value="management">管理工具</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>图标</Label>
          <Select
            value={formData.icon_name}
            onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map(icon => (
                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>渐变样式</Label>
        <Input
          value={formData.gradient}
          onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
          placeholder="如: from-blue-500 to-cyan-500"
        />
      </div>

      <div>
        <Label>使用场景</Label>
        {formData.usage_scenarios.map((scenario: string, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={scenario}
              onChange={(e) => updateScenario(index, e.target.value)}
              placeholder="如: 感到焦虑或压力时"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeScenario(index)}
              disabled={formData.usage_scenarios.length === 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addScenario}>
          <Plus className="w-4 h-4 mr-2" />
          添加场景
        </Button>
      </div>
    </div>
  );
}