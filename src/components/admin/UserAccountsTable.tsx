import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export function UserAccountsTable() {
  const [search, setSearch] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      const { data: accountsData, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and subscriptions separately
      const accountsWithDetails = await Promise.all(
        (accountsData || []).map(async (account) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', account.user_id)
            .maybeSingle();

          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('subscription_type, status')
            .eq('user_id', account.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...account,
            profile,
            subscription
          };
        })
      );

      return accountsWithDetails;
    }
  });

  const filteredAccounts = accounts?.filter(account => 
    account.profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    account.user_id.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div>加载中...</div>;

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索用户ID或显示名..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>剩余额度</TableHead>
            <TableHead>总额度</TableHead>
            <TableHead>会员类型</TableHead>
            <TableHead>过期时间</TableHead>
            <TableHead>最后同步</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAccounts?.map((account) => (
            <TableRow key={account.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{account.profile?.display_name || '未设置'}</div>
                  <div className="text-sm text-muted-foreground">{account.user_id.slice(0, 8)}...</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={account.remaining_quota > 10 ? "default" : "destructive"}>
                  {account.remaining_quota}
                </Badge>
              </TableCell>
              <TableCell>{account.total_quota}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {account.subscription?.subscription_type || 'free'}
                </Badge>
              </TableCell>
              <TableCell>
                {account.quota_expires_at 
                  ? format(new Date(account.quota_expires_at), 'yyyy-MM-dd')
                  : '-'}
              </TableCell>
              <TableCell>
                {account.last_sync_at 
                  ? format(new Date(account.last_sync_at), 'yyyy-MM-dd HH:mm')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
