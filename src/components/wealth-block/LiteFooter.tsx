import { useFooterHeight } from "@/hooks/useFooterHeight";

interface LiteFooterProps {
  wechatUrl?: string;
}

export function LiteFooter({ wechatUrl = "https://mp.weixin.qq.com/s/your-wechat-url" }: LiteFooterProps) {
  const { footerRef } = useFooterHeight();

  return (
    <div 
      ref={footerRef}
      className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t py-3 px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {/* 关注公众号链接 */}
      <a 
        href={wechatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 text-sm text-center block mb-2"
      >
        点此关注公众号
      </a>
      
      {/* 付费提示（红色） */}
      <p className="text-red-500 text-xs text-center mb-1">
        需付费后方可查看结果，结果纯属娱乐仅供参考
      </p>
      
      {/* 公司信息和ICP备案 */}
      <p className="text-muted-foreground text-xs text-center">
        北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
      </p>
    </div>
  );
}
