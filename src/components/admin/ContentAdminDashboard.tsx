import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MessageSquare, Flag, GraduationCap, Tent, Video, Pin, AlertCircle, Plus, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { AdminStatCard } from "./shared/AdminStatCard";

export default function ContentAdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: postStats, isLoading: loadingPosts } = useQuery({
    queryKey: ["content-admin-post-stats"],
    queryFn: async () => {
      const [totalRes, todayRes, pinnedRes] = await Promise.all([
        supabase.from("community_posts").select("*", { count: "exact", head: true }),
        supabase.from("community_posts").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("is_pinned", true),
      ]);
      return { total: totalRes.count || 0, today: todayRes.count || 0, pinned: pinnedRes.count || 0 };
    },
  });

  const { data: pendingReports, isLoading: loadingReports } = useQuery({
    queryKey: ["content-admin-pending-reports"],
    queryFn: async () => {
      const { count } = await supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
  });

  const { data: templateStats, isLoading: loadingTemplates } = useQuery({
    queryKey: ["content-admin-template-stats"],
    queryFn: async () => {
      const [coachRes, campRes, videoRes] = await Promise.all([
        supabase.from("coach_templates").select("*", { count: "exact", head: true }),
        supabase.from("camp_templates").select("*", { count: "exact", head: true }),
        supabase.from("video_courses").select("*", { count: "exact", head: true }),
      ]);
      return { coaches: coachRes.count || 0, camps: campRes.count || 0, videos: videoRes.count || 0 };
    },
  });

  const { data: recentPosts, isLoading: loadingRecent } = useQuery({
    queryKey: ["content-admin-recent-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("id, title, content, post_type, likes_count, comments_count, created_at, is_pinned")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const typeLabel: Record<string, string> = {
    story: "故事", checkin: "打卡", achievement: "成就", reflection: "反思", share: "分享",
  };

  return (
    <AdminPageLayout title="内容管理概览" description="管理社区动态、教练模板、课程等内容">
      {/* 统计卡片 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="社区动态" value={postStats?.total || 0} subtitle={`今日新增 ${postStats?.today || 0} 条`} icon={MessageSquare} loading={loadingPosts} href="/admin/community-posts" />
        <AdminStatCard label="置顶帖" value={postStats?.pinned || 0} icon={Pin} accent="bg-amber-500/10 text-amber-600" loading={loadingPosts} href="/admin/community-posts" />
        <AdminStatCard label="待审核举报" value={pendingReports || 0} icon={Flag} accent="bg-red-500/10 text-red-600" loading={loadingReports} href="/admin/reports" />
        <AdminStatCard label="教练模板" value={templateStats?.coaches || 0} icon={GraduationCap} accent="bg-blue-500/10 text-blue-600" loading={loadingTemplates} href="/admin/coaches" />
        <AdminStatCard label="训练营模板" value={templateStats?.camps || 0} icon={Tent} accent="bg-green-500/10 text-green-600" loading={loadingTemplates} href="/admin/camps" />
        <AdminStatCard label="视频课程" value={templateStats?.videos || 0} icon={Video} accent="bg-purple-500/10 text-purple-600" loading={loadingTemplates} href="/admin/videos" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 待处理举报 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              待处理事项
            </CardTitle>
            <CardDescription>需要您关注的内容</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <Link to="/admin/reports" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Flag className="h-4 w-4 text-red-500" />
                  <span>待审核举报</span>
                </div>
                <span className="font-semibold text-red-500">{pendingReports || 0}</span>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              快速操作
            </CardTitle>
            <CardDescription>常用内容管理入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/community-posts"><MessageSquare className="h-4 w-4" /><span className="text-xs">社区动态</span></Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/reports"><Flag className="h-4 w-4" /><span className="text-xs">举报管理</span></Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/coaches"><GraduationCap className="h-4 w-4" /><span className="text-xs">教练模板</span></Link>
              </Button>
              <Button variant="outline" asChild className="h-auto py-3 flex-col gap-1">
                <Link to="/admin/videos"><Video className="h-4 w-4" /><span className="text-xs">视频课程</span></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近社区动态 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>最近社区动态</CardTitle>
            <CardDescription>最新发布的5条动态</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/community-posts"><ArrowUpRight className="h-4 w-4 mr-1" />查看全部</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-2">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {post.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    <span className="truncate text-sm">{(post.title || post.content || "无内容").slice(0, 50)}</span>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{typeLabel[post.post_type] || post.post_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0 ml-3">
                    <span>👍 {post.likes_count}</span>
                    <span>💬 {post.comments_count}</span>
                    <span>{format(new Date(post.created_at), "MM-dd HH:mm")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">暂无动态</p>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
