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
import { cn } from "@/lib/utils";

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
  camp_id?: string;
  camp_type?: string;
  camp_name?: string;
  template_id?: string;
}

const POSTS_PER_PAGE = 10;

const categories = [
  { value: 'following', label: '关注', emoji: '👥' },
  { value: 'all', label: '发现', emoji: '✨' },
  { value: 'resonance', label: '同频', emoji: '💫' },
  { value: 'story', label: '故事', emoji: '📖' },
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
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [selectedEmotionTag, setSelectedEmotionTag] = useState<string | null>(null);
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
        .select(`
          id, user_id, post_type, title, content, image_urls, emotion_theme, 
          is_anonymous, likes_count, created_at, camp_id,
          training_camps!camp_id (
            camp_type,
            camp_name,
            template_id
          )
        `);

      // 关注筛选：获取关注用户的帖子
      if (filter === 'following') {
        if (!session?.user) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', session.user.id);

        const followingIds = followingData?.map((f) => f.following_id) || [];

        if (followingIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        query = query
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
      }
      // 同频筛选：找到有相同情绪主题的帖子
      else if (filter === 'resonance') {
        if (!session?.user) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        // 获取用户最近的情绪主题
        const { data: userEmotions } = await supabase
          .from('community_posts')
          .select('emotion_theme')
          .eq('user_id', session.user.id)
          .not('emotion_theme', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        const userThemes = [
          ...new Set(
            userEmotions?.map((e) => e.emotion_theme).filter(Boolean)
          ),
        ];

        if (userThemes.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        query = query
          .in('emotion_theme', userThemes)
          .neq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
      }
      // 故事筛选：只显示训练营故事教练生成的故事（必须有 camp_id）
      else if (filter === 'story') {
        query = query
          .eq('post_type', 'story')
          .not('camp_id', 'is', null);
        
        // 如果选择了情绪标签，进一步筛选
        if (selectedEmotionTag) {
          query = query.eq('emotion_theme', selectedEmotionTag);
        }
        
        query = query
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
      }
      // 其他类型筛选（打卡、成就、反思）
      else if (filter !== 'all' && filter !== 'following' && filter !== 'resonance') {
        query = query
          .eq('post_type', filter)
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
      }
      // 发现：全部或使用推荐
      else {
        // 如果使用推荐且是第一页
        if (useRecommendation && pageNum === 0 && filter === 'all') {
          const recommendedIds = await loadRecommendedPosts();
          if (recommendedIds && recommendedIds.length > 0) {
            query = query
              .in('id', recommendedIds)
              .order('created_at', { ascending: false })
              .limit(POSTS_PER_PAGE);
          } else {
            query = query.order('created_at', { ascending: false })
              .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // 展平 training_camps 数据到 post 对象
        const processedData = data.map((post: any) => {
          const campData = post.training_camps;
          return {
            ...post,
            camp_type: campData?.camp_type,
            camp_name: campData?.camp_name,
            template_id: campData?.template_id,
            training_camps: undefined
          };
        });
        
        if (append) {
          setPosts(prev => [...prev, ...processedData]);
        } else {
          setPosts(processedData);
        }
        setHasMore(data.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadRecommendedPosts, session, selectedEmotionTag]);
  
  // 加载用户的情绪标签（用于故事筛选）
  const loadEmotionTags = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('emotion_theme')
        .eq('post_type', 'story')
        .not('camp_id', 'is', null)
        .not('emotion_theme', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // 提取唯一的情绪标签
        const uniqueTags = [...new Set(data.map(p => p.emotion_theme).filter(Boolean))] as string[];
        setEmotionTags(uniqueTags);
      }
    } catch (error) {
      console.error('加载情绪标签失败:', error);
    }
  }, [session]);

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
        .select(`
          *,
          training_camps!camp_id (
            camp_type,
            camp_name,
            template_id
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      
      // 展平 training_camps 数据
      if (data) {
        const campData = data.training_camps;
        const processedData = {
          ...data,
          camp_type: campData?.camp_type,
          camp_name: campData?.camp_name,
          template_id: campData?.template_id,
          training_camps: undefined
        };
        setSelectedPost(processedData);
      }
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
    
    // 如果切换到故事分类，加载情绪标签
    if (activeFilter === 'story') {
      loadEmotionTags();
    }
  }, [activeFilter, loadPosts, loadEmotionTags]);
  
  // 情绪标签变化时重新加载
  useEffect(() => {
    if (activeFilter === 'story') {
      loadPosts(0, activeFilter, false, false);
      setPage(0);
    }
  }, [selectedEmotionTag]);

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
            className={`w-5 h-5 text-foreground/60 ${refreshing || pullDistance > 60 ? 'animate-spin' : ''}`} 
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {refreshing ? '正在刷新...' : pullDistance > 60 ? '释放刷新' : '下拉刷新'}
          </span>
        </div>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">🌈 有劲社区</h2>
          <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border/50">NEW</span>
        </div>
          <Button 
            size="sm" 
            variant="outline"
            className="gap-1 bg-card border-border/60 hover:bg-muted hover:border-border transition-all duration-200 text-foreground/90"
            onClick={() => navigate("/community")}
          >
            <Plus className="w-4 h-4 text-foreground/70" />
            发布
          </Button>
      </div>

      {/* 分类标签栏 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            size="default"
            variant="outline"
            className={cn(
              "flex-1 transition-all duration-200",
                activeFilter === cat.value 
                  ? "bg-card border-foreground text-foreground font-medium" 
                  : "bg-card border-border/60 hover:bg-muted hover:border-border text-foreground/80"
            )}
            onClick={() => {
              setActiveFilter(cat.value);
              setSelectedEmotionTag(null); // 切换分类时重置情绪标签
            }}
          >
            <span className="mr-1.5">{cat.emoji}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* 情绪标签筛选栏（仅故事分类显示） */}
      {activeFilter === 'story' && emotionTags.length > 0 && (
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-2 pb-2">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "transition-all duration-200",
                  selectedEmotionTag === null 
                    ? "bg-card border-foreground text-foreground font-medium" 
                    : "bg-card border-border/60 hover:bg-muted hover:border-border text-foreground/80"
              )}
              onClick={() => setSelectedEmotionTag(null)}
            >
              全部
            </Button>
            {emotionTags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant="outline"
                className={cn(
                  "transition-all duration-200",
                  selectedEmotionTag === tag 
                    ? "bg-card border-foreground text-foreground font-medium" 
                    : "bg-card border-border/60 hover:bg-muted hover:border-border text-foreground/80"
                )}
                onClick={() => setSelectedEmotionTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* 瀑布流内容 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-foreground/60" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          {activeFilter === 'following' ? (
            <>
              <p className="text-muted-foreground text-sm">还没有关注任何人</p>
              <p className="text-xs text-muted-foreground mt-1">去发现页面找到志同道合的朋友吧</p>
            </>
          ) : activeFilter === 'resonance' ? (
            <>
              <p className="text-muted-foreground text-sm">暂无同频内容</p>
              <p className="text-xs text-muted-foreground mt-1">先分享你的情绪日记，发现与你同频的伙伴</p>
            </>
          ) : activeFilter === 'story' ? (
            <>
              <p className="text-muted-foreground text-sm">暂无故事</p>
              <p className="text-xs text-muted-foreground mt-1">去训练营用说好故事教练创建你的第一个故事吧</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">暂无内容</p>
          )}
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
              <Loader2 className="w-5 h-5 animate-spin text-foreground/60 mx-auto" />
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
        onOpenChange={async (open) => {
          if (!open && selectedPostId) {
            // 检查帖子是否被删除
            const { data } = await supabase
              .from('community_posts')
              .select('id')
              .eq('id', selectedPostId)
              .maybeSingle();
            
            if (!data) {
              // 帖子已被删除，从列表中移除
              setPosts(prev => prev.filter(p => p.id !== selectedPostId));
            }
          }
          setSelectedPostId(null);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
    </div>
  );
};

export default CommunityWaterfall;
