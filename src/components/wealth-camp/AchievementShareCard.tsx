import React, { forwardRef, useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Crown, Flame, Star, Zap } from 'lucide-react';
import { useAchievementProgress } from '@/hooks/useAchievementProgress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

// Path theme colors for share card
const pathThemes = {
  milestone: { 
    bg: 'from-amber-400/90 to-orange-400/90', 
    bgDark: 'from-amber-600/90 to-orange-600/90',
    border: 'border-amber-300/50',
    icon: '🎯',
    name: '里程碑之路'
  },
  streak: { 
    bg: 'from-orange-400/90 to-red-400/90', 
    bgDark: 'from-orange-600/90 to-red-600/90',
    border: 'border-orange-300/50',
    icon: '🔥',
    name: '坚持之路'
  },
  growth: { 
    bg: 'from-violet-400/90 to-purple-400/90', 
    bgDark: 'from-violet-600/90 to-purple-600/90',
    border: 'border-violet-300/50',
    icon: '🌟',
    name: '成长之路'
  },
  social: { 
    bg: 'from-emerald-400/90 to-teal-400/90', 
    bgDark: 'from-emerald-600/90 to-teal-600/90',
    border: 'border-emerald-300/50',
    icon: '💫',
    name: '社交之路'
  },
};

// Visual style presets
export type CardStylePreset = 'dark' | 'gradient' | 'minimal' | 'neon';

const stylePresets: Record<CardStylePreset, { name: string; icon: React.ReactNode; bg: string; text: string }> = {
  dark: {
    name: '深邃',
    icon: <Crown className="w-3 h-3" />,
    bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    text: 'text-white',
  },
  gradient: {
    name: '渐变',
    icon: <Flame className="w-3 h-3" />,
    bg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500',
    text: 'text-white',
  },
  minimal: {
    name: '简约',
    icon: <Star className="w-3 h-3" />,
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    text: 'text-slate-800',
  },
  neon: {
    name: '霓虹',
    icon: <Zap className="w-3 h-3" />,
    bg: 'bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900',
    text: 'text-white',
  },
};

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface AchievementShareCardProps {
  avatarUrl?: string;
  displayName?: string;
  className?: string;
  selectedPath?: string | null; // 'milestone' | 'streak' | 'growth' | 'social' | null (all)
  onPathChange?: (path: string | null) => void;
  showPathSelector?: boolean;
  stylePreset?: CardStylePreset;
  onStyleChange?: (style: CardStylePreset) => void;
  showStyleSelector?: boolean;
  partnerInfo?: PartnerInfo;
}

