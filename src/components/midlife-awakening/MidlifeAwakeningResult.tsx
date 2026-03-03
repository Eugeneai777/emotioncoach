import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, RotateCcw, Bot, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import {
  type MidlifeResult,
  personalityTypeConfig,
  dimensionConfig,
  resultSectionTitles,
  personalityRecommendations,
  getMidlifeScoreLevelLabel,
  getMidlifeScoreLevelColor,
  getMidlifeBarColor,
  type MidlifeDimension,
} from "./midlifeAwakeningData";

interface MidlifeAwakeningResultProps {
  result: MidlifeResult;
  onShare?: () => void;
  onRetake?: () => void;
}

function IndexBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const levelLabel = getMidlifeScoreLevelLabel(value);
  const levelColor = getMidlifeScoreLevelColor(value);
  const barColor = getMidlifeBarColor(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="font-medium">{label}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{value}</span>
          <span className={cn("text-xs", levelColor)}>{levelLabel}</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function MidlifeAwakeningResult({ result, onShare, onRetake }: MidlifeAwakeningResultProps) {
  const navigate = useNavigate();
  const personality = personalityTypeConfig[result.personalityType];
  const recommendation = personalityRecommendations[result.personalityType];

  // 雷达图数据
  const radarData = result.dimensions.map(d => ({
    dimension: dimensionConfig[d.dimension].shortName,
    value: d.score,
    fullMark: 100,
  }));

  const handleStartCoach = () => {
    navigate('/assessment-coach', {
      state: {
        pattern: result.personalityType,
        blockedDimension: result.personalityType,
        fromAssessment: 'midlife_awakening',
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 人格类型卡片 */}
      <Card className={cn("border-2 overflow-hidden", personality.bgColor)}>
        <div className={cn("p-6 text-white text-center", personality.gradient)}>
          <span className="text-4xl block mb-2">{personality.emoji}</span>
          <h2 className="text-xl font-bold">{personality.name}</h2>
          <p className="text-sm opacity-90 mt-1">{personality.tagline}</p>
        </div>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{personality.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">特征</p>
              <p className="text-xs font-medium mt-0.5">{personality.feature}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">核心困境</p>
              <p className="text-xs font-medium mt-0.5">{personality.coreDilemma}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground">突破口</p>
              <p className="text-xs font-medium mt-0.5">{personality.breakthrough}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 六维雷达图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{resultSectionTitles.radarChart.title}</CardTitle>
          <CardDescription className="text-xs">{resultSectionTitles.radarChart.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="得分" dataKey="value" stroke="hsl(25, 95%, 53%)" fill="hsl(25, 95%, 53%)" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 维度详情 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{resultSectionTitles.dimensions.title}</CardTitle>
          <CardDescription className="text-xs">{resultSectionTitles.dimensions.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.dimensions.map(d => {
            const config = dimensionConfig[d.dimension];
            return (
              <IndexBar key={d.dimension} label={config.name} value={d.score} icon={config.icon} />
            );
          })}
        </CardContent>
      </Card>

      {/* 三大核心指标 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">核心指标</CardTitle>
          <CardDescription className="text-xs">基于六维数据整合的三大关键指标</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndexBar label="内耗风险" value={result.internalFrictionRisk} icon="🌀" />
          <IndexBar label="行动力" value={result.actionPower} icon="⚡" />
          <IndexBar label="使命清晰度" value={result.missionClarity} icon="🧭" />
        </CardContent>
      </Card>

      {/* AI教练入口 */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{resultSectionTitles.aiCoach.title}</h3>
              <p className="text-xs text-muted-foreground">{resultSectionTitles.aiCoach.subtitle}</p>
            </div>
          </div>
          <Button onClick={handleStartCoach} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <MessageCircle className="w-4 h-4 mr-2" />
            开始对话
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* 推荐 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">为你推荐</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">推荐教练：{recommendation.coach}</span>
              <Badge variant="secondary" className="text-[10px]">适合你</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">推荐工具：{recommendation.tool}</span>
              <Badge variant="secondary" className="text-[10px]">突破口</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button variant="outline" onClick={onRetake} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-1" />
          重新测评
        </Button>
        <Button onClick={onShare} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Share2 className="w-4 h-4 mr-1" />
          分享结果
        </Button>
      </div>
    </div>
  );
}
