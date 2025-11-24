import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function SyncStatusDashboard() {
  const { data: syncStatus, refetch } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('last_sync_at, sync_source')
        .order('last_sync_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const handleManualSync = async () => {
    try {
      toast.loading("正在同步MySQL数据...");
      
      const { data, error } = await supabase.functions.invoke('mysql-sync', {
        method: 'POST'
      });

      if (error) throw error;

      toast.success("同步成功！");
      refetch();
    } catch (error) {
      console.error('同步失败:', error);
      toast.error("同步失败，请查看控制台");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>MySQL 同步状态</CardTitle>
          <CardDescription>查看和管理外部数据库同步</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">最后同步时间</p>
              <p className="text-lg font-medium">
                {syncStatus?.last_sync_at 
                  ? format(new Date(syncStatus.last_sync_at), 'yyyy-MM-dd HH:mm:ss')
                  : '从未同步'}
              </p>
            </div>
            <Button onClick={handleManualSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              手动同步
            </Button>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">同步来源</p>
            <p className="text-lg font-medium">{syncStatus?.sync_source || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
