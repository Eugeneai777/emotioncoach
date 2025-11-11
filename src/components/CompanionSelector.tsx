import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

const companions = [
  {
    id: 'jing_teacher',
    name: '劲老师',
    icon: '🌿',
    description: '温柔、专业的情绪教练，陪你走过情绪四部曲',
    style: '温柔、缓慢、有节奏'
  },
  {
    id: 'little_sprout',
    name: '小树苗',
    icon: '🌱',
    description: '充满生命力的成长伙伴，和你一起慢慢长大',
    style: '温暖、鼓励、充满希望'
  },
  {
    id: 'starlight',
    name: '小星星',
    icon: '⭐',
    description: '闪亮的梦想守护者，照亮你的情绪之路',
    style: '明亮、激励、充满活力'
  },
  {
    id: 'calm_breeze',
    name: '微风',
    icon: '🍃',
    description: '轻柔的自然使者，带来平静与安宁',
    style: '平和、舒缓、轻松'
  },
  {
    id: 'wise_owl',
    name: '智慧猫头鹰',
    icon: '🦉',
    description: '深邃的智者，帮你看清情绪的本质',
    style: '深刻、洞察、启发'
  }
];

const conversationStyles = [
  {
    id: 'gentle',
    name: '温柔陪伴',
    description: '如同温热的茶，慢慢地、温柔地陪伴你',
    keywords: '接纳、共情、不评判'
  },
  {
    id: 'encouraging',
    name: '积极鼓励',
    description: '看到你的努力，肯定你的每一步成长',
    keywords: '肯定、激励、支持'
  },
  {
    id: 'analytical',
    name: '理性分析',
    description: '帮助你理性地理解和分析情绪',
    keywords: '逻辑、结构化、清晰'
  },
  {
    id: 'playful',
    name: '轻松活泼',
    description: '用轻松的方式面对情绪，带点幽默',
    keywords: '轻松、有趣、解压'
  },
  {
    id: 'profound',
    name: '深度启发',
    description: '引导你深入探索情绪背后的意义',
    keywords: '深刻、哲思、洞察'
  }
];

export const CompanionSelector = () => {
  const [selectedCompanion, setSelectedCompanion] = useState<string>('jing_teacher');
  const [selectedStyle, setSelectedStyle] = useState<string>('gentle');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('companion_type, conversation_style')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedCompanion(data.companion_type || 'jing_teacher');
        setSelectedStyle(data.conversation_style || 'gentle');
      }
    } catch (error) {
      console.error('加载偏好失败:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { error } = await supabase
        .from('profiles')
        .update({
          companion_type: selectedCompanion,
          conversation_style: selectedStyle,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "设置已保存 ✨",
        description: "你的情绪伙伴偏好已更新",
      });
    } catch (error) {
      console.error('保存偏好失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">选择你的情绪伙伴</h2>
          <p className="text-sm text-muted-foreground">
            每个伙伴都有独特的陪伴方式，选择最能共鸣的那一个
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companions.map((companion) => (
            <Card
              key={companion.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedCompanion === companion.id
                  ? 'border-primary border-2 bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedCompanion(companion.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{companion.icon}</span>
                    <h3 className="font-semibold text-foreground">{companion.name}</h3>
                  </div>
                  {selectedCompanion === companion.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {companion.description}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  风格：{companion.style}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">对话风格</h2>
          <p className="text-sm text-muted-foreground">
            定制伙伴与你对话的方式
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conversationStyles.map((style) => (
            <Card
              key={style.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedStyle === style.id
                  ? 'border-primary border-2 bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{style.name}</h3>
                  {selectedStyle === style.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {style.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {style.keywords.split('、').map((keyword, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={savePreferences} disabled={loading} size="lg">
          {loading ? "保存中..." : "保存设置"}
        </Button>
      </div>
    </div>
  );
};
