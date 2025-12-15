import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Calendar, Clock } from 'lucide-react';

export const AccountBalance = () => {
  const { data: account, isLoading } = useQuery({
    queryKey: ['user-account'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { data: accountData } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return { account: accountData, subscription: subscriptionData };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account?.account) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">暂无账户信息</p>
        </CardContent>
      </Card>
    );
  }

  const accountData = account.account;
  const subscription = account.subscription;
  const isExpired = accountData.quota_expires_at 
    ? new Date(accountData.quota_expires_at) < new Date()
    : false;

  const isExpiringSoon = accountData.quota_expires_at 
    ? new Date(accountData.quota_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  const getSubscriptionBadge = () => {
    if (subscription?.subscription_type === 'member365') {
      return <Badge className="bg-gradient-to-r from-primary to-primary/80">365会员</Badge>;
    }
    if (subscription?.subscription_type === 'basic') {
      return <Badge variant="secondary">尝鲜会员</Badge>;
    }
    if (subscription?.subscription_type === 'custom') {
      return <Badge variant="secondary">自定义套餐</Badge>;
    }
    // 没有订阅记录时，显示"体验版"
    return <Badge variant="outline">体验版</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            我的账户
          </div>
          {getSubscriptionBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">剩余对话次数</span>
          <span className={`font-bold text-2xl ${isExpired ? 'text-muted-foreground' : 'text-primary'}`}>
            {accountData.remaining_quota || 0}
          </span>
        </div>
        
        {accountData.quota_expires_at && (
          <div className="flex items-center justify-between text-sm border-t pt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              有效期至
            </div>
            <span className={isExpired ? 'text-destructive font-medium' : isExpiringSoon ? 'text-amber-500 font-medium' : 'text-foreground'}>
              {new Date(accountData.quota_expires_at).toLocaleDateString('zh-CN')}
              {isExpired && <span className="ml-2 text-xs">(已过期)</span>}
              {!isExpired && isExpiringSoon && <span className="ml-2 text-xs">(即将过期)</span>}
            </span>
          </div>
        )}
        
        {isExpired && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            ⚠️ 您的套餐已过期，未使用次数已作废，请重新购买套餐
          </div>
        )}

        {subscription?.combo_name && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">套餐名称</span>
            <span className="font-medium">{subscription.combo_name}</span>
          </div>
        )}

        {accountData.last_sync_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>最后同步: {new Date(accountData.last_sync_at).toLocaleString('zh-CN')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
