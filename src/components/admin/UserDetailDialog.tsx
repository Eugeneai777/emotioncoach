import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  FileText, 
  Calendar, 
  TrendingUp,
  Users,
  Mic,
  BookOpen,
  List,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";

interface UsageRecord {
  id: string;
  amount: number;
  record_type: string;
  source: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

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
        // 使用记录（最近30天统计）
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

  // 详细使用记录查询
  const { data: usageRecords, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['user-usage-records', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as UsageRecord[];
    },
    enabled: open && !!userId
  });

  // 获取 record_type 的中文名称
  const getRecordTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'deduction': '扣费',
      'refund': '退款',
      'recharge': '充值',
      'bonus': '赠送',
      'consumption': '消耗'
    };
    return typeMap[type] || type;
  };

  // 获取 source 的中文名称
  const getSourceName = (source: string) => {
    const sourceMap: Record<string, string> = {
      'realtime_voice': '语音对话',
      'realtime_voice_emotion': '情绪语音',
      'realtime_voice_parent': '亲子语音',
      'realtime_voice_vibrant_life': '有劲语音',
      'realtime_voice_teen': '青少年语音',
      'coach_chat': '教练对话',
      'emotion_coach': '情绪教练',
      'parent_coach': '亲子教练',
      'wealth_coach': '财富教练',
      'briefing': '生成简报',
      'admin_recharge': '管理员充值',
      'purchase': '购买套餐',
      'voice_chat': '语音通话',
      'refund_short_call': '短通话退款',
      'refund_failed_call': '失败通话退款'
    };
    return sourceMap[source] || source;
  };

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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">📊 统计概览</TabsTrigger>
              <TabsTrigger value="records">📋 使用记录</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
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
            </TabsContent>

            <TabsContent value="records" className="mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <List className="h-4 w-4" />
                    详细使用记录（最近100条）
                  </h4>
                </div>

                {isLoadingRecords ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">加载中...</div>
                  </div>
                ) : usageRecords && usageRecords.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {usageRecords.map((record) => (
                        <Card key={record.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  record.record_type === 'refund' || record.amount > 0
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {record.record_type === 'refund' || record.amount > 0 ? (
                                    <ArrowUpCircle className="h-4 w-4" />
                                  ) : (
                                    <ArrowDownCircle className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {getSourceName(record.source)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {getRecordTypeName(record.record_type)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                  </p>
                                  {record.metadata && Object.keys(record.metadata).length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                                      {JSON.stringify(record.metadata)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className={`text-lg font-bold ${
                                record.record_type === 'refund' || record.amount > 0
                                  ? 'text-green-600'
                                  : 'text-orange-600'
                              }`}>
                                {record.record_type === 'refund' || record.amount > 0 ? '+' : ''}
                                {Math.abs(record.amount)} 点
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card>
                    <CardContent className="pt-4 text-center text-muted-foreground">
                      暂无使用记录
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
