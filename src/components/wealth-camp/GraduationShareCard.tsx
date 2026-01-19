import React, { forwardRef } from 'react';
import { Trophy, Sparkles, TrendingUp, Award, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQRCode } from '@/utils/qrCodeUtils';

interface GraduationShareCardProps {
  displayName?: string;
  avatarUrl?: string;
  shareUrl: string;
  // Core stats
  totalDays: number;
  journalCount: number;
  awakeningGrowth: number;
  startAwakening: number;
  endAwakening: number;
  consecutiveStreak?: number;
  // Three-layer growth
  behaviorGrowth?: number;
  emotionGrowth?: number;
  beliefGrowth?: number;
  // Level info
  currentLevel?: number;
  levelName?: string;
  levelIcon?: string;
  totalPoints?: number;
  // Achievements
  earnedAchievements?: Array<{ icon: string; name: string }>;
  // AI Coach message
  coachMessage?: string;
  coreBreakthrough?: string;
}

const GraduationShareCard = forwardRef<HTMLDivElement, GraduationShareCardProps>(
  (
    {
      displayName = '财富觉醒者',
      avatarUrl,
      shareUrl,
      totalDays,
      journalCount,
      awakeningGrowth,
      startAwakening,
      endAwakening,
      consecutiveStreak = 0,
      behaviorGrowth = 0,
      emotionGrowth = 0,
      beliefGrowth = 0,
      currentLevel = 4,
      levelName = '信念转化者',
      levelIcon = '⭐',
      totalPoints = 0,
      earnedAchievements = [],
      coachMessage,
      coreBreakthrough,
    },
    ref
  ) => {
    const { qrCodeUrl } = useQRCode(shareUrl);

    // Display top achievements (max 5)
    const displayAchievements = earnedAchievements.slice(0, 5);

    return (
      <div
        ref={ref}
        className="w-[340px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Golden top accent */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

        {/* Header with Avatar and Level */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-14 h-14 rounded-full border-2 border-amber-400/50 shadow-lg object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center border-2 border-amber-400/30 shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <p className="text-white font-bold text-lg">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base">{levelIcon}</span>
                  <span className="text-amber-300 text-sm font-medium">Lv.{currentLevel} {levelName}</span>
                </div>
              </div>
            </div>
            {/* Graduation badge */}
            <div className="flex flex-col items-center">
              <span className="text-4xl">🎓</span>
              <span className="text-amber-300 text-xs font-medium">毕业</span>
            </div>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="mx-4 rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
          {/* Awakening Growth - Hero Stat */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">觉醒成长</span>
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-slate-400 text-lg">{startAwakening}</span>
              <span className="text-slate-500">→</span>
              <span className="text-4xl font-bold text-white">{endAwakening}</span>
              <span className={`text-lg font-semibold ${awakeningGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({awakeningGrowth >= 0 ? '+' : ''}{awakeningGrowth})
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-amber-300">{totalDays}</div>
              <div className="text-xs text-slate-400">坚持天数</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-violet-300">{journalCount}</div>
              <div className="text-xs text-slate-400">财富日记</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-orange-300">{totalPoints}</div>
              <div className="text-xs text-slate-400">成长积分</div>
            </div>
          </div>

          {/* Three-layer Growth Bars */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-slate-400">🎯 行为</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                  style={{ width: `${Math.min(Math.max(behaviorGrowth * 5 + 50, 10), 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${behaviorGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {behaviorGrowth >= 0 ? '+' : ''}{behaviorGrowth}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-slate-400">💗 情绪</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
                  style={{ width: `${Math.min(Math.max(emotionGrowth * 5 + 50, 10), 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${emotionGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {emotionGrowth >= 0 ? '+' : ''}{emotionGrowth}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-slate-400">💡 信念</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                  style={{ width: `${Math.min(Math.max(beliefGrowth * 5 + 50, 10), 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${beliefGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {beliefGrowth >= 0 ? '+' : ''}{beliefGrowth}%
              </span>
            </div>
          </div>

          {/* Streak badge */}
          {consecutiveStreak >= 3 && (
            <div className="flex items-center justify-center gap-2 py-2 bg-orange-500/20 rounded-lg mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">🔥 连续打卡 {consecutiveStreak} 天</span>
            </div>
          )}
        </div>

        {/* Achievements Section */}
        {displayAchievements.length > 0 && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-xs font-medium">解锁成就</span>
              <span className="text-slate-500 text-xs">({earnedAchievements.length}个)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayAchievements.map((ach, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-lg border border-amber-500/30"
                >
                  <span className="text-sm">{ach.icon}</span>
                  <span className="text-xs text-amber-200">{ach.name}</span>
                </div>
              ))}
              {earnedAchievements.length > 5 && (
                <div className="px-2 py-1 bg-slate-700/50 rounded-lg">
                  <span className="text-xs text-slate-400">+{earnedAchievements.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Core Breakthrough */}
        {coreBreakthrough && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-xs font-medium">核心突破</span>
            </div>
            <p className="text-white/80 text-xs leading-relaxed">
              "{coreBreakthrough.length > 60 ? coreBreakthrough.slice(0, 60) + '...' : coreBreakthrough}"
            </p>
          </div>
        )}

        {/* CTA with QR */}
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-amber-300 text-xs font-medium mb-0.5">扫码开启你的</p>
            <p className="text-white text-sm font-bold">7天财富觉醒之旅</p>
            <p className="text-slate-500 text-xs mt-1">¥299 限时特惠</p>
          </div>
          {qrCodeUrl && (
            <div className="bg-white p-1.5 rounded-lg shadow-lg">
              <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Brand Footer */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-5 py-2.5 text-center border-t border-white/5">
          <p className="text-amber-200/80 text-xs font-medium">有劲AI · 财富觉醒训练营</p>
        </div>
      </div>
    );
  }
);

GraduationShareCard.displayName = 'GraduationShareCard';

export default GraduationShareCard;
