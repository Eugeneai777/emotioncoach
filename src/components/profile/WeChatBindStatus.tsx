import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWeChatBindStatus } from '@/hooks/useWeChatBindStatus';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser } from '@/utils/platform';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Bell, 
  Gift, 
  TrendingUp,
  Link2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeChatBindStatusProps {
  className?: string;
}

export function WeChatBindStatus({ className }: WeChatBindStatusProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isBound, isSubscribed, wechatInfo, isLoading, refetch } = useWeChatBindStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);

  const handleBind = async () => {
    if (isWeChatBrowser()) {
      // 微信内：直接拉起 OAuth 授权
      setBindLoading(true);
      try {
        const redirectUri = `${window.location.origin}/wechat-bindcallback`;
        const { data, error } = await supabase.functions.invoke('get-wechat-bind-url', {
          body: { redirectUri },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error('未获取到授权链接');
      } catch (err) {
        console.error('WeChat bind error:', err);
        toast({
          title: '绑定失败',
          description: '请稍后再试，或前往通知设置页绑定',
          variant: 'destructive',
        });
      } finally {
        setBindLoading(false);
      }
    } else {
      // 非微信浏览器：跳到通知页使用二维码绑定
      toast({
        title: '请在微信中操作',
        description: '微信绑定需要在微信浏览器中完成，已为您跳转到通知设置页',
      });
      navigate('/settings?tab=notifications');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className={cn('border-border shadow-sm', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const benefits = [
    { icon: Bell, label: '打卡提醒' },
    { icon: TrendingUp, label: '情绪报告' },
    { icon: Gift, label: '专属福利' },
  ];

  return (
    <Card className={cn('border-border shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            微信账号
          </CardTitle>
          {isBound && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-7 px-2"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {isBound ? '管理微信绑定和通知设置' : '绑定微信接收智能消息推送'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isBound ? (
          <>
            {/* 绑定状态 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={wechatInfo?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {wechatInfo?.nickname?.charAt(0) || '微'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {wechatInfo?.nickname || '微信用户'}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已绑定
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {isSubscribed ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      <Bell className="h-3 w-3 mr-1" />
                      已关注公众号
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      未关注公众号
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBind}
              className="w-full text-xs"
            >
              管理微信设置
            </Button>
          </>
        ) : (
          <>
            {/* 未绑定状态 */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">未绑定微信</span>
              </div>
            </div>

            {/* 绑定好处 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">绑定后可接收：</p>
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/50 text-xs"
                  >
                    <benefit.icon className="h-3 w-3 text-primary" />
                    <span>{benefit.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 绑定按钮 */}
            <Button onClick={handleBind} disabled={bindLoading} className="w-full">
              {bindLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              {bindLoading ? '正在跳转授权...' : '立即绑定微信账号'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
