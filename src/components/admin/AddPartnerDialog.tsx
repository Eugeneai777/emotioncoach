import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Flame, Gem } from "lucide-react";
import { addDays, format } from "date-fns";

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LEVEL_CONFIG = {
  L1: { name: '初级', icon: Zap, gradient: 'from-orange-400 to-amber-400', l1Rate: 20, l2Rate: 0, price: 792 },
  L2: { name: '高级', icon: Flame, gradient: 'from-orange-500 to-amber-500', l1Rate: 35, l2Rate: 0, price: 3217 },
  L3: { name: '钻石', icon: Gem, gradient: 'from-orange-600 to-amber-600', l1Rate: 50, l2Rate: 10, price: 4950 },
};

export function AddPartnerDialog({ open, onOpenChange, onSuccess }: AddPartnerDialogProps) {
  const [userId, setUserId] = useState("");
  const [level, setLevel] = useState<keyof typeof LEVEL_CONFIG>("L1");
  const [prepurchaseCount, setPrepurchaseCount] = useState("100");
  const [expiryDays, setExpiryDays] = useState("365");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // 根据等级自动更新佣金比例
  const currentConfig = LEVEL_CONFIG[level];

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

    setLoading(true);

    try {
      // 验证用户ID存在
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', userId.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("未找到该用户，请确认用户ID正确");
      }

      // 检查是否已是合伙人
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId.trim())
        .single();

      if (existingPartner) {
        throw new Error("该用户已是合伙人");
      }

      // 计算有效期
      const expiresAt = addDays(new Date(), parseInt(expiryDays) || 365);

      // 创建合伙人记录
      const { error: insertError } = await supabase
        .from('partners')
        .insert({
          user_id: userId.trim(),
          partner_code: generatePartnerCode(),
          partner_type: 'youjin',
          partner_level: level,
          commission_rate_l1: currentConfig.l1Rate / 100,
          commission_rate_l2: currentConfig.l2Rate / 100,
          prepurchase_count: parseInt(prepurchaseCount) || 0,
          prepurchase_expires_at: expiresAt.toISOString(),
          status: 'active',
          source: 'manual',
        });

      if (insertError) throw insertError;

      toast.success("有劲合伙人添加成功", {
        description: `已为 ${profile.display_name || '用户'} 开通 ${level} ${currentConfig.name}等级`
      });
      
      // 重置表单
      setUserId("");
      setLevel("L1");
      setPrepurchaseCount("100");
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

  const LevelIcon = currentConfig.icon;

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

          {/* 等级选择器 */}
          <div className="space-y-2">
            <Label>合伙人等级</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(LEVEL_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = level === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLevel(key as keyof typeof LEVEL_CONFIG)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                        : 'border-border hover:border-orange-300'
                    }`}
                  >
                    <div className={`inline-flex p-1.5 rounded-md bg-gradient-to-r ${config.gradient} mb-2`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-medium text-sm">{key} {config.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      佣金 {config.l1Rate}%/{config.l2Rate}%
                    </div>
                    <div className="text-xs text-orange-600 font-medium mt-0.5">
                      ¥{config.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 佣金比例显示（只读） */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>一级佣金比例</Label>
              <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {currentConfig.l1Rate}%
              </div>
            </div>
            <div className="space-y-2">
              <Label>二级佣金比例</Label>
              <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-medium">
                {currentConfig.l2Rate}%
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
                min="0"
                value={prepurchaseCount}
                onChange={(e) => setPrepurchaseCount(e.target.value)}
              />
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
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {loading ? "添加中..." : "确认添加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
