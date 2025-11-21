import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TagSentimentBadge from "./TagSentimentBadge";

interface TagAssociation {
  tag1: {
    id: string;
    name: string;
    color: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  tag2: {
    id: string;
    name: string;
    color: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  count: number;
  avgIntensity: number | null;
  strength: number;
  lastOccurrence: string;
}

interface Pattern {
  type: string;
  title: string;
  description: string;
  associations: TagAssociation[];
  severity: 'low' | 'medium' | 'high';
  icon: string;
}

interface TagAssociationAnalysisProps {
  autoLoad?: boolean;
}

const TagAssociationAnalysis = ({ autoLoad = false }: TagAssociationAnalysisProps) => {
  const [associations, setAssociations] = useState<TagAssociation[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (autoLoad && !hasLoaded) {
      loadAssociations();
    }
  }, [autoLoad]);

  const loadAssociations = async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('未登录');

      const { data, error } = await supabase.functions.invoke('analyze-tag-associations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { minOccurrences: 3 }
      });

      if (error) throw error;

      setAssociations(data.associations || []);
      setPatterns(data.patterns || []);
      setHasLoaded(true);

      if (data.associations.length === 0) {
        toast.info('暂无标签关联数据', {
          description: '继续记录情绪，积累更多数据后将显示关联分析',
        });
      }
    } catch (error: any) {
      console.error('Error loading tag associations:', error);
      toast.error('加载标签关联失败', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const severityConfig = {
    low: { color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
    high: { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">正在分析标签关联...</p>
        </div>
      </Card>
    );
  }

  if (!hasLoaded) {
    return (
      <Card className="p-6 text-center">
        <Network className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold mb-2">标签关联分析</h3>
        <p className="text-sm text-muted-foreground mb-4">
          发现哪些情绪标签经常一起出现，识别你的情绪模式
        </p>
        <Button onClick={loadAssociations}>开始分析</Button>
      </Card>
    );
  }

  if (associations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold mb-2">暂无关联数据</h3>
        <p className="text-sm text-muted-foreground">
          继续记录情绪并使用标签，积累足够数据后将显示关联分析
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 识别的模式 */}
      {patterns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <Network className="w-5 h-5" />
            情绪模式识别
          </h3>
          {patterns.map((pattern, index) => {
            const config = severityConfig[pattern.severity];
            return (
              <Card key={index} className={`p-4 border ${config.bgColor}`}>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{pattern.icon}</span>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm mb-1 ${config.color}`}>
                        {pattern.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {pattern.description}
                      </p>
                    </div>
                  </div>

                  {/* 关联标签对 */}
                  <div className="space-y-2 pl-8">
                    {pattern.associations.map((assoc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${assoc.tag1.color}20`,
                              color: assoc.tag1.color,
                            }}
                          >
                            {assoc.tag1.name}
                          </Badge>
                          <TagSentimentBadge sentiment={assoc.tag1.sentiment} size="sm" />
                        </div>
                        <span className="text-muted-foreground">+</span>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${assoc.tag2.color}20`,
                              color: assoc.tag2.color,
                            }}
                          >
                            {assoc.tag2.name}
                          </Badge>
                          <TagSentimentBadge sentiment={assoc.tag2.sentiment} size="sm" />
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {assoc.count}次
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 所有关联列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            标签共现分析 ({associations.length}组)
          </h3>
          <Button variant="outline" size="sm" onClick={loadAssociations}>
            刷新
          </Button>
        </div>

        <div className="space-y-2">
          {associations.slice(0, 10).map((assoc, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${assoc.tag1.color}20`,
                        color: assoc.tag1.color,
                      }}
                    >
                      {assoc.tag1.name}
                    </Badge>
                    <TagSentimentBadge sentiment={assoc.tag1.sentiment} size="sm" />
                  </div>
                  <span className="text-muted-foreground text-xs">×</span>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${assoc.tag2.color}20`,
                        color: assoc.tag2.color,
                      }}
                    >
                      {assoc.tag2.name}
                    </Badge>
                    <TagSentimentBadge sentiment={assoc.tag2.sentiment} size="sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {assoc.count}次
                  </Badge>
                  {assoc.avgIntensity && (
                    <Badge variant="secondary" className="text-xs">
                      强度{assoc.avgIntensity}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(assoc.strength * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  关联强度: {Math.round(assoc.strength * 100)}%
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagAssociationAnalysis;
