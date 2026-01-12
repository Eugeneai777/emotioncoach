import { useState } from "react";
import { ArrowLeft, Search, Filter, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HumanCoachCard } from "@/components/human-coach/HumanCoachCard";
import { CoachRecommendations } from "@/components/human-coach/CoachRecommendations";
import { useActiveHumanCoaches } from "@/hooks/useHumanCoaches";
import { useCoachProfile } from "@/hooks/useCoachDashboard";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { Helmet } from "react-helmet";

const SPECIALTIES = [
  "全部",
  "亲子关系",
  "情绪管理",
  "职场压力",
  "人际沟通",
  "个人成长",
  "婚姻家庭",
];

export default function HumanCoaches() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("全部");
  const { showTour, completeTour } = usePageTour('human_coaches');
  
  const { data: coaches = [], isLoading } = useActiveHumanCoaches();
  const { data: coachProfile } = useCoachProfile();
  
  // 筛选教练
  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch = !searchQuery || 
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === "全部" ||
      coach.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });
  
  return (
    <>
      <Helmet>
        <title>真人教练 - 有劲AI</title>
        <meta name="description" content="一对一专属咨询服务，找到适合你的教练" />
        <meta property="og:title" content="有劲AI • 真人教练" />
        <meta property="og:description" content="专业认证教练，一对一深度咨询，助你突破成长瓶颈" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/human-coaches" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      <PageTour
        steps={pageTourConfig.human_coaches}
        open={showTour}
        onComplete={completeTour}
      />
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">真人教练</h1>
              <p className="text-xs text-muted-foreground">一对一专属咨询服务</p>
            </div>
          </div>
          
          {/* 申请成为教练入口 */}
          {!coachProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/become-coach")}
              className="text-teal-600 border-teal-200 hover:bg-teal-50"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              申请入驻
            </Button>
          )}
          {coachProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/coach-dashboard")}
              className="text-teal-600 border-teal-200 hover:bg-teal-50"
            >
              我的后台
            </Button>
          )}
        </div>
      </header>
      
      {/* 搜索和筛选 */}
      <div className="container max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索教练姓名或专业领域..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/60 backdrop-blur"
          />
        </div>
        
        {/* 专业领域筛选 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {SPECIALTIES.map((specialty) => (
            <Badge
              key={specialty}
              variant={selectedSpecialty === specialty ? "default" : "outline"}
              className={
                selectedSpecialty === specialty
                  ? "bg-teal-500 hover:bg-teal-600 cursor-pointer whitespace-nowrap"
                  : "bg-white/60 hover:bg-white cursor-pointer whitespace-nowrap"
              }
              onClick={() => setSelectedSpecialty(specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* 智能推荐 */}
      {!searchQuery && selectedSpecialty === "全部" && (
        <div className="container max-w-4xl mx-auto px-4 pb-4">
          <CoachRecommendations limit={3} showTitle={true} />
        </div>
      )}
      
      {/* 教练列表 */}
      <div className="container max-w-4xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery || selectedSpecialty !== "全部"
                ? "没有找到匹配的教练"
                : "暂无可预约的教练"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              请尝试其他搜索条件或稍后再来
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              共 {filteredCoaches.length} 位教练可预约
            </p>
            {filteredCoaches.map((coach) => (
              <HumanCoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
