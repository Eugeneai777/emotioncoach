import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Edit2, Save, X, Loader2 } from "lucide-react";
import { useCoachPriceTiers, useAdminUpdatePriceTier, CoachPriceTier } from "@/hooks/useCoachPriceTiers";

export function AdminPriceTierManagement() {
  const { data: tiers, isLoading } = useCoachPriceTiers();
  const updateTier = useAdminUpdatePriceTier();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CoachPriceTier>>({});

  const startEdit = (tier: CoachPriceTier) => {
    setEditingId(tier.id);
    setEditForm({
      tier_name: tier.tier_name,
      price: tier.price,
      description: tier.description || "",
      duration_minutes: tier.duration_minutes
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      await updateTier.mutateAsync({
        tierId: editingId,
        updates: editForm
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      // Error handled in mutation
    }
  };

  const getTierColor = (level: number) => {
    switch (level) {
      case 1: return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white";
      case 2: return "bg-gradient-to-r from-slate-400 to-slate-500 text-white";
      case 3: return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
      case 4: return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
      default: return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          教练收费档次管理
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          配置真人教练的4个收费档次，修改后将影响新审核的教练
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tiers?.map((tier) => (
          <Card key={tier.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${getTierColor(tier.tier_level)}`} />
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className={getTierColor(tier.tier_level)}>
                  {tier.tier_name}
                </Badge>
                {editingId !== tier.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(tier)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveEdit}
                      disabled={updateTier.isPending}
                    >
                      {updateTier.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {editingId === tier.id ? (
                <>
                  <div className="space-y-2">
                    <Label>档次名称</Label>
                    <Input
                      value={editForm.tier_name || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tier_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>收费金额 (元)</Label>
                      <Input
                        type="number"
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>默认时长 (分钟)</Label>
                      <Input
                        type="number"
                        value={editForm.duration_minutes || 60}
                        onChange={(e) => setEditForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>档次描述</Label>
                    <Textarea
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">¥{tier.price}</span>
                    <span className="text-muted-foreground">/{tier.duration_minutes}分钟</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.description || "暂无描述"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>提示：</strong>修改档次价格不会影响已设定档次的教练，仅影响之后新审核的教练。
            如需调整已有教练的价格，请在教练管理中单独修改其收费档次。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
