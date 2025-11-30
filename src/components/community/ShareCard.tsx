import { forwardRef } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  post: {
    post_type: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    camp_day: number | null;
    badges: any;
  };
  isPreview?: boolean;
}

// 情绪emoji映射
const getEmotionEmoji = (theme: string | null): string => {
  if (!theme) return "💭";
  const emojiMap: Record<string, string> = {
    '平静': '😌', '焦虑': '😰', '开心': '😊', '喜悦': '😄',
    '愤怒': '😤', '悲伤': '😢', '感恩': '🙏', '兴奋': '🤩',
    '困惑': '😕', '放松': '😊', '压力': '😓', '满足': '😌',
    '失落': '😔', '紧张': '😬', '温暖': '🥰', '孤独': '😞'
  };
  return emojiMap[theme] || "💭";
};

// 计算阶段信息
const getPhaseInfo = (campDay: number | null) => {
  if (!campDay) return { phase: '共振期', progress: 0, emoji: '🌱' };
  
  if (campDay <= 7) {
    return { 
      phase: '共振期', 
      progress: (campDay / 7) * 33, 
      emoji: '🌱',
      nextPhase: '觉醒期'
    };
  }
  if (campDay <= 14) {
    return { 
      phase: '觉醒期', 
      progress: 33 + ((campDay - 7) / 7) * 33, 
      emoji: '🌟',
      nextPhase: '升维期'
    };
  }
  return { 
    phase: '升维期', 
    progress: 66 + Math.min((campDay - 14) / 7, 1) * 34, 
    emoji: '✨',
    nextPhase: '完成'
  };
};

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ post, isPreview = false }, ref) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const phaseInfo = getPhaseInfo(post.camp_day);
  const emotionEmoji = getEmotionEmoji(post.emotion_theme);

  useEffect(() => {
    const appUrl = window.location.origin;
    QRCode.toDataURL(appUrl, {
      width: 120,
      margin: 1,
    }).then(setQrCodeUrl);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        isPreview ? "w-full p-4" : "w-[600px] p-8"
      )}
      style={{ 
        minHeight: isPreview ? "auto" : "800px",
        background: "linear-gradient(135deg, hsl(330, 80%, 95%), hsl(270, 70%, 95%), hsl(200, 80%, 95%))"
      }}
    >
      {/* 装饰性元素 */}
      <div className="absolute top-4 right-4 text-2xl opacity-20">✨</div>
      <div className="absolute top-20 left-4 text-xl opacity-20">💫</div>
      <div className="absolute bottom-40 right-8 text-xl opacity-20">🌟</div>

      {/* 品牌头部 */}
      <div className={cn("text-center", isPreview ? "mb-3" : "mb-6")}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={cn(isPreview ? "text-2xl" : "text-3xl")}>🌱</span>
          <h1 className={cn(
            "font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
            isPreview ? "text-xl" : "text-3xl"
          )}>
            有劲AI · 情绪日记
          </h1>
        </div>
        <p className={cn(
          "text-muted-foreground italic mb-2",
          isPreview ? "text-xs" : "text-sm"
        )}>
          "每天10分钟，让情绪变成力量"
        </p>
        <p className={cn(
          "text-primary/80 font-medium",
          isPreview ? "text-xs" : "text-sm"
        )}>
          ✨ 已有 12,580+ 人开启成长之旅
        </p>
      </div>

      {/* 打卡进度区 */}
      {post.camp_day && (
        <div className={cn("mb-4", isPreview ? "mb-3" : "mb-6")}>
          <div className={cn(
            "text-center mb-2",
            isPreview ? "text-base" : "text-xl"
          )}>
            <span className="font-bold text-primary">
              🔥 我的第 {post.camp_day} 天 · {phaseInfo.phase} {phaseInfo.emoji}
            </span>
          </div>
          <div className={cn("bg-background/50 rounded-full overflow-hidden", isPreview ? "h-3" : "h-4")}>
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${phaseInfo.progress}%` }}
            />
          </div>
          <p className={cn(
            "text-center text-muted-foreground mt-1",
            isPreview ? "text-xs" : "text-sm"
          )}>
            {phaseInfo.nextPhase !== '完成' ? `${phaseInfo.nextPhase}在望` : '即将完成21天旅程'}
          </p>
        </div>
      )}

      {/* 标题 */}
      {post.title && (
        <h2 className={cn(
          "font-bold text-foreground text-center mb-2",
          isPreview ? "text-lg" : "text-2xl"
        )}>
          {post.title}
        </h2>
      )}

      {/* 情绪主题显示 */}
      {post.emotion_theme && (
        <div className={cn("text-center mb-3", isPreview ? "mb-2" : "mb-4")}>
          <div className="inline-flex items-center gap-2 bg-background/60 rounded-full px-4 py-2">
            <span className={cn(isPreview ? "text-xl" : "text-2xl")}>{emotionEmoji}</span>
            <span className={cn("font-medium text-foreground", isPreview ? "text-sm" : "text-base")}>
              {post.emotion_theme}
            </span>
            {post.emotion_intensity && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className={cn("text-primary font-medium", isPreview ? "text-xs" : "text-sm")}>
                  强度 {post.emotion_intensity}/10
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 内容 */}
      {post.content && (
        <div className={cn(
          "bg-background/60 backdrop-blur-sm rounded-xl shadow-sm border border-primary/10",
          isPreview ? "p-3 mb-3" : "p-6 mb-6"
        )}>
          <p className={cn(
            "text-foreground/90 leading-relaxed line-clamp-6",
            isPreview ? "text-sm" : "text-base"
          )}>
            {post.content}
          </p>
        </div>
      )}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={cn(isPreview ? "mb-3" : "mb-6")}>
          <img
            src={post.image_urls[0]}
            alt="分享图片"
            className={cn(
              "w-full object-cover rounded-xl shadow-md",
              isPreview ? "h-40" : "h-64"
            )}
          />
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div className={cn(
          "space-y-2 bg-secondary/30 backdrop-blur-sm rounded-xl border border-primary/10",
          isPreview ? "mb-3 p-3" : "mb-6 p-4"
        )}>
          {post.insight && (
            <div>
              <p className={cn("font-medium text-primary mb-1", isPreview ? "text-xs" : "text-sm")}>
                💡 今日洞察
              </p>
              <p className={cn("text-foreground/80 line-clamp-2", isPreview ? "text-xs" : "text-sm")}>
                {post.insight}
              </p>
            </div>
          )}
          {post.action && (
            <div>
              <p className={cn("font-medium text-primary mb-1", isPreview ? "text-xs" : "text-sm")}>
                🎯 行动计划
              </p>
              <p className={cn("text-foreground/80 line-clamp-2", isPreview ? "text-xs" : "text-sm")}>
                {post.action}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 勋章展示 - 精美卡片样式 */}
      {post.badges && Object.keys(post.badges).length > 0 && (
        <div className={cn("flex flex-wrap gap-2 justify-center", isPreview ? "mb-3" : "mb-6")}>
          {Object.entries(post.badges)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div
                key={key}
                className={cn(
                  "bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-xl shadow-sm border border-primary/20",
                  isPreview ? "px-3 py-2" : "px-4 py-3"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(isPreview ? "text-lg" : "text-xl")}>{badge.icon}</span>
                  <span className={cn("font-medium text-foreground", isPreview ? "text-xs" : "text-sm")}>
                    {badge.name}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 分隔线 */}
      <div className={cn("border-t border-primary/20", isPreview ? "my-3" : "my-6")} />

      {/* 底部CTA区域 */}
      <div className={cn("space-y-3", isPreview ? "space-y-2" : "space-y-4")}>
        {/* 限时福利提示 */}
        <div className={cn(
          "text-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg",
          isPreview ? "py-2 px-3" : "py-3 px-4"
        )}>
          <p className={cn("font-bold text-primary", isPreview ? "text-sm" : "text-base")}>
            🎁 扫码加入，开启你的情绪成长之旅
          </p>
        </div>

        <div className={cn("flex gap-4 items-start", isPreview && "gap-3")}>
          {/* 价值清单 */}
          <div className="flex-1 space-y-2">
            <div className={cn(
              "flex items-start gap-2",
              isPreview ? "text-xs" : "text-sm"
            )}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">温暖AI陪伴</span>
            </div>
            <div className={cn(
              "flex items-start gap-2",
              isPreview ? "text-xs" : "text-sm"
            )}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">系统成长方法</span>
            </div>
            <div className={cn(
              "flex items-start gap-2",
              isPreview ? "text-xs" : "text-sm"
            )}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">社群共振支持</span>
            </div>
          </div>

          {/* 二维码 */}
          {qrCodeUrl && (
            <div className="flex-shrink-0">
              <img
                src={qrCodeUrl}
                alt="二维码"
                className={cn(
                  "rounded-lg shadow-md border-2 border-primary/20",
                  isPreview ? "w-20 h-20" : "w-28 h-28"
                )}
              />
            </div>
          )}
        </div>

        {/* 科学数据背书 */}
        <div className={cn(
          "text-center bg-background/50 backdrop-blur-sm rounded-lg border border-primary/10",
          isPreview ? "py-2 px-3" : "py-3 px-4"
        )}>
          <p className={cn(
            "text-foreground/80 font-medium",
            isPreview ? "text-xs" : "text-sm"
          )}>
            📊 21天科学验证：焦虑↓31% · 睡眠↑28% · 执行力×2.4
          </p>
        </div>

        {/* 社会认同 */}
        <p className={cn(
          "text-center text-muted-foreground",
          isPreview ? "text-xs" : "text-sm"
        )}>
          已有 328 人通过分享加入 ✨
        </p>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";

export default ShareCard;
