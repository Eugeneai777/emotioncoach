import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Plus, X, GripVertical, Package } from "lucide-react";
import { PartnerProductCommissionConfig } from "./PartnerProductCommissionConfig";

interface PartnerLevelRule {
  id: string;
  partner_type: string;
  level_name: string;
  min_prepurchase: number;
  commission_rate_l1: number;
  commission_rate_l2: number;
  description: string;
  is_active: boolean;
  price: number;
  benefits: string[];
  icon: string;
  gradient: string;
  display_order: number;
}

const GRADIENT_OPTIONS = [
  { value: "from-orange-400 to-amber-400", label: "橙色渐变 (L1)" },
  { value: "from-orange-500 to-amber-500", label: "深橙渐变 (L2)" },
  { value: "from-orange-600 to-amber-600", label: "橙金渐变 (L3)" },
  { value: "from-purple-500 to-pink-500", label: "紫粉渐变 (绽放)" },
  { value: "from-blue-500 to-cyan-500", label: "蓝青渐变" },
  { value: "from-green-500 to-emerald-500", label: "绿色渐变" },
];

const ICON_OPTIONS = ["💪", "🔥", "💎", "🦋", "⭐", "🏆", "👑", "🌟"];

export function PartnerLevelManagement() {
  const [levels, setLevels] = useState<PartnerLevelRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<PartnerLevelRule | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_level_rules")
        .select("*")
        .order("partner_type")
        .order("display_order");

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        id: item.id,
        partner_type: item.partner_type,
        level_name: item.level_name,
        min_prepurchase: item.min_prepurchase,
        commission_rate_l1: Number(item.commission_rate_l1) || 0,
        commission_rate_l2: Number(item.commission_rate_l2) || 0,
        description: item.description,
        is_active: item.is_active,
        price: Number(item.price) || 0,
        benefits: Array.isArray(item.benefits) 
          ? (item.benefits as unknown as string[]) 
          : [],
        icon: item.icon || '💪',
        gradient: item.gradient || 'from-orange-400 to-amber-400',
        display_order: item.display_order || 0,
      })) as PartnerLevelRule[];

      setLevels(formattedData);
    } catch (error) {
      console.error("Error fetching levels:", error);
      toast.error("加载等级配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleEdit = (level: PartnerLevelRule) => {
    setEditingLevel({ ...level });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingLevel) return;

    try {
      const { error } = await supabase
        .from("partner_level_rules")
        .update({
          min_prepurchase: editingLevel.min_prepurchase,
          commission_rate_l1: editingLevel.commission_rate_l1,
          commission_rate_l2: editingLevel.commission_rate_l2,
          description: editingLevel.description,
          is_active: editingLevel.is_active,
          price: editingLevel.price,
          benefits: editingLevel.benefits,
          icon: editingLevel.icon,
          gradient: editingLevel.gradient,
          display_order: editingLevel.display_order,
        })
        .eq("id", editingLevel.id);

      if (error) throw error;

      toast.success("保存成功");
      setShowEditDialog(false);
      setEditingLevel(null);
      fetchLevels();
    } catch (error) {
      console.error("Error saving level:", error);
      toast.error("保存失败");
    }
  };

  const addBenefit = () => {
    if (!newBenefit.trim() || !editingLevel) return;
    setEditingLevel({
      ...editingLevel,
      benefits: [...editingLevel.benefits, newBenefit.trim()],
    });
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    if (!editingLevel) return;
    setEditingLevel({
      ...editingLevel,
      benefits: editingLevel.benefits.filter((_, i) => i !== index),
    });
  };

  const toggleActive = async (level: PartnerLevelRule) => {
    try {
      const { error } = await supabase
        .from("partner_level_rules")
        .update({ is_active: !level.is_active })
        .eq("id", level.id);

      if (error) throw error;
      toast.success(level.is_active ? "已禁用" : "已启用");
      fetchLevels();
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const youjinLevels = levels.filter(l => l.partner_type === "youjin");
  const bloomLevels = levels.filter(l => l.partner_type === "bloom");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">合伙人等级权益配置</h1>
        <p className="text-muted-foreground mt-1">管理有劲合伙人和绽放合伙人的等级配置</p>
      </div>

      {/* 有劲合伙人 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            有劲合伙人等级
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">等级</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>预购门槛</TableHead>
                <TableHead>一级佣金</TableHead>
                <TableHead>二级佣金</TableHead>
                <TableHead>权益数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {youjinLevels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{level.icon}</span>
                      <span className="font-medium">{level.level_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>¥{level.price}</TableCell>
                  <TableCell>{level.min_prepurchase}份</TableCell>
                  <TableCell>{(level.commission_rate_l1 * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(level.commission_rate_l2 * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{level.benefits.length}项</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={level.is_active}
                      onCheckedChange={() => toggleActive(level)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(level)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 绽放合伙人 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🦋</span>
            绽放合伙人等级
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">等级</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>预购门槛</TableHead>
                <TableHead>一级佣金</TableHead>
                <TableHead>二级佣金</TableHead>
                <TableHead>权益数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloomLevels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{level.icon}</span>
                      <span className="font-medium">{level.level_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>¥{level.price}</TableCell>
                  <TableCell>{level.min_prepurchase}份</TableCell>
                  <TableCell>{(level.commission_rate_l1 * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(level.commission_rate_l2 * 100).toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{level.benefits.length}项</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={level.is_active}
                      onCheckedChange={() => toggleActive(level)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(level)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{editingLevel?.icon}</span>
              编辑 {editingLevel?.level_name} 等级配置
            </DialogTitle>
          </DialogHeader>

          {editingLevel && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基础信息</TabsTrigger>
                <TabsTrigger value="benefits">权益配置</TabsTrigger>
                {editingLevel.partner_type === 'youjin' && (
                  <TabsTrigger value="products" className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    产品佣金
                  </TabsTrigger>
                )}
              </TabsList>

              {/* 基础信息 Tab */}
              <TabsContent value="basic" className="space-y-6 py-4">
                {/* 价格和门槛 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>等级价格 (¥)</Label>
                    <Input
                      type="number"
                      value={editingLevel.price}
                      onChange={(e) =>
                        setEditingLevel({
                          ...editingLevel,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>预购门槛 (份)</Label>
                    <Input
                      type="number"
                      value={editingLevel.min_prepurchase}
                      onChange={(e) =>
                        setEditingLevel({
                          ...editingLevel,
                          min_prepurchase: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* 默认佣金比例 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>默认一级佣金 (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={(editingLevel.commission_rate_l1 * 100).toFixed(0)}
                      onChange={(e) =>
                        setEditingLevel({
                          ...editingLevel,
                          commission_rate_l1: Number(e.target.value) / 100,
                        })
                      }
                    />
                    {editingLevel.partner_type === 'youjin' && (
                      <p className="text-xs text-muted-foreground">未配置产品专属佣金时的默认值</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>默认二级佣金 (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={(editingLevel.commission_rate_l2 * 100).toFixed(0)}
                      onChange={(e) =>
                        setEditingLevel({
                          ...editingLevel,
                          commission_rate_l2: Number(e.target.value) / 100,
                        })
                      }
                    />
                  </div>
                </div>

                {/* 图标和渐变色 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>等级图标</Label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map((icon) => (
                        <Button
                          key={icon}
                          variant={editingLevel.icon === icon ? "default" : "outline"}
                          size="icon"
                          className="text-xl"
                          onClick={() =>
                            setEditingLevel({ ...editingLevel, icon })
                          }
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>渐变色</Label>
                    <Select
                      value={editingLevel.gradient}
                      onValueChange={(value) =>
                        setEditingLevel({ ...editingLevel, gradient: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADIENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded bg-gradient-to-r ${opt.value}`}
                              />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <Label>等级描述</Label>
                  <Textarea
                    value={editingLevel.description}
                    onChange={(e) =>
                      setEditingLevel({
                        ...editingLevel,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                {/* 显示顺序 */}
                <div className="space-y-2">
                  <Label>显示顺序</Label>
                  <Input
                    type="number"
                    value={editingLevel.display_order}
                    onChange={(e) =>
                      setEditingLevel({
                        ...editingLevel,
                        display_order: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </TabsContent>

              {/* 权益配置 Tab */}
              <TabsContent value="benefits" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>权益列表</Label>
                  <div className="space-y-2">
                    {editingLevel.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{benefit}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeBenefit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="添加新权益..."
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addBenefit()}
                    />
                    <Button onClick={addBenefit} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 产品佣金 Tab (仅有劲合伙人) */}
              {editingLevel.partner_type === 'youjin' && (
                <TabsContent value="products" className="py-4">
                  <PartnerProductCommissionConfig
                    levelRuleId={editingLevel.id}
                    defaultL1={editingLevel.commission_rate_l1}
                    defaultL2={editingLevel.commission_rate_l2}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存基础信息</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
