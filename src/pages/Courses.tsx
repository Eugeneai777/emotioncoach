import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { 
  ArrowLeft, 
  Search,
  Video,
  Heart,
  ExternalLink,
  BookOpen,
  User
} from "lucide-react";
import logoImage from "@/assets/logo-youjin-ai.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PersonalCourseZone } from "@/components/courses/PersonalCourseZone";
import { deductVideoQuota } from "@/utils/videoQuotaUtils";

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
  const [activeTab, setActiveTab] = useState<"personal" | "all">("all");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(20);

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

  // 来源统计
  const sourceStats = courses.reduce((acc, course) => {
    const src = course.source || '其他';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 来源筛选后的课程
  const sourceFilteredCourses = activeSource === "all"
    ? courses
    : courses.filter(c => c.source === activeSource);

  // 获取类别统计（基于来源筛选）
  const categoryStats = sourceFilteredCourses.reduce((acc, course) => {
    const cat = course.category || '其他';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 判断当前来源下是否只有一个分类
  const categoryEntries = Object.entries(categoryStats);
  const showCategories = categoryEntries.length > 1;

  // 筛选和搜索
  const filteredCourses = courses.filter(course => {
    // 来源筛选
    if (activeSource !== "all" && course.source !== activeSource) {
      return false;
    }
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
  const handleWatch = async (videoUrlOrCourse: string | Course, courseId?: string) => {
    if (!user) {
      toast.error("请先登录");
      navigate("/auth");
      return;
    }

    // 判断是传入的 Course 对象还是 URL + ID
    let videoUrl: string;
    let videoId: string;
    let videoTitle: string;
    
    if (typeof videoUrlOrCourse === 'string') {
      // 新的调用方式：handleWatch(videoUrl, courseId)
      videoUrl = videoUrlOrCourse;
      videoId = courseId!;
      videoTitle = courses.find(c => c.id === courseId)?.title || '视频课程';
    } else {
      // 旧的调用方式：handleWatch(course)
      const course = videoUrlOrCourse;
      videoUrl = course.video_url;
      videoId = course.id;
      videoTitle = course.title;
    }

    // 扣费检查（首次观看扣费）
    const result = await deductVideoQuota(user.id, videoId, videoTitle, 'courses_page');
    if (!result.success) {
      toast.error(result.error || "额度不足，请充值后观看");
      return;
    }

    // 打开视频
    const newWindow = window.open(videoUrl, '_blank');
    
    if (newWindow) {
      toast.success(result.isFirstWatch ? "扣费成功，视频已打开" : "视频已在新标签页打开");
    } else {
      toast.error("弹窗被拦截，请允许浏览器弹窗", {
        action: {
          label: "点击打开",
          onClick: () => window.open(videoUrl, '_blank'),
        },
      });
    }

    // 记录观看历史（仅首次观看时记录）
    if (result.isFirstWatch) {
      try {
        await supabase
          .from('video_watch_history')
          .insert({
            user_id: user.id,
            video_id: videoId,
            watched_at: new Date().toISOString(),
            completed: false
          });
      } catch (error) {
        console.error('记录观看历史失败:', error);
      }
    }
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
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="text-center">
          <Video className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载课程中...</p>
        </div>
      </div>
    );
  }

  const sources = [
    { id: "all", name: "全部", emoji: "📚", count: courses.length },
    ...Object.entries(sourceStats).map(([name, count]) => ({
      id: name, name, count,
      emoji: name === "绽放公开课" ? "🦋" : name === "有劲365" ? "🔥" : "📖"
    }))
  ];

  const categories = categoryEntries.map(([name, count]) => ({
    id: name,
    name,
    count
  }));

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-accent/5"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="courses" />
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-warm/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div
                onClick={() => navigate('/')}
                className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <img src={logoImage} alt="有劲AI" className="w-9 h-9 md:w-12 md:h-12 rounded-full object-cover" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/energy-studio")}
                className="gap-2 hover:bg-background/80"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-warm to-primary bg-clip-text text-transparent">
                线上课程
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                共 {courses.length} 门课程 · 系统化学习成长
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "personal" | "all")} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="w-4 h-4" />
              全部课程
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2">
              <User className="w-4 h-4" />
              个人专区
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalCourseZone onWatchCourse={handleWatch} />
          </TabsContent>

          <TabsContent value="all">
            {/* 搜索框 */}
            <div className="relative max-w-xl mx-auto mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索课程标题、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* 来源筛选 */}
            <div className="flex flex-wrap gap-1.5 mb-2 justify-center">
              {sources.map(source => (
                <Button
                  key={source.id}
                  variant={activeSource === source.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveSource(source.id);
                    setActiveCategory("all");
                    setVisibleCount(20);
                  }}
                  className="gap-1 text-xs h-7 px-2.5"
                >
                  {source.name}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {source.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* 类别筛选 */}
            <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setActiveCategory(category.id); setVisibleCount(20); }}
                  className="gap-1 text-xs h-7 px-2.5"
                >
                  {category.name}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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
              <>
              <p className="text-center text-xs text-muted-foreground mb-3">
                显示 {Math.min(visibleCount, filteredCourses.length)} / {filteredCourses.length} 门课程
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.slice(0, visibleCount).map((course, index) => {
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
                            <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
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
                          <CardDescription className="text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
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
                          <p className="text-xs text-muted-foreground text-center hidden sm:block">
                            来源：{course.source}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {visibleCount < filteredCourses.length && (
                <div className="text-center mt-6 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="gap-2"
                  >
                    加载更多课程
                    <Badge variant="secondary" className="text-xs">
                      还有 {filteredCourses.length - visibleCount} 门
                    </Badge>
                  </Button>
                </div>
              )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Courses;
