import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/hooks/usePartner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Sparkles, Download, Loader2 } from 'lucide-react';
import { PosterTemplateGrid } from '@/components/poster/PosterTemplateGrid';
import { PosterGenerator } from '@/components/poster/PosterGenerator';
import { PosterExpertChat } from '@/components/poster/PosterExpertChat';
import { PosterWithCustomCopy } from '@/components/poster/PosterWithCustomCopy';
import { GeneratedCopy } from '@/components/poster/CopyPreview';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

type Mode = 'quick' | 'expert';
type ExpertStep = 'chat' | 'preview';

export default function PosterCenter() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, loading: partnerLoading } = usePartner();
  const [mode, setMode] = useState<Mode>('quick');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expertStep, setExpertStep] = useState<ExpertStep>('chat');
  const [customCopy, setCustomCopy] = useState<GeneratedCopy & { selectedHeadline: number; selectedSubtitle: number } | null>(null);
  const [backgroundImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Auth check
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">请先登录后使用海报中心</p>
          <Button onClick={() => navigate('/auth')}>去登录</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Partner check
  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">成为合伙人后即可使用海报中心</p>
          <Button onClick={() => navigate('/partner/type')}>了解合伙人计划</Button>
        </div>
      </div>
    );
  }

  const entryType = partner.default_entry_type === 'paid' ? 'paid' : 'free';

  const handleCopyConfirmed = (copy: GeneratedCopy & { selectedHeadline: number; selectedSubtitle: number }) => {
    setCustomCopy(copy);
    setExpertStep('preview');
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;

    setIsDownloading(true);
    toast.loading('正在生成海报...');

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const link = document.createElement('a');
      link.download = `promotion-poster-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.dismiss();
      toast.success('海报已保存');
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('保存失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const resetToModeSelection = () => {
    setSelectedTemplate(null);
    setCustomCopy(null);
    setExpertStep('chat');
  };

  // Quick mode with template selected
  if (mode === 'quick' && selectedTemplate) {
    return (
      <PosterGenerator
        templateKey={selectedTemplate}
        partnerId={partner.id}
        entryType={entryType as 'free' | 'paid'}
        onBack={() => setSelectedTemplate(null)}
      />
    );
  }

  // Expert mode with custom copy - preview step
  if (mode === 'expert' && expertStep === 'preview' && customCopy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => {
              setExpertStep('chat');
              setCustomCopy(null);
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medium">AI定制海报</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Poster Preview */}
        <div className="flex flex-col items-center px-4 py-6">
          <div className="mb-6">
            <PosterWithCustomCopy
              ref={posterRef}
              copy={customCopy}
              partnerId={partner.id}
              entryType={entryType as 'free' | 'paid'}
              backgroundImageUrl={backgroundImageUrl || undefined}
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[300px] space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              保存海报
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setExpertStep('chat');
                setCustomCopy(null);
              }}
            >
              重新生成文案
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main selection view
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medium">推广海报中心</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Mode Switch */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'quick' ? 'default' : 'outline'}
            className={mode === 'quick' ? 'flex-1 bg-gradient-to-r from-teal-500 to-cyan-500' : 'flex-1'}
            onClick={() => {
              setMode('quick');
              resetToModeSelection();
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            快速生成
          </Button>
          <Button
            variant={mode === 'expert' ? 'default' : 'outline'}
            className={mode === 'expert' ? 'flex-1 bg-gradient-to-r from-amber-500 to-orange-500' : 'flex-1'}
            onClick={() => {
              setMode('expert');
              resetToModeSelection();
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI推广专家
          </Button>
        </div>

        {/* Content based on mode */}
        {mode === 'quick' ? (
          <>
            <p className="text-sm text-muted-foreground text-center mb-4">
              选择模板快速生成推广海报
            </p>
            <PosterTemplateGrid onSelect={setSelectedTemplate} />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center mb-4">
              与AI对话，生成专属定制文案
            </p>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border">
              <PosterExpertChat
                partnerId={partner.id}
                entryType={entryType as 'free' | 'paid'}
                onCopyConfirmed={handleCopyConfirmed}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
