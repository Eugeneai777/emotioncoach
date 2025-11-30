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
    camp_type?: string;
    template_id?: string;
  };
  isPreview?: boolean;
  partnerInfo?: {
    isPartner: boolean;
    partnerId?: string;
  };
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

// 根据合伙人状态和帖子来源生成二维码URL
const getQRCodeUrl = (
  partnerInfo: ShareCardProps['partnerInfo'],
  post: ShareCardProps['post']
): string => {
  // 优先使用生产域名环境变量，确保二维码指向正式发布的地址
  const baseUrl = import.meta.env.VITE_PRODUCTION_URL || window.location.origin;
  
  // 合伙人：生成推广二维码
  if (partnerInfo?.isPartner && partnerInfo?.partnerId) {
    return `${baseUrl}/redeem?partner=${partnerInfo.partnerId}`;
  }
  
  // 非合伙人：根据帖子来源跳转到对应教练详情页
  if (post.camp_type) {
    const campTypeMap: Record<string, string> = {
      'parent_emotion_21': '/parent-camp',
      'emotion_journal_21': '/camp-intro/emotion_journal_21',
      'emotion_bloom': '/camp-intro/emotion_bloom',
      'identity_bloom': '/camp-intro/identity_bloom',
    };
    if (campTypeMap[post.camp_type]) {
      return `${baseUrl}${campTypeMap[post.camp_type]}`;
    }
  }
  
  // 有自定义模板
  if (post.template_id) {
    return `${baseUrl}/camp-template/${post.template_id}`;
  }
  
  // 默认（普通情绪日记/无来源）→ 情绪教练详情页
  return `${baseUrl}/introduction`;
};

