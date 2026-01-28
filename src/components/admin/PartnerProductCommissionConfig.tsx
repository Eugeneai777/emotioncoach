import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, AlertCircle } from "lucide-react";

interface ProductCommission {
  id?: string;
  partner_level_rule_id: string;
  package_key: string;
  package_name: string;
  commission_rate_l1: number;
  commission_rate_l2: number;
  is_enabled: boolean;
  hasChanges?: boolean;
}

interface Props {
  levelRuleId: string;
  defaultL1: number;
  defaultL2: number;
  onSave?: () => void;
}

export function PartnerProductCommissionConfig({ levelRuleId, defaultL1, defaultL2, onSave }: Props) {
  const [configs, setConfigs] = useState<ProductCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);

      // 获取所有有劲产品
      const { data: packages, error: pkgError } = await supabase
        .from("packages")
        .select("package_key, package_name")
        .eq("product_line", "youjin")
        .eq("is_active", true)
        .order("display_order");

      if (pkgError) throw pkgError;

      // 获取已有配置
      const { data: existingConfigs, error: configError } = await supabase
        .from("partner_product_commissions")
        .select("*")
        .eq("partner_level_rule_id", levelRuleId);

      if (configError) throw configError;

      // 合并数据
      const configMap = new Map(
        (existingConfigs || []).map(c => [c.package_key, c])
      );

      const mergedConfigs: ProductCommission[] = (packages || []).map(pkg => {
        const existing = configMap.get(pkg.package_key);
        return {
          id: existing?.id,
          partner_level_rule_id: levelRuleId,
          package_key: pkg.package_key,
          package_name: pkg.package_name,
          commission_rate_l1: existing ? Number(existing.commission_rate_l1) : defaultL1,
          commission_rate_l2: existing ? Number(existing.commission_rate_l2) : defaultL2,
          is_enabled: existing?.is_enabled ?? true,
          hasChanges: false,
        };
      });

      setConfigs(mergedConfigs);
    } catch (error) {
      console.error("Error fetching product commissions:", error);
      toast.error("加载产品佣金配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (levelRuleId) {
      fetchConfigs();
    }
  }, [levelRuleId]);

  const updateConfig = (index: number, updates: Partial<ProductCommission>) => {
    setConfigs(prev => prev.map((c, i) => 
      i === index ? { ...c, ...updates, hasChanges: true } : c
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const changedConfigs = configs.filter(c => c.hasChanges);

      for (const config of changedConfigs) {
        const data = {
          partner_level_rule_id: config.partner_level_rule_id,
          package_key: config.package_key,
          commission_rate_l1: config.commission_rate_l1,
          commission_rate_l2: config.commission_rate_l2,
          is_enabled: config.is_enabled,
        };

        if (config.id) {
          // 更新已有记录
          const { error } = await supabase
            .from("partner_product_commissions")
            .update(data)
            .eq("id", config.id);
          if (error) throw error;
        } else {
          // 插入新记录
          const { error } = await supabase
            .from("partner_product_commissions")
            .insert(data);
          if (error) throw error;
        }
      }

      toast.success(`已保存 ${changedConfigs.length} 项产品佣金配置`);
      fetchConfigs();
      onSave?.();
    } catch (error) {
      console.error("Error saving product commissions:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = configs.some(c => c.hasChanges);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>未配置的产品将使用默认佣金率：一级 {(defaultL1 * 100).toFixed(0)}% / 二级 {(defaultL2 * 100).toFixed(0)}%</span>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "保存中..." : "保存更改"}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {configs.map((config, index) => (
          <Card key={config.package_key} className={`transition-all ${config.hasChanges ? 'ring-2 ring-primary/50' : ''}`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-4">
                {/* 启用开关 */}
                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={(checked) => updateConfig(index, { is_enabled: checked })}
                />
                
                {/* 产品名称 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${!config.is_enabled ? 'text-muted-foreground line-through' : ''}`}>
                      {config.package_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {config.package_key}
                    </Badge>
                    {!config.is_enabled && (
                      <Badge variant="secondary" className="text-xs">不参与分成</Badge>
                    )}
                  </div>
                </div>

                {/* 佣金率输入 */}
                {config.is_enabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">一级</Label>
                      <Input
                        type="number"
                        className="w-16 h-8 text-center text-sm"
                        value={(config.commission_rate_l1 * 100).toFixed(0)}
                        onChange={(e) => updateConfig(index, { 
                          commission_rate_l1: Number(e.target.value) / 100 
                        })}
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">二级</Label>
                      <Input
                        type="number"
                        className="w-16 h-8 text-center text-sm"
                        value={(config.commission_rate_l2 * 100).toFixed(0)}
                        onChange={(e) => updateConfig(index, { 
                          commission_rate_l2: Number(e.target.value) / 100 
                        })}
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          暂无有劲产品线产品
        </div>
      )}
    </div>
  );
}
