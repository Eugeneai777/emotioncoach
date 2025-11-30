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

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ post, isPreview = false }, ref) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    // 生成二维码（指向应用首页）
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
        "bg-gradient-to-br from-primary/5 via-background to-secondary/10 rounded-2xl",
        isPreview ? "w-full p-4" : "w-[600px] p-8"
      )}
      style={{ minHeight: isPreview ? "auto" : "800px" }}
    >
      {/* 头部 */}
      <div className={cn("text-center", isPreview ? "mb-3" : "mb-6")}>
        <h1 className={cn(
          "font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
          isPreview ? "text-xl" : "text-3xl"
        )}>
          有劲生活
        </h1>
      </div>

      {/* 打卡天数 */}
      {post.camp_day && (
        <div className={cn("text-center", isPreview ? "mb-3" : "mb-6")}>
          <div className={cn("inline-block bg-primary/10 rounded-full", isPreview ? "px-3 py-1.5" : "px-6 py-3")}>
            <span className={cn("font-bold text-primary", isPreview ? "text-base" : "text-2xl")}>
              第 {post.camp_day} 天
            </span>
          </div>
        </div>
      )}

      {/* 标题 */}
      {post.title && (
        <h2 className={cn(
          "font-bold text-foreground text-center",
          isPreview ? "text-lg mb-2" : "text-2xl mb-4"
        )}>
          {post.title}
        </h2>
      )}

      {/* 内容 */}
      {post.content && (
        <div className={cn("bg-background/50 rounded-xl", isPreview ? "p-3 mb-3" : "p-6 mb-6")}>
          <p className={cn(
            "text-foreground/80 leading-relaxed line-clamp-6",
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
            className={cn("w-full object-cover rounded-xl", isPreview ? "h-40" : "h-64")}
          />
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div className={cn(
          "space-y-2 bg-secondary/30 rounded-xl",
          isPreview ? "mb-3 p-3" : "mb-6 p-4"
        )}>
          {post.insight && (
            <div>
              <p className={cn("font-medium text-primary mb-1", isPreview ? "text-xs" : "text-sm")}>💡 洞察</p>
              <p className={cn("text-foreground/80 line-clamp-2", isPreview ? "text-xs" : "text-sm")}>
                {post.insight}
              </p>
            </div>
          )}
          {post.action && (
            <div>
              <p className={cn("font-medium text-primary mb-1", isPreview ? "text-xs" : "text-sm")}>🎯 行动</p>
              <p className={cn("text-foreground/80 line-clamp-2", isPreview ? "text-xs" : "text-sm")}>
                {post.action}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 勋章 */}
      {post.badges && Object.keys(post.badges).length > 0 && (
        <div className={cn("flex flex-wrap gap-2 justify-center", isPreview ? "mb-3" : "mb-6")}>
          {Object.entries(post.badges)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div
                key={key}
                className={cn("bg-primary/10 rounded-full", isPreview ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm")}
              >
                {badge.icon} {badge.name}
              </div>
            ))}
        </div>
      )}

      {/* 底部二维码 */}
      <div className={cn("border-t mt-auto", isPreview ? "pt-3" : "pt-6")}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("font-medium text-foreground mb-1", isPreview ? "text-xs" : "text-sm")}>
              扫码加入21天情绪日记训练营
            </p>
            <p className={cn("text-muted-foreground", isPreview ? "text-[10px]" : "text-xs")}>
              一起记录 · 共同成长
            </p>
          </div>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="二维码"
              className={cn("rounded-lg", isPreview ? "w-16 h-16" : "w-24 h-24")}
            />
          )}
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";

export default ShareCard;
