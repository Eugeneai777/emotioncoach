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
import { Skeleton } from "@/components/ui/skeleton";
import { Pin, PinOff, Trash2, Search, RefreshCw, MessageSquare, TrendingUp, Heart, Eye, ThumbsUp, MessageCircle } from "lucide-react";
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
    return text.length > 50 ? text.slice(0, 50) + "…" : text;
  };

  const visibilityLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    public: { label: "公开", variant: "default" },
    followers: { label: "关注者", variant: "secondary" },
    followers_only: { label: "关注者", variant: "secondary" },
    private: { label: "私密", variant: "outline" },
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

  const StatCard = ({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent?: string }) => (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent || "bg-primary/10 text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loadingStats ? (
          <Skeleton className="h-6 w-12 mt-0.5" />
        ) : (
          <p className="text-xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">社区动态管理</h2>
          <p className="text-sm text-muted-foreground mt-0.5">管理社区帖子，包括置顶、删除和内容审核</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> 刷新
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="总帖数" value={stats?.total || 0} icon={MessageSquare} />
        <StatCard label="今日新增" value={stats?.today || 0} icon={TrendingUp} accent="bg-green-500/10 text-green-600" />
        <StatCard label="置顶帖" value={stats?.pinned || 0} icon={Pin} accent="bg-amber-500/10 text-amber-600" />
        <StatCard label="总互动" value={stats?.interactions || 0} icon={Heart} accent="bg-rose-500/10 text-rose-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索标题/内容/作者…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="类型" /></SelectTrigger>
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
          <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="置顶" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pinned">已置顶</SelectItem>
            <SelectItem value="unpinned">未置顶</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue placeholder="可见性" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部可见性</SelectItem>
            <SelectItem value="public">公开</SelectItem>
            <SelectItem value="followers">仅关注者</SelectItem>
            <SelectItem value="private">私密</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          共 {filtered.length} 条
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 w-[35%]">内容</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3 w-[10%]">作者</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3 w-[8%]">类型</th>
                <th className="text-center font-medium text-muted-foreground px-2 py-3 w-[6%]">
                  <ThumbsUp className="h-3.5 w-3.5 mx-auto" />
                </th>
                <th className="text-center font-medium text-muted-foreground px-2 py-3 w-[6%]">
                  <MessageCircle className="h-3.5 w-3.5 mx-auto" />
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3 w-[10%]">时间</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-3 w-[8%]">可见性</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3 w-[12%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    {loading ? "加载中…" : "暂无数据"}
                  </td>
                </tr>
              ) : filtered.map(post => (
                <tr
                  key={post.id}
                  className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${post.is_pinned ? "bg-primary/[0.03]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {post.is_pinned && (
                        <span className="mt-0.5 shrink-0 inline-flex items-center justify-center h-5 w-5 rounded bg-primary/10">
                          <Pin className="h-3 w-3 text-primary" />
                        </span>
                      )}
                      <span className="text-foreground leading-relaxed line-clamp-2">{getSummary(post)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {post.is_anonymous ? (
                      <span className="italic">匿名</span>
                    ) : (
                      <span className="truncate block max-w-[80px]">{profiles[post.user_id] || post.user_id.slice(0, 6)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {typeLabel[post.post_type] || post.post_type}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-center text-muted-foreground tabular-nums">{post.likes_count}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground tabular-nums">{post.comments_count}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {format(new Date(post.created_at), "MM-dd HH:mm")}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge
                      variant={visibilityLabel[post.visibility]?.variant || "outline"}
                      className="text-xs font-normal"
                    >
                      {visibilityLabel[post.visibility]?.label || post.visibility}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePin(post)}
                        title={post.is_pinned ? "取消置顶" : "置顶"}
                      >
                        {post.is_pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(post)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
