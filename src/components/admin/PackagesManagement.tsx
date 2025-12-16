import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Trash2, Settings, Users, Tent, Wrench, BookOpen, Sparkles, ChevronDown, ChevronRight, Home, CircleDot, Brain, Mic, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PackageFeatureSettingsDialog } from "./PackageFeatureSettingsDialog";
import FreeTrialSettings from "./FreeTrialSettings";

import { Database } from "@/integrations/supabase/types";

type Package = Database["public"]["Tables"]["packages"]["Row"];

interface FeatureItem {
  id: string;
  category: string;
  sub_category: string | null;
  item_key: string;
  item_name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface PackageFeatureSetting {
  id: string;
  package_id: string;
  feature_id: string;
  is_enabled: boolean;
  cost_per_use: number;
  free_quota: number;
  free_quota_period: string;
  max_duration_minutes?: number | null;
}

const categoryConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  coach: { label: '教练', icon: Users, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  training_camp: { label: '训练营', icon: Tent, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  tool: { label: '工具', icon: Wrench, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  course: { label: '课程', icon: BookOpen, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
};

const subCategoryConfig: Record<string, { label: string; icon: typeof Home; color: string }> = {
  studio: { label: '有劲生活馆工具', icon: Home, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  emotion_button: { label: '情绪按钮', icon: CircleDot, color: 'bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200' },
  ai_analysis: { label: 'AI分析工具', icon: Brain, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200' },
  ai_generation: { label: 'AI生成工具', icon: Sparkles, color: 'bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-200' },
  ai_voice: { label: 'AI语音工具', icon: Mic, color: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200' },
};

export function PackagesManagement() {
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settingsPackageId, setSettingsPackageId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [editingSettings, setEditingSettings] = useState<Record<string, Partial<PackageFeatureSetting>>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({
    studio: true,
    emotion_button: true,
    ai_analysis: true,
    ai_generation: true,
    ai_voice: true,
  });

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("product_line", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Package[];
    },
  });

  // Fetch feature items
  const { data: featureItems = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ['feature-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_items')
        .select('*')
        .order('category')
        .order('display_order');
      if (error) throw error;
      return data as FeatureItem[];
    }
  });

  // Fetch package feature settings
  const { data: packageSettings = [] } = useQuery({
    queryKey: ['package-feature-settings', selectedPackage],
    queryFn: async () => {
      if (!selectedPackage) return [];
      const { data, error } = await supabase
        .from('package_feature_settings')
        .select('*')
        .eq('package_id', selectedPackage);
      if (error) throw error;
      return data as PackageFeatureSetting[];
    },
    enabled: !!selectedPackage
  });

  const createPackage = useMutation({
    mutationFn: async (pkg: Database["public"]["Tables"]["packages"]["Insert"]) => {
      const { error } = await supabase.from("packages").insert(pkg);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐创建成功");
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, ...pkg }: Database["public"]["Tables"]["packages"]["Update"] & { id: string }) => {
      const { error } = await supabase.from("packages").update(pkg).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐更新成功");
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐删除成功");
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // Update feature item mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeatureItem> }) => {
      const { error } = await supabase
        .from('feature_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-items'] });
      toast.success('功能更新成功');
    },
    onError: () => toast.error('更新失败'),
  });

  // Save package feature settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ featureId, settings }: { featureId: string; settings: Partial<PackageFeatureSetting> }) => {
      const existingSetting = packageSettings.find(s => s.feature_id === featureId);
      
      if (existingSetting) {
        const { error } = await supabase
          .from('package_feature_settings')
          .update(settings)
          .eq('id', existingSetting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('package_feature_settings')
          .insert({
            package_id: selectedPackage,
            feature_id: featureId,
            ...settings,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-feature-settings', selectedPackage] });
      toast.success('配置保存成功');
    },
    onError: () => toast.error('保存失败'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const packageData = {
      package_key: formData.get("package_key") as string,
      package_name: formData.get("package_name") as string,
      product_line: formData.get("product_line") as string,
      price: parseFloat(formData.get("price") as string) || null,
      original_price: parseFloat(formData.get("original_price") as string) || null,
      duration_days: parseInt(formData.get("duration_days") as string) || null,
      ai_quota: parseInt(formData.get("ai_quota") as string) || null,
      description: formData.get("description") as string,
      is_active: formData.get("is_active") === "on",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };

    if (editingPackage) {
      updatePackage.mutate({ id: editingPackage.id, ...packageData });
    } else {
      createPackage.mutate(packageData);
    }
  };

  const getSettingForFeature = (featureId: string): Partial<PackageFeatureSetting> => {
    const existing = packageSettings.find(s => s.feature_id === featureId);
    const editing = editingSettings[featureId];
    return {
      is_enabled: editing?.is_enabled ?? existing?.is_enabled ?? true,
      cost_per_use: editing?.cost_per_use ?? existing?.cost_per_use ?? 0,
      free_quota: editing?.free_quota ?? existing?.free_quota ?? 0,
      free_quota_period: editing?.free_quota_period ?? existing?.free_quota_period ?? 'per_use',
      max_duration_minutes: editing?.max_duration_minutes ?? existing?.max_duration_minutes ?? null,
    };
  };

  const updateEditingSetting = (featureId: string, field: string, value: any) => {
    setEditingSettings(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [field]: value,
      },
    }));
  };

