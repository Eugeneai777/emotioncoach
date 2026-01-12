import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet";
import { ArrowLeft, ClipboardCheck, Target, Calendar, Lightbulb, Share2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import WealthInviteCardDialog from '@/components/wealth-camp/WealthInviteCardDialog';

const ShareInvite = () => {
  const navigate = useNavigate();
  const [assessmentQR, setAssessmentQR] = useState<string>('');
  const [campQR, setCampQR] = useState<string>('');

  const baseUrl = getPromotionDomain();
  const assessmentUrl = `${baseUrl}/wealth-block`;
  const campUrl = `${baseUrl}/wealth-camp-intro`;

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
      <Helmet>
        <title>邀请好友 - 有劲AI</title>
        <meta name="description" content="邀请好友一起成长，分享财富觉醒之旅" />
        <meta property="og:title" content="有劲AI • 邀请好友" />
        <meta property="og:description" content="分享测评或训练营给朋友，一起开启财富觉醒" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-wealth-coach.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/share-invite" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
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
                    <WealthInviteCardDialog
                      defaultTab={entry.id === 'assessment' ? 'assessment' : 'camp'}
                      trigger={
                        <Button variant="default" size="sm" className="gap-1.5">
                          <Image className="h-4 w-4" />
                          生成卡片
                        </Button>
                      }
                    />
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
                <li>• 长按二维码保存到相册，发送给朋友</li>
                <li>• 复制链接后直接发送到微信群</li>
                <li>• 先让朋友做测评，了解自己的卡点</li>
                <li>• 再邀请加入训练营，系统突破</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShareInvite;
