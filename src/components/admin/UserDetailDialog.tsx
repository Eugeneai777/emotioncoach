import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  FileText, 
  Calendar, 
  TrendingUp,
  Users,
  Mic,
  BookOpen
} from "lucide-react";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  avatarUrl?: string;
  authProvider?: string;
  createdAt?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
}

function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserDetailDialog({
  open,
  onOpenChange,
  userId,
  userName,
  avatarUrl,
  authProvider,
  createdAt,
}: UserDetailDialogProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-detail-stats', userId],
    queryFn: async () => {
      const now = new Date();
      const last7Days = subDays(now, 7);
      const last30Days = subDays(now, 30);

      // 并行查询所有统计数据
      const [
        conversationsResult,
        briefingsResult,
        recentConversationsResult,
        coachingSessionsResult,
        communityPostsResult,
        trainingCampsResult,
        usageRecordsResult
      ] = await Promise.all([
        // 总对话数
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // 总简报数
        supabase
          .from('briefings')
          .select('id, created_at', { count: 'exact' })
          .eq('conversation_id', userId), // 需要通过conversation关联
        // 最近7天对话数
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', last7Days.toISOString()),
        // 情绪教练会话数
        supabase
          .from('emotion_coaching_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // 社区帖子数
        supabase
          .from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // 训练营参与
        supabase
          .from('training_camps')
          .select('id, status, camp_type')
          .eq('user_id', userId),
        // 使用记录（最近30天）
        supabase
          .from('usage_records')
          .select('id, amount, created_at')
          .eq('user_id', userId)
          .gte('created_at', last30Days.toISOString())
      ]);

      // 查询简报数（通过conversations关联）
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId);
      
      const conversationIds = userConversations?.map(c => c.id) || [];
      
      let briefingsCount = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from('briefings')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds);
        briefingsCount = count || 0;
      }

      // 计算使用频率
      const totalConversations = conversationsResult.count || 0;
      const recentConversations = recentConversationsResult.count || 0;
      
      // 计算总消耗点数
      const totalPointsUsed = usageRecordsResult.data?.reduce(
        (sum, record) => sum + (record.amount || 0), 0
      ) || 0;

      // 活跃训练营
      const activeCamps = trainingCampsResult.data?.filter(c => c.status === 'active') || [];

      return {
        totalConversations,
        recentConversations,
        briefingsCount,
        coachingSessions: coachingSessionsResult.count || 0,
        communityPosts: communityPostsResult.count || 0,
        trainingCamps: trainingCampsResult.data || [],
        activeCampsCount: activeCamps.length,
        totalPointsUsed,
        usageRecordsCount: usageRecordsResult.data?.length || 0
      };
    },
    enabled: open && !!userId
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
        </DialogHeader>

        {/* 用户基本信息 */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-lg">
              {userName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{userName}</h3>
              <Badge variant="outline">
                {authProvider === 'wechat' ? '💬微信' : '📧邮箱'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              注册时间：{createdAt ? format(new Date(createdAt), 'yyyy-MM-dd HH:mm') : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {userId.slice(0, 8)}...
            </p>
          </div>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 核心统计 */}
            <div>
              <h4 className="text-sm font-medium mb-3">使用统计</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="总对话数"
                  value={stats?.totalConversations || 0}
                  subtitle={`近7天: ${stats?.recentConversations || 0}次`}
                />
                <StatCard
                  icon={<FileText className="h-5 w-5" />}
                  label="生成简报"
                  value={stats?.briefingsCount || 0}
                />
                <StatCard
                  icon={<Mic className="h-5 w-5" />}
                  label="教练会话"
                  value={stats?.coachingSessions || 0}
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="社区发帖"
                  value={stats?.communityPosts || 0}
                />
              </div>
            </div>

            {/* 消耗统计 */}
            <div>
              <h4 className="text-sm font-medium mb-3">消耗统计（近30天）</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="消耗点数"
                  value={stats?.totalPointsUsed || 0}
                />
                <StatCard
                  icon={<Calendar className="h-5 w-5" />}
                  label="使用次数"
                  value={stats?.usageRecordsCount || 0}
                />
              </div>
            </div>

            {/* 训练营参与 */}
            <div>
              <h4 className="text-sm font-medium mb-3">训练营参与</h4>
              {stats?.trainingCamps && stats.trainingCamps.length > 0 ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.trainingCamps.length}</p>
                        <p className="text-sm text-muted-foreground">
                          参与训练营（进行中: {stats.activeCampsCount}）
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stats.trainingCamps.map((camp: any) => (
                        <Badge 
                          key={camp.id} 
                          variant={camp.status === 'active' ? 'default' : 'secondary'}
                        >
                          {camp.camp_type}
                          {camp.status === 'active' && ' (进行中)'}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-4 text-center text-muted-foreground">
                    暂未参与训练营
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
