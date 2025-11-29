import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Download, Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RedemptionCode {
  id: string;
  code: string;
  status: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
}

interface RedemptionCodeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
}

export function RedemptionCodeManager({ open, onOpenChange, partnerId }: RedemptionCodeManagerProps) {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'redeemed' | 'expired'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open && partnerId) {
      fetchCodes();
    }
  }, [open, partnerId, filter]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('partner_redemption_codes')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error('Failed to fetch codes:', error);
      toast.error('加载兑换码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('兑换码已复制');
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/redeem?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('兑换链接已复制');
  };

  const handleExportCodes = () => {
    const csvContent = [
      ['兑换码', '状态', '创建时间', '兑换时间', '过期时间'].join(','),
      ...filteredCodes.map(code => [
        code.code,
        getStatusText(code.status),
        new Date(code.created_at).toLocaleString(),
        code.redeemed_at ? new Date(code.redeemed_at).toLocaleString() : '-',
        new Date(code.expires_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `兑换码列表_${new Date().toLocaleDateString()}.csv`;
    link.click();
    toast.success('导出成功');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可用';
      case 'redeemed': return '已兑换';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'available': return 'default';
      case 'redeemed': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: codes.length,
    available: codes.filter(c => c.status === 'available').length,
    redeemed: codes.filter(c => c.status === 'redeemed').length,
    expired: codes.filter(c => c.status === 'expired').length
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>兑换码管理</DialogTitle>
          <DialogDescription>
            查看和管理您的所有兑换码
          </DialogDescription>
        </DialogHeader>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">总数</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-muted-foreground">可用</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.redeemed}</div>
            <div className="text-sm text-muted-foreground">已兑换</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">已过期</div>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索兑换码..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleExportCodes} className="gap-2">
            <Download className="w-4 h-4" />
            导出
          </Button>
        </div>

        {/* 过滤标签 */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="available">可用</TabsTrigger>
            <TabsTrigger value="redeemed">已兑换</TabsTrigger>
            <TabsTrigger value="expired">已过期</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 兑换码列表 */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无兑换码</div>
          ) : (
            filteredCodes.map((code) => (
              <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{code.code}</span>
                    <Badge variant={getStatusVariant(code.status)}>
                      {getStatusText(code.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    创建于 {new Date(code.created_at).toLocaleDateString()}
                    {code.redeemed_at && ` · 兑换于 ${new Date(code.redeemed_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleCopyCode(code.code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyLink(code.code)}>
                    复制链接
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}