import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Play, CheckCircle2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getDateRangeUTC } from "@/utils/dateUtils";

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campId: string;
  userId: string;
  date: string | null;
}

interface Briefing {
  id: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
  growth_story: string | null;
  created_at: string;
}

interface VideoRecommendation {
  id: string;
  video_id: string;
  reason: string | null;
  match_score: number | null;
  is_completed: boolean;
  watched_at: string | null;
  video_courses: {
    id: string;
    title: string;
    video_url: string | null;
    description: string | null;
    category: string | null;
  } | null;
}

const DayDetailDialog = ({ open, onOpenChange, campId, userId, date }: DayDetailDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([]);

  useEffect(() => {
    if (open && date) {
      loadDayDetails();
    }
  }, [open, date, campId, userId]);

  const loadDayDetails = async () => {
    if (!date || !userId || !campId) return;
    
    setLoading(true);
    try {
      // 加载简报和推荐课程并行执行
      await Promise.all([
        loadBriefingForDate(),
        loadRecommendationsForDate(),
      ]);
    } catch (error) {
      console.error("Error loading day details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBriefingForDate = async () => {
    if (!date || !userId) return;
    
    const { start, end } = getDateRangeUTC(date);
    
    const { data, error } = await supabase
      .from("briefings")
      .select("id, emotion_theme, emotion_intensity, insight, action, growth_story, created_at, conversations!inner(user_id)")
      .eq("conversations.user_id", userId)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading briefing:", error);
      return;
    }

    setBriefing(data as Briefing | null);
  };

  const loadRecommendationsForDate = async () => {
    if (!date || !userId || !campId) return;

    const { data, error } = await supabase
      .from("camp_video_tasks")
      .select(`
        id, video_id, reason, match_score, is_completed, watched_at,
        video_courses (id, title, video_url, description, category)
      `)
      .eq("camp_id", campId)
      .eq("user_id", userId)
      .eq("progress_date", date)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Error loading recommendations:", error);
      return;
    }

    setRecommendations((data as VideoRecommendation[]) || []);
  };

  const getIntensityColor = (intensity: number | null) => {
    if (!intensity) return "bg-muted text-muted-foreground";
    if (intensity <= 3) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (intensity <= 6) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  };

  const handleWatchVideo = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (!date) return null;

  const formattedDate = format(parseISO(date), "yyyy年M月d日 EEEE", { locale: zhCN });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            {formattedDate} 打卡记录
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 情绪简报 */}
            <div>
              <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" />
                情绪简报
              </h3>
              {briefing ? (
                <Card className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-800/50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-medium text-teal-900 dark:text-teal-100">
                        {briefing.emotion_theme}
                      </span>
                      {briefing.emotion_intensity && (
                        <Badge className={getIntensityColor(briefing.emotion_intensity)}>
                          强度 {briefing.emotion_intensity}/10
                        </Badge>
                      )}
                    </div>
                    
                    {briefing.insight && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">洞察</p>
                        <p className="text-sm text-foreground leading-relaxed">{briefing.insight}</p>
                      </div>
                    )}
                    
                    {briefing.action && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">行动计划</p>
                        <p className="text-sm text-foreground leading-relaxed">{briefing.action}</p>
                      </div>
                    )}

                    {briefing.growth_story && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">成长故事</p>
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{briefing.growth_story}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="p-4 bg-muted/30 border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    未找到当天的情绪简报
                  </p>
                </Card>
              )}
            </div>

            {/* 推荐课程 */}
            <div>
              <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2 mb-3">
                <Play className="w-4 h-4" />
                推荐课程
              </h3>
              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <Card 
                      key={rec.id} 
                      className="p-3 bg-white/70 dark:bg-background/70 border-teal-200/40 dark:border-teal-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {rec.video_courses?.title || "未知课程"}
                            </p>
                            {rec.is_completed && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                已看
                              </Badge>
                            )}
                          </div>
                          {rec.reason && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{rec.reason}</p>
                          )}
                          {rec.video_courses?.category && (
                            <Badge variant="outline" className="mt-2 text-[10px] h-4 px-1.5">
                              {rec.video_courses.category}
                            </Badge>
                          )}
                        </div>
                        {rec.video_courses?.video_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => handleWatchVideo(rec.video_courses?.video_url || null)}
                          >
                            <ExternalLink className="w-4 h-4 text-teal-600" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4 bg-muted/30 border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    当天没有推荐课程
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DayDetailDialog;
