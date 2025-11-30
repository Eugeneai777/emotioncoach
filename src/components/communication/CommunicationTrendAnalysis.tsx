import { useMemo, useState, useEffect } from "react";
import { format, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunicationBriefing {
  id: string;
  communication_theme: string;
  created_at: string;
  communication_difficulty?: number;
  scenario_type?: string;
  difficulty_keywords?: string[];
}

const SCENARIO_TYPES = {
  family: "家庭沟通",
  work: "职场沟通",
  social: "社交沟通",
  romantic: "恋爱沟通",
  other: "其他沟通",
};

export const CommunicationTrendAnalysis = () => {
  const [briefings, setBriefings] = useState<CommunicationBriefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("communication_briefings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setBriefings(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const weekdayData = useMemo(() => {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const counts = Array(7).fill(0);
    briefings.forEach((b) => {
      const day = getDay(new Date(b.created_at));
      counts[day] += 1;
    });
    return weekdays.map((name, index) => ({ name, count: counts[index] }));
  }, [briefings]);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return "hsl(142, 76%, 36%)";
    if (difficulty <= 6) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有足够的数据进行趋势分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📅 星期分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};