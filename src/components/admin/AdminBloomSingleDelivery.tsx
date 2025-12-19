import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Heart,
  Sparkles,
  Sun,
  Download,
  Play,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { 
  useBloomSingleDeliveries, 
  useBloomSingleDeliveryStats,
  useUpdateBloomDelivery,
  useSyncSingleCampPurchases,
  BloomSingleDelivery 
} from '@/hooks/useBloomSingleDelivery';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

const CAMP_CONFIG: Record<string, { name: string; icon: typeof Sparkles; color: string }> = {
  identity_bloom: { name: '身份绽放营', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10' },
  emotion_bloom: { name: '情感绽放营', icon: Heart, color: 'text-pink-500 bg-pink-500/10' },
  life_bloom: { name: '生命绽放营', icon: Sun, color: 'text-amber-500 bg-amber-500/10' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: '待分配', variant: 'outline', icon: Clock },
  in_progress: { label: '进行中', variant: 'secondary', icon: Play },
  completed: { label: '已完成', variant: 'default', icon: CheckCircle2 },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

function DeliveryCard({ delivery, onStatusChange }: { 
  delivery: BloomSingleDelivery; 
  onStatusChange: (id: string, status: string) => void;
}) {
  const campConfig = CAMP_CONFIG[delivery.camp_type] || CAMP_CONFIG.identity_bloom;
  const Icon = campConfig.icon;
  const statusConfig = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={delivery.user_profile?.avatar_url || ''} />
              <AvatarFallback>
                {delivery.user_profile?.display_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {delivery.user_profile?.display_name || '未设置昵称'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(delivery.created_at), 'yyyy/MM/dd', { locale: zhCN })}
              </p>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1">
            <statusConfig.icon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        
        {/* Camp Type Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm ${campConfig.color}`}>
          <Icon className="h-4 w-4" />
          <span className="font-medium">{campConfig.name}</span>
        </div>
        
        {/* Order Info */}
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">订单金额</span>
            <span className="font-medium">{formatCurrency(delivery.order_amount)}</span>
          </div>
          
          {delivery.partner && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">推荐人</span>
              <span>{delivery.partner.name}</span>
            </div>
          )}
          
          {delivery.coach && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">带教教练</span>
              <span>{delivery.coach.name}</span>
            </div>
          )}
          
          {delivery.status === 'completed' && (
            <>
              <div className="flex justify-between text-green-600">
                <span>净利润</span>
                <span className="font-medium">{formatCurrency(delivery.profit)}</span>
              </div>
              {delivery.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">完成时间</span>
                  <span>{format(new Date(delivery.completed_at), 'MM/dd HH:mm')}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Status Update */}
        {delivery.status !== 'completed' && (
          <div className="mt-4 pt-3 border-t">
            <Select 
              value={delivery.status} 
              onValueChange={(value) => onStatusChange(delivery.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="更新状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待分配</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminBloomSingleDelivery() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: deliveries, isLoading, refetch } = useBloomSingleDeliveries(statusFilter);
  const { data: stats } = useBloomSingleDeliveryStats();
  const updateDelivery = useUpdateBloomDelivery();
  const syncPurchases = useSyncSingleCampPurchases();
  
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateDelivery.mutateAsync({
        id,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      });
      toast.success('状态已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };
  
  const handleSync = async () => {
    try {
      const result = await syncPurchases.mutateAsync();
      toast.success(`同步完成，新增 ${result.synced} 条记录`);
    } catch (error) {
      toast.error('同步失败');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">绽放单营交付管理</h1>
          <p className="text-muted-foreground">单独购买的绽放训练营交付进度跟踪</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={syncPurchases.isPending}
          >
            <Download className={`h-4 w-4 mr-1 ${syncPurchases.isPending ? 'animate-spin' : ''}`} />
            同步订单
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">总订单</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              <p className="text-xs text-muted-foreground">待分配</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Play className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.in_progress || 0}</p>
              <p className="text-xs text-muted-foreground">进行中</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              <p className="text-xs text-muted-foreground">已完成</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats?.confirmedRevenue || 0)}</p>
              <p className="text-xs text-muted-foreground">确认收入</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats?.totalProfit || 0)}</p>
              <p className="text-xs text-muted-foreground">已确认利润</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待分配</TabsTrigger>
          <TabsTrigger value="in_progress">进行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Deliveries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : deliveries?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无订单数据</p>
            <Button variant="link" onClick={handleSync} className="mt-2">
              点击同步订单数据
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deliveries?.map((delivery) => (
            <DeliveryCard 
              key={delivery.id} 
              delivery={delivery} 
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
