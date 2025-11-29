import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { AddPartnerDialog } from "./AddPartnerDialog";

interface Partner {
  id: string;
  user_id: string;
  partner_code: string;
  status: string;
  source: string;
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

export function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPartners(data as any || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error("加载合伙人列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>合伙人管理</CardTitle>
              <CardDescription>
                共 {partners.length} 位合伙人
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              手动添加合伙人
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
                  <TableHead>来源</TableHead>
                  <TableHead>提成比例</TableHead>
                  <TableHead className="text-right">总收益</TableHead>
                  <TableHead className="text-right">推荐人数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      没有找到合伙人
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">
                        {partner.profiles?.display_name || '未知用户'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {partner.partner_code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {partner.source === 'purchase' ? '购买' : '手动添加'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        L1: {(partner.commission_rate_l1 * 100).toFixed(0)}% / 
                        L2: {(partner.commission_rate_l2 * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{partner.total_earnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {partner.total_referrals} / {partner.total_l2_referrals}
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
                  ))
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
