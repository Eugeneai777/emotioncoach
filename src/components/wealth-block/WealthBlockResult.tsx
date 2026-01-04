import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Brain, Share2, MessageCircle, GraduationCap, Sparkles, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AssessmentResult, blockInfo, patternInfo } from "./wealthBlockData";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const iconMap = {
  behavior: Target,
  emotion: Heart,
  belief: Brain,
};

interface WealthBlockResultProps {
  result: AssessmentResult;
  onRetake: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function WealthBlockResult({ result, onRetake, onSave, isSaving, isSaved }: WealthBlockResultProps) {
  const navigate = useNavigate();
  const dominant = blockInfo[result.dominantBlock];
  const pattern = patternInfo[result.reactionPattern];
  const DominantIcon = iconMap[result.dominantBlock];

  // 雷达图数据
  const radarData = [
    { subject: '行为层', score: result.behaviorScore, fullMark: 50 },
    { subject: '情绪层', score: result.emotionScore, fullMark: 50 },
    { subject: '信念层', score: result.beliefScore, fullMark: 50 },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* 核心结果卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className={cn("bg-gradient-to-br p-6 text-white", dominant.color)}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <DominantIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/80 text-sm">你的主导财富卡点</p>
                <h2 className="text-2xl font-bold">{dominant.emoji} {dominant.name}</h2>
              </div>
            </div>
            <p className="text-white/90 leading-relaxed">{dominant.description}</p>
          </div>
          
          <CardContent className="p-6 space-y-6">
            {/* 财富反应模式 */}
            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border", pattern.color)}>
              <span>{pattern.emoji}</span>
              <span className="font-medium">财富反应模式：{pattern.name}</span>
            </div>
            
            {/* 雷达图 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">三层卡点分布</h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 50]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickCount={6}
                    />
                    <Radar
                      name="得分"
                      dataKey="score"
                      stroke="hsl(38, 92%, 50%)"
                      fill="hsl(38, 92%, 50%)"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 三层得分条形图 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">详细得分</h3>
              <div className="space-y-3">
                {[
                  { label: '行为层', score: result.behaviorScore, max: 50, color: 'bg-blue-500' },
                  { label: '情绪层', score: result.emotionScore, max: 50, color: 'bg-pink-500' },
                  { label: '信念层', score: result.beliefScore, max: 50, color: 'bg-purple-500' },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", item.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 详细解读 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">深度解读</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{dominant.detail}</p>
            
            <div className="p-4 bg-muted/50 rounded-xl border">
              <p className="text-sm text-muted-foreground">{pattern.description}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 行动建议 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              突破卡点行动清单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dominant.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* 行动按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        {onSave && !isSaved && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg h-12"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "保存中..." : "保存测评结果"}
          </Button>
        )}
        
        {isSaved && (
          <div className="flex items-center justify-center gap-2 text-emerald-600 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">测评结果已保存</span>
          </div>
        )}

        <Button 
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg h-12"
          onClick={() => navigate('/camps')}
        >
          <GraduationCap className="w-5 h-5 mr-2" />
          进入突破财富卡点训练营
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11">
            <Share2 className="w-4 h-4 mr-2" />
            分享结果
          </Button>
          <Button variant="outline" className="h-11" onClick={() => navigate('/energy-studio#coach')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            与教练对话
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={onRetake}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新测评
        </Button>
      </motion.div>
    </div>
  );
}