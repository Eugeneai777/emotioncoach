import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getPartnerShareUrl, getDefaultShareUrl } from "@/utils/partnerQRUtils";
import ShareCardBase from "@/components/sharing/ShareCardBase";

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
    camp_type?: string;
    template_id?: string;
    camp_name?: string;
  };
  isPreview?: boolean;
  partnerInfo?: {
    isPartner: boolean;
    partnerId?: string;
    entryType?: 'free' | 'paid';
  };
  onReady?: () => void;
}

// 情绪emoji映射
const getEmotionEmoji = (theme: string | null): string => {
  if (!theme) return "💭";
  const emojiMap: Record<string, string> = {
    '平静': '😌',
    '焦虑': '😰',
    '开心': '😊',
    '喜悦': '😄',
    '愤怒': '😤',
    '悲伤': '😢',
    '感恩': '🙏',
    '兴奋': '🤩',
    '困惑': '😕',
    '放松': '😊',
    '压力': '😓',
    '满足': '😌',
    '失落': '😔',
    '紧张': '😬',
    '温暖': '🥰',
    '孤独': '😞',
    '委屈': '😢',
    '不屑': '😒',
    '释然': '😌',
    '期待': '🤗',
    '烦躁': '😤',
    '无奈': '😮‍💨',
    '自豪': '😊',
    '羞愧': '😳',
    '后悔': '😔',
    '嫉妒': '😠'
  };
  return emojiMap[theme] || "💭";
};

