import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import WaterfallPostCard from "./WaterfallPostCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 加载帖子
  const loadPosts = async (pageNum: number, filter: string, append = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('community_posts')
        .select('id, user_id, post_type, title, content, image_urls, emotion_theme, is_anonymous, likes_count, created_at')
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (filter !== 'all') {
        query = query.eq('post_type', filter);
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
  };

  // 初始加载
  useEffect(() => {
    loadPosts(0, activeFilter);
    setPage(0);
  }, [activeFilter]);

  // 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage, activeFilter, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, activeFilter]);

  // 瀑布流布局：将帖子分配到两列
  const [leftColumn, rightColumn] = useMemo(() => {
    const left: Post[] = [];
    const right: Post[] = [];
    
    posts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    
    return [left, right];
  }, [posts]);

  return (
    <div className="w-full">
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
            <div className="space-y-0">
              {leftColumn.map((post) => (
                <WaterfallPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 右列 */}
            <div className="space-y-0">
              {rightColumn.map((post) => (
                <WaterfallPostCard key={post.id} post={post} />
              ))}
            </div>
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
    </div>
  );
};

export default CommunityWaterfall;
