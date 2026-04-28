import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/hooks/usePartner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Sparkles, Download, Loader2, Copy, Check, ImageIcon, ChevronRight, Share2 } from 'lucide-react';
import { PosterTemplateGrid, posterTemplates, type SceneType } from '@/components/poster/PosterTemplateGrid';
import { SceneSelector } from '@/components/poster/SceneSelector';
import { PosterGenerator } from '@/components/poster/PosterGenerator';
import { PosterExpertChat } from '@/components/poster/PosterExpertChat';
import { PosterWithCustomCopy } from '@/components/poster/PosterWithCustomCopy';
import { PosterLayoutSelector, type PosterLayout } from '@/components/poster/PosterLayoutSelector';
import { BackgroundSourceSelector } from '@/components/poster/BackgroundSourceSelector';
import { UnsplashImagePicker } from '@/components/poster/UnsplashImagePicker';
import { PosterSizeSelector, POSTER_SIZES, type PosterSize } from '@/components/poster/PosterSizeSelector';
import { type PosterScheme } from '@/components/poster/SchemePreview';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateCardBlob } from '@/utils/shareCardConfig';
import { executeOneClickShare } from '@/utils/oneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { handleShareWithFallback } from '@/utils/shareUtils';

type Mode = 'quick' | 'expert';
type QuickStep = 'template' | 'scene' | 'generate';
type ExpertStep = 'chat' | 'layout' | 'background' | 'preview';
type BackgroundSource = 'solid' | 'unsplash' | 'ai';

