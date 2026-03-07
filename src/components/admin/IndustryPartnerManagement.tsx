import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminFilterBar } from "./shared/AdminFilterBar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Network, Plus, Building2, UserPlus, Link2, Bot, ClipboardList, Settings, Save, Users, Unlink, TrendingUp, Share2 } from "lucide-react";
import { PartnerCoachManager } from "@/components/partner/PartnerCoachManager";
import { PartnerAssessmentManager } from "@/components/partner/PartnerAssessmentManager";
import { FlywheelGrowthSystem } from "@/components/partner/FlywheelGrowthSystem";
import { PartnerStoreProducts } from "@/components/partner/PartnerStoreProducts";
import { PartnerStoreOrders } from "@/components/partner/PartnerStoreOrders";
import { PartnerProductBundles } from "@/components/admin/industry-partners/PartnerProductBundles";
import { PartnerTeamManager } from "@/components/admin/industry-partners/PartnerTeamManager";
import { PartnerInfoEditor } from "@/components/admin/industry-partners/PartnerInfoEditor";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { PromotionHub } from "@/components/partner/PromotionHub";
import { ReferralList } from "@/components/partner/ReferralList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdminStatCard } from "./shared/AdminStatCard";

interface IndustryPartner {
  id: string;
  partner_code: string;
  status: string;
  partner_type: string;
  total_referrals: number;
  created_at: string;
  user_id: string | null;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  cooperation_note: string | null;
  custom_commission_rate_l1: number | null;
  custom_commission_rate_l2: number | null;
  traffic_source: string | null;
  settlement_cycle: string | null;
  custom_product_packages: any | null;
  nickname?: string;
}

function generatePartnerCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "IND-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function IndustryPartnerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [partners, setPartners] = useState<IndustryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(searchParams.get("partner"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isPartnerAdmin, setIsPartnerAdmin] = useState(false);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [bindPartnerId, setBindPartnerId] = useState<string | null>(null);
  const [bindPhone, setBindPhone] = useState("");
  const [binding, setBinding] = useState(false);
  const [unbindingId, setUnbindingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    contact_phone: "",
    cooperation_note: "",
    commission_l1: "0.20",
    traffic_source: "",
    settlement_cycle: "monthly",
  });

  // Check if user is partner_admin (not full admin)
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'partner_admin']);
      
      const hasAdmin = roles?.some(r => r.role === 'admin');
      const hasPartnerAdmin = roles?.some(r => r.role === 'partner_admin');
      setIsPartnerAdmin(!hasAdmin && !!hasPartnerAdmin);
    };
    checkRole();
  }, [user]);

  const fetchPartners = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // If partner_admin, first get bound partner IDs
      let boundPartnerIds: string[] | null = null;
      if (isPartnerAdmin) {
        const { data: bindings } = await supabase
          .from('partner_admin_bindings')
          .select('partner_id')
          .eq('user_id', user.id);
        boundPartnerIds = (bindings || []).map(b => b.partner_id);
        if (boundPartnerIds.length === 0) {
          setPartners([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from("partners")
        .select("id, partner_code, status, partner_type, total_referrals, total_l2_referrals, total_earnings, pending_balance, available_balance, withdrawn_amount, prepurchase_count, default_entry_type, default_entry_price, default_quota_amount, default_product_type, selected_experience_packages, created_at, user_id, company_name, contact_person, contact_phone, cooperation_note, custom_commission_rate_l1, custom_commission_rate_l2, traffic_source, settlement_cycle, custom_product_packages, commission_rate_l1, commission_rate_l2, partner_level, partner_expires_at")
        .eq("partner_type", "industry")
        .order("created_at", { ascending: false });

      if (boundPartnerIds) {
        query = query.in('id', boundPartnerIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = (data || []).map((p) => p.user_id).filter(Boolean);
      let nicknameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles" as any)
          .select("id, nickname")
          .in("id", userIds);
        if (profiles) {
          (profiles as any[]).forEach((p: any) => {
            nicknameMap[p.id] = p.nickname || "";
          });
        }
      }

      const partnerList = (data || []).map((p) => ({
        ...p,
        nickname: nicknameMap[p.user_id] || "",
      }));
      setPartners(partnerList);

      // If partner_admin with only one partner, auto-select it
      if (isPartnerAdmin && partnerList.length === 1 && !selectedPartnerId) {
        setSelectedPartnerId(partnerList[0].id);
      }
    } catch (err) {
      console.error("fetchPartners error:", err);
      toast.error("加载行业合伙人列表失败");
    } finally {
      setLoading(false);
    }
  }, [user, isPartnerAdmin, selectedPartnerId]);

  useEffect(() => {
    if (user) fetchPartners();
  }, [fetchPartners, user]);

  const handleCreate = async () => {
    if (!form.company_name.trim()) {
      toast.error("请填写公司/机构名称");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const partnerCode = generatePartnerCode();

      const { error } = await supabase.from("partners").insert({
        user_id: null,
        partner_code: partnerCode,
        partner_type: "industry",
        partner_level: "L1",
        status: "active",
        source: "admin",
        source_admin_id: user.id,
        source_note: `行业合伙人: ${form.company_name}`,
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        cooperation_note: form.cooperation_note.trim() || null,
        custom_commission_rate_l1: parseFloat(form.commission_l1) || 0.20,
        custom_commission_rate_l2: 0,
        commission_rate_l1: parseFloat(form.commission_l1) || 0.20,
        commission_rate_l2: 0,
        traffic_source: form.traffic_source.trim() || null,
        settlement_cycle: form.settlement_cycle || "monthly",
      } as any);

      if (error) throw error;

      toast.success("行业合伙人创建成功");
      setDialogOpen(false);
      setForm({
        company_name: "",
        contact_person: "",
        contact_phone: "",
        cooperation_note: "",
        commission_l1: "0.20",
        traffic_source: "",
        settlement_cycle: "monthly",
      });
      fetchPartners();
    } catch (err: any) {
      console.error("create error:", err);
      toast.error("创建失败: " + (err.message || "未知错误"));
    } finally {
      setCreating(false);
    }
  };

  const handleBindUser = async () => {
    if (!bindPhone.trim() || !bindPartnerId) return;
    setBinding(true);
    try {
      // Find user by phone
      const { data: profiles, error: profileError } = await supabase
        .from('profiles' as any)
        .select('id, display_name, phone')
        .eq('phone', bindPhone.trim())
        .limit(1);
      
      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        toast.error('未找到该手机号对应的用户');
        return;
      }

      const userId = (profiles as any[])[0].id;

      // Update partner's user_id
      const { error } = await supabase
        .from('partners')
        .update({ user_id: userId } as any)
        .eq('id', bindPartnerId);

      if (error) throw error;

      toast.success(`已绑定用户: ${(profiles as any[])[0].display_name || bindPhone}`);
      setBindDialogOpen(false);
      setBindPhone("");
      setBindPartnerId(null);
      fetchPartners();
    } catch (err: any) {
      toast.error('绑定失败: ' + (err.message || '未知错误'));
    } finally {
      setBinding(false);
    }
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.company_name || "").toLowerCase().includes(q) ||
      p.partner_code.toLowerCase().includes(q) ||
      (p.contact_person || "").toLowerCase().includes(q)
    );
  });

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  if (selectedPartnerId && selectedPartner) {
    return (
      <AdminPageLayout
        title={selectedPartner.company_name || selectedPartner.partner_code}
        actions={
          <Button variant="outline" size="sm" onClick={() => { setSelectedPartnerId(null); setSearchParams({}); }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回列表
          </Button>
        }
      >
        <Tabs defaultValue="flywheel" className="space-y-4">
          <TabsList className="flex-wrap">
            {!isPartnerAdmin && (
              <TabsTrigger value="info" className="gap-1">
                <Settings className="w-3.5 h-3.5" />
                基本信息
              </TabsTrigger>
            )}
            <TabsTrigger value="revenue" className="gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              收益看板
            </TabsTrigger>
            <TabsTrigger value="promotion" className="gap-1">
              <Share2 className="w-3.5 h-3.5" />
              推广链接
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              学员管理
            </TabsTrigger>
            <TabsTrigger value="flywheel">创建活动</TabsTrigger>
            <TabsTrigger value="coaches" className="gap-1">
              <Bot className="w-3.5 h-3.5" />
              AI 教练
            </TabsTrigger>
            <TabsTrigger value="assessments" className="gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              测评
            </TabsTrigger>
            <TabsTrigger value="bundles">组合产品</TabsTrigger>
            <TabsTrigger value="team" className="gap-1">
              <Users className="w-3.5 h-3.5" />
              团队成员
            </TabsTrigger>
            <TabsTrigger value="store">商城商品</TabsTrigger>
            <TabsTrigger value="orders">商城订单</TabsTrigger>
          </TabsList>
          {!isPartnerAdmin && (
            <TabsContent value="info">
              <PartnerInfoEditor partner={selectedPartner} onSaved={fetchPartners} onBindUser={(id) => { setBindPartnerId(id); setBindDialogOpen(true); }} />
            </TabsContent>
          )}
          <TabsContent value="revenue">
            <PartnerStats partner={{
              ...selectedPartner,
              total_earnings: (selectedPartner as any).total_earnings ?? 0,
              pending_balance: (selectedPartner as any).pending_balance ?? 0,
              available_balance: (selectedPartner as any).available_balance ?? 0,
              withdrawn_amount: (selectedPartner as any).withdrawn_amount ?? 0,
              total_referrals: (selectedPartner as any).total_referrals ?? 0,
              total_l2_referrals: (selectedPartner as any).total_l2_referrals ?? 0,
              commission_rate_l1: (selectedPartner as any).commission_rate_l1 ?? 0,
              commission_rate_l2: (selectedPartner as any).commission_rate_l2 ?? 0,
              partner_level: (selectedPartner as any).partner_level ?? 'L1',
              prepurchase_count: (selectedPartner as any).prepurchase_count ?? 0,
              partner_type: (selectedPartner as any).partner_type ?? 'industry',
              partner_code: selectedPartner.partner_code,
              source: 'admin',
              partner_expires_at: (selectedPartner as any).partner_expires_at ?? null,
              prepurchase_expires_at: null,
            } as any} />
          </TabsContent>
          <TabsContent value="promotion">
            <PromotionHub 
              partnerId={selectedPartnerId} 
              currentEntryType={(selectedPartner as any).default_entry_type || 'free'}
              prepurchaseCount={(selectedPartner as any).prepurchase_count ?? 0}
              currentSelectedPackages={(selectedPartner as any).selected_experience_packages}
            />
          </TabsContent>
          <TabsContent value="students">
            <ReferralList partnerId={selectedPartnerId} />
          </TabsContent>
          <TabsContent value="flywheel">
            <FlywheelGrowthSystem partnerId={selectedPartnerId} fromAdmin />
          </TabsContent>
          <TabsContent value="coaches">
            <PartnerCoachManager partnerId={selectedPartnerId} partnerCode={selectedPartner.partner_code} />
          </TabsContent>
          <TabsContent value="assessments">
            <PartnerAssessmentManager partnerId={selectedPartnerId} partnerCode={selectedPartner.partner_code} />
          </TabsContent>
          <TabsContent value="bundles">
            <PartnerProductBundles partnerId={selectedPartnerId} />
          </TabsContent>
          <TabsContent value="team">
            <PartnerTeamManager partnerId={selectedPartnerId} />
          </TabsContent>
          <TabsContent value="store">
            <PartnerStoreProducts partnerId={selectedPartnerId} />
          </TabsContent>
          <TabsContent value="orders">
            <PartnerStoreOrders partnerId={selectedPartnerId} />
          </TabsContent>
        </Tabs>

        {/* Bind User Dialog (detail view) */}
        <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>绑定用户账号</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                输入用户手机号，将其账号与此行业合伙人关联。绑定后合伙人可登录访问合伙人中心。
              </p>
              <div>
                <Label>手机号</Label>
                <Input
                  value={bindPhone}
                  onChange={(e) => setBindPhone(e.target.value)}
                  placeholder="请输入用户手机号"
                />
              </div>
              <Button onClick={handleBindUser} disabled={binding || !bindPhone.trim()} className="w-full">
                {binding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                确认绑定
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="行业合伙人"
      description="管理 B2B 渠道合作伙伴，配置独立佣金与 Campaign"
      actions={
        !isPartnerAdmin ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              新建行业合伙人
            </Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>新建行业合伙人</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>公司/机构名称 *</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="例如: XX心理咨询中心"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>联系人</Label>
                  <Input
                    value={form.contact_person}
                    onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <Label>联系电话</Label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="手机号"
                  />
                </div>
              </div>
              <div>
                <Label>佣金比例</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.commission_l1}
                  onChange={(e) => setForm((f) => ({ ...f, commission_l1: e.target.value }))}
                  placeholder="0.20 = 20%"
                />
                <p className="text-xs text-muted-foreground mt-1">{(parseFloat(form.commission_l1) * 100 || 0).toFixed(0)}%</p>
              </div>
              <div>
                <Label>流量来源</Label>
                <Input
                  value={form.traffic_source}
                  onChange={(e) => setForm((f) => ({ ...f, traffic_source: e.target.value }))}
                  placeholder="例如: 微信公众号、线下门店"
                />
              </div>
              <div>
                <Label>结算周期</Label>
                <select
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base"
                  value={form.settlement_cycle}
                  onChange={(e) => setForm((f) => ({ ...f, settlement_cycle: e.target.value }))}
                >
                  <option value="monthly">月结</option>
                  <option value="quarterly">季结</option>
                  <option value="yearly">年结</option>
                </select>
              </div>
              <div>
                <Label>合作备注</Label>
                <Textarea
                  value={form.cooperation_note}
                  onChange={(e) => setForm((f) => ({ ...f, cooperation_note: e.target.value }))}
                  placeholder="合作协议、特殊条款等"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : null
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          label="行业合伙人总数"
          value={partners.length}
          icon={Building2}
          accent="bg-primary/10 text-primary"
          loading={loading}
        />
        <AdminStatCard
          label="活跃合伙人"
          value={partners.filter((p) => p.status === "active").length}
          icon={Network}
          accent="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <AdminStatCard
          label="总推荐用户"
          value={partners.reduce((sum, p) => sum + (p.total_referrals || 0), 0)}
          icon={Network}
          accent="bg-blue-50 text-blue-600"
          loading={loading}
        />
      </div>

      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索公司名称、编码或联系人…"
        totalCount={filtered.length}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>公司/机构</TableHead>
                <TableHead>合伙人编码</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>绑定用户</TableHead>
                <TableHead>一级佣金</TableHead>
                
                <TableHead className="text-right">推荐用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedPartnerId(p.id)}>
                  <TableCell className="font-medium">{p.company_name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.partner_code}</TableCell>
                  <TableCell>{p.contact_person || "-"}</TableCell>
                  <TableCell>
                    {p.user_id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          已绑定
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          disabled={unbindingId === p.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("确认解除绑定？")) return;
                            setUnbindingId(p.id);
                            try {
                              const { error } = await supabase
                                .from("partners")
                                .update({ user_id: null } as any)
                                .eq("id", p.id);
                              if (error) throw error;
                              toast.success("已解除绑定");
                              fetchPartners();
                            } catch (err: any) {
                              toast.error("解绑失败");
                            } finally {
                              setUnbindingId(null);
                            }
                          }}
                        >
                          {unbindingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBindPartnerId(p.id);
                          setBindDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        绑定
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{((p.custom_commission_rate_l1 ?? 0.30) * 100).toFixed(0)}%</TableCell>
                  
                  <TableCell className="text-right">{p.total_referrals}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {p.status === "active" ? "活跃" : p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedPartnerId(p.id); }}>
                      <Network className="h-4 w-4 mr-1" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    暂无行业合伙人，点击右上角"新建"添加
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bind User Dialog */}
      <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>绑定用户账号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              输入用户手机号，将其账号与此行业合伙人关联。绑定后合伙人可登录访问合伙人中心。
            </p>
            <div>
              <Label>手机号</Label>
              <Input
                value={bindPhone}
                onChange={(e) => setBindPhone(e.target.value)}
                placeholder="请输入用户手机号"
              />
            </div>
            <Button onClick={handleBindUser} disabled={binding || !bindPhone.trim()} className="w-full">
              {binding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
              确认绑定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
