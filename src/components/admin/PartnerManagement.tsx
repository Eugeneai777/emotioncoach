import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Flame, Gem, Zap } from "lucide-react";
import { AddPartnerDialog } from "./AddPartnerDialog";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminFilterBar } from "./shared/AdminFilterBar";
import { AdminStatCard } from "./shared/AdminStatCard";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Partner {
  id: string;
  user_id: string;
  partner_code: string;
  status: string;
  source: string;
  partner_level: string;
  prepurchase_count: number;
  prepurchase_expires_at: string | null;
  commission_rate_l1: number;
  commission_rate_l2: number;
  total_earnings: number;
  available_balance: number;
  total_referrals: number;
  total_l2_referrals: number;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

const LEVEL_CONFIG = {
  L1: { name: '初级', icon: Zap, gradient: 'from-orange-400 to-amber-400', commission: { l1: 20, l2: 0 } },
  L2: { name: '高级', icon: Flame, gradient: 'from-orange-500 to-amber-500', commission: { l1: 35, l2: 0 } },
  L3: { name: '钻石', icon: Gem, gradient: 'from-orange-600 to-amber-600', commission: { l1: 50, l2: 10 } },
};

export function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchPartners = async () => {
    try {
      // Step 1: Fetch partners
      let query = supabase
        .from('partners')
        .select('*')
        .eq('partner_type', 'youjin')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (levelFilter !== 'all') {
        query = query.eq('partner_level', levelFilter);
      }

      const { data: partnersData, error: partnersError } = await query;
      if (partnersError) throw partnersError;

      if (!partnersData || partnersData.length === 0) {
        setPartners([]);
        return;
      }

      // Step 2: Fetch profiles separately
      const userIds = partnersData.map(p => p.user_id).filter(Boolean);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Step 3: Merge data
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, { display_name: p.display_name }])
      );

      const mergedData = partnersData.map(partner => ({
        ...partner,
        profiles: profilesMap.get(partner.user_id) || null
      }));
      
      setPartners(mergedData as Partner[]);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error("加载有劲合伙人列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter, levelFilter]);

  const handleToggleStatus = async (partnerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success(`已${newStatus === 'active' ? '启用' : '暂停'}合伙人`);
      fetchPartners();
    } catch (error) {
      console.error('Error toggling partner status:', error);
      toast.error("操作失败");
    }
  };

  const filteredPartners = partners.filter(p => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      p.partner_code.toLowerCase().includes(searchLower) ||
      p.profiles?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // 统计各等级数量
  const levelStats = {
    L1: partners.filter(p => p.partner_level === 'L1').length,
    L2: partners.filter(p => p.partner_level === 'L2').length,
    L3: partners.filter(p => p.partner_level === 'L3').length,
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: '永久', variant: 'default' as const };
    const days = differenceInDays(new Date(expiresAt), new Date());
    if (days < 0) return { label: '已过期', variant: 'destructive' as const };
    if (days <= 30) return { label: `${days}天后`, variant: 'secondary' as const };
    return { label: '有效', variant: 'default' as const };
  };

  const LevelBadge = ({ level }: { level: string }) => {
    const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
    if (!config) return <Badge variant="outline">{level}</Badge>;
    const Icon = config.icon;
    return (
      <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {level} {config.name}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AdminPageLayout
      title="💪 有劲合伙人管理"
      description={`共 ${partners.length} 位有劲合伙人`}
      actions={
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
          <Plus className="w-4 h-4" />
          添加有劲合伙人
        </Button>
      }
    >
      {/* 等级统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={level}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${levelFilter === level ? 'ring-2 ring-orange-500 rounded-xl' : ''}`}
              onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
            >
              <AdminStatCard
                label={`${level} ${config.name}`}
                value={`${levelStats[level as keyof typeof levelStats]} 人`}
                icon={Icon}
                accent={`bg-gradient-to-r ${config.gradient} text-white`}
              />
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜索推广码或用户名..."
        totalCount={filteredPartners.length}
      >
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="等级筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            <SelectItem value="L1">L1 初级</SelectItem>
            <SelectItem value="L2">L2 高级</SelectItem>
            <SelectItem value="L3">L3 钻石</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">活跃</SelectItem>
            <SelectItem value="suspended">已暂停</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>推广码</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>佣金比例</TableHead>
                <TableHead className="text-right">预购数量</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead className="text-right">总收益</TableHead>
                <TableHead className="text-right">推荐</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    没有找到有劲合伙人
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => {
                  const expiryStatus = getExpiryStatus(partner.prepurchase_expires_at);
                  return (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">
                        {partner.profiles?.display_name || '未知用户'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {partner.partner_code}
                      </TableCell>
                      <TableCell>
                        <LevelBadge level={partner.partner_level || 'L1'} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {(partner.commission_rate_l1 * 100).toFixed(0)}% / {(partner.commission_rate_l2 * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {partner.prepurchase_count || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expiryStatus.variant}>
                          {expiryStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{partner.total_earnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {partner.total_referrals}/{partner.total_l2_referrals}
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                          {partner.status === 'active' ? '活跃' : '已暂停'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(partner.id, partner.status)}
                        >
                          {partner.status === 'active' ? '暂停' : '启用'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddPartnerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchPartners}
      />
    </AdminPageLayout>
  );
}
