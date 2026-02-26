import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, User, Handshake } from "lucide-react";

interface SetRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

import { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

const ROLE_CONFIG: { role: AppRole; label: string; description: string; icon: React.ReactNode }[] = [
  { role: 'admin', label: '管理员', description: '拥有后台管理全部权限', icon: <ShieldCheck className="h-4 w-4 text-red-500" /> },
  { role: 'content_admin', label: '内容管理员', description: '仅可管理内容和举报，无法查看用户、订单、财务等', icon: <Shield className="h-4 w-4 text-orange-500" /> },
  { role: 'partner_admin', label: '合伙人运营', description: '仅可管理被分配的行业合伙人', icon: <Handshake className="h-4 w-4 text-emerald-500" /> },
  { role: 'user', label: '普通用户', description: '标准用户权限', icon: <User className="h-4 w-4 text-blue-500" /> },
];

export function SetRoleDialog({ open, onOpenChange, userId, userName, onSuccess }: SetRoleDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [originalRoles, setOriginalRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Partner binding state
  const [industryPartners, setIndustryPartners] = useState<{ id: string; company_name: string }[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [originalPartnerIds, setOriginalPartnerIds] = useState<string[]>([]);

  // 获取当前登录用户ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // 获取用户当前角色 + 绑定
  useEffect(() => {
    if (open && userId) {
      fetchUserRoles();
      fetchBindings();
      fetchIndustryPartners();
    }
  }, [open, userId]);

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = (data || []).map(r => r.role as AppRole);
      setSelectedRoles(roles);
      setOriginalRoles(roles);
    } catch (error: any) {
      toast.error('获取用户角色失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBindings = async () => {
    const { data } = await supabase
      .from('partner_admin_bindings')
      .select('partner_id')
      .eq('user_id', userId);
    const ids = (data || []).map(b => b.partner_id);
    setSelectedPartnerIds(ids);
    setOriginalPartnerIds(ids);
  };

  const fetchIndustryPartners = async () => {
    const { data } = await supabase
      .from('partners')
      .select('id, company_name')
      .eq('partner_type', 'industry')
      .eq('status', 'active')
      .order('company_name');
    setIndustryPartners(data || []);
  };

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    // 防止管理员移除自己的 admin 权限
    if (role === 'admin' && !checked && userId === currentUserId) {
      toast.error('不能移除自己的管理员权限');
      return;
    }

    if (checked) {
      setSelectedRoles(prev => [...prev, role]);
    } else {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 找出需要删除和新增的角色
      const rolesToRemove = originalRoles.filter(r => !selectedRoles.includes(r));
      const rolesToAdd = selectedRoles.filter(r => !originalRoles.includes(r));

      // 删除旧角色
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .in('role', rolesToRemove);

        if (deleteError) throw deleteError;
      }

      // 添加新角色
      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToAdd.map(role => ({ user_id: userId, role })));

        if (insertError) throw insertError;
      }

      // 同步 partner_admin_bindings
      const bindingsToRemove = originalPartnerIds.filter(id => !selectedPartnerIds.includes(id));
      const bindingsToAdd = selectedPartnerIds.filter(id => !originalPartnerIds.includes(id));

      if (bindingsToRemove.length > 0) {
        await supabase
          .from('partner_admin_bindings')
          .delete()
          .eq('user_id', userId)
          .in('partner_id', bindingsToRemove);
      }

      if (bindingsToAdd.length > 0) {
        await supabase
          .from('partner_admin_bindings')
          .insert(bindingsToAdd.map(partner_id => ({ user_id: userId, partner_id })));
      }

      toast.success('用户角色已更新');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('保存失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(originalRoles.sort())
    || JSON.stringify(selectedPartnerIds.sort()) !== JSON.stringify(originalPartnerIds.sort());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            设置用户角色
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            为 <span className="font-medium text-foreground">{userName}</span> 分配角色权限
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {ROLE_CONFIG.map(({ role, label, description, icon }) => (
                <div 
                  key={role}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleToggle(role, !!checked)}
                    disabled={role === 'admin' && userId === currentUserId && selectedRoles.includes('admin')}
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={`role-${role}`}
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      {icon}
                      {label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
              {/* Partner binding selector - show when partner_admin is selected */}
              {selectedRoles.includes('partner_admin') && (
                <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium mb-2">分配管理的行业合伙人</p>
                  {industryPartners.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暂无行业合伙人</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {industryPartners.map(p => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`partner-${p.id}`}
                            checked={selectedPartnerIds.includes(p.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPartnerIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedPartnerIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                          />
                          <Label htmlFor={`partner-${p.id}`} className="text-sm cursor-pointer">
                            {p.company_name || '未命名'}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
