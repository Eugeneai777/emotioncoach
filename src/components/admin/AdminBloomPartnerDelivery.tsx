import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Heart,
  Sparkles,
  Sun
} from 'lucide-react';
import { useBloomPartnerOrders, BloomPartnerOrder } from '@/hooks/useBloomPartnerOrders';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const CAMP_CONFIG = {
  identity: { name: '身份绽放营', icon: Sparkles, price: 2980, color: 'text-purple-500' },
  emotion: { name: '情感绽放营', icon: Heart, price: 3980, color: 'text-pink-500' },
  life: { name: '生命绽放营', icon: Sun, price: 12800, color: 'text-amber-500' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: '待分配', variant: 'outline', icon: Clock },
  in_progress: { label: '进行中', variant: 'secondary', icon: AlertCircle },
  completed: { label: '已完成', variant: 'default', icon: CheckCircle2 },
};

function CampStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function DeliveryProgressBar({ order }: { order: BloomPartnerOrder }) {
  const completedCount = [
    order.identity_status === 'completed',
    order.emotion_status === 'completed',
    order.life_status === 'completed',
  ].filter(Boolean).length;
  
  const inProgressCount = [
    order.identity_status === 'in_progress',
    order.emotion_status === 'in_progress',
    order.life_status === 'in_progress',
  ].filter(Boolean).length;
  
  const progress = (completedCount / 3) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>交付进度</span>
        <span>{completedCount}/3 完成{inProgressCount > 0 ? `, ${inProgressCount} 进行中` : ''}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

function OrderCard({ order }: { order: BloomPartnerOrder }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={order.user_profile?.avatar_url || ''} />
              <AvatarFallback>
                {order.user_profile?.display_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {order.user_profile?.display_name || '未设置昵称'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'yyyy/MM/dd HH:mm', { locale: zhCN })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={
                order.delivery_status === 'completed' ? 'default' :
                order.delivery_status === 'partial' ? 'secondary' : 'outline'
              }
            >
              {order.delivery_status === 'completed' ? '已完成' :
               order.delivery_status === 'partial' ? '进行中' : '待开始'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              ¥{order.order_amount.toLocaleString()}
            </p>
          </div>
        </div>
        
        {order.partner && (
          <div className="mb-3 text-xs text-muted-foreground">
            推荐人: {order.partner_profile?.display_name || order.partner.partner_code}
          </div>
        )}
        
        <DeliveryProgressBar order={order} />
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {(['identity', 'emotion', 'life'] as const).map((type) => {
            const config = CAMP_CONFIG[type];
            const Icon = config.icon;
            const status = order[`${type}_status`];
            
            return (
              <div 
                key={type}
                className="p-2 rounded-lg bg-muted/50 text-center"
              >
                <Icon className={`h-4 w-4 mx-auto mb-1 ${config.color}`} />
                <p className="text-xs font-medium truncate">{config.name}</p>
                <div className="mt-1">
                  <CampStatusBadge status={status} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBloomPartnerDelivery() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: orders, isLoading, refetch } = useBloomPartnerOrders(statusFilter);
  
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.delivery_status === 'pending').length || 0,
    partial: orders?.filter(o => o.delivery_status === 'partial').length || 0,
    completed: orders?.filter(o => o.delivery_status === 'completed').length || 0,
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
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
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">待开始</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.partial}</p>
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
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">已完成</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter and Refresh */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待开始</TabsTrigger>
            <TabsTrigger value="partial">进行中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>
      
      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无订单数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders?.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
