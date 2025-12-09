import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface Commission {
  id: string;
  order_id: string;
  order_type: string;
  order_amount: number;
  commission_level: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  confirm_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

interface CommissionHistoryProps {
  partnerId: string;
}

export function CommissionHistory({ partnerId }: CommissionHistoryProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        let query = supabase
          .from('partner_commissions')
          .select('*')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setCommissions(data || []);
      } catch (error) {
        console.error('Error fetching commissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [partnerId, filter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: '待确认' },
      confirmed: { variant: 'default' as const, label: '已确认' },
      cancelled: { variant: 'destructive' as const, label: '已取消' }
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOrderTypeName = (type: string) => {
    const names: Record<string, string> = {
      basic: '尝鲜会员',
      member365: '365会员',
      partner: '合伙人套餐'
    };
    return names[type] || type;
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
    <Card>
      <CardHeader>
        <CardTitle>佣金明细</CardTitle>
        <CardDescription>
          共 {commissions.length} 条记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-4">
          <TabsList>
            <ResponsiveTabsTrigger value="all" label="全部" />
            <ResponsiveTabsTrigger value="pending" label="待确认" shortLabel="待确" />
            <ResponsiveTabsTrigger value="confirmed" label="已确认" shortLabel="已确" />
            <ResponsiveTabsTrigger value="cancelled" label="已取消" shortLabel="取消" />
          </TabsList>

          <div className="space-y-4">
            {commissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto opacity-50 mb-2" />
                <p>暂无佣金记录</p>
              </div>
            ) : (
              commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getOrderTypeName(commission.order_type)}
                      </span>
                      <Badge variant="outline">
                        {commission.commission_level === 1 ? '一级' : '二级'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>订单金额: ¥{commission.order_amount.toFixed(2)}</div>
                      <div>
                        {format(new Date(commission.created_at), 'PPP', { locale: zhCN })}
                      </div>
                      {commission.status === 'pending' && commission.confirm_at && (
                        <div className="text-amber-600">
                          预计确认: {format(new Date(commission.confirm_at), 'PPP', { locale: zhCN })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-lg font-bold text-green-600">
                      +¥{commission.commission_amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(commission.commission_rate * 100).toFixed(0)}%
                    </div>
                    {getStatusBadge(commission.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
