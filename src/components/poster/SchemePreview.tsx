import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, RefreshCw, Lightbulb, Sparkles, Shield, Award, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrustElements {
  data_point?: string;
  authority_badge?: string;
  user_proof?: string;
  certification?: string;
}

export interface PosterScheme {
  scheme_name: string;
  recommended_template: string;
  template_name: string;
  template_reason: string;
  headline: string;
  subtitle: string;
  selling_points: string[];
  call_to_action: string;
  urgency_text: string;
  trust_elements?: TrustElements;
  background_keywords: string[];
  visual_style: string;
  color_scheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface GeneratedSchemes {
  schemes: PosterScheme[];
  target_audience: string;
  promotion_scene: string;
  trust_preference?: string;
  promotion_tips: string;
}

interface SchemePreviewProps {
  data: GeneratedSchemes;
  onSelectScheme: (scheme: PosterScheme) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

const schemeGradients = [
  'from-amber-500 to-orange-500',
  'from-teal-500 to-cyan-500',
];

const trustElementIcons: Record<string, typeof Shield> = {
  data_point: BarChart3,
  authority_badge: Award,
  user_proof: Users,
  certification: Shield,
};

const trustElementLabels: Record<string, string> = {
  data_point: '数据支持',
  authority_badge: '权威背书',
  user_proof: '用户验证',
  certification: '品牌认证',
};

export function SchemePreview({ 
  data, 
  onSelectScheme, 
  onRegenerate,
  isRegenerating 
}: SchemePreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelectScheme(data.schemes[selectedIndex]);
    }
  };

  const renderTrustElements = (trustElements?: TrustElements) => {
    if (!trustElements) return null;
    
    const elements = Object.entries(trustElements).filter(([_, value]) => value);
    if (elements.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          信任元素
        </p>
        <div className="flex flex-wrap gap-1.5">
          {elements.map(([key, value]) => {
            const Icon = trustElementIcons[key] || Shield;
            return (
              <span
                key={key}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
              >
                <Icon className="w-3 h-3" />
                {value}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">为你生成了2个方案</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("w-3 h-3 mr-1", isRegenerating && "animate-spin")} />
          {isRegenerating ? '生成中...' : '不满意？再生成'}
        </Button>
      </div>

      {/* Scheme Cards */}
      <div className="grid gap-3">
        {data.schemes.map((scheme, index) => (
          <Card
            key={index}
            className={cn(
              "p-4 cursor-pointer transition-all border-2",
              selectedIndex === index
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-muted-foreground/20"
            )}
            onClick={() => handleSelect(index)}
          >
            {/* Scheme Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium bg-gradient-to-br",
                  schemeGradients[index % 2]
                )}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div>
                  <p className="text-sm font-medium">{scheme.scheme_name}</p>
                  <p className="text-xs text-muted-foreground">推荐：{scheme.template_name}</p>
                </div>
              </div>
              {selectedIndex === index && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Recommendation Reason */}
            <div className="bg-muted/50 rounded-lg p-2 mb-3">
              <p className="text-xs text-muted-foreground">
                💡 {scheme.template_reason}
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2 mb-3">
              <p className="font-bold text-base leading-tight">{scheme.headline}</p>
              <p className="text-sm text-muted-foreground">{scheme.subtitle}</p>
            </div>

            {/* Selling Points */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {scheme.selling_points.map((point, i) => (
                <span
                  key={i}
                  className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
                >
                  ✨ {point}
                </span>
              ))}
            </div>

            {/* CTA & Urgency */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                {scheme.call_to_action}
              </span>
              <span className="text-red-500 font-medium">
                🔥 {scheme.urgency_text}
              </span>
            </div>

            {/* Trust Elements */}
            {renderTrustElements(scheme.trust_elements)}
          </Card>
        ))}
      </div>

      {/* Promotion Tips */}
      {data.promotion_tips && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">推广技巧</p>
              <p className="text-xs text-blue-600">{data.promotion_tips}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Button */}
      <Button
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        onClick={handleConfirm}
        disabled={selectedIndex === null}
      >
        {selectedIndex !== null ? '使用这个方案 →' : '请选择一个方案'}
      </Button>
    </div>
  );
}
