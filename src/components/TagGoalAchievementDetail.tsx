import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown, TrendingUp, Calendar, Sparkles, Download } from "lucide-react";
import confetti from "canvas-confetti";
import type { TagGoalProgress } from "@/types/tagGoals";
import TagSentimentBadge from "./TagSentimentBadge";

interface TagGoalAchievementDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  tagName: string;
  tagSentiment: 'positive' | 'negative' | 'neutral';
  goalType: 'tag_reduction' | 'tag_increase';
  progress: TagGoalProgress;
  startDate: string;
  endDate: string;
}

const TagGoalAchievementDetail = ({
  open,
  onOpenChange,
  goalId,
  tagName,
  tagSentiment,
  goalType,
  progress,
  startDate,
  endDate,
}: TagGoalAchievementDetailProps): JSX.Element => {
  const [showConfetti, setShowConfetti] = useState(false);
  const isReduction = goalType === 'tag_reduction';

  useEffect(() => {
    if (open && !showConfetti && progress.status === 'success') {
      setShowConfetti(true);
      
      // 多阶段庆祝动画
      const duration = 5000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      // 初始爆炸
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#9370DB', '#3CB371'],
      });

      // 持续彩带效果
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 30 * (timeLeft / duration);

        // 从左侧发射
        confetti({
          particleCount: particleCount / 2,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });

        // 从右侧发射
        confetti({
          particleCount: particleCount / 2,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#9370DB', '#3CB371', '#FFD700'],
        });

        // 随机星星效果
        if (Math.random() > 0.7) {
          confetti({
            particleCount: 20,
            spread: 360,
            startVelocity: 30,
            origin: {
              x: randomInRange(0.1, 0.9),
              y: Math.random() - 0.2,
            },
            shapes: ['star'],
            colors: ['#FFD700', '#FFA500'],
          });
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [open, showConfetti, progress.status]);

  const calculateDuration = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const calculateReduction = () => {
    const weeklyData = progress.weeklyData;
    if (weeklyData.length < 2) return 0;
    
    const firstWeek = weeklyData[0].count;
    const lastWeek = weeklyData[weeklyData.length - 1].count;
    
    if (firstWeek === 0) return 0;
    
    return Math.round(((firstWeek - lastWeek) / firstWeek) * 100);
  };

  const duration = calculateDuration();
  const reductionPercent = calculateReduction();

  const achievements = [
    {
      icon: '🎯',
      title: '目标达成',
      description: `成功${isReduction ? '减少' : '增加'}"${tagName}"标签使用`,
    },
    {
      icon: '📊',
      title: isReduction ? `减少${Math.abs(reductionPercent)}%` : `增加${Math.abs(reductionPercent)}%`,
      description: '相比初始值的改善幅度',
    },
    {
      icon: '📅',
      title: `坚持${duration}天`,
      description: '持续追踪和管理',
    },
    {
      icon: '🌟',
      title: '模式突破',
      description: '成功改变情绪反应模式',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center animate-trophy-bounce shadow-lg shadow-yellow-500/50">
                <Trophy className="w-10 h-10 text-white animate-trophy-shine" />
              </div>
              <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent animate-text-shimmer">
                🎉 恭喜达成目标！
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 标签信息 */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 animate-slide-in-up">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 animate-fade-in">
                <Badge className="text-base px-4 py-2 animate-scale-in">
                  {tagName}
                </Badge>
                <TagSentimentBadge sentiment={tagSentiment} />
              </div>
              {isReduction ? (
                <TrendingDown className="w-6 h-6 text-green-600 animate-bounce-gentle" />
              ) : (
                <TrendingUp className="w-6 h-6 text-blue-600 animate-bounce-gentle" />
              )}
            </div>
          </Card>

          {/* 核心数据 */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center animate-slide-in-left hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-3xl font-bold text-primary mb-1 animate-count-up">
                {progress.currentWeeklyCount}
              </div>
              <div className="text-xs text-muted-foreground">本周次数</div>
            </Card>
            <Card className="p-4 text-center animate-slide-in-right hover:shadow-lg transition-all hover:-translate-y-1 animation-delay-100">
              <div className="text-3xl font-bold text-green-600 mb-1 animate-count-up animation-delay-100">
                {Math.abs(reductionPercent)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {isReduction ? '减少幅度' : '增长幅度'}
              </div>
            </Card>
            <Card className="p-4 text-center animate-slide-in-left hover:shadow-lg transition-all hover:-translate-y-1 animation-delay-200">
              <div className="text-3xl font-bold text-blue-600 mb-1 animate-count-up animation-delay-200">
                {duration}
              </div>
              <div className="text-xs text-muted-foreground">坚持天数</div>
            </Card>
            <Card className="p-4 text-center animate-slide-in-right hover:shadow-lg transition-all hover:-translate-y-1 animation-delay-300">
              <div className="text-3xl font-bold text-purple-600 mb-1 animate-count-up animation-delay-300">
                {progress.weeklyData.filter(w => w.status === 'success').length}
              </div>
              <div className="text-xs text-muted-foreground">达标周数</div>
            </Card>
          </div>

          {/* 成就列表 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              解锁成就
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {achievements.map((achievement, index) => (
                <Card
                  key={index}
                  className="p-3 hover:shadow-md transition-all duration-300 hover:scale-105"
                  style={{
                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 周趋势回顾 */}
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              周趋势回顾
            </h4>
            <div className="space-y-2">
              {progress.weeklyData.map((week, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px]">
                    {week.weekLabel}
                  </span>
                  <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        week.status === 'success'
                          ? 'bg-green-500'
                          : week.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(week.count / Math.max(...progress.weeklyData.map(w => w.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium min-w-[40px] text-right">
                    {week.count}次
                  </span>
                  <span className="text-lg">
                    {week.status === 'success' ? '✅' : week.status === 'warning' ? '⚠️' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* 个性化祝贺语 */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
            <p className="text-sm text-center text-foreground font-medium">
              {isReduction
                ? `太棒了！你在${duration}天里成功将"${tagName}"减少了${Math.abs(reductionPercent)}%。这不仅仅是数字的改变，更代表着你对情绪的掌控力在不断提升。继续保持，你会发现生活变得更加平和。💪`
                : `真了不起！你在${duration}天里将"${tagName}"增加了${Math.abs(reductionPercent)}%。这些积极体验的累积会让你的生活更加充实和美好。继续创造这样的美好时刻吧！✨`}
            </p>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => onOpenChange(false)}>
              <Download className="w-4 h-4" />
              下载成就报告
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              完成
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes trophy-bounce {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-10px) scale(1.1);
            }
          }

          @keyframes trophy-shine {
            0%, 100% {
              filter: brightness(1);
            }
            50% {
              filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
            }
          }

          @keyframes text-shimmer {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes slide-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-in-left {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slide-in-right {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes scale-in {
            from {
              transform: scale(0.8);
            }
            to {
              transform: scale(1);
            }
          }

          @keyframes bounce-gentle {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }

          @keyframes count-up {
            from {
              transform: scale(0.5);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .animate-trophy-bounce {
            animation: trophy-bounce 2s ease-in-out infinite;
          }

          .animate-trophy-shine {
            animation: trophy-shine 2s ease-in-out infinite;
          }

          .animate-text-shimmer {
            background-size: 200% auto;
            animation: text-shimmer 3s linear infinite;
          }

          .animate-slide-in-up {
            animation: slide-in-up 0.5s ease-out;
          }

          .animate-slide-in-left {
            animation: slide-in-left 0.5s ease-out;
          }

          .animate-slide-in-right {
            animation: slide-in-right 0.5s ease-out;
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }

          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }

          .animate-bounce-gentle {
            animation: bounce-gentle 2s ease-in-out infinite;
          }

          .animate-count-up {
            animation: count-up 0.6s ease-out;
          }

          .animation-delay-100 {
            animation-delay: 0.1s;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-300 {
            animation-delay: 0.3s;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default TagGoalAchievementDetail;
