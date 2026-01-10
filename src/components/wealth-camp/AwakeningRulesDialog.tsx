import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Target, Star, TrendingUp, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AwakeningRulesDialogProps {
  trigger?: React.ReactNode;
}

const AwakeningRulesDialog: React.FC<AwakeningRulesDialogProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            财富觉醒之旅 · 规则说明
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="index" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="index" className="text-xs">📊 指数</TabsTrigger>
            <TabsTrigger value="goals" className="text-xs">🎯 目标</TabsTrigger>
            <TabsTrigger value="points" className="text-xs">⭐ 积分</TabsTrigger>
          </TabsList>
          
          {/* 指数说明 */}
          <TabsContent value="index" className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              觉醒指数统一使用 0-100 分制，分数越高代表财富意识越觉醒
            </div>
            
            {/* 转换示例 - 帮助用户理解 */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 dark:from-rose-950/30 dark:via-amber-950/30 dark:to-emerald-950/30 border border-amber-200/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">📌 转换示例</div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-rose-600">55</div>
                  <div className="text-[10px] text-muted-foreground">卡点分数</div>
                  <div className="text-[10px] text-rose-500/70">越低越好</div>
                </div>
                <div className="flex flex-col items-center px-3">
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="text-[10px] text-muted-foreground font-mono">100 - 55</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">45</div>
                  <div className="text-[10px] text-muted-foreground">觉醒起点</div>
                  <div className="text-[10px] text-emerald-500/70">越高越好</div>
                </div>
              </div>
              <div className="text-center mt-2 text-[10px] text-muted-foreground">
                卡点分 + 觉醒分 = 100（互为补数）
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-600 font-medium">觉醒起点</span>
                  <span className="text-xs text-muted-foreground">Day 0</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  来自财富卡点测评。将卡点分（越高越阻塞）转换为觉醒分（越高越好）
                </p>
                <div className="mt-2 text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1">
                  <div className="font-mono">觉醒起点 = 100 - 卡点分数</div>
                  <div className="text-muted-foreground mt-1">卡点分数 = (三层原始分之和 ÷ 150) × 100</div>
                </div>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600 font-medium">当前觉醒</span>
                  <span className="text-xs text-muted-foreground">最佳表现</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  取最近 3 天教练梳理的最佳平均分，确保反映你的真实潜力
                </p>
                <div className="mt-2 text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 font-mono">
                  当前觉醒 = (星级均分 - 1) ÷ 4 × 100
                </div>
              </div>
              
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 border border-violet-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-violet-600 font-medium">成长值</span>
                  <span className="text-xs text-muted-foreground">+N</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  从觉醒起点到当前觉醒的提升幅度，是你7天训练的成果
                </p>
                <div className="mt-2 text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 font-mono">
                  成长值 = 当前觉醒 - 觉醒起点
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* 觉醒目标 */}
          <TabsContent value="goals" className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              7天训练营的目标是提升觉醒指数，达到更高的财富意识状态
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  80+
                </div>
                <div>
                  <div className="font-medium text-emerald-700 dark:text-emerald-400">🟢 高度觉醒</div>
                  <div className="text-xs text-muted-foreground">财富能量畅通，与金钱和谐共处</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                  60-79
                </div>
                <div>
                  <div className="font-medium text-amber-700 dark:text-amber-400">🟡 稳步觉醒</div>
                  <div className="text-xs text-muted-foreground">持续突破中，正在建立新模式</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  40-59
                </div>
                <div>
                  <div className="font-medium text-orange-700 dark:text-orange-400">🟠 初步觉醒</div>
                  <div className="text-xs text-muted-foreground">开始看见改变，意识正在觉醒</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50">
                <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm">
                  0-39
                </div>
                <div>
                  <div className="font-medium text-rose-700 dark:text-rose-400">🔴 觉醒起步</div>
                  <div className="text-xs text-muted-foreground">刚刚开始，需要持续练习</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-lg border border-amber-200/50">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm">
                <Target className="h-4 w-4" />
                7天目标
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                坚持完成每日练习，目标是在7天内提升至少 10 分觉醒指数
              </p>
            </div>
          </TabsContent>
          
          {/* 积分规则 */}
          <TabsContent value="points" className="space-y-3 mt-4">
            <div className="text-sm text-muted-foreground mb-3">
              通过完成每日任务获得积分，积分累积可解锁更高等级
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">每日任务</div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧘</span>
                    <span className="text-sm">完成每日冥想</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">+10</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm">完成教练梳理</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">+20</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm">完成给予行动</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">+15</span>
                </div>
              </div>
              
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">额外奖励</div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200/30">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">单层得分 ≥ 4星</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">+5</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200/30">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">全层满分 (5星)</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">+30</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-lg border border-violet-200/30">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-500" />
                    <span className="text-sm">成功邀请学员</span>
                  </div>
                  <span className="text-sm font-medium text-violet-600">+50</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">
                💡 <strong>提示：</strong>每日潜力积分 = 基础任务(45) + 额外奖励(最高45) = 最高 90 分/天
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AwakeningRulesDialog;
