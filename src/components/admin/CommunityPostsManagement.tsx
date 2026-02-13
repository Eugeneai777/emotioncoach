import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pin, PinOff, Trash2, Search, RefreshCw, MessageSquare, TrendingUp, Heart } from "lucide-react";
import { format } from "date-fns";

interface CommunityPost {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_anonymous: boolean;
  visibility: string;
}

interface Profile {
  id: string;
  display_name: string | null;
}

export default function CommunityPostsManagement() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const { toast } = useToast();

  const today = format(new Date(), "yyyy-MM-dd");

  // 统计数据
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["community-posts-stats"],
    queryFn: async () => {
      const [totalRes, todayRes, pinnedRes, interactionRes] = await Promise.all([
        supabase.from("community_posts").select("*", { count: "exact", head: true }),
        supabase.from("community_posts").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("is_pinned", true),
        supabase.from("community_posts").select("likes_count, comments_count"),
      ]);
      const interactions = interactionRes.data?.reduce((sum, p) => sum + (p.likes_count || 0) + (p.comments_count || 0), 0) || 0;
      return {
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        pinned: pinnedRes.count || 0,
        interactions,
      };
    },
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("community_posts")
        .select("id, user_id, post_type, title, content, is_pinned, pinned_at, likes_count, comments_count, created_at, is_anonymous, visibility")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") query = query.eq("post_type", typeFilter);
      if (pinFilter === "pinned") query = query.eq("is_pinned", true);
      if (pinFilter === "unpinned") query = query.eq("is_pinned", false);
      if (visibilityFilter !== "all") query = query.eq("visibility", visibilityFilter);

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);

      // load profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        const map: Record<string, string> = {};
        profileData?.forEach(p => { map[p.id] = p.display_name || `用户${p.id.slice(0, 6)}`; });
        setProfiles(map);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "加载失败", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [typeFilter, pinFilter, visibilityFilter]);

  const togglePin = async (post: CommunityPost) => {
    const newPinned = !post.is_pinned;
    const { error } = await supabase
      .from("community_posts")
      .update({
        is_pinned: newPinned,
        pinned_at: newPinned ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (error) {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newPinned ? "已置顶" : "已取消置顶" });
      loadPosts();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "已删除" });
      loadPosts();
    }
    setDeleteTarget(null);
  };

  const getSummary = (post: CommunityPost) => {
    const text = post.title || post.content || "无内容";
    return text.length > 40 ? text.slice(0, 40) + "…" : text;
  };

  const visibilityLabel: Record<string, string> = {
    public: "公开", followers: "仅关注者", private: "私密",
  };

  const typeLabel: Record<string, string> = {
    story: "故事", checkin: "打卡", achievement: "成就", reflection: "反思", share: "分享",
  };

  const filtered = posts.filter(p => {
    if (!search) return true;
    const summary = (p.title || "") + (p.content || "");
    const author = profiles[p.user_id] || "";
    return summary.includes(search) || author.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">社区动态管理</h2>
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> 刷新
        </Button>
      </div>
      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">总帖数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loadingStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stats?.total || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日新增</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loadingStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stats?.today || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">置顶帖</CardTitle>
            <Pin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loadingStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stats?.pinned || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">总互动</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loadingStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{(stats?.interactions || 0).toLocaleString()}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索标题/内容/作者…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="story">故事</SelectItem>
            <SelectItem value="checkin">打卡</SelectItem>
            <SelectItem value="achievement">成就</SelectItem>
            <SelectItem value="reflection">反思</SelectItem>
            <SelectItem value="share">分享</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pinFilter} onValueChange={setPinFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="置顶" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pinned">已置顶</SelectItem>
            <SelectItem value="unpinned">未置顶</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="可见性" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部可见性</SelectItem>
            <SelectItem value="public">公开</SelectItem>
            <SelectItem value="followers">仅关注者</SelectItem>
            <SelectItem value="private">私密</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">内容摘要</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>类型</TableHead>
              <TableHead className="text-center">👍</TableHead>
              <TableHead className="text-center">💬</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead>可见性</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {loading ? "加载中…" : "暂无数据"}
                </TableCell>
              </TableRow>
            ) : filtered.map(post => (
              <TableRow key={post.id} className={post.is_pinned ? "bg-primary/5" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {post.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    <span className="truncate">{getSummary(post)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {post.is_anonymous ? "匿名" : (profiles[post.user_id] || post.user_id.slice(0, 8))}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{typeLabel[post.post_type] || post.post_type}</Badge>
                </TableCell>
                <TableCell className="text-center text-sm">{post.likes_count}</TableCell>
                <TableCell className="text-center text-sm">{post.comments_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(post.created_at), "MM-dd HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {visibilityLabel[post.visibility] || post.visibility}
                  </Badge>
                </TableCell>
                <TableCell>
                  {post.is_pinned ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">置顶</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">普通</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => togglePin(post)} title={post.is_pinned ? "取消置顶" : "置顶"}>
                      {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(post)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复。确定要删除这条动态吗？
              <br />
              <span className="font-medium text-foreground">「{deleteTarget && getSummary(deleteTarget)}」</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
