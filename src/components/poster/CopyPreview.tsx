import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GeneratedCopy {
  recommended_template: string;
  target_audience: string;
  promotion_scene?: string;
  headline_options: string[];
  subtitle_options: string[];
  selling_points: string[];
  call_to_action: string;
  promotion_tips?: string;
  template_reason?: string;
  urgency_text?: string;
}

interface CopyPreviewProps {
  copy: GeneratedCopy;
  onConfirm: (copy: GeneratedCopy & { selectedHeadline: number; selectedSubtitle: number }) => void;
}

const templateNames: Record<string, string> = {
  emotion_button: '情绪按钮',
  emotion_coach: '情绪教练',
  parent_coach: '亲子教练',
  communication_coach: '沟通教练',
  story_coach: '故事教练',
  emotion_journal_21: '情绪日记训练营',
  parent_emotion_21: '青少年困境突破营',
  training_camp: '21天训练营',
  '365_member': '365会员',
  member_365: '365会员',
  partner_recruit: '招募合伙人',
};

export function CopyPreview({ copy, onConfirm }: CopyPreviewProps) {
  const [selectedHeadline, setSelectedHeadline] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState(0);

  const handleConfirm = () => {
    onConfirm({
      ...copy,
      selectedHeadline,
      selectedSubtitle,
    });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Recommended Template Badge */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">推荐模板：</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {templateNames[copy.recommended_template] || copy.recommended_template}
          </span>
        </div>
        
        {/* Template Reason */}
        {copy.template_reason && (
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">
              💡 {copy.template_reason}
            </p>
          </div>
        )}
      </div>

      {/* Headlines Selection */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">选择标题：</p>
        <div className="space-y-2">
          {copy.headline_options.map((headline, i) => (
            <Card
              key={i}
              className={cn(
                "p-3 cursor-pointer transition-all border-2",
                selectedHeadline === i
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted-foreground/20"
              )}
              onClick={() => setSelectedHeadline(i)}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  selectedHeadline === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {selectedHeadline === i ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="text-sm font-medium">{headline}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Subtitles Selection */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">选择副标题：</p>
        <div className="space-y-2">
          {copy.subtitle_options.map((subtitle, i) => (
            <Card
              key={i}
              className={cn(
                "p-3 cursor-pointer transition-all border-2",
                selectedSubtitle === i
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted-foreground/20"
              )}
              onClick={() => setSelectedSubtitle(i)}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  selectedSubtitle === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {selectedSubtitle === i ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="text-sm">{subtitle}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Selling Points Preview */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">产品卖点：</p>
        <div className="flex flex-wrap gap-2">
          {copy.selling_points.map((point, i) => (
            <span
              key={i}
              className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
            >
              ✨ {point}
            </span>
          ))}
        </div>
      </div>

      {/* Urgency Text */}
      {copy.urgency_text && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">紧迫感：</span>
          <span className="text-xs font-medium text-red-500">
            🔥 {copy.urgency_text}
          </span>
        </div>
      )}

      {/* Promotion Tips */}
      {copy.promotion_tips && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">推广技巧</p>
              <p className="text-xs text-blue-600">{copy.promotion_tips}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Button */}
      <Button
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        onClick={handleConfirm}
      >
        使用这个文案生成海报 →
      </Button>
    </div>
  );
}
