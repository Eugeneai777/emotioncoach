import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { usePartnerLevels, type PartnerLevelRule } from "@/hooks/usePartnerLevels";

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LEVEL_ICONS: Record<string, string> = {
  L1: '⚡',
  L2: '🔥',
  L3: '💎',
};

export function AddPartnerDialog({ open, onOpenChange, onSuccess }: AddPartnerDialogProps) {
  const { levels: youjinLevels, loading: levelsLoading } = usePartnerLevels('youjin');
  const [userId, setUserId] = useState("");
  const [levelName, setLevelName] = useState("L1");
  const [prepurchaseCount, setPrepurchaseCount] = useState("100");
  const [expiryDays, setExpiryDays] = useState("365");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // 当前选中的等级配置（从数据库动态获取）
  const currentLevel = youjinLevels.find(l => l.level_name === levelName) || youjinLevels[0];

  // 等级变化时自动更新预购数量
  useEffect(() => {
    if (currentLevel) {
      setPrepurchaseCount(String(currentLevel.min_prepurchase));
    }
  }, [levelName, currentLevel?.min_prepurchase]);

  const generatePartnerCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'YJ';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      toast.error("请输入用户ID");
      return;
    }

    if (!currentLevel) {
      toast.error("等级配置加载中，请稍后");
      return;
    }

    setLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', userId.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("未找到该用户，请确认用户ID正确");
      }

      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId.trim())
        .single();

      if (existingPartner) {
        throw new Error("该用户已是合伙人");
      }

      const expiresAt = addDays(new Date(), parseInt(expiryDays) || 365);

      const { error: insertError } = await supabase
        .from('partners')
        .insert({
          user_id: userId.trim(),
          partner_code: generatePartnerCode(),
          partner_type: 'youjin',
          partner_level: levelName,
          commission_rate_l1: currentLevel.commission_rate_l1,
          commission_rate_l2: currentLevel.commission_rate_l2,
          prepurchase_count: parseInt(prepurchaseCount) || 0,
          prepurchase_expires_at: expiresAt.toISOString(),
          status: 'active',
          source: 'manual',
        });

      if (insertError) throw insertError;

      const levelLabel = levelName === 'L1' ? '初级' : levelName === 'L2' ? '高级' : '钻石';
      toast.success("有劲合伙人添加成功", {
        description: `已为 ${profile.display_name || '用户'} 开通 ${levelName} ${levelLabel}等级`
      });
      
      setUserId("");
      setLevelName("L1");
      setPrepurchaseCount(String(youjinLevels[0]?.min_prepurchase || 100));
      setExpiryDays("365");
      setNote("");
      
      onOpenChange(false);
      onSuccess();

    } catch (error: any) {
      console.error('Error adding partner:', error);
      toast.error("添加失败", {
        description: error.message || "请稍后重试"
      });
    } finally {
      setLoading(false);
    }
  };

  const l1Percent = currentLevel ? Math.round(currentLevel.commission_rate_l1 * 100) : 0;
  const l2Percent = currentLevel ? Math.round(currentLevel.commission_rate_l2 * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💪 添加有劲合伙人
          </DialogTitle>
          <DialogDescription>
            为指定用户开通有劲合伙人权限
          </DialogDescription>
        </DialogHeader>

        {levelsLoading ? (
          <div className="py-8 text-center text-muted-foreground">加载等级配置中...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">用户ID</Label>
              <Input
                id="userId"
                placeholder="请输入用户ID（可从用户管理获取）"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                可在"用户管理"标签页查看和复制用户ID
              </p>
            </div>

            {/* 等级选择器 - 从数据库动态渲染 */}
            <div className="space-y-2">
              <Label>合伙人等级</Label>
              <div className="grid grid-cols-3 gap-3">
                {youjinLevels.map((rule) => {
                  const isSelected = levelName === rule.level_name;
                  const rateL1 = Math.round(rule.commission_rate_l1 * 100);
                  const rateL2 = Math.round(rule.commission_rate_l2 * 100);
                  return (
                    <button
                      key={rule.level_name}
                      type="button"
                      onClick={() => setLevelName(rule.level_name)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className={`inline-flex p-1.5 rounded-md bg-gradient-to-r ${rule.gradient} mb-2`}>
                        <span className="text-sm">{LEVEL_ICONS[rule.level_name] || rule.icon}</span>
                      </div>
                      <div className="font-medium text-sm">{rule.level_name} {rule.level_name === 'L1' ? '初级' : rule.level_name === 'L2' ? '高级' : '钻石'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        佣金 {rateL1}%/{rateL2}%
                      </div>
                      <div className="text-xs text-primary font-medium mt-0.5">
                        ¥{rule.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 佣金比例显示（只读，来自数据库） */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>一级佣金比例</Label>
                <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                  {l1Percent}%
                </div>
              </div>
              <div className="space-y-2">
                <Label>二级佣金比例</Label>
                <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                  {l2Percent}%
                </div>
              </div>
            </div>

            {/* 预购配置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepurchase">预购数量</Label>
                <Input
                  id="prepurchase"
                  type="number"
                  min={currentLevel?.min_prepurchase || 100}
                  value={prepurchaseCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setPrepurchaseCount(String(Math.max(value, currentLevel?.min_prepurchase || 100)));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {levelName}等级最低 {currentLevel?.min_prepurchase || 100}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">有效期（天）</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30天</SelectItem>
                    <SelectItem value="90">90天</SelectItem>
                    <SelectItem value="180">180天</SelectItem>
                    <SelectItem value="365">365天（1年）</SelectItem>
                    <SelectItem value="730">730天（2年）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">备注（可选）</Label>
              <Textarea
                id="note"
                placeholder="添加备注说明"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {loading ? "添加中..." : "确认添加"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
