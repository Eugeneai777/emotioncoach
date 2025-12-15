import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import WaterfallPostCard from "./WaterfallPostCard";
import PostDetailSheet from "./PostDetailSheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, RefreshCw, ChevronRight } from "lucide-react";
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
  author_display_name?: string | null;
  author_avatar_url?: string | null;
}

const POSTS_PER_PAGE = 10;
const RECOMMENDATION_CACHE_KEY = 'community_recommendation_cache';
const RECOMMENDATION_CACHE_TTL = 2 * 60 * 1000; // 2分钟缓存（更快显示新帖子）

const categories = [
  { value: 'following', label: '关注', emoji: '👥' },
  { value: 'all', label: '发现', emoji: '✨' },
  { value: 'resonance', label: '同频', emoji: '💫' },
  { value: 'story', label: '故事', emoji: '📖' },
];

// 移到组件外部避免重新创建
const LeftColumnComponent = memo(({ 
  posts, 
  likedMap, 
  onCardClick 
}: { 
  posts: Post[]; 
  likedMap: Map<string, boolean>;
  onCardClick: (postId: string) => void;
}) => (
  <div className="space-y-0">
    {posts.map((post) => (
      <WaterfallPostCard 
        key={post.id} 
        post={post} 
        isLiked={likedMap.get(post.id) || false}
        onCardClick={onCardClick} 
      />
    ))}
  </div>
));
LeftColumnComponent.displayName = 'LeftColumn';

