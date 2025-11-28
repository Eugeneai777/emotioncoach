import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";

interface ParentJourneySummaryProps {
  briefing: {
    emotion_theme: string;
    stage_1_content: string;
    stage_2_content: string;
    stage_3_content: string;
    stage_4_content: string;
    insight: string;
    action: string;
    growth_story: string;
  };
  onShare?: () => void;
  onDownload?: () => void;
}

export const ParentJourneySummary = ({ briefing, onShare, onDownload }: ParentJourneySummaryProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">🌸 今日主题情绪</h3>
            <p className="text-muted-foreground">{briefing.emotion_theme}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">🌿 情绪四部曲旅程</h3>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm text-primary mb-1">1️⃣ 觉察（Feel it）</div>
                <p className="text-sm text-muted-foreground">{briefing.stage_1_content}</p>
              </div>
              <div>
                <div className="font-medium text-sm text-primary mb-1">2️⃣ 看见（See it）</div>
                <p className="text-sm text-muted-foreground">{briefing.stage_2_content}</p>
              </div>
              <div>
                <div className="font-medium text-sm text-primary mb-1">3️⃣ 反应（Sense it）</div>
                <p className="text-sm text-muted-foreground">{briefing.stage_3_content}</p>
              </div>
              <div>
                <div className="font-medium text-sm text-primary mb-1">4️⃣ 转化（Transform it）</div>
                <p className="text-sm text-muted-foreground">{briefing.stage_4_content}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">💡 今日洞察</h3>
            <p className="text-muted-foreground">{briefing.insight}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">✅ 今日行动</h3>
            <p className="text-muted-foreground">{briefing.action}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">🌸 今日成长故事</h3>
            <p className="text-muted-foreground italic">💫「{briefing.growth_story}」</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        {onShare && (
          <Button variant="outline" className="flex-1" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            分享到社区
          </Button>
        )}
        {onDownload && (
          <Button variant="outline" className="flex-1" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            导出简报
          </Button>
        )}
      </div>
    </div>
  );
};