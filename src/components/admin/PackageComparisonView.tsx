import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureItem {
  id: string;
  category: string;
  sub_category: string | null;
  item_key: string;
  item_name: string;
  is_active: boolean;
}

interface PackageFeatureSetting {
  id: string;
  package_id: string;
  feature_id: string;
  is_enabled: boolean;
  cost_per_use: number;
  free_quota: number;
  max_duration_minutes?: number | null;
}

interface Package {
  id: string;
  package_key: string;
  package_name: string;
  product_line: string;
  price: number | null;
}

const categoryLabels: Record<string, string> = {
  coach: '教练',
  training_camp: '训练营',
  tool: '工具',
  course: '课程',
};

const subCategoryLabels: Record<string, string> = {
  studio: '有劲生活馆',
  emotion_button: '情绪按钮',
  ai_analysis: 'AI分析',
  ai_generation: 'AI生成',
  ai_voice: 'AI语音',
};

export function PackageComparisonView() {
  // Fetch all packages (youjin membership only)
  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ["comparison-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, package_key, package_name, product_line, price")
        .eq("product_line", "youjin")
        .not("package_key", "ilike", "%camp%")
        .not("package_key", "ilike", "%training%")
        .neq("package_key", "partner")
        .order("display_order");
      if (error) throw error;
      return data as Package[];
    },
  });

  // Fetch all feature items
  const { data: featureItems = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ["comparison-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_items")
        .select("id, category, sub_category, item_key, item_name, is_active")
        .eq("is_active", true)
        .order("category")
        .order("display_order");
      if (error) throw error;
      return data as FeatureItem[];
    },
  });

  // Fetch all package feature settings
  const { data: allSettings = [], isLoading: loadingSettings } = useQuery({
    queryKey: ["comparison-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_feature_settings")
        .select("id, package_id, feature_id, is_enabled, cost_per_use, free_quota, max_duration_minutes");
      if (error) throw error;
      return data as PackageFeatureSetting[];
    },
  });

  const isLoading = loadingPackages || loadingFeatures || loadingSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Group features by category and sub_category
  const groupedFeatures = featureItems.reduce((acc, item) => {
    const category = item.category;
    const subCategory = item.sub_category || 'default';
    
    if (!acc[category]) acc[category] = {};
    if (!acc[category][subCategory]) acc[category][subCategory] = [];
    acc[category][subCategory].push(item);
    
    return acc;
  }, {} as Record<string, Record<string, FeatureItem[]>>);

  // Get setting for a feature and package
  const getSetting = (featureId: string, packageId: string): PackageFeatureSetting | undefined => {
    return allSettings.find(s => s.feature_id === featureId && s.package_id === packageId);
  };

  // Render cell content based on setting
  const renderSettingCell = (featureId: string, packageId: string, isVoice: boolean = false) => {
    const setting = getSetting(featureId, packageId);
    
    if (!setting) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">未配置</span>
        </div>
      );
    }

    if (!setting.is_enabled) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <X className="h-4 w-4 text-destructive" />
          <span className="text-xs text-muted-foreground">禁用</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-0.5">
        <Check className="h-4 w-4 text-green-600" />
        <div className="text-xs space-y-0.5 text-center">
          <div className="text-muted-foreground">
            {setting.cost_per_use}点/次
          </div>
          {setting.free_quota > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              免费{setting.free_quota}次
            </Badge>
          )}
          {isVoice && setting.max_duration_minutes && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              限{setting.max_duration_minutes}分钟
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Check if features in a category have different settings across packages
  const hasDifferences = (features: FeatureItem[]): boolean => {
    return features.some(feature => {
      const settings = packages.map(pkg => getSetting(feature.id, pkg.id));
      const firstSetting = settings[0];
      
      return settings.some(s => {
        if (!firstSetting && !s) return false;
        if (!firstSetting || !s) return true;
        return (
          s.is_enabled !== firstSetting.is_enabled ||
          s.cost_per_use !== firstSetting.cost_per_use ||
          s.free_quota !== firstSetting.free_quota
        );
      });
    });
  };

  const categoryOrder = ['coach', 'tool', 'training_camp', 'course'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>套餐配置对比</CardTitle>
        <CardDescription>
          一眼查看不同套餐的功能配置差异，标黄的行表示各套餐配置不一致
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-background z-10">功能名称</TableHead>
                {packages.map(pkg => (
                  <TableHead key={pkg.id} className="text-center min-w-[120px]">
                    <div>{pkg.package_name}</div>
                    {pkg.price && (
                      <div className="text-xs text-muted-foreground font-normal">
                        ¥{pkg.price}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryOrder.map(category => {
                const subCategories = groupedFeatures[category];
                if (!subCategories) return null;

                return Object.entries(subCategories).map(([subCategory, features]) => {
                  const hasSubCategoryDiff = hasDifferences(features);
                  
                  return (
                    <React.Fragment key={`${category}-${subCategory}`}>
                      {/* Category/SubCategory Header */}
                      <TableRow className="bg-muted/50">
                        <TableCell 
                          colSpan={packages.length + 1} 
                          className="font-semibold sticky left-0 bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span>{categoryLabels[category] || category}</span>
                            {subCategory !== 'default' && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">
                                  {subCategoryLabels[subCategory] || subCategory}
                                </span>
                              </>
                            )}
                            {hasSubCategoryDiff && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                有差异
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Feature Rows */}
                      {features.map(feature => {
                        const featureSettings = packages.map(pkg => getSetting(feature.id, pkg.id));
                        const firstSetting = featureSettings[0];
                        const rowHasDiff = featureSettings.some(s => {
                          if (!firstSetting && !s) return false;
                          if (!firstSetting || !s) return true;
                          return (
                            s.is_enabled !== firstSetting.is_enabled ||
                            s.cost_per_use !== firstSetting.cost_per_use ||
                            s.free_quota !== firstSetting.free_quota
                          );
                        });

                        const isVoiceFeature = subCategory === 'ai_voice';

                        return (
                          <TableRow 
                            key={feature.id}
                            className={cn(rowHasDiff && "bg-amber-50/50 dark:bg-amber-950/20")}
                          >
                            <TableCell className="sticky left-0 bg-background z-10">
                              <span className={cn(rowHasDiff && "bg-amber-50/50 dark:bg-amber-950/20")}>
                                {feature.item_name}
                              </span>
                            </TableCell>
                            {packages.map(pkg => (
                              <TableCell key={pkg.id} className="text-center">
                                {renderSettingCell(feature.id, pkg.id, isVoiceFeature)}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-600" />
            <span>已启用</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-4 w-4 text-destructive" />
            <span>已禁用</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span>未配置</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded" />
            <span>配置有差异</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import React for React.Fragment
import React from "react";
