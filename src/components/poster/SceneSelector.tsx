import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle, BookOpen, Users, Sparkles } from "lucide-react";
import type { PosterTemplate, SceneType } from "./PosterTemplateGrid";

interface SceneSelectorProps {
  template: PosterTemplate;
  onConfirm: (scene: SceneType, tagline: string, sellingPoints: string[]) => void;
  onBack: () => void;
}

const sceneConfig = {
  default: {
    icon: Sparkles,
    label: '通用版',
    description: '标准专业文案',
    color: 'from-gray-400 to-gray-500'
  },
  moments: {
    icon: MessageCircle,
    label: '朋友圈版',
    description: '故事感+情感共鸣',
    color: 'from-green-400 to-emerald-500'
  },
  xiaohongshu: {
    icon: BookOpen,
    label: '小红书版',
    description: '数据种草+标签引流',
    color: 'from-red-400 to-pink-500'
  },
  wechat_group: {
    icon: Users,
    label: '微信群版',
    description: '群友推荐+信任背书',
    color: 'from-blue-400 to-indigo-500'
  }
};

export function SceneSelector({ template, onConfirm, onBack }: SceneSelectorProps) {
  const [selectedScene, setSelectedScene] = useState<SceneType>('default');

  const getSceneCopy = (scene: SceneType) => {
    if (scene === 'default') {
      return {
        tagline: template.tagline,
        sellingPoints: template.sellingPoints
      };
    }
    return {
      tagline: template.sceneVariants[scene].tagline,
      sellingPoints: template.sceneVariants[scene].sellingPoints
    };
  };

  const currentCopy = getSceneCopy(selectedScene);

  const handleConfirm = () => {
    onConfirm(selectedScene, currentCopy.tagline, currentCopy.sellingPoints);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center text-2xl`}>
          {template.emoji}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{template.name}</h3>
          <p className="text-sm text-muted-foreground">选择推广场景，获取专属文案</p>
        </div>
      </div>

      {/* Scene Options */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(sceneConfig) as SceneType[]).map((scene) => {
          const config = sceneConfig[scene];
          const Icon = config.icon;
          const isSelected = selectedScene === scene;
          
          return (
            <Card 
              key={scene}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-md' 
                  : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
              onClick={() => setSelectedScene(scene)}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              文案预览
            </Badge>
            {selectedScene !== 'default' && (
              <Badge variant="outline" className="text-xs">
                {template.sceneVariants[selectedScene as keyof typeof template.sceneVariants].tone}
              </Badge>
            )}
          </div>
          
          <p className="text-sm font-medium leading-relaxed">
            "{currentCopy.tagline}"
          </p>
          
          <div className="space-y-1.5 pt-1">
            {currentCopy.sellingPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">✓</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          返回选择
        </Button>
        <Button 
          onClick={handleConfirm} 
          className={`flex-1 bg-gradient-to-r ${template.gradient} text-white hover:opacity-90`}
        >
          使用此文案
        </Button>
      </div>
    </div>
  );
}
