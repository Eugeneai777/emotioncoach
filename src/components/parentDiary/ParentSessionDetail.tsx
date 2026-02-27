import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar } from "lucide-react";
import { EmotionIntensityCard } from "@/components/EmotionIntensityMeter";
import { ParentSessionTagSelector } from "@/components/parentDiary/ParentSessionTagSelector";
import { MusicRecommendation } from "@/components/MusicRecommendation";
import { FrequencyMusicPlayer } from "@/components/FrequencyMusicPlayer";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSession {
  id: string;
  event_description: string | null;
  feel_it: any;
  see_it: any;
  sense_it: any;
  transform_it: any;
  micro_action: string | null;
  summary: string | null;
  created_at: string;
  tags?: ParentTag[];
  briefing?: {
    emotion_theme: string;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    growth_story: string | null;
    intensity_reasoning: string | null;
    intensity_keywords: string[] | null;
  };
}

interface ParentSessionDetailProps {
  session: ParentSession;
  onBack: () => void;
  onTagsChange: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderStageContent = (content: any) => {
  if (!content) return null;
  return typeof content === "string" ? content : JSON.stringify(content);
};

export const ParentSessionDetail = ({ session, onBack, onTagsChange }: ParentSessionDetailProps) => {
  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 md:gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-white border border-purple-100 rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 shadow-lg">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pb-3 md:pb-4 border-b border-border/50">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            {formatDate(session.created_at)}
          </div>

          <div className="space-y-4 md:space-y-6">
            {session.briefing?.emotion_theme && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  💜 情绪主题
                </h3>
                <p className="text-sm md:text-base text-foreground/80">{session.briefing.emotion_theme}</p>
              </div>
            )}

            {session.briefing?.emotion_intensity != null && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  📊 情绪强度
                </h3>
                <EmotionIntensityCard intensity={session.briefing.emotion_intensity} />
                {session.briefing.intensity_reasoning && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      <span className="font-medium">分析：</span>{session.briefing.intensity_reasoning}
                    </p>
                    {session.briefing.intensity_keywords && session.briefing.intensity_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {session.briefing.intensity_keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {session.event_description && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  🌟 触发事件
                </h3>
                <p className="text-sm md:text-base text-foreground/80">{session.event_description}</p>
              </div>
            )}

            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 flex items-center gap-2">
                💜 亲子情绪四部曲旅程
              </h3>
              <div className="space-y-3 pl-2 md:pl-4">
                {session.feel_it && (
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">1️⃣ 觉察（Feel it）</p>
                    <p className="text-foreground/70 text-xs md:text-sm mt-1">{renderStageContent(session.feel_it)}</p>
                  </div>
                )}
                {session.see_it && (
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">2️⃣ 看见（See it）</p>
                    <p className="text-foreground/70 text-xs md:text-sm mt-1">{renderStageContent(session.see_it)}</p>
                  </div>
                )}
                {session.sense_it && (
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">3️⃣ 反应（Sense it）</p>
                    <p className="text-foreground/70 text-xs md:text-sm mt-1">{renderStageContent(session.sense_it)}</p>
                  </div>
                )}
                {session.transform_it && (
                  <div>
                    <p className="font-medium text-foreground text-sm md:text-base">4️⃣ 转化（Transform it）</p>
                    <p className="text-foreground/70 text-xs md:text-sm mt-1">{renderStageContent(session.transform_it)}</p>
                  </div>
                )}
              </div>
            </div>

            {session.briefing?.insight && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">💡 今日洞察</h3>
                <p className="text-sm md:text-base text-foreground/80">{session.briefing.insight}</p>
              </div>
            )}

            {session.briefing?.action && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">🎯 今日行动</h3>
                <p className="text-sm md:text-base text-foreground/80">{session.briefing.action}</p>
              </div>
            )}

            {session.briefing?.growth_story && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">🌱 今日成长故事</h3>
                <p className="text-sm md:text-base text-foreground/80">{session.briefing.growth_story}</p>
              </div>
            )}

            {session.micro_action && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">✨ 微行动</h3>
                <p className="text-sm md:text-base text-foreground/80">{session.micro_action}</p>
              </div>
            )}

            {session.summary && (
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">📝 总结</h3>
                <p className="text-sm md:text-base text-foreground/80">{session.summary}</p>
              </div>
            )}

            <div className="pt-3 md:pt-4 border-t border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-2">标签</h3>
              <ParentSessionTagSelector
                sessionId={session.id}
                selectedTags={session.tags || []}
                onTagsChange={onTagsChange}
              />
            </div>

            {session.briefing?.emotion_theme && (
              <>
                <div className="pt-3 md:pt-4 border-t border-border/50">
                  <FrequencyMusicPlayer emotionTheme={session.briefing.emotion_theme} />
                </div>
                <div className="pt-3 md:pt-4 border-t border-border/50">
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">🎵 音乐推荐</h3>
                  <MusicRecommendation
                    emotionTheme={session.briefing.emotion_theme}
                    insight={session.briefing.insight || undefined}
                    briefingContent={session.summary || undefined}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
