import React, { useRef, useState, cloneElement, isValidElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Share2, Sparkles } from "lucide-react";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { Button } from "@/components/ui/button";
import { usePartner } from "@/hooks/usePartner";
import { getPartnerShareUrl, getPromotionDomain } from "@/utils/partnerQRUtils";
import { useQRCode } from "@/utils/qrCodeUtils";

interface GratitudeJournalShareDialogProps {
  trigger?: React.ReactNode;
}

/** Inline share card content (no separate card component) */
function GratitudeShareCardContent({ isPartner, qrCodeUrl }: { isPartner: boolean; qrCodeUrl: string | null }) {
  return (
    <div
      className="bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 space-y-4"
      style={{ width: '320px' }}
    >
      <div className="text-center space-y-2">
        {isPartner && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-2">
            🌟 合伙人专属推广
          </Badge>
        )}
        <div className="text-4xl">📔</div>
        <h3 className="text-lg font-bold text-teal-900">我的感恩日记</h3>
        <p className="text-sm text-teal-700">每天1分钟，看见幸福的力量</p>
      </div>

      <div className="bg-white/60 backdrop-blur rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-teal-600">
          <Sparkles className="w-3.5 h-3.5" />
          核心价值
        </div>
        <ul className="text-sm text-teal-800 space-y-1">
          <li>✨ 7维度幸福分析</li>
          <li>✨ AI自动生成报告</li>
          <li>✨ 每天只需1分钟</li>
          <li>✨ 科学验证有效</li>
        </ul>
      </div>

      <div className="text-center">
        <p className="text-xs text-teal-600">
          {isPartner ? "🎁 扫码领取专属福利" : "扫码开始记录"}
        </p>
        <div className="mt-2 inline-block bg-white p-2 rounded-lg">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="感恩日记二维码" className="w-20 h-20 rounded" />
          ) : (
            <div className="w-20 h-20 bg-teal-100 rounded flex items-center justify-center">
              <span className="text-teal-400 text-xs">生成中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const GratitudeJournalShareDialog = ({ trigger }: GratitudeJournalShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const { partner, isPartner } = usePartner();

  const shareUrl = isPartner && partner?.id
    ? getPartnerShareUrl(partner.id, (partner.default_entry_type as 'free' | 'paid') || 'free')
    : `${getPromotionDomain()}/gratitude-journal-intro`;

  const { qrCodeUrl } = useQRCode(open ? shareUrl : null, 'SHARE_CARD');

  // Render trigger button that opens the dialog
  const triggerElement = trigger ? (
    isValidElement(trigger) ? (
      cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => setOpen(true),
      })
    ) : (
      <span onClick={() => setOpen(true)}>{trigger}</span>
    )
  ) : (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
      <Share2 className="w-4 h-4" />
      分享
    </Button>
  );

  return (
    <>
      {triggerElement}
      <ShareDialogBase
        open={open}
        onOpenChange={setOpen}
        title="分享感恩日记"
        description={isPartner ? "分享给朋友，赚取推广佣金" : "分享给朋友，一起记录感恩时刻"}
        shareUrl={shareUrl}
        fileName="感恩日记-分享海报.png"
        buttonGradient="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
        exportCardRef={posterRef}
        cardReady={!!qrCodeUrl}
        previewScale={0.55}
        footerHint="点击生成图片后，长按保存到相册分享给好友"
        previewCard={<GratitudeShareCardContent isPartner={isPartner} qrCodeUrl={qrCodeUrl} />}
        exportCard={
          <div ref={posterRef}>
            <GratitudeShareCardContent isPartner={isPartner} qrCodeUrl={qrCodeUrl} />
          </div>
        }
      />
    </>
  );
};
