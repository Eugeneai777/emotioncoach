import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Target } from "lucide-react";

interface ParentSession {
  id: string;
  event_description: string | null;
  feel_it: any;
  see_it: any;
  sense_it: any;
  transform_it: any;
  created_at: string;
}

interface ParentPatternInsightsProps {
  sessions: ParentSession[];
}

export const ParentPatternInsights = ({ sessions }: ParentPatternInsightsProps) => {
  // 分析常见触发场景
  const triggers: Record<string, number> = {};
  sessions.forEach(session => {
    const desc = session.event_description || "";
    const keywords = ["作业", "刷牙", "吃饭", "睡觉", "手机", "游戏", "电视", "学习"];
    keywords.forEach(keyword => {
      if (desc.includes(keyword)) {
        triggers[keyword] = (triggers[keyword] || 0) + 1;
      }
    });
  });

  const topTriggers = Object.entries(triggers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // 分析反应模式（基于 sense_it）
  const reactions: Record<string, number> = {
    "提高音量": 0,
    "忍住不说": 0,
    "讲道理": 0,
    "其他": 0
  };

  sessions.forEach(session => {
    const senseIt = JSON.stringify(session.sense_it || "").toLowerCase();
    if (senseIt.includes("音量") || senseIt.includes("吼")) {
      reactions["提高音量"]++;
    } else if (senseIt.includes("忍") || senseIt.includes("不说")) {
      reactions["忍住不说"]++;
    } else if (senseIt.includes("道理") || senseIt.includes("说教")) {
      reactions["讲道理"]++;
    } else if (session.sense_it) {
      reactions["其他"]++;
    }
  });

  const topReactions = Object.entries(reactions)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // 成长轨迹洞察
  const recentSessions = sessions.slice(0, 5);
  const olderSessions = sessions.slice(-5);
  
  const hasTransformItRecent = recentSessions.filter(s => s.transform_it).length;
  const hasTransformItOlder = olderSessions.filter(s => s.transform_it).length;
  
  const improvementRate = sessions.length > 5 
    ? ((hasTransformItRecent / recentSessions.length) - (hasTransformItOlder / olderSessions.length)) * 100
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">常见触发场景</h3>
        </div>
        {topTriggers.length > 0 ? (
          <div className="space-y-3">
            {topTriggers.map(([trigger, count]) => (
              <div key={trigger} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">{trigger}</span>
                <Badge variant="secondary">{count} 次</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">反应模式识别</h3>
        </div>
        {topReactions.length > 0 ? (
          <div className="space-y-3">
            {topReactions.map(([reaction, count]) => (
              <div key={reaction} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">{reaction}</span>
                <Badge variant="secondary">{count} 次</Badge>
              </div>
            ))}
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 识别到你的反应模式，这是成长的第一步！继续通过四部曲练习，你会发现更多可能性。
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">暂无数据</p>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">成长轨迹</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{sessions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">练习次数</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-secondary-foreground">
                {sessions.filter(s => s.transform_it).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">完成转化</p>
            </div>
          </div>
          
          {sessions.length > 5 && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">
                {improvementRate > 0 ? "🌟 进步趋势" : "💪 继续加油"}
              </p>
              <p className="text-xs text-muted-foreground">
                {improvementRate > 0 
                  ? `最近的对话中，你有 ${hasTransformItRecent}/${recentSessions.length} 次完成了转化行动，比之前提升了 ${improvementRate.toFixed(0)}%！` 
                  : "每一次练习都是成长，继续坚持！"}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
