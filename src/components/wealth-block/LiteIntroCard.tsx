import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Target, TrendingDown, Brain, ArrowRight, Clock, CheckCircle } from "lucide-react";

interface LiteIntroCardProps {
  onStart: () => void;
}

export function LiteIntroCard({ onStart }: LiteIntroCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background px-4 py-6 pb-36">
      {/* 标题区域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full text-amber-700 text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          <span>财富潜能测评</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          财富卡点测评
        </h1>
        <p className="text-muted-foreground text-lg">
          发现阻碍你赚钱的隐形刹车
        </p>
      </div>

      {/* 测评简介 */}
      <Card className="mb-6 border-amber-200/50 bg-white/80 backdrop-blur">
        <CardContent className="p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-600" />
            什么是财富卡点？
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            财富卡点是指那些深藏在潜意识中，阻碍你赚钱、留钱、用钱的隐性心理障碍。它们可能来自童年经历、家庭信念或社会文化的影响，让你在不知不觉中给自己的财富之路踩下了"刹车"。
          </p>
        </CardContent>
      </Card>

      {/* 测评维度 */}
      <Card className="mb-6 border-amber-200/50 bg-white/80 backdrop-blur">
        <CardContent className="p-5">
          <h2 className="font-semibold text-foreground mb-4">测评四大维度</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-sm">💰</span>
              </div>
              <div>
                <p className="font-medium text-sm">思维穷</p>
                <p className="text-xs text-muted-foreground">金钱信念限制</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-sm">😰</span>
              </div>
              <div>
                <p className="font-medium text-sm">情绪穷</p>
                <p className="text-xs text-muted-foreground">金钱焦虑恐惧</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-sm">🙈</span>
              </div>
              <div>
                <p className="font-medium text-sm">行为穷</p>
                <p className="text-xs text-muted-foreground">财务习惯障碍</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-sm">🔗</span>
              </div>
              <div>
                <p className="font-medium text-sm">关系穷</p>
                <p className="text-xs text-muted-foreground">金钱关系模式</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测评特点 */}
      <Card className="mb-8 border-amber-200/50 bg-white/80 backdrop-blur">
        <CardContent className="p-5">
          <h2 className="font-semibold text-foreground mb-4">你将获得</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm text-muted-foreground">专业的财富卡点诊断报告</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm text-muted-foreground">四维度深度分析与建议</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm text-muted-foreground">个性化财富觉醒路径</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测评信息 */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>约5分钟</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          <span>30道题</span>
        </div>
      </div>

      {/* 开始按钮 */}
      <Button 
        onClick={onStart}
        className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
      >
        开始测评
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
