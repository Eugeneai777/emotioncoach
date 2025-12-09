import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Download, Search, Plus, Loader2, QrCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import QRCode from "qrcode";

// 正式发布域名
const PRODUCTION_DOMAIN = 'https://eugeneai.me';
const isProductionEnv = () => {
  const host = window.location.host;
  const productionHost = new URL(PRODUCTION_DOMAIN).host;
  return host === productionHost || !host.includes('lovable');
};
const getPromotionDomain = () => isProductionEnv() ? window.location.origin : PRODUCTION_DOMAIN;

interface RedemptionCode {
  id: string;
  code: string;
  status: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
  entry_type: string | null;
  entry_price: number | null;
  quota_amount: number | null;
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
  
  // 生成兑换码对话框状态
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateCount, setGenerateCount] = useState('10');
  const [generateEntryType, setGenerateEntryType] = useState<'free' | 'paid'>('free');
  const [generating, setGenerating] = useState(false);

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

  const handleGenerateCodes = async () => {
    const count = parseInt(generateCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast.error('请输入1-100之间的数量');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-redemption-codes', {
        body: { 
          partner_id: partnerId, 
          count, 
          entry_type: generateEntryType 
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`成功生成 ${data.count} 个${generateEntryType === 'free' ? '免费' : '9.9元'}兑换码`);
      setShowGenerateDialog(false);
      fetchCodes();
    } catch (error: any) {
      console.error('Failed to generate codes:', error);
      toast.error('生成兑换码失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('兑换码已复制');
  };

  const handleGenerateCodeQR = async (code: string) => {
    try {
      const domain = getPromotionDomain();
      const redemptionUrl = `${domain}/redeem?code=${code}`;
      
      const qrUrl = await QRCode.toDataURL(redemptionUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#f97316', light: '#ffffff' }
      });

      // 下载二维码
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `兑换码_${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('二维码已下载');
    } catch (error) {
      console.error('Generate QR failed:', error);
      toast.error('生成二维码失败');
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/redeem?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('兑换链接已复制');
  };

  const handleExportCodes = () => {
    const csvContent = [
      ['兑换码', '入口类型', '额度', '状态', '创建时间', '兑换时间', '过期时间'].join(','),
      ...filteredCodes.map(code => [
        code.code,
        getEntryTypeText(code.entry_type),
        code.quota_amount || '-',
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

  const getEntryTypeText = (entryType: string | null) => {
    switch (entryType) {
      case 'free': return '🆓 免费';
      case 'paid': return '💰 9.9元';
      default: return '🆓 免费';
    }
  };

  const getEntryTypeBadgeVariant = (entryType: string | null): "default" | "secondary" | "outline" => {
    return entryType === 'paid' ? 'default' : 'outline';
  };

  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: codes.length,
    available: codes.filter(c => c.status === 'available').length,
    redeemed: codes.filter(c => c.status === 'redeemed').length,
    expired: codes.filter(c => c.status === 'expired').length,
    freeAvailable: codes.filter(c => c.status === 'available' && c.entry_type === 'free').length,
    paidAvailable: codes.filter(c => c.status === 'available' && c.entry_type === 'paid').length
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>兑换码管理</DialogTitle>
            <DialogDescription>
              查看和管理您的所有兑换码
            </DialogDescription>
          </DialogHeader>

          {/* 统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总数</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-muted-foreground">
                可用 (🆓{stats.freeAvailable} / 💰{stats.paidAvailable})
              </div>
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
            <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              生成
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-lg">{code.code}</span>
                      <Badge variant={getStatusVariant(code.status)}>
                        {getStatusText(code.status)}
                      </Badge>
                      <Badge variant={getEntryTypeBadgeVariant(code.entry_type)}>
                        {getEntryTypeText(code.entry_type)}
                      </Badge>
                      {code.quota_amount && (
                        <span className="text-xs text-muted-foreground">
                          {code.quota_amount}次额度
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      创建于 {new Date(code.created_at).toLocaleDateString()}
                      {code.redeemed_at && ` · 兑换于 ${new Date(code.redeemed_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleCopyCode(code.code)} title="复制兑换码">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyLink(code.code)} title="复制链接">
                      复制链接
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleGenerateCodeQR(code.code)} title="生成二维码">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 生成兑换码对话框 */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>生成兑换码</DialogTitle>
            <DialogDescription>
              选择入口类型和生成数量
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 入口类型选择 */}
            <div className="space-y-3">
              <Label>入口类型</Label>
              <RadioGroup
                value={generateEntryType}
                onValueChange={(v) => setGenerateEntryType(v as 'free' | 'paid')}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`relative flex cursor-pointer rounded-lg border p-4 ${generateEntryType === 'free' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="free" id="free" className="sr-only" />
                  <Label htmlFor="free" className="flex flex-col cursor-pointer">
                    <span className="text-2xl mb-1">🆓</span>
                    <span className="font-semibold">免费入口</span>
                    <span className="text-sm text-muted-foreground">10次对话额度</span>
                    <span className="text-xs text-green-600 mt-1">¥0</span>
                  </Label>
                </div>
                <div className={`relative flex cursor-pointer rounded-lg border p-4 ${generateEntryType === 'paid' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="paid" id="paid" className="sr-only" />
                  <Label htmlFor="paid" className="flex flex-col cursor-pointer">
                    <span className="text-2xl mb-1">💰</span>
                    <span className="font-semibold">9.9元入口</span>
                    <span className="text-sm text-muted-foreground">50次对话额度</span>
                    <span className="text-xs text-orange-600 mt-1">¥9.9</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 生成数量 */}
            <div className="space-y-2">
              <Label htmlFor="count">生成数量</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                placeholder="1-100"
              />
              <p className="text-xs text-muted-foreground">
                每次最多生成100个兑换码
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGenerateDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerateCodes}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    生成 {generateCount} 个
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
