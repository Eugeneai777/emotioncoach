import { forwardRef } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

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
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ post }, ref) => {
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
      className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-8 rounded-2xl w-[600px]"
      style={{ minHeight: "800px" }}
    >
      {/* 头部 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          有劲生活
        </h1>
      </div>

      {/* 打卡天数 */}
      {post.camp_day && (
        <div className="text-center mb-6">
          <div className="inline-block px-6 py-3 bg-primary/10 rounded-full">
            <span className="text-2xl font-bold text-primary">
              第 {post.camp_day} 天
            </span>
          </div>
        </div>
      )}

      {/* 标题 */}
      {post.title && (
        <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
          {post.title}
        </h2>
      )}

      {/* 内容 */}
      {post.content && (
        <div className="bg-background/50 rounded-xl p-6 mb-6">
          <p className="text-foreground/80 leading-relaxed line-clamp-6">
            {post.content}
          </p>
        </div>
      )}

      {/* 图片 */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="mb-6">
          <img
            src={post.image_urls[0]}
            alt="分享图片"
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>
      )}

      {/* 洞察与行动 */}
      {(post.insight || post.action) && (
        <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-xl">
          {post.insight && (
            <div>
              <p className="text-sm font-medium text-primary mb-1">💡 洞察</p>
              <p className="text-sm text-foreground/80 line-clamp-2">
                {post.insight}
              </p>
            </div>
          )}
          {post.action && (
            <div>
              <p className="text-sm font-medium text-primary mb-1">🎯 行动</p>
              <p className="text-sm text-foreground/80 line-clamp-2">
                {post.action}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 勋章 */}
      {post.badges && Object.keys(post.badges).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {Object.entries(post.badges)
            .slice(0, 3)
            .map(([key, badge]: [string, any]) => (
              <div
                key={key}
                className="px-4 py-2 bg-primary/10 rounded-full text-sm"
              >
                {badge.icon} {badge.name}
              </div>
            ))}
        </div>
      )}

      {/* 底部二维码 */}
      <div className="border-t pt-6 mt-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              扫码加入21天情绪日记训练营
            </p>
            <p className="text-xs text-muted-foreground">
              一起记录 · 共同成长
            </p>
          </div>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="二维码"
              className="w-24 h-24 rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = "ShareCard";

export default ShareCard;
