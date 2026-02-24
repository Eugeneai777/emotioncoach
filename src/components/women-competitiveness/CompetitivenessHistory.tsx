import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { levelInfo, CompetitivenessLevel } from "./competitivenessData";
import PageHeader from "@/components/PageHeader";
import { format } from "date-fns";

interface Assessment {
  id: string;
  total_score: number;
  level: string;
  category_scores: Record<string, number>;
  strongest_category: string;
  weakest_category: string;
  answers: Record<string, number>;
  follow_up_insights: any;
  ai_analysis: string | null;
  created_at: string;
}

interface CompetitivenessHistoryProps {
  onBack: () => void;
  onViewReport: (assessment: Assessment) => void;
}

export function CompetitivenessHistory({ onBack, onViewReport }: CompetitivenessHistoryProps) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('competitiveness_assessments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAssessments(data as any);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-rose-50 to-purple-50 pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader title="历史测评记录" showBack={true} />
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted-foreground mb-4">暂无历史测评记录</p>
            <Button variant="outline" onClick={onBack}>去测评</Button>
          </div>
        ) : (
          assessments.map((a, idx) => {
            const level = levelInfo[a.level as CompetitivenessLevel] || levelInfo.dormant;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow border-rose-200"
                  onClick={() => onViewReport(a)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-2xl">{level.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{a.total_score}分</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: level.color }}
                        >
                          {level.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(a.created_at), 'yyyy年M月d日 HH:mm')}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-sm">查看 →</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
