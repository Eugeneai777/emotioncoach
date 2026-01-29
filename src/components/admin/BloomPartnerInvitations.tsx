import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Search, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { BloomPartnerBatchImport } from "./BloomPartnerBatchImport";

interface Invitation {
  id: string;
  invite_code: string;
  partner_type: string;
  invitee_name: string | null;
  invitee_phone: string | null;
  order_amount: number;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
  notes: string | null;
}

export function BloomPartnerInvitations() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['partner-invitations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('partner_invitations')
        .select('*')
        .eq('partner_type', 'bloom')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invitation[];
    },
  });

  const filteredInvitations = invitations?.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invite_code.toLowerCase().includes(term) ||
      inv.invitee_name?.toLowerCase().includes(term) ||
      inv.invitee_phone?.includes(term)
    );
  });

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("邀请链接已复制");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待领取</Badge>;
      case 'claimed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已领取</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: invitations?.length || 0,
    pending: invitations?.filter(i => i.status === 'pending').length || 0,
    claimed: invitations?.filter(i => i.status === 'claimed').length || 0,
    expired: invitations?.filter(i => i.status === 'expired').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">绽放合伙人邀请管理</h2>
        <BloomPartnerBatchImport onSuccess={() => refetch()} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">总邀请数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">待领取</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.claimed}</div>
            <div className="text-sm text-muted-foreground">已领取</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">已过期</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>邀请列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名、手机号或邀请码"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待领取</SelectItem>
                  <SelectItem value="claimed">已领取</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredInvitations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无邀请记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邀请码</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>领取时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations?.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invite_code}</TableCell>
                    <TableCell>{inv.invitee_name || '-'}</TableCell>
                    <TableCell>{inv.invitee_phone || '-'}</TableCell>
                    <TableCell>¥{inv.order_amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(inv.created_at), 'MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.claimed_at ? format(new Date(inv.claimed_at), 'MM-dd HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(inv.invite_code)}
                        >
                          {copiedCode === inv.invite_code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