// 智能格式化内容，识别段落标记
const formatContent = (content: string, isPreview: boolean): React.ReactNode[] => {
  // 按段落标记拆分
  const parts = content.split(/(\【[^】]+\】[^\【]*)/g).filter(Boolean);
  
  return parts.map((part, index) => {
    // 匹配【标题】后面的内容
    const match = part.match(/\【([^】]+)\】\s*(.*)/s);
    
    if (match) {
      const [, title, text] = match;
      // 根据标题类型选择不同颜色和图标
      const titleStyles: Record<string, { emoji: string; color: string }> = {
        '问题': { emoji: '❓', color: 'text-orange-600' },
        '转折': { emoji: '🔄', color: 'text-blue-600' },
        '成长': { emoji: '🌱', color: 'text-green-600' },
        '反思': { emoji: '💭', color: 'text-purple-600' },
        '洞察': { emoji: '💡', color: 'text-yellow-600' },
        '行动': { emoji: '🎯', color: 'text-red-600' },
      };
      const style = titleStyles[title] || { emoji: '📌', color: 'text-primary' };
      
      return (
        <div key={index} className={cn("last:mb-0", isPreview ? "mb-3" : "mb-4")}>
          <div className={cn("font-bold mb-1.5 flex items-center gap-1.5", style.color, isPreview ? "text-sm" : "text-base")}>
            <span>{style.emoji}</span>
            <span>【{title}】</span>
          </div>
          <p className={cn("text-foreground/85 leading-relaxed", isPreview ? "text-xs pl-4" : "text-sm pl-5")}>
            {text.trim()}
          </p>
        </div>
      );
    }
    
    // 普通段落
    return <p key={index} className={cn("text-foreground/85 leading-relaxed last:mb-0", isPreview ? "text-xs mb-2" : "text-sm mb-3")}>{part}</p>;
  });
};
const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({
  post,
  isPreview = false,
  partnerInfo
}, ref) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const phaseInfo = getPhaseInfo(post.camp_day);
  const emotionEmoji = getEmotionEmoji(post.emotion_theme);
  useEffect(() => {
    const qrUrl = getQRCodeUrl(partnerInfo, post);
    QRCode.toDataURL(qrUrl, {
      width: 120,
      margin: 1
    }).then(setQrCodeUrl);
  }, [partnerInfo, post]);
  return <div 
    ref={ref} 
    data-share-card
    className={cn("relative overflow-hidden rounded-2xl", isPreview ? "w-full p-4" : "w-[600px] p-8")} 
    style={{
      minHeight: "auto",
      background: "linear-gradient(135deg, hsl(330, 80%, 95%), hsl(270, 70%, 95%), hsl(200, 80%, 95%))",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif'
    }}
  >
      {/* 装饰性元素 */}
      <div className="absolute top-4 right-4 text-2xl opacity-20">✨</div>
      <div className="absolute top-20 left-4 text-xl opacity-20">💫</div>
      <div className="absolute bottom-40 right-8 text-xl opacity-20">🌟</div>


      {/* 打卡进度区 */}
      {post.camp_day && <div className={cn("mb-4", isPreview ? "mb-3" : "mb-6")}>
          <div className={cn("text-center mb-2", isPreview ? "text-base" : "text-xl")}>
            <span className="font-bold text-primary">
              🔥 我的第 {post.camp_day} 天 · {phaseInfo.phase} {phaseInfo.emoji}
            </span>
          </div>
          <div className={cn("bg-background/50 rounded-full overflow-hidden", isPreview ? "h-3" : "h-4")}>
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{
          width: `${phaseInfo.progress}%`
        }} />
          </div>
          <p className={cn("text-center text-muted-foreground mt-1", isPreview ? "text-xs" : "text-sm")}>
            {phaseInfo.nextPhase !== '完成' ? `${phaseInfo.nextPhase}在望` : '即将完成21天旅程'}
          </p>
        </div>}

      {/* 标题 */}
      {post.title && <h2 className={cn("font-bold text-foreground text-center", isPreview ? "text-lg mb-3" : "text-2xl mb-4")}>
          {post.title}
        </h2>}

      {/* 内容 - 智能格式化 */}
      {post.content && <div className={cn("bg-background/60 backdrop-blur-sm rounded-xl shadow-sm border border-primary/10", isPreview ? "p-3 mb-3" : "p-4 mb-4")}>
          {formatContent(post.content, isPreview)}
        </div>}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && <div className={cn(isPreview ? "mb-3" : "mb-4")}>
          <img 
            src={post.image_urls[0]} 
            alt="分享图片" 
            crossOrigin="anonymous"
            className={cn("w-full object-cover rounded-xl shadow-md", isPreview ? "h-40" : "h-64")} 
          />
        </div>}

      {/* 洞察与行动 - 优化间距和分隔 */}
      {(post.insight || post.action) && <div className={cn("bg-secondary/30 backdrop-blur-sm rounded-xl border border-primary/10", isPreview ? "mb-3 p-3" : "mb-4 p-4")}>
          {post.insight && <div className={cn(post.action && (isPreview ? "pb-2.5 mb-2.5" : "pb-3 mb-3"), post.action && "border-b border-primary/10")}>
              <p className={cn("font-bold text-primary mb-2 flex items-center gap-1.5", isPreview ? "text-xs" : "text-sm")}>
                <span>💡</span>
                <span>今日洞察</span>
              </p>
              <p className={cn("text-foreground/80 leading-relaxed", isPreview ? "text-xs" : "text-sm")}>
                {post.insight}
              </p>
            </div>}
          {post.action && <div>
              <p className={cn("font-bold text-primary mb-2 flex items-center gap-1.5", isPreview ? "text-xs" : "text-sm")}>
                <span>🎯</span>
                <span>行动计划</span>
              </p>
              <p className={cn("text-foreground/80 leading-relaxed", isPreview ? "text-xs" : "text-sm")}>
                {post.action}
              </p>
            </div>}
        </div>}

      {/* 勋章展示 - 精美卡片样式 */}
      {post.badges && Object.keys(post.badges).length > 0 && <div className={cn("flex flex-wrap gap-2 justify-center", isPreview ? "mb-3" : "mb-4")}>
          {Object.entries(post.badges)
            .filter(([_, badge]: [string, any]) => badge?.icon && badge?.name)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div key={key} className={cn("bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-xl shadow-sm border border-primary/20", isPreview ? "px-3 py-2" : "px-4 py-3")}>
                <div className="flex items-center gap-2">
                  <span className={cn(isPreview ? "text-lg" : "text-xl")}>{badge.icon}</span>
                  <span className={cn("font-medium text-foreground", isPreview ? "text-xs" : "text-sm")}>
                    {badge.name}
                  </span>
                </div>
              </div>
            ))}
        </div>}

      {/* 分隔线 */}
      <div className={cn("border-t border-primary/20", isPreview ? "my-3" : "my-6")} />

      {/* 底部CTA区域 */}
      <div className={cn("space-y-3", isPreview ? "space-y-2" : "space-y-4")}>
        {/* 品牌水印 + 价值清单 + 二维码 */}
        <div className={cn("flex gap-4 items-start", isPreview && "gap-3")}>
          {/* 价值清单 */}
          <div className="flex-1 space-y-2">
            <p className={cn("font-bold text-primary mb-2", isPreview ? "text-sm" : "text-base")}>
              有劲AI · 情绪日记
            </p>
            <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">温暖AI陪伴</span>
            </div>
            <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">系统成长方法</span>
            </div>
            <div className={cn("flex items-start gap-2", isPreview ? "text-xs" : "text-sm")}>
              <span className="text-primary mt-0.5">✅</span>
              <span className="text-foreground/90">社群共振支持</span>
            </div>
          </div>

          {/* 二维码 */}
          {qrCodeUrl && <div className="flex-shrink-0">
              <img src={qrCodeUrl} alt="二维码" className={cn("rounded-lg shadow-md border-2 border-primary/20", isPreview ? "w-20 h-20" : "w-28 h-28")} />
            </div>}
        </div>

        {/* 科学数据背书 */}
        <div className={cn("text-center bg-background/50 backdrop-blur-sm rounded-lg border border-primary/10", isPreview ? "py-2 px-3" : "py-3 px-4")}>
          <p className={cn("text-foreground/80 font-medium", isPreview ? "text-xs" : "text-sm")}>
            📊 21天科学验证：焦虑↓31% · 睡眠↑28% · 执行力×2.4
          </p>
        </div>

        {/* 最终CTA - 移到最后 */}
        <div className={cn("text-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg", isPreview ? "py-2 px-3" : "py-3 px-4")}>
          <p className={cn("font-bold text-primary", isPreview ? "text-sm" : "text-base")}>
            {partnerInfo?.isPartner 
              ? "🎁 扫码领取专属福利，立享预购优惠"
              : "🎁 扫码了解详情，开启你的成长之旅"
            }
          </p>
        </div>
      </div>
    </div>;
});
ShareCard.displayName = "ShareCard";
export default ShareCard;