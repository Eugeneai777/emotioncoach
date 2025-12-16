import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Save, Loader2, Users, Tent, Wrench, BookOpen, Sparkles, ChevronDown, ChevronRight, Home, CircleDot, Brain, Mic } from 'lucide-react';

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

interface PackageInfo {
  id: string;
  package_name: string;
  package_key: string;
}

interface PackageFeatureSetting {
  id: string;
  package_id: string;
  feature_id: string;
  is_enabled: boolean;
  cost_per_use: number;
  free_quota: number;
  free_quota_period: string;
  max_duration_minutes: number | null;
}

const categoryConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  coach: { label: '教练', icon: Users, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  training_camp: { label: '训练营', icon: Tent, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  tool: { label: '工具', icon: Wrench, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  course: { label: '课程', icon: BookOpen, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
};

const subCategoryConfig: Record<string, { label: string; icon: typeof Home; color: string }> = {
  studio: { label: '有劲生活馆工具', icon: Home, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  emotion_button: { label: '情绪🆘按钮', icon: CircleDot, color: 'bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-200' },
  ai_analysis: { label: 'AI分析工具', icon: Brain, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200' },
  ai_generation: { label: 'AI生成工具', icon: Sparkles, color: 'bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-200' },
  ai_voice: { label: 'AI语音工具', icon: Mic, color: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200' },
};

const FeatureCostManagement = () => {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [editingSettings, setEditingSettings] = useState<Record<string, Partial<PackageFeatureSetting>>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({
    studio: true,
    emotion_button: true,
    ai_analysis: true,
    ai_generation: true,
    ai_voice: true,
  });

  // Fetch feature items (new table)
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

  // Fetch packages (membership only)
  const { data: packages = [] } = useQuery({
    queryKey: ['packages-for-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, package_name, package_key')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as PackageInfo[];
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

  const getSettingForFeature = (featureId: string, itemKey?: string): Partial<PackageFeatureSetting> => {
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

  if (loadingFeatures) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const renderFeatureRow = (item: FeatureItem) => {
    const setting = getSettingForFeature(item.id, item.item_key);
    const hasChanges = !!editingSettings[item.id];
    const isVoiceFeature = item.item_key === 'realtime_voice';
    
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
        {/* 时长限制列 - 仅对 realtime_voice 显示 */}
        <TableCell className="text-center">
          {isVoiceFeature ? (
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
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </TableCell>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            功能权益管理
          </CardTitle>
          <CardDescription>
            管理4大功能类别（教练/训练营/工具/课程）及套餐权益配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features">
            <TabsList className="mb-4">
              <TabsTrigger value="features">功能管理</TabsTrigger>
              <TabsTrigger value="packages">套餐权益配置</TabsTrigger>
            </TabsList>

            <TabsContent value="features">
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
            </TabsContent>

            <TabsContent value="packages">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">选择套餐:</span>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="选择套餐" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map(pkg => (
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
                                              <TableHead className="text-center w-24">时长限制</TableHead>
                                              <TableHead className="text-center w-16">操作</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {subItems.map(item => renderFeatureRow(item))}
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
                                  <TableHead className="text-center w-24">时长限制</TableHead>
                                  <TableHead className="text-center w-16">操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map(item => renderFeatureRow(item))}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureCostManagement;
