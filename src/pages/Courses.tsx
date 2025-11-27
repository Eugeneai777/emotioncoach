import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search,
  Video,
  Heart,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  keywords: string[] | null;
  video_url: string;
  source: string | null;
}

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // 获取课程列表
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['video-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    }
  });

  // 获取收藏列表
  const { data: favorites = [] } = useQuery({
    queryKey: ['video-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('video_favorites')
        .select('video_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(f => f.video_id);
    },
    enabled: !!user
  });

  // 获取类别统计
  const categoryStats = courses.reduce((acc, course) => {
    const cat = course.category || '其他';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 筛选和搜索
  const filteredCourses = courses.filter(course => {
    // 类别筛选
    if (activeCategory !== "all" && course.category !== activeCategory) {
      return false;
    }
    
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        course.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // 处理观看
  const handleWatch = async (course: Course) => {
    if (!user) {
      toast.error("请先登录");
      navigate("/auth");
      return;
    }

    // 记录观看历史
    try {
      await supabase
        .from('video_watch_history')
        .insert({
          user_id: user.id,
          video_id: course.id,
          watched_at: new Date().toISOString(),
          completed: false
        });
    } catch (error) {
      console.error('记录观看历史失败:', error);
    }

    // 打开视频
    window.open(course.video_url, '_blank');
    toast.success("视频已在新标签页打开");
  };

  // 处理收藏
  const handleToggleFavorite = async (courseId: string) => {
    if (!user) {
      toast.error("请先登录");
      navigate("/auth");
      return;
    }

    const isFavorited = favorites.includes(courseId);

    try {
      if (isFavorited) {
        await supabase
          .from('video_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', courseId);
        toast.success("已取消收藏");
      } else {
        await supabase
          .from('video_favorites')
          .insert({
            user_id: user.id,
            video_id: courseId
          });
        toast.success("已添加收藏");
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      toast.error("操作失败，请重试");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Video className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载课程中...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: "all", name: "全部", count: courses.length },
    ...Object.entries(categoryStats).map(([name, count]) => ({
      id: name,
      name,
      count
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-background/80"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                线上课程
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                共 {courses.length} 门课程 · 系统化学习成长
              </p>
            </div>
            <div className="w-[80px]"></div>
          </div>

          {/* 搜索框 */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索课程标题、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* 类别筛选 */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="gap-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {category.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* 课程网格 */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">暂无符合条件的课程</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const isFavorited = favorites.includes(course.id);
              
              return (
                <Card
                  key={course.id}
                  className="group cursor-pointer bg-card/60 backdrop-blur-sm border-2 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl rounded-2xl overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </CardTitle>
                        {course.category && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {course.category}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(course.id);
                        }}
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {course.description && (
                      <CardDescription className="text-sm leading-relaxed line-clamp-3">
                        {course.description}
                      </CardDescription>
                    )}

                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {course.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {course.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{course.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => handleWatch(course)}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                      <Video className="w-4 h-4" />
                      观看课程
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>

                    {course.source && (
                      <p className="text-xs text-muted-foreground text-center">
                        来源：{course.source}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
