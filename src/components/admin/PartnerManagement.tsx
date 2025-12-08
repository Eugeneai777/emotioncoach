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
      let query = supabase
        .from('partners')
        .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
        .eq('partner_type', 'youjin')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (levelFilter !== 'all') {
        query = query.eq('partner_level', levelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPartners(data as any || []);
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
    <div className="space-y-4">
      {/* 等级统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          const Icon = config.icon;
          return (
            <Card 
              key={level} 
              className={`cursor-pointer transition-all hover:scale-105 ${levelFilter === level ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{level} {config.name}</div>
                    <div className="text-2xl font-bold">{levelStats[level as keyof typeof levelStats]} 人</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                💪 有劲合伙人管理
              </CardTitle>
              <CardDescription>
                共 {partners.length} 位有劲合伙人
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Plus className="w-4 h-4" />
              添加有劲合伙人
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索推广码或用户名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="等级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="L1">L1 初级</SelectItem>
                <SelectItem value="L2">L2 高级</SelectItem>
                <SelectItem value="L3">L3 钻石</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
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
        </CardContent>
      </Card>

      <AddPartnerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchPartners}
      />
    </div>
  );
}
