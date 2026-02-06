import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, RefreshCw, Copy, Search, Key, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ActivationCodeBatchGenerate } from './ActivationCodeBatchGenerate';

interface ActivationCode {
  id: string;
  code: string;
  batch_name: string | null;
  source_channel: string | null;
  is_used: boolean;
  redeemed_at: string | null;
  redeemed_by: string | null;
  expires_at: string | null;
  created_at: string;
}

type StatusFilter = 'all' | 'unused' | 'used' | 'expired';

export function ActivationCodeManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [showBatchGenerate, setShowBatchGenerate] = useState(false);

  // 获取激活码列表
  const { data: codes = [], isLoading, refetch } = useQuery({
    queryKey: ['activation-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_assessment_activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActivationCode[];
    },
  });

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const total = codes.length;
    const used = codes.filter(c => c.is_used).length;
    const expired = codes.filter(c => 
      !c.is_used && c.expires_at && new Date(c.expires_at) < now
    ).length;
    const unused = total - used - expired;

    return { total, used, unused, expired };
  }, [codes]);

  // 获取唯一的批次和渠道列表
  const { batches, channels } = useMemo(() => {
    const batchSet = new Set<string>();
    const channelSet = new Set<string>();
    
    codes.forEach(code => {
      if (code.batch_name) batchSet.add(code.batch_name);
      if (code.source_channel) channelSet.add(code.source_channel);
    });

    return {
      batches: Array.from(batchSet).sort(),
      channels: Array.from(channelSet).sort(),
    };
  }, [codes]);

  // 筛选激活码
  const filteredCodes = useMemo(() => {
    const now = new Date();
    
    return codes.filter(code => {
      // 搜索过滤
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!code.code.toLowerCase().includes(search)) {
          return false;
        }
      }

      // 状态过滤
      if (statusFilter !== 'all') {
        const isExpired = !code.is_used && code.expires_at && new Date(code.expires_at) < now;
        
        if (statusFilter === 'used' && !code.is_used) return false;
        if (statusFilter === 'unused' && (code.is_used || isExpired)) return false;
        if (statusFilter === 'expired' && !isExpired) return false;
      }

      // 批次过滤
      if (batchFilter !== 'all' && code.batch_name !== batchFilter) {
        return false;
      }

      // 渠道过滤
      if (channelFilter !== 'all' && code.source_channel !== channelFilter) {
        return false;
      }

      return true;
    });
  }, [codes, searchTerm, statusFilter, batchFilter, channelFilter]);

  // 获取激活码状态
  const getCodeStatus = (code: ActivationCode) => {
    if (code.is_used) {
      return { label: '已使用', variant: 'secondary' as const, icon: CheckCircle };
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return { label: '已过期', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: '未使用', variant: 'default' as const, icon: Clock };
  };

  // 复制激活链接
  const copyActivationLink = async (code: string) => {
    const link = `${window.location.origin}/wealth-block-activate?code=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('激活链接已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">财富测评激活码管理</h1>
          <p className="text-muted-foreground">管理和生成财富测评激活码</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowBatchGenerate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            批量生成
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已使用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.used}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">未使用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.unused}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已过期</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">{stats.expired}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区域 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索激活码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="unused">未使用</SelectItem>
            <SelectItem value="used">已使用</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>

        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="批次筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部批次</SelectItem>
            {batches.map(batch => (
              <SelectItem key={batch} value={batch}>{batch}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="渠道筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道</SelectItem>
            {channels.map(channel => (
              <SelectItem key={channel} value={channel}>{channel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 激活码列表 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无激活码数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>激活码</TableHead>
                  <TableHead>批次</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>使用者</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => {
                  const status = getCodeStatus(code);
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{code.batch_name || '-'}</TableCell>
                      <TableCell>{code.source_channel || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {code.is_used && code.redeemed_by
                          ? code.redeemed_by.slice(0, 8) + '...'
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {code.expires_at
                          ? format(new Date(code.expires_at), 'yyyy-MM-dd', { locale: zhCN })
                          : '永久有效'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(code.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyActivationLink(code.code)}
                          disabled={code.is_used}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 批量生成对话框 */}
      <ActivationCodeBatchGenerate
        open={showBatchGenerate}
        onOpenChange={setShowBatchGenerate}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['activation-codes'] });
        }}
      />
    </div>
  );
}
