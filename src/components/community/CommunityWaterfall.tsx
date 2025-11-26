import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import WaterfallPostCard from "./WaterfallPostCard";
import PostDetailSheet from "./PostDetailSheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string | null;
  image_urls: string[] | null;
  emotion_theme: string | null;
  is_anonymous: boolean;
  likes_count: number;
  created_at: string;
}

const POSTS_PER_PAGE = 10;

const categories = [
  { value: 'all', label: '全部', emoji: '' },
  { value: 'story', label: '故事', emoji: '🌸' },
  { value: 'checkin', label: '打卡', emoji: '📅' },
  { value: 'achievement', label: '成就', emoji: '🏆' },
  { value: 'reflection', label: '反思', emoji: '💭' },
];

const CommunityWaterfall = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取推荐帖子
  const loadRecommendedPosts = useCallback(async () => {
    if (!session?.user || activeFilter !== 'all') return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('recommend-posts', {
        body: { userId: session.user.id }
      });

      if (error) {
        console.error('推荐失败:', error);
        return null;
      }

      return data?.recommendedPostIds || null;
    } catch (error) {
      console.error('推荐请求失败:', error);
      return null;
    }
  }, [session, activeFilter]);

  // 加载帖子
  const loadPosts = useCallback(async (pageNum: number, filter: string, append = false, useRecommendation = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('community_posts')
        .select('id, user_id, post_type, title, content, image_urls, emotion_theme, is_anonymous, likes_count, created_at');

      if (filter !== 'all') {
        query = query.eq('post_type', filter);
      }

      // 如果使用推荐且是第一页
      if (useRecommendation && pageNum === 0 && filter === 'all') {
        const recommendedIds = await loadRecommendedPosts();
        if (recommendedIds && recommendedIds.length > 0) {
          query = query.in('id', recommendedIds).limit(POSTS_PER_PAGE);
        } else {
          query = query.order('created_at', { ascending: false })
            .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
        }
      } else {
        query = query.order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        if (append) {
          setPosts(prev => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        setHasMore(data.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadRecommendedPosts]);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(0, activeFilter, false, true);
    setPage(0);
    setRefreshing(false);
    toast({
      title: "刷新成功",
      description: "已加载最新内容",
    });
  }, [activeFilter, loadPosts, toast]);

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.min(currentY - pullStartY, 100);
      if (distance > 0) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullStartY(0);
    setPullDistance(0);
  };

  // 加载帖子详情
  const loadPostDetail = useCallback(async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setSelectedPost(data);
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      toast({
        title: "加载失败",
        description: "无法加载帖子详情",
        variant: "destructive",
      });
    }
  }, [toast]);

  // 处理卡片点击
  const handleCardClick = useCallback((postId: string) => {
    setSelectedPostId(postId);
    loadPostDetail(postId);
  }, [loadPostDetail]);

  // 初始加载
  useEffect(() => {
    loadPosts(0, activeFilter, false, true);
    setPage(0);
  }, [activeFilter, loadPosts]);

  // 无限滚动 - 使用 useCallback 优化
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        loadPosts(nextPage, activeFilter, true);
        return nextPage;
      });
    }
  }, [hasMore, loading, loadingMore, activeFilter, loadPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 });

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleIntersection]);

  // 瀑布流布局：将帖子分配到两列 - 使用 memo 优化
  const columns = useMemo(() => {
    const left: Post[] = [];
    const right: Post[] = [];
    
    posts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    
    return { left, right };
  }, [posts]);

  // Memoized 列渲染
  const LeftColumn = memo(() => (
    <div className="space-y-0">
      {columns.left.map((post) => (
        <WaterfallPostCard key={post.id} post={post} onCardClick={handleCardClick} />
      ))}
    </div>
  ));

  const RightColumn = memo(() => (
    <div className="space-y-0">
      {columns.right.map((post) => (
        <WaterfallPostCard key={post.id} post={post} onCardClick={handleCardClick} />
      ))}
    </div>
  ));

  LeftColumn.displayName = 'LeftColumn';
  RightColumn.displayName = 'RightColumn';

  return (
    <div 
      className="w-full"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {pullDistance > 0 && (
        <div 
          className="flex items-center justify-center py-2 transition-all"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <RefreshCw 
            className={`w-5 h-5 text-primary ${refreshing || pullDistance > 60 ? 'animate-spin' : ''}`} 
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {refreshing ? '正在刷新...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
          </span>
        </div>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">💪 有劲社区</h2>
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">NEW</span>
        </div>
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => navigate("/community")}
        >
          <Plus className="w-4 h-4" />
          发布
        </Button>
      </div>

      {/* 分类标签栏 */}
      <ScrollArea className="w-full mb-4">
        <div className="flex gap-2 pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              size="sm"
              variant={activeFilter === cat.value ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setActiveFilter(cat.value)}
            >
              {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
              {cat.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* 瀑布流内容 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">暂无内容</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* 左列 */}
            <LeftColumn />

            {/* 右列 */}
            <RightColumn />
          </div>

          {/* 加载更多指示器 */}
          <div ref={observerTarget} className="py-4 text-center">
            {loadingMore ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            ) : !hasMore ? (
              <p className="text-xs text-muted-foreground">没有更多内容了</p>
            ) : null}
          </div>

          {/* 查看更多按钮 */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/community")}
              className="w-full"
            >
              查看完整社区
            </Button>
          </div>
        </>
      )}

      {/* 帖子详情弹窗 */}
      <PostDetailSheet
        open={!!selectedPostId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPostId(null);
            setSelectedPost(null);
          }
        }}
        post={selectedPost}
      />
    </div>
  );
};

export default CommunityWaterfall;
