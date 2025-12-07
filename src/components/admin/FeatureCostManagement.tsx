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
import { toast } from '@/hooks/use-toast';
import { Save, Loader2, Coins, Gift, Package } from 'lucide-react';

interface FeatureCostRule {
  id: string;
  feature_type: string;
  feature_name: string;
  default_cost: number;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface PackageFreeQuota {
  id: string;
  package_id: string;
  feature_type: string;
  free_quota: number;
  period: string;
}

interface PackageInfo {
  id: string;
  package_name: string;
  package_key: string;
}

const FeatureCostManagement = () => {
  const queryClient = useQueryClient();
  const [editingCosts, setEditingCosts] = useState<Record<string, number>>({});
  const [editingQuotas, setEditingQuotas] = useState<Record<string, { quota: number; period: string }>>({});
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  // Fetch feature cost rules
  const { data: costRules, isLoading: loadingRules } = useQuery({
    queryKey: ['feature-cost-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_cost_rules')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as FeatureCostRule[];
    }
  });

  // Fetch packages
  const { data: packages } = useQuery({
    queryKey: ['packages-for-quotas'],
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

  // Fetch free quotas for selected package
  const { data: freeQuotas, isLoading: loadingQuotas } = useQuery({
    queryKey: ['package-free-quotas', selectedPackage],
    queryFn: async () => {
      if (!selectedPackage) return [];
      const { data, error } = await supabase
        .from('package_free_quotas')
        .select('*')
        .eq('package_id', selectedPackage);
      if (error) throw error;
      return data as PackageFreeQuota[];
    },
    enabled: !!selectedPackage
  });

  // Update cost rule mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ id, cost, isActive }: { id: string; cost?: number; isActive?: boolean }) => {
      const updates: Partial<FeatureCostRule> = {};
      if (cost !== undefined) updates.default_cost = cost;
      if (isActive !== undefined) updates.is_active = isActive;
      
      const { error } = await supabase
        .from('feature_cost_rules')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-cost-rules'] });
      toast({ title: '已更新扣费规则' });
    },
    onError: (error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' });
    }
  });

  // Save/update free quota mutation
  const saveQuotaMutation = useMutation({
    mutationFn: async ({ packageId, featureType, quota, period }: { 
      packageId: string; 
      featureType: string; 
      quota: number; 
      period: string;
    }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('package_free_quotas')
        .select('id')
        .eq('package_id', packageId)
        .eq('feature_type', featureType)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('package_free_quotas')
          .update({ free_quota: quota, period })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('package_free_quotas')
          .insert({ package_id: packageId, feature_type: featureType, free_quota: quota, period });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-free-quotas'] });
      toast({ title: '已保存免费额度' });
    },
    onError: (error) => {
      toast({ title: '保存失败', description: error.message, variant: 'destructive' });
    }
  });

  const handleCostChange = (id: string, value: string) => {
    const cost = parseInt(value) || 0;
    setEditingCosts(prev => ({ ...prev, [id]: cost }));
  };

  const handleSaveCost = (rule: FeatureCostRule) => {
    const newCost = editingCosts[rule.id] ?? rule.default_cost;
    updateCostMutation.mutate({ id: rule.id, cost: newCost });
    setEditingCosts(prev => {
      const next = { ...prev };
      delete next[rule.id];
      return next;
    });
  };

  const handleToggleActive = (rule: FeatureCostRule) => {
    updateCostMutation.mutate({ id: rule.id, isActive: !rule.is_active });
  };

  const getQuotaForFeature = (featureType: string) => {
    return freeQuotas?.find(q => q.feature_type === featureType);
  };

  const handleQuotaChange = (featureType: string, quota: number, period: string) => {
    setEditingQuotas(prev => ({ ...prev, [featureType]: { quota, period } }));
  };

  const handleSaveQuota = (featureType: string) => {
    const edit = editingQuotas[featureType];
    const existing = getQuotaForFeature(featureType);
    const quota = edit?.quota ?? existing?.free_quota ?? 0;
    const period = edit?.period ?? existing?.period ?? 'monthly';

    saveQuotaMutation.mutate({
      packageId: selectedPackage,
      featureType,
      quota,
      period
    });

    setEditingQuotas(prev => {
      const next = { ...prev };
      delete next[featureType];
      return next;
    });
  };

  if (loadingRules) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="costs">
        <TabsList>
          <TabsTrigger value="costs" className="gap-2">
            <Coins className="h-4 w-4" />
            扣费规则
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-2">
            <Gift className="h-4 w-4" />
            免费额度
          </TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                功能扣费点数配置
              </CardTitle>
              <CardDescription>
                设置每个功能使用时扣除的点数，0 表示免费
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>功能类型</TableHead>
                    <TableHead>功能名称</TableHead>
                    <TableHead>说明</TableHead>
                    <TableHead className="w-24">扣费点数</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costRules?.map((rule) => {
                    const currentCost = editingCosts[rule.id] ?? rule.default_cost;
                    const hasChanges = editingCosts[rule.id] !== undefined && editingCosts[rule.id] !== rule.default_cost;
                    
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {rule.feature_type}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{rule.feature_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {rule.description}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={currentCost}
                            onChange={(e) => handleCostChange(rule.id, e.target.value)}
                            className="w-20 h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleActive(rule)}
                          />
                        </TableCell>
                        <TableCell>
                          {hasChanges && (
                            <Button
                              size="sm"
                              onClick={() => handleSaveCost(rule)}
                              disabled={updateCostMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                套餐免费额度配置
              </CardTitle>
              <CardDescription>
                为不同套餐设置功能免费使用次数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Package className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="选择套餐" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.package_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPackage && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>功能类型</TableHead>
                      <TableHead>功能名称</TableHead>
                      <TableHead className="w-24">免费次数</TableHead>
                      <TableHead className="w-32">周期</TableHead>
                      <TableHead className="w-20">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costRules?.map((rule) => {
                      const existing = getQuotaForFeature(rule.feature_type);
                      const editing = editingQuotas[rule.feature_type];
                      const currentQuota = editing?.quota ?? existing?.free_quota ?? 0;
                      const currentPeriod = editing?.period ?? existing?.period ?? 'monthly';
                      const hasChanges = editing !== undefined;
                      
                      return (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {rule.feature_type}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">{rule.feature_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={currentQuota}
                              onChange={(e) => handleQuotaChange(
                                rule.feature_type,
                                parseInt(e.target.value) || 0,
                                currentPeriod
                              )}
                              className="w-20 h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={currentPeriod}
                              onValueChange={(v) => handleQuotaChange(
                                rule.feature_type,
                                currentQuota,
                                v
                              )}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">每日</SelectItem>
                                <SelectItem value="monthly">每月</SelectItem>
                                <SelectItem value="lifetime">永久</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {hasChanges && (
                              <Button
                                size="sm"
                                onClick={() => handleSaveQuota(rule.feature_type)}
                                disabled={saveQuotaMutation.isPending}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {!selectedPackage && (
                <div className="text-center py-8 text-muted-foreground">
                  请先选择一个套餐来配置免费额度
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureCostManagement;