const AchievementShareCard = forwardRef<HTMLDivElement, AchievementShareCardProps>(
  ({ 
    avatarUrl, 
    displayName = '财富觉醒者', 
    className, 
    selectedPath = null, 
    onPathChange, 
    showPathSelector = false,
    stylePreset = 'dark',
    onStyleChange,
    showStyleSelector = false,
    partnerInfo,
  }, ref) => {
    const { paths, totalEarned, totalCount, overallProgress, globalNextAchievement } = useAchievementProgress();
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    
    // Generate share URL with partner tracking
    const baseUrl = `${getPromotionDomain()}/wealth-camp-intro`;
    const shareUrl = partnerInfo?.partnerCode 
      ? `${baseUrl}?ref=${partnerInfo.partnerCode}` 
      : baseUrl;
    
    useEffect(() => {
      const generateQR = async () => {
        try {
          const qr = await QRCode.toDataURL(shareUrl, {
            width: 100,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
          });
          setQrCodeUrl(qr);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      };
      generateQR();
    }, [shareUrl]);
    
    const currentStyle = stylePresets[stylePreset];
    const isDark = stylePreset !== 'minimal';
    
    // 根据选择的路径过滤成就
    const filteredPaths = selectedPath 
      ? paths.filter(p => p.key === selectedPath)
      : paths;
    
    const displayEarnedCount = selectedPath 
      ? filteredPaths[0]?.earnedCount || 0 
      : totalEarned;
    
    const displayTotalCount = selectedPath 
      ? filteredPaths[0]?.totalCount || 0 
      : totalCount;
    
    const displayProgress = displayTotalCount > 0 
      ? Math.round((displayEarnedCount / displayTotalCount) * 100) 
      : 0;

    // Check if user has no achievements
    const hasNoAchievements = totalEarned === 0;

    return (
      <div
        ref={ref}
        className={cn(
          "w-[340px] rounded-2xl overflow-hidden shadow-2xl",
          currentStyle.bg,
          className
        )}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Decorative sparkles */}
          <motion.div 
            className={cn("absolute top-3 right-3", isDark ? "text-amber-400/30" : "text-amber-500/50")}
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          
          {/* User info */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-11 h-11 rounded-full overflow-hidden p-0.5",
              stylePreset === 'neon' 
                ? "bg-gradient-to-br from-pink-400 to-violet-500" 
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            )}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className={cn(
                  "w-full h-full rounded-full flex items-center justify-center text-lg",
                  isDark ? "bg-slate-700" : "bg-white"
                )}>
                  👤
                </div>
              )}
            </div>
            <div>
              <div className={cn("font-bold text-sm", currentStyle.text)}>{displayName}</div>
              <div className={cn("text-xs flex items-center gap-1", isDark ? "text-amber-400/80" : "text-amber-600")}>
                🏅 {selectedPath ? pathThemes[selectedPath as keyof typeof pathThemes]?.name : '财富觉醒成就墙'}
              </div>
            </div>
          </div>

          {/* Progress stats */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex-1 rounded-lg p-2.5 text-center",
              isDark ? "bg-slate-700/50" : "bg-white/70"
            )}>
              <div className={cn(
                "text-xl font-bold bg-clip-text text-transparent",
                stylePreset === 'neon' 
                  ? "bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400"
                  : "bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400"
              )}>
                {displayEarnedCount}
              </div>
              <div className={cn("text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>已解锁</div>
            </div>
            <div className={cn(
              "flex-1 rounded-lg p-2.5 text-center",
              isDark ? "bg-slate-700/50" : "bg-white/70"
            )}>
              <div className={cn("text-xl font-bold", isDark ? "text-slate-300" : "text-slate-600")}>{displayTotalCount}</div>
              <div className={cn("text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>全部</div>
            </div>
            <div className={cn(
              "flex-1 rounded-lg p-2.5 text-center",
              isDark ? "bg-slate-700/50" : "bg-white/70"
            )}>
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {displayProgress}%
              </div>
              <div className={cn("text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>完成度</div>
            </div>
          </div>
        </div>

        {/* Style Selector */}
        {showStyleSelector && onStyleChange && (
          <div className="px-5 pb-3">
            <div className={cn("text-[10px] mb-2", isDark ? "text-slate-400" : "text-slate-500")}>选择样式：</div>
            <div className="flex gap-1.5">
              {(Object.keys(stylePresets) as CardStylePreset[]).map((key) => {
                const preset = stylePresets[key];
                return (
                  <button
                    key={key}
                    onClick={() => onStyleChange(key)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-[10px] transition-all flex items-center gap-1",
                      stylePreset === key 
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md" 
                        : isDark 
                          ? "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                          : "bg-white/50 text-slate-500 hover:bg-white/80"
                    )}
                  >
                    {preset.icon}
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Path Selector */}
        {showPathSelector && onPathChange && (
          <div className="px-5 pb-3">
            <div className={cn("text-[10px] mb-2", isDark ? "text-slate-400" : "text-slate-500")}>选择展示路径：</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onPathChange(null)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] transition-all",
                  !selectedPath 
                    ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white" 
                    : isDark 
                      ? "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                      : "bg-white/50 text-slate-500 hover:bg-white/80"
                )}
              >
                全部成就
              </button>
              {Object.entries(pathThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => onPathChange(key)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] transition-all flex items-center gap-1",
                    selectedPath === key 
                      ? `bg-gradient-to-r ${theme.bg} text-white` 
                      : isDark 
                        ? "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                        : "bg-white/50 text-slate-500 hover:bg-white/80"
                  )}
                >
                  {theme.icon} {theme.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="px-5 pb-4">
          {hasNoAchievements ? (
            // Journey Map Mode (when no achievements)
            <div className="space-y-3">
              <div className={cn("text-center text-xs mb-3", isDark ? "text-slate-400" : "text-slate-500")}>
                🌱 觉醒之旅即将开始
              </div>
              
              {/* Visual journey path */}
              <div className="relative py-3">
                <div className="grid grid-cols-5 gap-1">
                  {paths[0]?.achievements.slice(0, 5).map((ach, index) => (
                    <div key={ach.key} className="relative flex flex-col items-center">
                      {/* Connector line */}
                      {index < 4 && (
                        <div className={cn(
                          "absolute top-4 left-[50%] w-full h-[2px] border-t-2 border-dashed",
                          isDark ? "border-slate-600/50" : "border-slate-300/50"
                        )} />
                      )}
                      
                      {/* Milestone dot */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-base relative z-10 border-2 border-dashed",
                        isDark ? "bg-slate-700/80 border-slate-500/50" : "bg-white/80 border-slate-300/50"
                      )}>
                        <span className="grayscale opacity-50">{ach.icon}</span>
                      </div>
                      
                      {/* Label */}
                      <div className={cn(
                        "mt-1.5 text-[8px] text-center w-12 leading-tight truncate",
                        isDark ? "text-slate-500" : "text-slate-400"
                      )}>
                        {ach.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next step hint */}
              {globalNextAchievement && (
                <div className={cn(
                  "mt-3 p-2.5 rounded-lg text-center border",
                  stylePreset === 'neon'
                    ? "bg-pink-500/10 border-pink-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                )}>
                  <span className={cn("text-xs", stylePreset === 'neon' ? "text-pink-400" : "text-amber-400")}>
                    🎯 下一步：{globalNextAchievement.achievement.icon} {globalNextAchievement.achievement.name}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Achievement Display Mode (when has achievements)
            <div className="space-y-2.5">
              {filteredPaths.map((path) => {
                const earnedAchievements = path.achievements.filter(a => a.earned);
                
                if (earnedAchievements.length === 0) return null;
                
                const theme = pathThemes[path.key as keyof typeof pathThemes];
                
                return (
                  <div key={path.key}>
                    <div className={cn("text-[10px] mb-1.5 flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full bg-gradient-to-r",
                        theme.bg
                      )} />
                      {theme.name} ({earnedAchievements.length}/{path.totalCount})
                    </div>
                    
                    {/* Progress dots */}
                    <div className="flex items-center gap-0.5 mb-2">
                      {path.achievements.map((ach, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            ach.earned 
                              ? `bg-gradient-to-r ${theme.bg}` 
                              : isDark 
                                ? "bg-slate-700/50 border border-slate-600/50"
                                : "bg-slate-200/50 border border-slate-300/50"
                          )}
                        />
                      ))}
                    </div>
                    
                    {/* Earned achievements */}
                    <div className="flex flex-wrap gap-1.5">
                      {earnedAchievements.map((ach) => (
                        <motion.div
                          key={ach.key}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            "px-2 py-1 rounded-md flex items-center gap-1 bg-gradient-to-r border",
                            theme.bg,
                            theme.border
                          )}
                        >
                          <span className="text-sm">{ach.icon}</span>
                          <span className="text-[10px] font-medium text-white/90">{ach.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Next goal if not all complete */}
              {totalEarned < totalCount && globalNextAchievement && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-2 p-2.5 rounded-lg border",
                    isDark ? "bg-slate-700/30 border-slate-600/30" : "bg-white/50 border-slate-200/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px]", isDark ? "text-slate-400" : "text-slate-500")}>🎯 下一个目标：</span>
                      <span className={cn("text-xs font-medium", stylePreset === 'neon' ? "text-pink-400" : "text-amber-400")}>
                        {globalNextAchievement.achievement.icon} {globalNextAchievement.achievement.name}
                      </span>
                    </div>
                    <ChevronRight className={cn("w-3 h-3", isDark ? "text-slate-500" : "text-slate-400")} />
                  </div>
                  {/* Mini progress */}
                  <div className={cn(
                    "mt-1.5 h-1 rounded-full overflow-hidden",
                    isDark ? "bg-slate-700/50" : "bg-slate-200/50"
                  )}>
                    <motion.div
                      className={cn(
                        "h-full bg-gradient-to-r",
                        stylePreset === 'neon' ? "from-pink-400 to-violet-400" : "from-amber-400 to-orange-400"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${globalNextAchievement.progress}%` }}
                    />
                  </div>
                  <div className={cn("mt-1 text-[9px] text-right", isDark ? "text-slate-500" : "text-slate-400")}>
                    {globalNextAchievement.remainingText}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer with QR Code */}
        <div className={cn(
          "px-5 py-2.5 flex items-center justify-between border-t",
          stylePreset === 'neon'
            ? "bg-gradient-to-r from-pink-500/20 via-violet-500/20 to-cyan-500/20 border-violet-700/50"
            : stylePreset === 'gradient'
              ? "bg-black/20 border-white/20"
              : stylePreset === 'minimal'
                ? "bg-slate-100 border-slate-200"
                : "bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border-slate-700/50"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center",
              stylePreset === 'neon' 
                ? "bg-gradient-to-br from-pink-400 to-violet-500"
                : "bg-gradient-to-br from-amber-400 to-orange-500"
            )}>
              <span className="text-[10px]">💰</span>
            </div>
            <div>
              <div className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-600")}>有劲AI · 财富教练</div>
              <div className={cn("text-[9px]", isDark ? "text-slate-500" : "text-slate-400")}>扫码开启觉醒之旅</div>
            </div>
          </div>
          {qrCodeUrl && (
            <div className={cn(
              "p-1 rounded-md",
              isDark ? "bg-white" : "bg-white shadow-sm"
            )}>
              <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

AchievementShareCard.displayName = 'AchievementShareCard';

export default AchievementShareCard;