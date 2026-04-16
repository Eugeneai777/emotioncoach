import React, { useState, useEffect } from "react";
import { Mic, ChevronDown, Phone, Zap, Battery } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface VoiceSession {
  id: string;
  coach_key: string;
  duration_seconds: number | null;
  billed_minutes: number | null;
  total_cost: number | null;
  created_at: string;
}

const COACH_LABELS: Record<string, string> = {
  vibrant_life_sage: "生活教练",
  emotion_coach: "情绪教练",
  wealth_coach: "财富教练",
  career_coach: "职场教练",
  relationship_coach: "关系教练",
  parenting_coach: "亲子教练",
  youth_mentor: "青少年教练",
};

const getCoachLabel = (key: string): string =>
  COACH_LABELS[key] || key.replace(/_/g, " ");

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "0秒";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}秒`;
  return `${mins}分${secs > 0 ? secs + "秒" : ""}`;
};

interface Props {
  userId: string;
}

export const VoiceUsageSection: React.FC<Props> = ({ userId }) => {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [sessionsRes, accountRes] = await Promise.all([
        supabase
          .from("voice_chat_sessions")
          .select("id, coach_key, duration_seconds, billed_minutes, total_cost, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_accounts")
          .select("remaining_quota")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (sessionsRes.data) setSessions(sessionsRes.data as VoiceSession[]);
      if (accountRes.data) setRemainingQuota(accountRes.data.remaining_quota);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading || sessions.length === 0) return null;

  // 本月汇总
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSessions = sessions.filter(
    (s) => new Date(s.created_at) >= monthStart
  );
  const monthCalls = monthSessions.length;
  const monthPoints = monthSessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  

  const visible = showAll ? sessions : sessions.slice(0, 3);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">语音通话记录</h2>
        </div>
        <span className="text-xs text-muted-foreground">近期记录</span>
      </div>

      {/* 汇总条 */}
      <Card className="border-border/40 bg-card/80 mb-2">
        <CardContent className="p-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {remainingQuota !== null && (
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-emerald-500" />
              剩余 <span className="font-semibold text-foreground">{remainingQuota}</span> 点
            </span>
          )}
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            本月消耗 <span className="font-semibold text-foreground">{monthPoints}</span> 点
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-primary/60" />
            本月 <span className="font-semibold text-foreground">{monthCalls}</span> 次通话
          </span>
        </CardContent>
      </Card>

      {/* 记录列表 */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-0 divide-y divide-border/30">
          {visible.map((s) => (
            <div key={s.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {getCoachLabel(s.coach_key)}
                </Badge>
                <span className="text-xs font-semibold text-foreground">
                  消耗 {s.total_cost ?? 0} 点
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>通话 {formatDuration(s.duration_seconds)}</span>
                <span>{new Date(s.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {sessions.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-1 mt-2 py-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <span>{showAll ? "收起" : "查看全部记录"}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </section>
  );
};
