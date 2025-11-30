import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSession {
  id: string;
  event_description: string | null;
  created_at: string;
  tags?: ParentTag[];
  briefing?: {
    emotion_theme: string;
    emotion_intensity: number | null;
    insight: string | null;
  };
}

interface ParentSessionComparisonProps {
  sessions: ParentSession[];
}

export const ParentSessionComparison = ({ sessions }: ParentSessionComparisonProps) => {
  const [session1Id, setSession1Id] = useState<string>("");
  const [session2Id, setSession2Id] = useState<string>("");

  const session1 = sessions.find(s => s.id === session1Id);
  const session2 = sessions.find(s => s.id === session2Id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔄 亲子对话对比
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">选择对话 1</label>
            <Select value={session1Id} onValueChange={setSession1Id}>
              <SelectTrigger>
                <SelectValue placeholder="选择一次对话" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.briefing?.emotion_theme || session.event_description || "未命名对话"} - {formatDate(session.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">选择对话 2</label>
            <Select value={session2Id} onValueChange={setSession2Id}>
              <SelectTrigger>
                <SelectValue placeholder="选择另一次对话" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.briefing?.emotion_theme || session.event_description || "未命名对话"} - {formatDate(session.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {session1 && session2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 对话 1 */}
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(session1.created_at)}
                </div>
                
                {session1.briefing?.emotion_theme && (
                  <div className="mb-3">
                    <span className="text-lg">💜</span>
                    <span className="ml-2 font-semibold">{session1.briefing.emotion_theme}</span>
                  </div>
                )}

                {session1.event_description && (
                  <p className="text-sm text-muted-foreground mb-3">{session1.event_description}</p>
                )}

                {session1.briefing?.emotion_intensity !== null && session1.briefing?.emotion_intensity !== undefined && (
                  <div className="mb-3">
                    <span className="text-sm font-medium">情绪强度: </span>
                    <span className="text-sm font-bold text-purple-600">{session1.briefing.emotion_intensity}/10</span>
                  </div>
                )}

                {session1.briefing?.insight && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">洞察</p>
                    <p className="text-sm">{session1.briefing.insight}</p>
                  </div>
                )}

                {session1.tags && session1.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session1.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 对话 2 */}
            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(session2.created_at)}
                </div>
                
                {session2.briefing?.emotion_theme && (
                  <div className="mb-3">
                    <span className="text-lg">💜</span>
                    <span className="ml-2 font-semibold">{session2.briefing.emotion_theme}</span>
                  </div>
                )}

                {session2.event_description && (
                  <p className="text-sm text-muted-foreground mb-3">{session2.event_description}</p>
                )}

                {session2.briefing?.emotion_intensity !== null && session2.briefing?.emotion_intensity !== undefined && (
                  <div className="mb-3">
                    <span className="text-sm font-medium">情绪强度: </span>
                    <span className="text-sm font-bold text-purple-600">{session2.briefing.emotion_intensity}/10</span>
                  </div>
                )}

                {session2.briefing?.insight && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">洞察</p>
                    <p className="text-sm">{session2.briefing.insight}</p>
                  </div>
                )}

                {session2.tags && session2.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {session2.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(!session1 || !session2) && (
          <p className="text-center text-muted-foreground py-8">
            请选择两次对话进行对比分析
          </p>
        )}
      </Card>
    </div>
  );
};