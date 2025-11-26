import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";
import { RechargeDialog } from "./RechargeDialog";
import { Plus } from "lucide-react";

export function UserAccountsTable() {
  const [search, setSearch] = useState("");
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const { data: accounts, isLoading, refetch } = useQuery({
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
            <TableHead>操作</TableHead>
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
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser({
                      id: account.user_id,
                      name: account.profile?.display_name || account.user_id.slice(0, 8)
                    });
                    setRechargeDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  充值
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <RechargeDialog
          open={rechargeDialogOpen}
          onOpenChange={setRechargeDialogOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
