import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublishedSessions } from "@/hooks/useTeamCoaching";
import { TeamCoachingCard } from "@/components/team-coaching/TeamCoachingCard";
import { TeamCoachingCardSkeleton } from "@/components/team-coaching/TeamCoachingCardSkeleton";

type FilterType = 'all' | 'free' | 'paid';

export default function TeamCoaching() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: sessions, isLoading } = usePublishedSessions(filter);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">团队教练</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 筛选标签 */}
      <div className="px-4 py-3 border-b">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="free">免费</TabsTrigger>
            <TabsTrigger value="paid">付费</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 课程列表 */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <>
            <TeamCoachingCardSkeleton />
            <TeamCoachingCardSkeleton />
            <TeamCoachingCardSkeleton />
          </>
        ) : sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <TeamCoachingCard
              key={session.id}
              session={session}
              onClick={() => navigate(`/team-coaching/${session.id}`)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无课程</p>
            <p className="text-sm text-muted-foreground mt-1">
              稍后再来看看吧
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
