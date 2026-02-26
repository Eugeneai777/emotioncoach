import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { format } from "date-fns";
import { RechargeDialog } from "./RechargeDialog";
import { UserActionMenu } from "./UserActionMenu";
import { UserDetailDialog } from "./UserDetailDialog";
import { Ban } from "lucide-react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminFilterBar } from "./shared/AdminFilterBar";

export function UserAccountsTable() {
  const [search, setSearch] = useState("");
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ 
    id: string; 
    name: string;
    avatarUrl?: string;
    authProvider?: string;
    createdAt?: string;
  } | null>(null);

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ['admin-accounts-enhanced'],
    queryFn: async () => {
      // 获取用户账户
      const { data: accountsData, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 并行获取所有关联数据
      const accountsWithDetails = await Promise.all(
        (accountsData || []).map(async (account) => {
            const [profileResult, subscriptionResult, wechatResult, paidOrderResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('display_name, avatar_url, auth_provider, created_at, is_disabled, disabled_at, disabled_reason, deleted_at, phone')
                .eq('id', account.user_id)
                .maybeSingle(),
              supabase
                .from('subscriptions')
                .select('subscription_type, status')
                .eq('user_id', account.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase
                .from('wechat_user_mappings')
                .select('nickname, subscribe_status, phone_number, avatar_url')
                .eq('system_user_id', account.user_id)
                .maybeSingle(),
              supabase
                .from('orders')
                .select('id')
                .eq('user_id', account.user_id)
                .eq('status', 'paid')
                .limit(1)
            ]);

            return {
              ...account,
              profile: profileResult.data,
              subscription: subscriptionResult.data,
              wechat: wechatResult.data,
              paidOrder: paidOrderResult.data && paidOrderResult.data.length > 0
            };
        })
      );

      // 过滤已删除的账号（软删除）
      return accountsWithDetails.filter(account => !account.profile?.deleted_at);
    }
  });

  const filteredAccounts = accounts?.filter(account => {
    const searchLower = search.toLowerCase();
    return (
      account.profile?.display_name?.toLowerCase().includes(searchLower) ||
      account.user_id.toLowerCase().includes(searchLower) ||
      account.wechat?.nickname?.toLowerCase().includes(searchLower) ||
      account.wechat?.phone_number?.includes(search) ||
      account.profile?.phone?.includes(search)
    );
  });

  if (isLoading) return <div>加载中...</div>;

  return (
    <AdminPageLayout title="用户管理" description="查看和管理所有用户账户">
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜索用户名/微信昵称/手机号/ID..."
        totalCount={filteredAccounts?.length}
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">用户</TableHead>
              <TableHead className="w-[100px]">额度</TableHead>
              <TableHead className="w-[100px]">会员类型</TableHead>
              <TableHead className="w-[80px]">付费</TableHead>
              <TableHead className="w-[120px]">过期时间</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[60px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts?.map((account) => {
              // 🆕 优先使用微信昵称和头像（如果 profile 中没有设置）
              const displayName = 
                account.profile?.display_name || 
                account.wechat?.nickname || 
                '未设置';
              const avatarUrl = 
                account.profile?.avatar_url || 
                account.wechat?.avatar_url;
              const authProvider = account.profile?.auth_provider || 'email';
              const isDisabled = account.profile?.is_disabled || false;

              return (
                <TableRow 
                  key={account.id} 
                  className={`${isDisabled ? "opacity-60" : ""} cursor-pointer hover:bg-muted/50`}
                  onClick={() => {
                    setSelectedUser({
                      id: account.user_id,
                      name: displayName,
                      avatarUrl: avatarUrl,
                      authProvider: authProvider,
                      createdAt: account.profile?.created_at
                    });
                    setDetailDialogOpen(true);
                  }}
                >
                  {/* 用户信息：头像+名字+注册来源+注册时间 */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {displayName[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[120px]">{displayName}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {authProvider === 'wechat' ? '💬微信' : authProvider === 'phone' ? '📱手机' : '📧邮箱'}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground/70">
                          {account.profile?.created_at 
                            ? `注册于 ${format(new Date(account.profile.created_at), 'yyyy-MM-dd HH:mm')}`
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* 额度 */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={account.remaining_quota > 10 ? "default" : "destructive"}>
                        {account.remaining_quota}
                      </Badge>
                      <span className="text-muted-foreground text-xs">/ {account.total_quota}</span>
                    </div>
                  </TableCell>

                  {/* 会员类型 */}
                  <TableCell>
                    <Badge variant="outline">
                    {(account.subscription?.subscription_type === '365' || account.subscription?.subscription_type === 'member365') ? '365会员' 
                       : account.subscription?.subscription_type === 'basic' ? '尝鲜会员'
                       : account.subscription?.subscription_type === 'custom' ? '自定义'
                       : '体验版'}
                    </Badge>
                  </TableCell>

                  {/* 付费状态 */}
                  <TableCell>
                    {account.paidOrder ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        已付费
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        未付费
                      </Badge>
                    )}
                  </TableCell>

                  {/* 过期时间 */}
                  <TableCell className="text-sm">
                    {account.quota_expires_at 
                      ? format(new Date(account.quota_expires_at), 'yyyy-MM-dd')
                      : <span className="text-green-600">永久有效</span>}
                  </TableCell>

                  {/* 状态 */}
                  <TableCell>
                    {isDisabled ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        已停用
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        正常
                      </Badge>
                    )}
                  </TableCell>

                  {/* 操作 */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <UserActionMenu
                      userId={account.user_id}
                      userName={displayName}
                      isDisabled={isDisabled}
                      onRecharge={() => {
                        setSelectedUser({
                          id: account.user_id,
                          name: displayName
                        });
                        setRechargeDialogOpen(true);
                      }}
                      onRefresh={() => refetch()}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {selectedUser && (
        <>
          <RechargeDialog
            open={rechargeDialogOpen}
            onOpenChange={setRechargeDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.name}
            onSuccess={() => refetch()}
          />
          <UserDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.name}
            avatarUrl={selectedUser.avatarUrl}
            authProvider={selectedUser.authProvider}
            createdAt={selectedUser.createdAt}
          />
        </>
      )}
    </AdminPageLayout>
  );
}
