import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Brain, Share2, MessageCircle, GraduationCap, Sparkles, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AssessmentResult, blockInfo, patternInfo, fourPoorInfo } from "./wealthBlockData";
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
  const dominantPoor = fourPoorInfo[result.dominantPoor];
  const DominantIcon = iconMap[result.dominantBlock];

  // 四穷雷达图数据
  const fourPoorRadarData = [
    { subject: '嘴穷', score: result.mouthScore, fullMark: 15 },
    { subject: '手穷', score: result.handScore, fullMark: 10 },
    { subject: '眼穷', score: result.eyeScore, fullMark: 15 },
    { subject: '心穷', score: result.heartScore, fullMark: 10 },
  ];

  // 三层卡点雷达图数据
  const layerRadarData = [
    { subject: '行为层', score: result.behaviorScore, fullMark: 50 },
    { subject: '情绪层', score: result.emotionScore, fullMark: 50 },
    { subject: '信念层', score: result.beliefScore, fullMark: 50 },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* 四穷主导卡点卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className={cn("bg-gradient-to-br p-6 text-white", dominantPoor.color)}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm text-4xl">
                {dominantPoor.emoji}
              </div>
              <div>
                <p className="text-white/80 text-sm">你的主导行为卡点</p>
                <h2 className="text-2xl font-bold">{dominantPoor.name}</h2>
                <p className="text-white/90 text-sm mt-1">{dominantPoor.description}</p>
              </div>
            </div>
            <p className="text-white/90 leading-relaxed text-sm">{dominantPoor.detail}</p>
          </div>
          
          <CardContent className="p-6 space-y-6">
            {/* 核心解决方案 */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                核心突破方案
              </h4>
              <p className="text-amber-800 text-sm leading-relaxed">{dominantPoor.solution}</p>
            </div>

            {/* 四穷雷达图 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">四穷行为卡点分布</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={fourPoorRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 15]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickCount={4}
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

            {/* 四穷得分条形图 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">四穷详细得分</h3>
              <div className="space-y-3">
                {[
                  { type: 'mouth' as const, label: '嘴穷', score: result.mouthScore, max: 15, emoji: '👄' },
                  { type: 'hand' as const, label: '手穷', score: result.handScore, max: 10, emoji: '✋' },
                  { type: 'eye' as const, label: '眼穷', score: result.eyeScore, max: 15, emoji: '👁️' },
                  { type: 'heart' as const, label: '心穷', score: result.heartScore, max: 10, emoji: '💔' },
                ].map(item => (
                  <div key={item.type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span>{item.emoji}</span>
                        {item.label}
                        {result.dominantPoor === item.type && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">主导</span>
                        )}
                      </span>
                      <span className="font-medium">{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", fourPoorInfo[item.type].bgColor)}
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

      {/* 三层卡点结果 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={cn("bg-gradient-to-br p-4 text-white", dominant.color)}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DominantIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-xs">深层财富卡点</p>
                <h3 className="text-lg font-bold">{dominant.emoji} {dominant.name}</h3>
              </div>
            </div>
          </div>
          
          <CardContent className="p-5 space-y-5">
            {/* 财富反应模式 */}
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm", pattern.color)}>
              <span>{pattern.emoji}</span>
              <span className="font-medium">财富反应模式：{pattern.name}</span>
            </div>
            
            {/* 三层雷达图 */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground text-sm">三层卡点分布</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={layerRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 50]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                      tickCount={6}
                    />
                    <Radar
                      name="得分"
                      dataKey="score"
                      stroke="hsl(280, 70%, 50%)"
                      fill="hsl(280, 70%, 50%)"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 三层得分条形图 */}
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
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", item.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / item.max) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 详细解读 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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

            {/* 核心逻辑提示 */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <p className="text-sm text-purple-800 leading-relaxed">
                <span className="font-semibold">核心逻辑：</span>财富伴随"无形价值"而来，需以利他发心，而非功利营销。扩大情感张力，对客户、家人、世界充满无分别的爱与关怀；让"爱意"贯穿行为，自然吸引他人信任与能量交换。
              </p>
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
              突破"{dominantPoor.name}"行动清单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dominantPoor.suggestions.map((suggestion, index) => (
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
        transition={{ delay: 0.5 }}
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
