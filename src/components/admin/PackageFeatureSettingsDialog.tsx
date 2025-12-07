import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, BookOpen, Tent, Wrench, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeatureItem {
  id: string;
  category: string;
  item_key: string;
  item_name: string;
  description: string | null;
  is_active: boolean;
}

interface FeatureSetting {
  id?: string;
  feature_id: string;
  is_enabled: boolean;
  cost_per_use: number;
  free_quota: number;
  free_quota_period: string;
}

interface PackageFeatureSettingsDialogProps {
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  coach: { label: "教练类", icon: <BookOpen className="h-4 w-4" />, color: "text-emerald-600" },
  training_camp: { label: "训练营", icon: <Tent className="h-4 w-4" />, color: "text-amber-600" },
  tool: { label: "工具类", icon: <Wrench className="h-4 w-4" />, color: "text-blue-600" },
  course: { label: "课程类", icon: <Video className="h-4 w-4" />, color: "text-purple-600" },
};

export function PackageFeatureSettingsDialog({ packageId, open, onOpenChange }: PackageFeatureSettingsDialogProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, FeatureSetting>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    coach: true,
    training_camp: true,
    tool: true,
    course: true,
  });

  // Fetch package info
  const { data: pkg } = useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("package_name")
        .eq("id", packageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!packageId && open,
  });

  // Fetch all feature items
  const { data: featureItems } = useQuery({
    queryKey: ["feature-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_items")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("display_order");
      if (error) throw error;
      return data as FeatureItem[];
    },
    enabled: open,
  });

  // Fetch existing settings for this package
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ["package-feature-settings", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_feature_settings")
        .select("*")
        .eq("package_id", packageId);
      if (error) throw error;
      return data;
    },
    enabled: !!packageId && open,
  });

  // Initialize settings when data loads
  useEffect(() => {
    if (featureItems && existingSettings) {
      const newSettings: Record<string, FeatureSetting> = {};
      
      featureItems.forEach((feature) => {
        const existing = existingSettings.find((s) => s.feature_id === feature.id);
        if (existing) {
          newSettings[feature.id] = {
            id: existing.id,
            feature_id: feature.id,
            is_enabled: existing.is_enabled ?? true,
            cost_per_use: existing.cost_per_use ?? 0,
            free_quota: existing.free_quota ?? 0,
            free_quota_period: existing.free_quota_period ?? "monthly",
          };
        } else {
          // Default settings for new features
          newSettings[feature.id] = {
            feature_id: feature.id,
            is_enabled: true,
            cost_per_use: feature.category === "coach" ? 1 : 0,
            free_quota: 0,
            free_quota_period: "monthly",
          };
        }
      });
      
      setSettings(newSettings);
    }
  }, [featureItems, existingSettings]);

  // Save all settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      const settingsArray = Object.values(settings);
      
      for (const setting of settingsArray) {
        if (setting.id) {
          // Update existing
          const { error } = await supabase
            .from("package_feature_settings")
            .update({
              is_enabled: setting.is_enabled,
              cost_per_use: setting.cost_per_use,
              free_quota: setting.free_quota,
              free_quota_period: setting.free_quota_period,
            })
            .eq("id", setting.id);
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from("package_feature_settings")
            .insert({
              package_id: packageId,
              feature_id: setting.feature_id,
              is_enabled: setting.is_enabled,
              cost_per_use: setting.cost_per_use,
              free_quota: setting.free_quota,
              free_quota_period: setting.free_quota_period,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-feature-settings", packageId] });
      toast.success("套餐权益配置已保存");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const updateSetting = (featureId: string, field: keyof FeatureSetting, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [field]: value,
      },
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group features by category
  const groupedFeatures = featureItems?.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureItem[]>) || {};

  const categoryOrder = ["coach", "training_camp", "tool", "course"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置套餐权益 - {pkg?.package_name}</DialogTitle>
          <DialogDescription>管理此套餐的功能启用状态和扣费配置</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {categoryOrder.map((category) => {
              const features = groupedFeatures[category] || [];
              if (features.length === 0) return null;
              
              const config = categoryConfig[category];
              const isExpanded = expandedCategories[category];

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className={config.color}>{config.icon}</span>
                    <span className="font-medium">{config.label}</span>
                    <span className="text-muted-foreground text-sm">({features.length}个)</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">功能名称</TableHead>
                          <TableHead className="w-[80px]">启用</TableHead>
                          <TableHead className="w-[100px]">扣费点数</TableHead>
                          <TableHead className="w-[100px]">免费额度</TableHead>
                          <TableHead className="w-[120px]">周期</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {features.map((feature) => {
                          const setting = settings[feature.id];
                          if (!setting) return null;
                          
                          return (
                            <TableRow key={feature.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div>{feature.item_name}</div>
                                  {feature.description && (
                                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={setting.is_enabled}
                                  onCheckedChange={(checked) => updateSetting(feature.id, "is_enabled", checked)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  value={setting.cost_per_use}
                                  onChange={(e) => updateSetting(feature.id, "cost_per_use", parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  disabled={!setting.is_enabled}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  value={setting.free_quota}
                                  onChange={(e) => updateSetting(feature.id, "free_quota", parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  placeholder="0=无限"
                                  disabled={!setting.is_enabled}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={setting.free_quota_period}
                                  onValueChange={(value) => updateSetting(feature.id, "free_quota_period", value)}
                                  disabled={!setting.is_enabled}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">每日</SelectItem>
                                    <SelectItem value="monthly">每月</SelectItem>
                                    <SelectItem value="lifetime">永久</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