const RightColumnComponent = memo(({ 
  posts, 
  likedMap, 
  onCardClick 
}: { 
  posts: Post[]; 
  likedMap: Map<string, boolean>;
  onCardClick: (postId: string) => void;
}) => (
  <div className="space-y-0">
    {posts.map((post) => (
      <WaterfallPostCard 
        key={post.id} 
        post={post} 
        isLiked={likedMap.get(post.id) || false}
        onCardClick={onCardClick} 
      />
    ))}
  </div>
));
RightColumnComponent.displayName = 'RightColumn';

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
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 批量获取点赞状态
  const batchCheckLikedStatus = useCallback(async (postIds: string[]) => {
    if (!session?.user || postIds.length === 0) return;

    try {
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", postIds);

      if (data) {
        const likedIds = new Set(data.map(item => item.post_id));
        setLikedPostIds(prev => {
          const newSet = new Set(prev);
          likedIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error) {
      console.error("批量检查点赞状态失败:", error);
    }
  }, [session]);

  // 获取缓存的推荐
  const getCachedRecommendation = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(RECOMMENDATION_CACHE_KEY);
      if (cached) {
        const { ids, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < RECOMMENDATION_CACHE_TTL) {
          return ids;
        }
      }
    } catch {
      // 忽略缓存读取错误
    }
    return null;
  }, []);

  // 缓存推荐结果
  const setCachedRecommendation = useCallback((ids: string[]) => {
    try {
      sessionStorage.setItem(RECOMMENDATION_CACHE_KEY, JSON.stringify({
        ids,
        timestamp: Date.now()
      }));
    } catch {
      // 忽略缓存写入错误
    }
  }, []);

  // 获取推荐帖子（带缓存）
  const loadRecommendedPosts = useCallback(async () => {
    if (!session?.user || activeFilter !== 'all') return null;
    
    // 先检查缓存
    const cachedIds = getCachedRecommendation();
    if (cachedIds) {
      return cachedIds;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('recommend-posts', {
        body: {}
      });

      if (error) {
        console.error('推荐失败:', error);
        return null;
      }

      const ids = data?.recommendedPostIds || null;
      if (ids) {
        setCachedRecommendation(ids);
      }
      return ids;
    } catch (error) {
      console.error('推荐请求失败:', error);
      return null;
    }
  }, [session, activeFilter, getCachedRecommendation, setCachedRecommendation]);

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
      // 故事筛选：显示所有经过故事教练梳理的故事
      else if (filter === 'story') {
        query = query.eq('post_type', 'story');
        
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
        } else {
          query = query.order('created_at', { ascending: false })
            .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
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
        
        // 批量获取作者资料
        const userIds = [...new Set(processedData.map((p: any) => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        
        // 合并作者资料到帖子数据
        const postsWithProfiles = processedData.map((post: any) => {
          const profile = profiles?.find(p => p.id === post.user_id);
          return {
            ...post,
            author_display_name: profile?.display_name,
            author_avatar_url: profile?.avatar_url,
          };
        });
        
        if (append) {
          setPosts(prev => [...prev, ...postsWithProfiles]);
        } else {
          setPosts(postsWithProfiles);
        }
        setHasMore(data.length === POSTS_PER_PAGE);

        // 批量获取点赞状态
        const postIds = postsWithProfiles.map((p: Post) => p.id);
        batchCheckLikedStatus(postIds);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadRecommendedPosts, session, selectedEmotionTag, batchCheckLikedStatus]);
  
  // 加载用户的情绪标签（用于故事筛选）
  const loadEmotionTags = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('emotion_theme')
        .eq('post_type', 'story')
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
    // 清除推荐缓存以获取新推荐
    sessionStorage.removeItem(RECOMMENDATION_CACHE_KEY);
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

  // 处理卡片点击 - 使用缓存的数据
  const handleCardClick = useCallback((postId: string) => {
    setSelectedPostId(postId);
    // 从已加载的帖子中查找，避免额外请求
    const cachedPost = posts.find(p => p.id === postId);
    if (cachedPost) {
      setSelectedPost(cachedPost);
    } else {
      // 仅在缓存中找不到时才发起请求
      loadPostDetail(postId);
    }
  }, [posts]);

  // 加载帖子详情（备用）
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
        
        // 获取作者资料
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', data.user_id)
          .single();
        
        const processedData = {
          ...data,
          camp_type: campData?.camp_type,
          camp_name: campData?.camp_name,
          template_id: campData?.template_id,
          training_camps: undefined,
          author_display_name: profile?.display_name,
          author_avatar_url: profile?.avatar_url,
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

  // 更新点赞状态
  const handleLikeChange = useCallback((postId: string, isLiked: boolean) => {
    setLikedPostIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });
  }, []);

  // 初始加载
  useEffect(() => {
    loadPosts(0, activeFilter, false, true);
    setPage(0);
    
    // 如果切换到故事分类，加载情绪标签
    if (activeFilter === 'story') {
      loadEmotionTags();
    }
  }, [activeFilter, loadPosts, loadEmotionTags]);

  // 监听帖子删除、更新事件
  useEffect(() => {
    const handlePostDeleted = (e: CustomEvent<{ postId: string }>) => {
      setPosts(prev => prev.filter(p => p.id !== e.detail.postId));
    };
    const handlePostUpdated = () => {
      loadPosts(0, activeFilter, false, true);
      setPage(0);
    };
    window.addEventListener('post-deleted', handlePostDeleted as EventListener);
    window.addEventListener('post-updated', handlePostUpdated as EventListener);
    return () => {
      window.removeEventListener('post-deleted', handlePostDeleted as EventListener);
      window.removeEventListener('post-updated', handlePostUpdated as EventListener);
    };
  }, [activeFilter, loadPosts]);
  
  // 情绪标签变化时重新加载
  useEffect(() => {
    if (activeFilter === 'story') {
      loadPosts(0, activeFilter, false, false);
      setPage(0);
    }
  }, [selectedEmotionTag]);

  // 无限滚动 - 带防抖
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
      // 清除之前的定时器
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      // 300ms 防抖
      loadMoreTimeoutRef.current = setTimeout(() => {
        setPage(prev => {
          const nextPage = prev + 1;
          loadPosts(nextPage, activeFilter, true);
          return nextPage;
        });
      }, 300);
    }
  }, [hasMore, loading, loadingMore, activeFilter, loadPosts]);

  useEffect(() => {
    // 增加 threshold 到 0.3
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.3 });

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      // 清理定时器
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [handleIntersection]);

  // 瀑布流布局：将帖子分配到两列 - 使用 useMemo 优化，并去重
  const { leftPosts, rightPosts } = useMemo(() => {
    const left: Post[] = [];
    const right: Post[] = [];
    const seenIds = new Set<string>();
    
    posts.forEach((post, index) => {
      // 跳过重复的帖子ID
      if (seenIds.has(post.id)) return;
      seenIds.add(post.id);
      
      if (left.length <= right.length) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    
    return { leftPosts: left, rightPosts: right };
  }, [posts]);

  // 创建稳定的 likedMap
  const likedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    posts.forEach(post => {
      map.set(post.id, likedPostIds.has(post.id));
    });
    return map;
  }, [posts, likedPostIds]);

  // 阻止按钮区域的触摸事件传播
  const handleButtonTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div 
      className="w-full"
      ref={containerRef}
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

      {/* 标题栏 - 按钮区域独立处理触摸事件 */}
      <div 
        className="flex items-center justify-between mb-4 px-1"
        onTouchStart={handleButtonTouchStart}
      >
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
          onClick={() => navigate("/community")}
        >
          <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            🌈 有劲社区
          </h2>
          <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border/50">NEW</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
          <Button 
            variant="outline"
            className="gap-1 bg-card border-border/60 hover:bg-muted hover:border-border active:scale-95 transition-all duration-150 text-foreground/90 min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => navigate("/my-posts")}
          >
            <Plus className="w-4 h-4 text-foreground/70" />
            我的动态
          </Button>
      </div>

      {/* 分类标签栏 - 按钮区域独立处理触摸事件 */}
      <div 
        className="grid grid-cols-4 gap-2 mb-4"
        onTouchStart={handleButtonTouchStart}
      >
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant="outline"
            className={cn(
              "flex-1 min-h-[44px] active:scale-95 transition-all duration-150 touch-manipulation",
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

      {/* 情绪标签筛选栏（仅故事分类显示）- 按钮区域独立处理触摸事件 */}
      {activeFilter === 'story' && emotionTags.length > 0 && (
        <ScrollArea className="w-full mb-4" onTouchStart={handleButtonTouchStart}>
          <div className="flex gap-2 pb-2">
            <Button
              variant="outline"
              className={cn(
                "min-h-[40px] active:scale-95 transition-all duration-150 touch-manipulation",
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
                variant="outline"
                className={cn(
                  "min-h-[40px] active:scale-95 transition-all duration-150 touch-manipulation",
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

      {/* 瀑布流内容 - 仅此区域支持下拉刷新 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
              <LeftColumnComponent 
                posts={leftPosts} 
                likedMap={likedMap}
                onCardClick={handleCardClick} 
              />

              {/* 右列 */}
              <RightColumnComponent 
                posts={rightPosts} 
                likedMap={likedMap}
                onCardClick={handleCardClick} 
              />
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
            <div className="mt-4 text-center" onTouchStart={handleButtonTouchStart}>
              <Button
                variant="outline"
                onClick={() => navigate("/community")}
                className="w-full min-h-[44px] active:scale-[0.98] transition-all duration-150 touch-manipulation"
              >
                查看完整社区
              </Button>
            </div>
          </>
        )}
      </div>

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
