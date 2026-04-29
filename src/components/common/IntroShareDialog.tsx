import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Check, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type IntroShareConfig, getShareUrl } from '@/config/introShareConfig';
import IntroShareCard, { CardTemplate, TEMPLATE_LABELS } from './IntroShareCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { getShareEnvironment, handleShareWithFallback } from '@/utils/shareUtils';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { getProxiedAvatarUrl } from '@/utils/avatarUtils';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { useQRCode } from '@/utils/qrCodeUtils';
import { generateCardBlob } from '@/utils/shareCardConfig';

// 调试开关
const DEBUG_SHARE_CARD = localStorage.getItem('debug_share_card') === 'true';

interface IntroShareDialogProps {
  config: IntroShareConfig;
  trigger?: React.ReactNode;
  partnerCode?: string;
  initialOpen?: boolean;
}

export const IntroShareDialog = ({ config, trigger, partnerCode, initialOpen = false }: IntroShareDialogProps) => {
  const [open, setOpen] = useState(initialOpen);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('value');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 预览卡片引用（带缩放，仅用于显示）
  const previewRef = useRef<HTMLDivElement>(null);
  // 导出卡片引用（全尺寸隐藏，用于 html2canvas）
  const exportRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfileCompletion();

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  // 获取用户头像和昵称
  const avatarUrl = getProxiedAvatarUrl(profile?.avatar_url);
  const displayName = profile?.display_name || '';

  // 获取合伙人代码
  const getPartnerCodeValue = useCallback(() => {
    if (partnerCode) return partnerCode;
    const storedRef = localStorage.getItem('share_ref_code');
    if (storedRef) return storedRef;
    return user?.id;
  }, [partnerCode, user]);

  // 预先获取QR码状态用于骨架屏判断
  const shareUrl = getShareUrl(config.targetUrl, getPartnerCodeValue());
  const { qrCodeUrl, isLoading: qrLoading } = useQRCode(shareUrl);

  // 整体加载状态
  const isContentLoading = profileLoading || qrLoading || !qrCodeUrl;

  const shareEnv = getShareEnvironment();
  const showImagePreview = shareEnv.isWeChat || shareEnv.isIOS;

  const generateBlob = async (): Promise<Blob | null> => {
    if (!exportRef.current) {
      if (DEBUG_SHARE_CARD) console.log('[IntroShareDialog] No export ref available');
      return null;
    }
    
    setIsGenerating(true);
    try {
      if (DEBUG_SHARE_CARD) {
        console.log('[IntroShareDialog] Card content:', {
          hasAvatar: !!avatarUrl,
          configTitle: config.title,
          template: selectedTemplate,
        });
      }

      const blob = await generateCardBlob(exportRef, { 
        isWeChat: shareEnv.isWeChat,
        skipImageWait: true,
        skipFontWait: true,
        forceScale: 2,
      });
      
      if (!blob) {
        throw new Error('Blob generation returned null');
      }
      
      if (DEBUG_SHARE_CARD) console.log('[IntroShareDialog] Blob generated successfully');
      return blob;
    } catch (error) {
      console.error('[IntroShareDialog] Generation failed:', error);
      toast({
        title: "生成图片失败",
        description: "请稍后重试",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePreview = async () => {
    const blob = await generateBlob();
    if (!blob) return;

    // Close the dialog FIRST to clear Radix modal locks (pointer-events, focus trap)
    // This ensures the preview portal can receive native touch gestures
    setOpen(false);

    // Wait for Radix to fully unmount its overlay
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const filename = `${config.title}-分享卡片.png`;
    setIsRemoteReady(false);

    await handleShareWithFallback(blob, filename, {
      title: config.title,
      text: config.subtitle,
      onShowPreview: (payload) => {
        setPreviewImage(payload.url);
        setIsRemoteReady(payload.isRemoteReady);
      },
    });
  };

  const handleDownload = async () => {
    const blob = await generateBlob();
    if (!blob) return;

    const filename = `${config.title}-分享卡片.png`;
    setIsRemoteReady(false);

    try {
      const result = await handleShareWithFallback(blob, filename, {
        title: config.title,
        text: config.subtitle,
        onShowPreview: (payload) => {
          setPreviewImage(payload.url);
          setIsRemoteReady(payload.isRemoteReady);
        },
      });

      if (result.success && result.method !== 'preview') {
        toast({
          title: result.method === 'webshare' ? "分享成功" : "保存成功",
          description: result.method === 'download' ? "图片已保存到下载目录" : undefined,
        });
      }
    } catch (error) {
      console.error('[IntroShareDialog] Save failed:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "链接已复制" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const templates: CardTemplate[] = ['value', 'scenario'];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-[380px] max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">分享 {config.title}</DialogTitle>
          </DialogHeader>

          {/* Template Selector */}
          <div className="flex justify-center gap-2 my-3">
            {templates.map((t) => (
              <Button
                key={t}
                variant={selectedTemplate === t ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTemplate(t)}
                className="text-xs px-3"
              >
                {selectedTemplate === t && <Check className="w-3 h-3 mr-1" />}
                {TEMPLATE_LABELS[t]}
              </Button>
            ))}
          </div>

          {/* Card Preview - 缩放显示 */}
          <div className="flex justify-center overflow-hidden" style={{ height: '320px' }}>
            <div className="transform origin-top scale-[0.55] sm:scale-[0.62]">
              {isContentLoading ? (
                <ShareCardSkeleton variant="compact" />
              ) : (
                <IntroShareCard
                  ref={previewRef}
                  config={config}
                  template={selectedTemplate}
                  partnerCode={getPartnerCodeValue()}
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  onReady={() => setCardReady(true)}
                />
              )}
            </div>
          </div>

          {/* Export card moved outside DialogContent */}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={showImagePreview ? handleGeneratePreview : handleDownload}
              disabled={isGenerating || isContentLoading}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {showImagePreview ? '生成图片' : '保存分享卡片'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="h-11 px-4"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-2">
            {showImagePreview ? '点击生成图片后，长按保存到相册' : '点击分享按钮，或复制链接后发送'}
          </p>
        </DialogContent>
      </Dialog>

      {/* Hidden Export Card - outside Dialog so it persists after dialog closes */}
      {!isContentLoading && (
        <div 
          className="fixed -left-[9999px] top-0 pointer-events-none"
          style={{ opacity: 0.01 }}
          aria-hidden="true"
        >
          <IntroShareCard
            ref={exportRef}
            config={config}
            template={selectedTemplate}
            partnerCode={getPartnerCodeValue()}
            avatarUrl={avatarUrl}
            displayName={displayName}
          />
        </div>
      )}

      {previewImage && (
        <ShareImagePreview
          open={!!previewImage}
          imageUrl={previewImage}
          onClose={handleClosePreview}
          isRemoteReady={isRemoteReady}
        />
      )}
    </>
  );
};

export default IntroShareDialog;
