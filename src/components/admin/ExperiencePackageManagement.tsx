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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AssessmentSyncChecker } from "./AssessmentSyncChecker";

interface ExperienceItem {
  id: string;
  item_key: string;
  package_key: string;
  name: string;
  value: string | null;
  icon: string | null;
  description: string | null;
  features: string[] | null;
  color_theme: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface PackageOption {
  package_key: string;
  package_name: string;
  product_line: string;
  price: number | null;
  description: string | null;
}

interface FormData {
  package_key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  features: string[];
  color_theme: string;
  display_order: number;
  is_active: boolean;
}

const COLOR_THEME_OPTIONS = [
  { value: "blue", label: "蓝色" },
  { value: "green", label: "绿色" },
  { value: "amber", label: "琥珀色" },
  { value: "purple", label: "紫色" },
];

const COLOR_BADGE_MAP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  purple: "bg-purple-100 text-purple-800",
};

const INITIAL_FORM: FormData = {
  package_key: "",
  name: "",
  value: "",
  icon: "",
  description: "",
  features: [""],
  color_theme: "blue",
  display_order: 0,
  is_active: true,
};

export function ExperiencePackageManagement() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceItem | null>(null);
  const [editingItem, setEditingItem] = useState<ExperienceItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM });
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Fetch experience items
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-experience-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_experience_items" as any)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data || []) as unknown as ExperienceItem[];
    },
  });

  // Fetch available packages for selection
  const { data: packages } = useQuery({
    queryKey: ["admin-packages-for-experience"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("package_key, package_name, product_line, price, description")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data || []) as PackageOption[];
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-experience-items"] });
    queryClient.invalidateQueries({ queryKey: ["experience-package-items"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from("partner_experience_items" as any)
        .insert({
          item_key: data.package_key,
          package_key: data.package_key,
          name: data.name,
          value: data.value,
          icon: data.icon,
          description: data.description,
          features: data.features.filter((f) => f.trim()),
          color_theme: data.color_theme,
          display_order: data.display_order,
          is_active: data.is_active,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("体验包已添加");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "添加失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("partner_experience_items" as any)
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("体验包已更新");
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "更新失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partner_experience_items" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("体验包已删除");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "删除失败");
    },
  });

  const toggleActive = (item: ExperienceItem) => {
    updateMutation.mutate({
      id: item.id,
      data: { is_active: !item.is_active },
    });
  };

  const moveOrder = async (item: ExperienceItem, direction: "up" | "down") => {
    if (!items) return;
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    await Promise.all([
      updateMutation.mutateAsync({
        id: item.id,
        data: { display_order: targetItem.display_order ?? targetIndex },
      }),
      updateMutation.mutateAsync({
        id: targetItem.id,
        data: { display_order: item.display_order ?? currentIndex },
      }),
    ]);
  };

  const resetForm = () => {
    setFormData({
      ...INITIAL_FORM,
      display_order: items?.length || 0,
    });
  };

  // AI auto-generate config for a selected package
  const generateAiConfig = async (pkg: PackageOption) => {
    setIsAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-experience-config', {
        body: {
          package_name: pkg.package_name,
          description: pkg.description || '',
          price: pkg.price,
        },
      });

      if (error) throw error;

      if (data && typeof data === 'object' && !data.error) {
        setFormData((prev) => ({
          ...prev,
          icon: data.icon || prev.icon,
          value: data.value || prev.value,
          description: data.description || prev.description,
          features: Array.isArray(data.features) && data.features.length > 0
            ? data.features
            : prev.features,
          color_theme: data.color_theme || prev.color_theme,
        }));
        toast.success("AI 配置已生成，可修改后保存");
      } else {
        throw new Error(data?.error || 'AI 返回异常');
      }
    } catch (err: any) {
      console.error('AI generate error:', err);
      toast.error(err.message || "AI 生成失败，请手动填写");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // When selecting a package, auto-fill name and trigger AI config
  const handlePackageSelect = (packageKey: string) => {
    const pkg = packages?.find((p) => p.package_key === packageKey);
    if (pkg) {
      setFormData((prev) => ({
        ...prev,
        package_key: pkg.package_key,
        name: pkg.package_name,
        value: "",
        icon: "",
        description: "",
        features: [""],
        color_theme: "blue",
      }));
      // Trigger AI auto-config
      generateAiConfig(pkg);
    } else {
      setFormData((prev) => ({ ...prev, package_key: packageKey }));
    }
  };

  // Regenerate AI config for current package
  const handleRegenerate = () => {
    const pkg = packages?.find((p) => p.package_key === formData.package_key);
    if (pkg) {
      generateAiConfig(pkg);
    }
  };

  const openEditDialog = (item: ExperienceItem) => {
    setEditingItem(item);
    setFormData({
      package_key: item.package_key,
      name: item.name,
      value: item.value || "",
      icon: item.icon || "",
      description: item.description || "",
      features: item.features && item.features.length > 0 ? item.features : [""],
      color_theme: item.color_theme || "blue",
      display_order: item.display_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.package_key || !formData.name) {
      toast.error("请选择关联产品并填写名称");
      return;
    }
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        data: {
          package_key: formData.package_key,
          item_key: formData.package_key,
          name: formData.name,
          value: formData.value,
          icon: formData.icon,
          description: formData.description,
          features: formData.features.filter((f) => f.trim()),
          color_theme: formData.color_theme,
          display_order: formData.display_order,
          is_active: formData.is_active,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Get package name for display
  const getPackageName = (packageKey: string) => {
    return packages?.find((p) => p.package_key === packageKey)?.package_name || packageKey;
  };

  // Filter out packages already used (except the one being edited)
  const availablePackages = packages?.filter(
    (pkg) =>
      !items?.some(
        (item) =>
          item.package_key === pkg.package_key &&
          item.id !== editingItem?.id
      )
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  return (
    <Card className="p-6">
      <AssessmentSyncChecker onSynced={invalidateQueries} />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">体验包管理</h2>
          <p className="text-sm text-muted-foreground mt-1">
            从已有产品（工具/测评）中选择，AI 自动生成配置，确认后保存
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              添加体验项
            </Button>
          </DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>添加体验项</DialogTitle>
            </DialogHeader>
            <ExperienceItemForm
              formData={formData}
              setFormData={setFormData}
              packages={availablePackages || []}
              onPackageSelect={handlePackageSelect}
              onRegenerate={handleRegenerate}
              isAiGenerating={isAiGenerating}
              isEditing={false}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || isAiGenerating}>
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>排序</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>关联产品</TableHead>
            <TableHead>价值</TableHead>
            <TableHead>颜色主题</TableHead>
            <TableHead>启用状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(item, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(item, "down")}
                    disabled={index === (items?.length ?? 0) - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-xl">{item.icon || "—"}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <div>
                  <span className="text-sm">{getPackageName(item.package_key)}</span>
                  <span className="block text-xs text-muted-foreground font-mono">
                    {item.package_key}
                  </span>
                </div>
              </TableCell>
              <TableCell>{item.value || "—"}</TableCell>
              <TableCell>
                <Badge
                  className={
                    COLOR_BADGE_MAP[item.color_theme || "blue"] ||
                    COLOR_BADGE_MAP.blue
                  }
                >
                  {COLOR_THEME_OPTIONS.find((o) => o.value === item.color_theme)
                    ?.label || item.color_theme}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={item.is_active ?? true}
                  onCheckedChange={() => toggleActive(item)}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!items || items.length === 0) && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                暂无体验包数据，点击"添加体验项"从已有产品中选择
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>编辑体验包</DialogTitle>
          </DialogHeader>
          <ExperienceItemForm
            formData={formData}
            setFormData={setFormData}
            packages={availablePackages || []}
            onPackageSelect={handlePackageSelect}
            onRegenerate={handleRegenerate}
            isAiGenerating={isAiGenerating}
            isEditing={true}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending || isAiGenerating}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除体验包「{deleteTarget?.name}」吗？此操作不可恢复。
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

function ExperienceItemForm({
  formData,
  setFormData,
  packages,
  onPackageSelect,
  onRegenerate,
  isAiGenerating,
  isEditing,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  packages: PackageOption[];
  onPackageSelect: (key: string) => void;
  onRegenerate: () => void;
  isAiGenerating: boolean;
  isEditing: boolean;
}) {
  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  // Group packages by product_line
  const groupedPackages = packages.reduce<Record<string, PackageOption[]>>((acc, pkg) => {
    const line = pkg.product_line || "other";
    if (!acc[line]) acc[line] = [];
    acc[line].push(pkg);
    return acc;
  }, {});

  const productLineLabels: Record<string, string> = {
    youjin: "有劲产品",
    bloom: "绽放产品",
    other: "其他",
  };

  return (
    <div className="space-y-4">
      {/* Package Selection */}
      <div>
        <Label>选择关联产品 *</Label>
        <Select
          value={formData.package_key}
          onValueChange={onPackageSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择一个产品（工具/测评）" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedPackages).map(([line, pkgs]) => (
              <div key={line}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {productLineLabels[line] || line}
                </div>
                {pkgs.map((pkg) => (
                  <SelectItem key={pkg.package_key} value={pkg.package_key}>
                    <span>{pkg.package_name}</span>
                    {pkg.price != null && (
                      <span className="ml-2 text-muted-foreground">¥{pkg.price}</span>
                    )}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {formData.package_key && (
          <p className="text-xs text-muted-foreground mt-1">
            关联套餐: <code className="bg-muted px-1 rounded">{formData.package_key}</code>
          </p>
        )}
      </div>

      {/* AI Loading State */}
      {isAiGenerating && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">AI 配置生成中...</span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )}

      {/* Regenerate Button - show when package is selected and not generating */}
      {formData.package_key && !isAiGenerating && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新生成 AI 配置
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>显示名称 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="体验包显示的名称"
            disabled={isAiGenerating}
          />
        </div>
        <div>
          <Label>价值展示</Label>
          <Input
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="如: 50点、1次"
            disabled={isAiGenerating}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>图标 (emoji)</Label>
          <Input
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="如: 🎯"
            disabled={isAiGenerating}
          />
        </div>
        <div>
          <Label>颜色主题</Label>
          <Select
            value={formData.color_theme}
            onValueChange={(value) => setFormData({ ...formData, color_theme: value })}
            disabled={isAiGenerating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="体验包简要描述"
          rows={2}
          disabled={isAiGenerating}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>排序</Label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>启用</Label>
        </div>
      </div>

      <div>
        <Label>功能特性</Label>
        {formData.features.map((feature, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={feature}
              onChange={(e) => updateFeature(index, e.target.value)}
              placeholder="如: 10次AI教练对话"
              disabled={isAiGenerating}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFeature(index)}
              disabled={formData.features.length === 1 || isAiGenerating}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addFeature} disabled={isAiGenerating}>
          <Plus className="w-4 h-4 mr-2" />
          添加特性
        </Button>
      </div>
    </div>
  );
}