// 计算阶段信息
const getPhaseInfo = (campDay: number | null) => {
  if (!campDay) return {
    phase: '共振期',
    progress: 0,
    emoji: '🌱'
  };
  if (campDay <= 7) {
    return {
      phase: '共振期',
      progress: campDay / 7 * 33,
      emoji: '🌱',
      nextPhase: '觉醒期'
    };
  }
  if (campDay <= 14) {
    return {
      phase: '觉醒期',
      progress: 33 + (campDay - 7) / 7 * 33,
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

// 根据合伙人状态和帖子来源生成分享路径
const getSharePath = (partnerInfo: ShareCardProps['partnerInfo'], post: ShareCardProps['post']): string => {
  // 合伙人：使用统一的合伙人分享URL
  if (partnerInfo?.isPartner && partnerInfo?.partnerId) {
    const entryType = partnerInfo.entryType || 'free';
    if (entryType === 'free') {
      return `/claim?partner=${partnerInfo.partnerId}`;
    } else {
      return `/pay-entry?partner=${partnerInfo.partnerId}`;
    }
  }

  // 非合伙人：根据帖子内容确定路径
  if (post?.camp_type) {
    const campTypeMap: Record<string, string> = {
      'parent_emotion_21': '/parent-camp',
      'emotion_journal_21': '/camp-intro/emotion_journal_21',
      'emotion_bloom': '/camp-intro/emotion_bloom',
      'identity_bloom': '/camp-intro/identity_bloom',
      'wealth_block_7': '/wealth-camp-intro',
      'wealth_block_21': '/wealth-camp-intro'
    };
    if (campTypeMap[post.camp_type]) {
      return campTypeMap[post.camp_type];
    }
  }
  
  if (post?.template_id) {
    return `/camp-template/${post.template_id}`;
  }
  
  return '/introduction';
};

// 生成来源标签（仅 AI 故事智能体内容显示）
const getSourceLabel = (postType: string, campName?: string, badges?: any): {
  label: string;
  emoji: string;
} | null => {
  const normalizedType = String(postType || '').trim().toLowerCase();
  if (normalizedType !== 'story') return null;

  const displayCampName = campName || badges?.campName || badges?.camp_name;
  if (displayCampName) {
    return {
      label: `${displayCampName}·今日成长故事`,
      emoji: '🌸'
    };
  }

  return {
    label: '今日成长故事',
    emoji: '🌸'
  };
};

// 智能格式化内容，识别段落标记
const formatContent = (content: string, isPreview: boolean): React.ReactNode[] => {
  const parts = content.split(/(\【[^】]+\】[^\【]*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const match = part.match(/\【([^】]+)\】\s*(.*)/s);
    if (match) {
      const [, title, text] = match;
      const titleStyles: Record<string, { emoji: string; color: string }> = {
        '问题': { emoji: '❓', color: '#ea580c' },
        '转折': { emoji: '🔄', color: '#2563eb' },
        '成长': { emoji: '🌱', color: '#16a34a' },
        '反思': { emoji: '💭', color: '#9333ea' },
        '洞察': { emoji: '💡', color: '#ca8a04' },
        '行动': { emoji: '🎯', color: '#dc2626' }
      };
      const style = titleStyles[title] || { emoji: '📌', color: '#be185d' };
      return (
        <div key={index} className={cn("last:mb-0", isPreview ? "mb-3" : "mb-4")}>
          <div 
            className={cn("font-bold mb-1.5 flex items-center gap-1.5", isPreview ? "text-sm" : "text-base")} 
            style={{ color: style.color }}
          >
            <span>【{title}】</span>
          </div>
          <p className={cn("text-foreground/85 leading-relaxed", isPreview ? "text-xs pl-4" : "text-sm pl-5")}>
            {text.trim()}
          </p>
        </div>
      );
    }

    return (
      <p key={index} className={cn("text-foreground/85 leading-relaxed last:mb-0", isPreview ? "text-xs mb-2" : "text-sm mb-3")}>
        {part}
      </p>
    );
  });
};

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({
  post,
  isPreview = false,
  partnerInfo,
  onReady,
}, ref) => {
  const sharePath = getSharePath(partnerInfo, post);
  const phaseInfo = getPhaseInfo(post.camp_day);
  const emotionEmoji = getEmotionEmoji(post.emotion_theme);
  const sourceLabel = getSourceLabel(post.post_type, post.camp_name, post.badges);

  return (
    <ShareCardBase
      ref={ref}
      sharePath={sharePath}
      partnerCode={partnerInfo?.partnerId}
      width={isPreview ? 340 : 420}
      padding={isPreview ? 16 : 24}
      background="linear-gradient(135deg, hsl(330, 80%, 95%), hsl(270, 70%, 95%), hsl(200, 80%, 95%))"
      onReady={onReady}
      showFooter={false}
      renderFooter={(qrCodeUrl) => (
        <div className={cn("space-y-3", isPreview ? "space-y-2" : "space-y-4")} style={{ marginTop: isPreview ? '12px' : '24px' }}>
          {/* 品牌水印 + 价值清单 + 二维码 */}
          <div className={cn("flex gap-4 items-start", isPreview && "gap-3")}>
            {/* 价值清单 */}
            <div className="flex-1 space-y-2">
              <p className={cn("font-bold mb-2", isPreview ? "text-sm" : "text-base")} style={{ color: '#be185d' }}>
                Powered by 有劲AI
              </p>
              <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
                <span className="mt-0.5" style={{ color: '#be185d' }}>✅</span>
                <span style={{ color: '#1f2937' }}>温暖AI陪伴</span>
              </div>
              <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
                <span className="mt-0.5" style={{ color: '#be185d' }}>✅</span>
                <span style={{ color: '#1f2937' }}>系统成长方法</span>
              </div>
              <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
                <span className="mt-0.5" style={{ color: '#be185d' }}>✅</span>
                <span style={{ color: '#1f2937' }}>社群共振支持</span>
              </div>
            </div>

            {/* 二维码 */}
            {qrCodeUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={qrCodeUrl} 
                  alt="二维码" 
                  className={cn("rounded-lg shadow-md border-2 border-primary/20", isPreview ? "w-20 h-20" : "w-28 h-28")} 
                />
              </div>
            )}
          </div>

          {/* 科学数据背书 */}
          <div className={cn("text-center bg-background/50 backdrop-blur-sm rounded-lg border border-primary/10", isPreview ? "py-2 px-3" : "py-3 px-4")}>
            <p className={cn("font-medium", isPreview ? "text-xs" : "text-sm")} style={{ color: '#1f2937' }}>
              📊 21天科学验证：焦虑↓31% · 睡眠↑28% · 执行力×2.4
            </p>
          </div>

          {/* 最终CTA */}
          <div className={cn("text-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg", isPreview ? "py-2 px-3" : "py-3 px-4")}>
            <p className={cn("font-bold", isPreview ? "text-sm" : "text-base")} style={{ color: '#be185d' }}>
              {partnerInfo?.isPartner ? "🎁 扫码领取专属福利，立享预购优惠" : "🎁 扫码了解详情，开启你的成长之旅"}
            </p>
          </div>
        </div>
      )}
    >
      {/* 装饰性元素 */}
      <div className="absolute top-4 right-4 text-2xl opacity-20">✨</div>
      <div className="absolute top-20 left-4 text-xl opacity-20">💫</div>
      <div className="absolute bottom-40 right-8 text-xl opacity-20">🌟</div>

      {/* 顶部留白 */}
      <div className={cn(isPreview ? "pt-4" : "pt-8")} />

      {/* 打卡进度区 */}
      {post.camp_day && (
        <div className={cn(isPreview ? "mb-6" : "mb-10")}>
          <div className={cn("text-center mb-2", isPreview ? "text-base" : "text-xl")}>
            <span className="font-bold" style={{ color: '#be185d' }}>
              🔥 我的第 {post.camp_day} 天 · {phaseInfo.phase} {phaseInfo.emoji}
            </span>
          </div>
          <div className={cn("bg-background/50 rounded-full overflow-hidden", isPreview ? "h-3" : "h-4")}>
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" 
              style={{ width: `${phaseInfo.progress}%` }} 
            />
          </div>
          <p className={cn("text-center text-muted-foreground mt-1", isPreview ? "text-xs" : "text-sm")}>
            {phaseInfo.nextPhase !== '完成' ? `${phaseInfo.nextPhase}在望` : '即将完成21天旅程'}
          </p>
        </div>
      )}

      {/* 标题 */}
      {post.title && (
        <h2 className={cn("font-bold text-foreground text-center", isPreview ? "text-lg mb-5" : "text-2xl mb-8")}>
          {post.title.replace(/^[^\w\s\u4e00-\u9fa5]+/, '').trim()}
        </h2>
      )}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={cn(isPreview ? "mb-4" : "mb-6")}>
          <img 
            src={post.image_urls[0]} 
            alt="分享图片" 
            crossOrigin="anonymous" 
            className={cn("w-full object-cover rounded-xl shadow-md", isPreview ? "h-40" : "h-64")} 
          />
        </div>
      )}

      {/* 内容 */}
      {post.content && (
        <div className={cn("bg-background/60 backdrop-blur-sm rounded-xl shadow-sm border border-primary/10", isPreview ? "p-3 mb-3" : "p-4 mb-4")}>
          {sourceLabel && (
            <div className={cn("text-left", isPreview ? "mb-3" : "mb-4")}>
              <span 
                className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium shadow-sm", isPreview ? "text-xs" : "text-sm")}
                style={{
                  background: "linear-gradient(to right, rgb(252, 231, 243), rgb(243, 232, 255))",
                  color: "#be185d"
                }}
              >
                <span style={{ color: "#be185d" }}>{sourceLabel.emoji}</span>
                <span style={{ color: "#be185d" }}>{sourceLabel.label}</span>
              </span>
            </div>
          )}
          
          {formatContent(post.content, isPreview)}
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div className={cn("bg-secondary/30 backdrop-blur-sm rounded-xl border border-primary/10", isPreview ? "mb-3 p-3" : "mb-4 p-4")}>
          {post.insight && (
            <div className={cn(post.action && (isPreview ? "pb-2.5 mb-2.5" : "pb-3 mb-3"), post.action && "border-b border-primary/10")}>
              <p className={cn("font-bold text-primary mb-2 flex items-center gap-1.5", isPreview ? "text-xs" : "text-sm")}>
                <span>💡</span>
                <span>今日洞察</span>
              </p>
              <p className={cn("text-foreground/80 leading-relaxed", isPreview ? "text-xs" : "text-sm")}>
                {post.insight}
              </p>
            </div>
          )}
          {post.action && (
            <div>
              <p className={cn("font-bold text-primary mb-2 flex items-center gap-1.5", isPreview ? "text-xs" : "text-sm")}>
                <span>🎯</span>
                <span>行动计划</span>
              </p>
              <p className={cn("text-foreground/80 leading-relaxed", isPreview ? "text-xs" : "text-sm")}>
                {post.action}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 勋章展示 */}
      {post.badges && Object.keys(post.badges).length > 0 && (
        <div className={cn("flex flex-wrap gap-2 justify-center", isPreview ? "mb-3" : "mb-4")}>
          {Object.entries(post.badges)
            .filter(([_, badge]: [string, any]) => badge?.icon && badge?.name)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div 
                key={key} 
                className={cn("bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-xl shadow-sm border border-primary/20", isPreview ? "px-3 py-2" : "px-4 py-3")}
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
    </ShareCardBase>
  );
});

ShareCard.displayName = "ShareCard";
export default ShareCard;