  const handleSaveSetting = (featureId: string) => {
    const setting = getSettingForFeature(featureId);
    saveSettingsMutation.mutate({ featureId, settings: setting });
    setEditingSettings(prev => {
      const next = { ...prev };
      delete next[featureId];
      return next;
    });
  };

  const toggleSubCategory = (subCategory: string) => {
    setExpandedSubCategories(prev => ({
      ...prev,
      [subCategory]: !prev[subCategory],
    }));
  };

  // Group features by category
  const groupedFeatures = featureItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FeatureItem[]>);

  // Group tool features by sub_category
  const groupToolsBySubCategory = (tools: FeatureItem[]) => {
    const subCategoryOrder = ['studio', 'emotion_button', 'ai_analysis', 'ai_generation', 'ai_voice'];
    const grouped: Record<string, FeatureItem[]> = {};
    
    tools.forEach((tool) => {
      const subCat = tool.sub_category || 'studio';
      if (!grouped[subCat]) {
        grouped[subCat] = [];
      }
      grouped[subCat].push(tool);
    });
    
    return subCategoryOrder.map(key => ({ key, items: grouped[key] || [] })).filter(g => g.items.length > 0);
  };

  // Filter packages - only show youjin membership packages, exclude camps, trainings and partner
  const membershipPackages = packages?.filter((p) => 
    p.product_line === "youjin" &&
    !p.package_key?.includes("camp") && 
    !p.package_key?.includes("training") &&
    p.package_key !== "partner"
  ) || [];

  const renderFeatureRow = (item: FeatureItem, showDuration: boolean = false) => {
    const setting = getSettingForFeature(item.id);
    const hasChanges = !!editingSettings[item.id];
    
    return (
      <TableRow key={item.id}>
        <TableCell>
          <div className="font-medium">{item.item_name}</div>
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={setting.is_enabled}
            onCheckedChange={(checked) =>
              updateEditingSetting(item.id, 'is_enabled', checked)
            }
          />
        </TableCell>
        <TableCell className="text-center">
          <Input
            type="number"
            min="0"
            value={setting.cost_per_use}
            onChange={(e) =>
              updateEditingSetting(item.id, 'cost_per_use', parseInt(e.target.value) || 0)
            }
            className="w-20 text-center mx-auto h-8"
          />
        </TableCell>
        <TableCell className="text-center">
          <Input
            type="number"
            min="0"
            value={setting.free_quota}
            onChange={(e) =>
              updateEditingSetting(item.id, 'free_quota', parseInt(e.target.value) || 0)
            }
            className="w-20 text-center mx-auto h-8"
          />
        </TableCell>
        <TableCell className="text-center">
          <Select
            value={setting.free_quota_period}
            onValueChange={(value) =>
              updateEditingSetting(item.id, 'free_quota_period', value)
            }
          >
            <SelectTrigger className="w-24 mx-auto h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_use">每次使用</SelectItem>
              <SelectItem value="daily">每日</SelectItem>
              <SelectItem value="monthly">每月</SelectItem>
              <SelectItem value="lifetime">永久</SelectItem>
              <SelectItem value="one_time">一次性</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        {showDuration && (
          <TableCell className="text-center">
            <Select
              value={setting.max_duration_minutes?.toString() || 'unlimited'}
              onValueChange={(value) =>
                updateEditingSetting(item.id, 'max_duration_minutes', value === 'unlimited' ? null : parseInt(value))
              }
            >
              <SelectTrigger className="w-24 mx-auto h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">不限时</SelectItem>
                <SelectItem value="1">1分钟</SelectItem>
                <SelectItem value="3">3分钟</SelectItem>
                <SelectItem value="5">5分钟</SelectItem>
                <SelectItem value="10">10分钟</SelectItem>
                <SelectItem value="15">15分钟</SelectItem>
                <SelectItem value="20">20分钟</SelectItem>
                <SelectItem value="30">30分钟</SelectItem>
                <SelectItem value="60">60分钟</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
        )}
        <TableCell className="text-center">
          <Button
            size="sm"
            variant={hasChanges ? "default" : "ghost"}
            onClick={() => handleSaveSetting(item.id)}
            disabled={saveSettingsMutation.isPending}
          >
            <Save className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading || loadingFeatures) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">套餐权益管理</h2>
          <p className="text-muted-foreground">统一管理会员套餐、功能开关和扣费配置</p>
        </div>
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="mb-4">
          <TabsTrigger value="packages">套餐管理</TabsTrigger>
          <TabsTrigger value="features">功能开关</TabsTrigger>
          <TabsTrigger value="pricing">套餐扣费配置</TabsTrigger>
          <TabsTrigger value="free-trial">免费试用</TabsTrigger>
        </TabsList>

        {/* 套餐管理 Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>有劲会员套餐列表</CardTitle>
                <CardDescription>点击设置按钮配置套餐包含的功能权益</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPackage(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增套餐
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingPackage ? "编辑套餐" : "新增套餐"}</DialogTitle>
                      <DialogDescription>填写套餐信息</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="package_key">套餐KEY</Label>
                          <Input
                            id="package_key"
                            name="package_key"
                            defaultValue={editingPackage?.package_key}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="package_name">套餐名称</Label>
                          <Input
                            id="package_name"
                            name="package_name"
                            defaultValue={editingPackage?.package_name}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product_line">产品线</Label>
                        <Select name="product_line" defaultValue={editingPackage?.product_line || "youjin"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youjin">有劲</SelectItem>
                            <SelectItem value="bloom">绽放</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">价格</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={editingPackage?.price || ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="original_price">原价</Label>
                          <Input
                            id="original_price"
                            name="original_price"
                            type="number"
                            step="0.01"
                            defaultValue={editingPackage?.original_price || ""}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration_days">有效期(天)</Label>
                          <Input
                            id="duration_days"
                            name="duration_days"
                            type="number"
                            defaultValue={editingPackage?.duration_days || ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ai_quota">AI配额</Label>
                          <Input
                            id="ai_quota"
                            name="ai_quota"
                            type="number"
                            defaultValue={editingPackage?.ai_quota || ""}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">描述</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={editingPackage?.description || ""}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="display_order">显示顺序</Label>
                          <Input
                            id="display_order"
                            name="display_order"
                            type="number"
                            defaultValue={editingPackage?.display_order || 0}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            name="is_active"
                            defaultChecked={editingPackage?.is_active ?? true}
                          />
                          <Label htmlFor="is_active">启用</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit">{editingPackage ? "更新" : "创建"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>套餐名称</TableHead>
                    <TableHead>产品线</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>有效期</TableHead>
                    <TableHead>AI配额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membershipPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.package_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pkg.product_line === "youjin" ? "有劲" : "绽放"}
                        </Badge>
                      </TableCell>
                      <TableCell>¥{pkg.price || "-"}</TableCell>
                      <TableCell>{pkg.duration_days ? `${pkg.duration_days}天` : "-"}</TableCell>
                      <TableCell>{pkg.ai_quota === -1 ? "无限" : pkg.ai_quota || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.is_active ? "default" : "secondary"}>
                          {pkg.is_active ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPackage(pkg);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettingsPackageId(pkg.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("确定删除此套餐？")) {
                                deletePackage.mutate(pkg.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {membershipPackages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        暂无套餐，点击右上角新增
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 功能开关 Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                功能开关管理
              </CardTitle>
              <CardDescription>
                管理4大功能类别（教练/训练营/工具/课程）的启用状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(categoryConfig).map(([category, config]) => {
                  const CategoryIcon = config.icon;
                  const items = groupedFeatures[category] || [];
                  
                  // Special handling for tools with sub-categories
                  if (category === 'tool') {
                    const subGroups = groupToolsBySubCategory(items);
                    
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5" />
                          <h3 className="font-semibold">{config.label}</h3>
                          <Badge className={config.color}>{items.length}项</Badge>
                        </div>
                        
                        <div className="pl-4 space-y-3">
                          {subGroups.map(({ key, items: subItems }) => {
                            const subConfig = subCategoryConfig[key];
                            const SubIcon = subConfig?.icon || Wrench;
                            
                            return (
                              <div key={key} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <SubIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{subConfig?.label || key}</span>
                                  <Badge variant="outline" className="text-xs">{subItems.length}项</Badge>
                                </div>
                                <div className="grid gap-2 pl-6">
                                  {subItems.map(item => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{item.item_name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          <code className="text-xs bg-muted px-1 rounded">{item.item_key}</code>
                                          {item.description && ` · ${item.description}`}
                                        </div>
                                      </div>
                                      <Switch
                                        checked={item.is_active}
                                        onCheckedChange={(checked) =>
                                          updateFeatureMutation.mutate({ id: item.id, updates: { is_active: checked } })
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5" />
                        <h3 className="font-semibold">{config.label}</h3>
                        <Badge className={config.color}>{items.length}项</Badge>
                      </div>
                      
                      <div className="grid gap-2">
                        {items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.item_name}</div>
                              <div className="text-sm text-muted-foreground">
                                <code className="text-xs bg-muted px-1 rounded">{item.item_key}</code>
                                {item.description && ` · ${item.description}`}
                              </div>
                            </div>
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={(checked) =>
                                updateFeatureMutation.mutate({ id: item.id, updates: { is_active: checked } })
                              }
                            />
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-sm text-muted-foreground p-3">暂无功能项</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 套餐扣费配置 Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>套餐扣费配置</CardTitle>
              <CardDescription>
                为每个套餐配置功能的扣费点数和免费额度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">选择套餐:</span>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="选择套餐" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipPackages.map(pkg => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.package_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPackage ? (
                  <div className="space-y-6">
                    {Object.entries(categoryConfig).map(([category, config]) => {
                      const CategoryIcon = config.icon;
                      const items = groupedFeatures[category] || [];
                      
                      if (items.length === 0) return null;

                      // Special handling for tools with sub-categories
                      if (category === 'tool') {
                        const subGroups = groupToolsBySubCategory(items);
                        
                        return (
                          <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-5 w-5" />
                              <h3 className="font-semibold">{config.label}</h3>
                              <Badge className={config.color}>{items.length}项</Badge>
                            </div>
                            
                            <div className="space-y-3">
                              {subGroups.map(({ key, items: subItems }) => {
                                const subConfig = subCategoryConfig[key];
                                const SubIcon = subConfig?.icon || Wrench;
                                const isExpanded = expandedSubCategories[key];
                                
                                return (
                                  <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSubCategory(key)}>
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center gap-2 w-full p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        <SubIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{subConfig?.label || key}</span>
                                        <Badge variant="outline" className="text-xs">{subItems.length}项</Badge>
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="border rounded-lg overflow-hidden mt-2">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>功能</TableHead>
                                              <TableHead className="text-center w-20">启用</TableHead>
                                              <TableHead className="text-center w-24">扣费点数</TableHead>
                                              <TableHead className="text-center w-24">免费额度</TableHead>
                                              <TableHead className="text-center w-28">额度周期</TableHead>
                                              {key === 'ai_voice' && <TableHead className="text-center w-24">时长限制</TableHead>}
                                              <TableHead className="text-center w-16">操作</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {subItems.map(item => renderFeatureRow(item, key === 'ai_voice'))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-5 w-5" />
                            <h3 className="font-semibold">{config.label}</h3>
                          </div>
                          
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>功能</TableHead>
                                  <TableHead className="text-center w-20">启用</TableHead>
                                  <TableHead className="text-center w-24">扣费点数</TableHead>
                                  <TableHead className="text-center w-24">免费额度</TableHead>
                                  <TableHead className="text-center w-28">额度周期</TableHead>
                                  <TableHead className="text-center w-16">操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map(item => renderFeatureRow(item, false))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    请先选择一个套餐来配置功能权益
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 免费试用配置 Tab */}
        <TabsContent value="free-trial">
          <FreeTrialSettings />
        </TabsContent>
      </Tabs>

      {settingsPackageId && (
        <PackageFeatureSettingsDialog
          packageId={settingsPackageId}
          open={!!settingsPackageId}
          onOpenChange={(open) => !open && setSettingsPackageId(null)}
        />
      )}
    </div>
  );
}