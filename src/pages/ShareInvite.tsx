import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, ClipboardCheck, Target, Calendar, Lightbulb, Share2, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';
import { executeOneClickShare, CardType } from '@/utils/oneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
import AssessmentValueShareCard from '@/components/wealth-block/AssessmentValueShareCard';
import WealthCampShareCard from '@/components/wealth-camp/WealthCampShareCard';

// Helper: Proxy third-party avatar URLs
const getProxiedAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  try {
    const url = new URL(avatarUrl);
    const thirdPartyDomains = ['thirdwx.qlogo.cn', 'wx.qlogo.cn', 'qlogo.cn'];
    const needsProxy = thirdPartyDomains.some(domain => url.hostname.includes(domain));
    if (needsProxy) {
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
};

const ShareInvite = () => {
  const navigate = useNavigate();
  const [assessmentQR, setAssessmentQR] = useState<string>('');
  const [campQR, setCampQR] = useState<string>('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // User info for share cards
  const [userInfo, setUserInfo] = useState<{
    avatarUrl?: string;
    displayName?: string;
  }>({});
  const [partnerInfo, setPartnerInfo] = useState<{
    partnerId: string;
    partnerCode: string;
  } | null>(null);

  // Card refs for one-click share
  const assessmentCardRef = useRef<HTMLDivElement>(null);
  const campCardRef = useRef<HTMLDivElement>(null);

  const baseUrl = getPromotionDomain();
  const assessmentUrl = `${baseUrl}/wealth-block`;
  const campUrl = `${baseUrl}/wealth-camp-intro`;

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      
      const profileRes = await sb.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single();
      const partnerRes = await sb.from('partners').select('id, partner_code').eq('user_id', user.id).eq('status', 'active').maybeSingle();
      
      const profile = profileRes?.data;
      const partner = partnerRes?.data;

      setUserInfo({
        avatarUrl: getProxiedAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url),
        displayName: profile?.display_name || user.user_metadata?.full_name || '财富觉醒者',
      });

      if (partner) {
        setPartnerInfo({
          partnerId: partner.id,
          partnerCode: partner.partner_code,
        });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    // Generate QR codes
    const generateQRCodes = async () => {
      try {
        const assessmentQRCode = await QRCode.toDataURL(assessmentUrl, {
          width: 160,
          margin: 2,
          color: { dark: '#0d9488', light: '#ffffff' }
        });
        setAssessmentQR(assessmentQRCode);

        const campQRCode = await QRCode.toDataURL(campUrl, {
          width: 160,
          margin: 2,
          color: { dark: '#6366f1', light: '#ffffff' }
        });
        setCampQR(campQRCode);
      } catch (error) {
        console.error('Failed to generate QR codes:', error);
      }
    };

    generateQRCodes();
  }, [assessmentUrl, campUrl]);

  const copyLink = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${name}链接已复制`);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  // One-click share handler
  const handleOneClickShare = useCallback(async (cardType: 'assessment' | 'camp') => {
    const cardRef = cardType === 'assessment' ? assessmentCardRef : campCardRef;
    const cardName = cardType === 'assessment' ? '测评价值卡' : '训练营邀请卡';
    // Map to oneClickShare CardType for background color
    const shareCardType = cardType === 'assessment' ? 'value' : 'camp';
    
    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(cardType);

    await executeOneClickShare({
      cardRef,
      cardName,
      cardType: shareCardType,
      onProgress: (status) => {
        if (status === 'done') {
          toast.success('分享成功');
        }
      },
      onShowPreview: (blobUrl) => {
        setPreviewImageUrl(blobUrl);
        setShowImagePreview(true);
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    setGenerating(null);
  }, []);

  const closePreview = useCallback(() => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  }, [previewImageUrl]);

  const shareEntries = [
    {
      id: 'assessment',
      name: '财富卡点测评',
      description: '让朋友先了解自己的财富卡点',
      url: assessmentUrl,
      qrCode: assessmentQR,
      icon: Target,
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-50/80 to-cyan-50/80',
      borderColor: 'border-teal-200/60',
    },
    {
      id: 'camp',
      name: '7天财富觉醒训练营',
      description: '邀请朋友加入系统训练',
      url: campUrl,
      qrCode: campQR,
      icon: Calendar,
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50/80 to-purple-50/80',
      borderColor: 'border-indigo-200/60',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <DynamicOGMeta pageKey="shareInvite" />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">邀请好友</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Intro Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 mb-2">
            <Share2 className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            邀请好友一起成长
          </h2>
          <p className="text-sm text-muted-foreground">
            分享测评或训练营给朋友，一起开启财富觉醒
          </p>
        </div>

        {/* Share Entry Cards */}
        <div className="space-y-4">
          {shareEntries.map((entry) => (
            <Card
              key={entry.id}
              className={`p-5 bg-gradient-to-br ${entry.bgGradient} border ${entry.borderColor} backdrop-blur-sm`}
            >
              <div className="flex items-start gap-4">
                {/* Left: Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${entry.gradient}`}>
                      <entry.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">{entry.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(entry.url, entry.name)}
                      className="flex-1"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      复制链接
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      disabled={generating === entry.id}
                      onClick={() => handleOneClickShare(entry.id as 'assessment' | 'camp')}
                    >
                      {generating === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Image className="h-4 w-4" />
                      )}
                      {generating === entry.id ? '生成中...' : '分享卡片'}
                    </Button>
                  </div>
                </div>

                {/* Right: QR Code */}
                <div className="flex-shrink-0">
                  {entry.qrCode ? (
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <img
                        src={entry.qrCode}
                        alt={`${entry.name}二维码`}
                        className="w-24 h-24"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-muted/50 rounded-lg animate-pulse" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips Card */}
        <Card className="p-4 bg-white/60 backdrop-blur-sm border border-white/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">分享小贴士</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• 点击「分享卡片」一键生成精美邀请图</li>
                <li>• 长按二维码保存到相册，发送给朋友</li>
                <li>• 先让朋友做测评，了解自己的卡点</li>
                <li>• 再邀请加入训练营，系统突破</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Hidden cards for screenshot capture */}
      <div 
        className="fixed -left-[9999px] top-0 pointer-events-none"
        style={{ opacity: 0.01 }}
        aria-hidden="true"
      >
        <AssessmentValueShareCard
          ref={assessmentCardRef}
          avatarUrl={userInfo.avatarUrl}
          displayName={userInfo.displayName}
          partnerInfo={partnerInfo || undefined}
        />
        <WealthCampShareCard
          ref={campCardRef}
          avatarUrl={userInfo.avatarUrl}
          displayName={userInfo.displayName}
          currentDay={1}
          totalDays={7}
          partnerInfo={partnerInfo || undefined}
        />
      </div>

      {/* Image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={closePreview}
        imageUrl={previewImageUrl}
      />
    </div>
  );
};

export default ShareInvite;
