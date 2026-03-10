import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Enrollment {
  id: string;
  camp_type: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  training_camps?: { camp_name: string; duration_days: number } | null;
}

export function MyCourses({ userId }: { userId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_camp_enrollments")
      .select("id, camp_type, status, enrolled_at, completed_at, training_camps(camp_name, duration_days)")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false })
      .then(({ data }) => {
        if (data) setEnrollments(data as any);
        setLoading(false);
      });
  }, [userId]);

  if (loading || enrollments.length === 0) return null;

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "进行中", color: "text-green-600" },
    completed: { label: "已完成", color: "text-blue-600" },
    paused: { label: "已暂停", color: "text-amber-600" },
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          我的训练营
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrollments.map((e) => {
          const s = statusLabels[e.status] || { label: e.status, color: "text-muted-foreground" };
          return (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {e.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <BookOpen className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {(e.training_camps as any)?.camp_name || e.camp_type}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(e.enrolled_at), "yyyy-MM-dd")}
                  <span className={`font-medium ${s.color}`}>{s.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