export default function PosterCenter() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { partner, loading: partnerLoading } = usePartner();
  const [mode, setMode] = useState<Mode>('quick');
  const [quickStep, setQuickStep] = useState<QuickStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<SceneType>('default');
  const [sceneCopy, setSceneCopy] = useState<{ tagline: string; sellingPoints: string[] } | null>(null);
  const [expertStep, setExpertStep] = useState<ExpertStep>('chat');
  const [customCopy, setCustomCopy] = useState<(PosterScheme & { target_audience: string; promotion_scene: string }) | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<PosterLayout>('default');
  const [backgroundSource, setBackgroundSource] = useState<BackgroundSource>('solid');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [savedPosterId, setSavedPosterId] = useState<string | null>(null);
  const [isGeneratingAiBackground, setIsGeneratingAiBackground] = useState(false);
  const [selectedPosterSize, setSelectedPosterSize] = useState<PosterSize>(POSTER_SIZES[0]);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [isPosterPreviewRemoteReady, setIsPosterPreviewRemoteReady] = useState(false);
  const [isPosterSharing, setIsPosterSharing] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // One-click share handler for expert mode poster
  const handlePosterShare = async () => {
    if (!posterRef.current || isPosterSharing) return;
    
    setIsPosterSharing(true);
    const toastId = toast.loading('正在生成海报...');

    await executeOneClickShare({
      cardRef: posterRef,
      cardName: `AI定制海报-${selectedPosterSize.name}`,
      onProgress: (status) => {
        if (status === 'sharing') {
          toast.dismiss(toastId);
          toast.loading('正在分享...');
        } else if (status === 'done') {
          toast.dismiss(toastId);
          toast.success('分享成功');
        } else if (status === 'error') {
          toast.dismiss(toastId);
        }
      },
      onShowPreview: (blobUrl) => {
        toast.dismiss(toastId);
        setPosterPreviewUrl(blobUrl);
        setIsPosterPreviewRemoteReady(!blobUrl.startsWith('blob:'));
        setShowPosterPreview(true);
      },
      onError: (error) => {
        toast.dismiss(toastId);
        toast.error(error);
      }
    });

    setIsPosterSharing(false);
  };

  // Close poster preview and cleanup
  const closePosterPreview = () => {
    setShowPosterPreview(false);
    if (posterPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(posterPreviewUrl);
    }
    setPosterPreviewUrl(null);
    setIsPosterPreviewRemoteReady(false);
  };

  // Auth check
  if (!user && !authLoading) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-4">请先登录后使用海报中心</p>
          <Button onClick={() => navigate('/auth?redirect=/poster-center')}>去登录</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || partnerLoading) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Partner check
  if (!partner) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="text-center">
          <p className="text-muted-foreground mb-4">成为合伙人后即可使用海报中心</p>
          <Button onClick={() => navigate('/partner/type')}>了解合伙人计划</Button>
        </div>
      </div>
    );
  }

  const entryType = partner.default_entry_type === 'paid' ? 'paid' : 'free';

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setQuickStep('scene');
  };

  const handleSceneConfirm = (scene: SceneType, tagline: string, sellingPoints: string[]) => {
    setSelectedScene(scene);
    setSceneCopy({ tagline, sellingPoints });
    setQuickStep('generate');
  };

  const handleSchemeConfirmed = async (scheme: PosterScheme & { target_audience: string; promotion_scene: string }) => {
    setCustomCopy(scheme);
    setExpertStep('layout'); // Go to layout selection first
  };

  const handleLayoutConfirm = () => {
    setExpertStep('background'); // Then go to background selection
  };

  const handleBackgroundConfirm = async () => {
    // Save poster to database for tracking
    if (customCopy) {
      try {
        const { data, error } = await supabase
          .from('partner_posters')
          .insert({
            partner_id: partner.id,
            template_key: customCopy.recommended_template,
            headline: customCopy.headline,
            subtitle: customCopy.subtitle,
            selling_points: customCopy.selling_points,
            call_to_action: customCopy.call_to_action,
            urgency_text: customCopy.urgency_text || null,
            entry_type: entryType,
          })
          .select('id')
          .single();
        
        if (!error && data) {
          setSavedPosterId(data.id);
          console.log('Poster saved with ID:', data.id);
        }
      } catch (e) {
        console.error('Failed to save poster:', e);
      }
    }
    setExpertStep('preview');
  };

  const handleGenerateAiBackground = async () => {
    if (!customCopy) return;
    
    setIsGeneratingAiBackground(true);
    try {
      const prompt = `Professional promotional poster background for ${customCopy.recommended_template}, ${customCopy.headline}, abstract, elegant, gradient, high quality`;
      
      const { data, error } = await supabase.functions.invoke('generate-poster-image', {
        body: { prompt, templateKey: customCopy.recommended_template }
      });
      
      if (error) throw error;
      if (data?.imageUrl) {
        setBackgroundImageUrl(data.imageUrl);
        toast.success('AI背景生成成功');
      } else {
        toast.error('AI背景生成失败，已保留当前背景，可继续生成海报');
      }
    } catch (e) {
      console.error('Failed to generate AI background:', e);
      toast.error('AI背景生成失败，已保留当前背景，可继续生成海报');
    } finally {
      setIsGeneratingAiBackground(false);
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;

    setIsDownloading(true);
    toast.loading('正在生成海报...');

    try {
      const blob = await generateCardBlob(posterRef, {
        explicitWidth: selectedPosterSize.width,
        explicitHeight: selectedPosterSize.height,
        forceScale: 2,
      });

      toast.dismiss();

      if (!blob) {
        toast.error('生成海报失败，请重试');
        return;
      }

      // 1. 立即用 blob URL 显示预览（毫秒级）
      const blobUrl = URL.createObjectURL(blob);
      setPosterPreviewUrl(blobUrl);
      setIsPosterPreviewRemoteReady(false);
      setShowPosterPreview(true);

      // 2. 后台上传，完成后替换为 HTTPS URL（安卓微信长按保存需要）
      import('@/utils/shareImageUploader').then(async ({ uploadShareImage }) => {
        try {
          const httpsUrl = await uploadShareImage(blob);
          setPosterPreviewUrl(httpsUrl);
          setIsPosterPreviewRemoteReady(true);
          URL.revokeObjectURL(blobUrl);
        } catch (e) {
          console.warn('[PosterCenter] Upload failed, keeping blob URL', e);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('保存失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate share copy text
  const generateShareCopy = () => {
    if (!customCopy) return '';
    
    const lines = [
      customCopy.headline,
      customCopy.subtitle,
      '',
      customCopy.selling_points.map(p => `✨ ${p}`).join('\n'),
      '',
      `${customCopy.call_to_action}`,
    ];
    
    if (customCopy.urgency_text) {
      lines.push(`🔥 ${customCopy.urgency_text}`);
    }
    
    return lines.join('\n');
  };

  const handleCopyShareText = async () => {
    const shareText = generateShareCopy();
    
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      toast.success('文案已复制，配合海报一起发布效果更好！');
      
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      console.error('Copy failed:', e);
      toast.error('复制失败，请手动复制');
    }
  };

  const resetToModeSelection = () => {
    setSelectedTemplate(null);
    setSelectedScene('default');
    setSceneCopy(null);
    setQuickStep('template');
    setCustomCopy(null);
    setExpertStep('chat');
    setSavedPosterId(null);
    setIsCopied(false);
    setSelectedLayout('default');
    setBackgroundSource('solid');
    setBackgroundImageUrl(null);
    setSelectedPosterSize(POSTER_SIZES[0]);
  };

  // Get current template object
  const currentTemplate = selectedTemplate 
    ? posterTemplates.find(t => t.key === selectedTemplate) 
    : null;

  // Quick mode - Scene selection step
  if (mode === 'quick' && quickStep === 'scene' && currentTemplate) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setQuickStep('template')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medium">选择推广场景</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          <SceneSelector
            template={currentTemplate}
            onConfirm={handleSceneConfirm}
            onBack={() => setQuickStep('template')}
          />
        </div>
      </div>
    );
  }

  // Quick mode with template and scene selected - Generate
  if (mode === 'quick' && quickStep === 'generate' && selectedTemplate && sceneCopy) {
    return (
      <PosterGenerator
        templateKey={selectedTemplate}
        partnerId={partner.id}
        entryType={entryType as 'free' | 'paid'}
        onBack={() => {
          setQuickStep('scene');
          setSceneCopy(null);
        }}
        customTagline={sceneCopy.tagline}
        customSellingPoints={sceneCopy.sellingPoints}
        scene={selectedScene}
      />
    );
  }

  // Expert mode - Layout selection step
  if (mode === 'expert' && expertStep === 'layout' && customCopy) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => {
              setExpertStep('chat');
              setCustomCopy(null);
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medium">选择海报风格</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Layout selector */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border mb-4">
            <PosterLayoutSelector
              selectedLayout={selectedLayout}
              onLayoutSelect={setSelectedLayout}
            />
          </div>

          {/* Preview */}
          <div className="flex justify-center mb-4">
            <div className="transform scale-[0.6] origin-top">
              <PosterWithCustomCopy
                copy={customCopy}
                partnerId={partner.id}
                entryType={entryType as 'free' | 'paid'}
                layout={selectedLayout}
              />
            </div>
          </div>

          {/* Continue button */}
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleLayoutConfirm}
          >
            下一步：选择背景
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Expert mode - Background selection step
  if (mode === 'expert' && expertStep === 'background' && customCopy) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setExpertStep('layout')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medium">选择背景</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Background source selector */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border mb-4">
            <BackgroundSourceSelector
              source={backgroundSource}
              onSourceChange={(source) => {
                setBackgroundSource(source);
                if (source === 'solid') {
                  setBackgroundImageUrl(null);
                }
              }}
            />
          </div>

          {/* Background options based on source */}
          {backgroundSource === 'unsplash' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border mb-4">
              <UnsplashImagePicker
                templateKey={customCopy.recommended_template}
                onImageSelect={(url) => setBackgroundImageUrl(url)}
                selectedImageUrl={backgroundImageUrl || undefined}
              />
            </div>
          )}

          {backgroundSource === 'ai' && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border mb-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                使用AI生成专属背景图片（消耗5点配额）
              </p>
              <Button
                variant="outline"
                onClick={handleGenerateAiBackground}
                disabled={isGeneratingAiBackground}
              >
                {isGeneratingAiBackground ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成AI背景
                  </>
                )}
              </Button>
              {backgroundImageUrl && backgroundSource === 'ai' && (
                <div className="mt-3">
                  <img src={backgroundImageUrl} alt="AI Generated" loading="lazy" decoding="async" className="w-32 h-auto mx-auto rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="flex justify-center mb-4">
            <div className="transform scale-[0.6] origin-top">
              <PosterWithCustomCopy
                copy={customCopy}
                partnerId={partner.id}
                entryType={entryType as 'free' | 'paid'}
                layout={selectedLayout}
                backgroundImageUrl={backgroundImageUrl || undefined}
              />
            </div>
          </div>

          {/* Continue button */}
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleBackgroundConfirm}
          >
            生成海报
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Expert mode with custom copy - preview step
  if (mode === 'expert' && expertStep === 'preview' && customCopy) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setExpertStep('background')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medium">AI定制海报</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Size Selector */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border">
            <PosterSizeSelector
              selectedSize={selectedPosterSize.key}
              onSizeSelect={setSelectedPosterSize}
            />
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
              posterId={savedPosterId || undefined}
              layout={selectedLayout}
              width={selectedPosterSize.width}
              height={selectedPosterSize.height}
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[300px] space-y-3">
            {/* One-Click Share - Primary */}
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handlePosterShare}
              disabled={isPosterSharing}
            >
              {isPosterSharing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              一键分享
            </Button>

            {/* Download - Secondary */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              下载海报
            </Button>

            {/* Copy Share Text */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyShareText}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  已复制文案
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  复制分享文案
                </>
              )}
            </Button>

            {/* Share Copy Preview */}
            <div className="bg-white/80 rounded-lg p-3 text-xs text-muted-foreground border">
              <p className="font-medium text-foreground mb-1 text-sm">分享文案预览：</p>
              <p className="whitespace-pre-line line-clamp-4">{generateShareCopy()}</p>
            </div>
            
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={resetToModeSelection}
            >
              重新生成海报
            </Button>

            {/* Scan Stats Badge */}
            {savedPosterId && (
              <div className="text-center text-xs text-muted-foreground">
                <p>📊 海报ID: {savedPosterId.slice(0, 8)}...</p>
                <p className="mt-1">扫码数据将在「我的学员」页面显示</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Image Preview */}
        <ShareImagePreview
          open={showPosterPreview}
          onClose={closePosterPreview}
          imageUrl={posterPreviewUrl}
          isRemoteReady={isPosterPreviewRemoteReady}
        />
      </div>
    );
  }

  // Main selection view
  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="posterCenter" />
      {/* Header */}
      <PageHeader title="海报工坊" />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Mode Switch */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'quick' ? 'default' : 'outline'}
            className={mode === 'quick' ? 'flex-1 bg-gradient-to-r from-orange-500 to-amber-500' : 'flex-1'}
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
              选择模板，选择推广场景，一键生成专属海报
            </p>
            <PosterTemplateGrid onSelect={handleTemplateSelect} />
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
                onSchemeConfirmed={handleSchemeConfirmed}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
