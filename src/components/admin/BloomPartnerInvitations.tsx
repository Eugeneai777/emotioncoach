import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Check, Search, RefreshCw, Download, UserPlus, Loader2, Plus, MoreHorizontal } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
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

const STATUS_OPTIONS = [
  { value: 'pending', label: '待领取' },
  { value: 'claimed', label: '已领取' },
  { value: 'expired', label: '已过期' },
  { value: 'skipped', label: '不需领取' },
] as const;

const STATUS_LABEL_MAP: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map(s => [s.value, s.label])
);

export function BloomPartnerInvitations() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isBatchRegistering, setIsBatchRegistering] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singleAmount, setSingleAmount] = useState("19800");
  const [singleCountryCode, setSingleCountryCode] = useState("+86");
  const [isAddingSingle, setIsAddingSingle] = useState(false);

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
    const link = `${getPromotionDomain()}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("邀请链接已复制");
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('partner_invitations')
      .update({ status: newStatus } as any)
      .eq('id', id);
    if (error) {
      toast.error('状态更新失败：' + error.message);
      return;
    }
    toast.success(`状态已更新为「${STATUS_LABEL_MAP[newStatus] || newStatus}」`);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待领取</Badge>;
      case 'claimed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已领取</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">已过期</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">不需领取</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: invitations?.length || 0,
    pending: invitations?.filter(i => i.status === 'pending').length || 0,
    claimed: invitations?.filter(i => i.status === 'claimed').length || 0,
    expired: invitations?.filter(i => i.status === 'expired').length || 0,
    skipped: invitations?.filter(i => i.status === 'skipped').length || 0,
  };

  const handleBatchRegister = async () => {
    setIsBatchRegistering(true);
    setBatchDialogOpen(false);
    try {
      const { data, error } = await supabase.functions.invoke('batch-register-bloom-partners');
      if (error) throw error;
      const result = data as { success: number; skipped: number; failed: number; details: any[] };
      toast.success(
        `批量注册完成：成功 ${result.success} 个，跳过 ${result.skipped} 个，失败 ${result.failed} 个`,
        { duration: 5000 }
      );
      refetch();
    } catch (err) {
      console.error('Batch register error:', err);
      toast.error('批量注册失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setIsBatchRegistering(false);
    }
  };

  const handleAddSingle = async () => {
    const name = singleName.trim();
    const phone = singlePhone.trim();
    if (!name || !phone) {
      toast.error('请填写姓名和手机号');
      return;
    }
    if (!/^\d{5,15}$/.test(phone)) {
      toast.error('手机号格式不正确（5-15位数字）');
      return;
    }

    setIsAddingSingle(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('请先登录'); return; }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'BLOOM';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const amount = parseFloat(singleAmount) || 19800;
      const { error } = await supabase.from('partner_invitations').insert({
        invite_code: code,
        partner_type: 'bloom',
        invitee_name: name,
        invitee_phone: phone,
        invitee_phone_country_code: singleCountryCode,
        order_amount: amount,
        status: 'pending',
        created_by: user.id,
      });

      if (error) throw error;

      toast.success(`已添加邀请：${name}（${code}）`);
      setSingleName('');
      setSinglePhone('');
      setAddDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Add single invitation error:', err);
      toast.error('添加失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setIsAddingSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">绽放合伙人邀请管理</h2>
        <div className="flex items-center gap-2">
          {stats.pending > 0 && (
            <AlertDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="default" disabled={isBatchRegistering}>
                  {isBatchRegistering ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-1" />
                  )}
                  {isBatchRegistering ? '注册中...' : '一键注册并发放权益'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认批量注册</AlertDialogTitle>
                  <AlertDialogDescription>
                    将为 <strong>{stats.pending}</strong> 条待处理邀请自动注册账号（手机号 + 密码 123456）并发放绽放合伙人权益（财富卡点测评 + 7天财富训练营）。
                    <br /><br />
                    已存在的手机号将跳过注册但仍会补发权益。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBatchRegister}>确认注册</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加邀请
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>添加单条邀请</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>姓名 *</Label>
                  <Input
                    placeholder="输入姓名"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>手机号 *</Label>
                  <div className="flex gap-2">
                    <Select value={singleCountryCode} onValueChange={setSingleCountryCode}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+852">🇭🇰 +852</SelectItem>
                        <SelectItem value="+886">🇹🇼 +886</SelectItem>
                        <SelectItem value="+65">🇸🇬 +65</SelectItem>
                        <SelectItem value="+81">🇯🇵 +81</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+61">🇦🇺 +61</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="输入手机号"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>订单金额（元）</Label>
                  <Input
                    type="number"
                    placeholder="19800"
                    value={singleAmount}
                    onChange={(e) => setSingleAmount(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
                  <Button onClick={handleAddSingle} disabled={isAddingSingle}>
                    {isAddingSingle ? '添加中...' : '确认添加'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <BloomPartnerBatchImport onSuccess={() => refetch()} />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
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
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.skipped}</div>
            <div className="text-sm text-muted-foreground">不需领取</div>
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
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => {
                if (!filteredInvitations?.length) return;
                const header = '邀请码,姓名,手机号,邀请链接,金额,状态,创建时间,领取时间\n';
                const rows = filteredInvitations.map(inv => {
                  const link = `${getPromotionDomain()}/invite/${inv.invite_code}`;
                  const status = STATUS_LABEL_MAP[inv.status] || inv.status;
                  const claimedAt = inv.claimed_at ? format(new Date(inv.claimed_at), 'yyyy-MM-dd HH:mm') : '';
                  return `${inv.invite_code},${inv.invitee_name || ''},${inv.invitee_phone || ''},${link},${inv.order_amount},${status},${format(new Date(inv.created_at), 'yyyy-MM-dd HH:mm')},${claimedAt}`;
                }).join('\n');
                const bom = '\uFEFF';
                const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' });
                saveAs(blob, `绽放合伙人名单_${format(new Date(), 'yyyyMMdd')}.csv`);
                toast.success('导出成功');
              }}>
                <Download className="h-4 w-4 mr-1" />
                导出CSV
              </Button>
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
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(inv.created_at), 'MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.claimed_at ? format(new Date(inv.claimed_at), 'MM-dd HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inv.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleCopyLink(inv.invite_code)}>
                                <Copy className="h-4 w-4 mr-2" />
                                复制邀请链接
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {STATUS_OPTIONS.filter(s => s.value !== inv.status).map(s => (
                            <DropdownMenuItem key={s.value} onClick={() => handleStatusUpdate(inv.id, s.value)}>
                              设为「{s.label}」
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
