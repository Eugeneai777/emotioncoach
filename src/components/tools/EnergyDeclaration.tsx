import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, RotateCw, FileText, Share2, Heart, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeUpload, QRCodeRenderer } from "@/components/declaration/QRCodeUpload";
import { ThemeSelector } from "@/components/declaration/ThemeSelector";
import { TemplateSelector } from "@/components/declaration/TemplateSelector";
import { AIDeclarationGenerator } from "@/components/declaration/AIDeclarationGenerator";
import { VoiceRecorder } from "@/components/declaration/VoiceRecorder";
import { getThemeById } from "@/config/themes";
import { SHARE_CARD_CONFIG } from '@/utils/shareCardConfig';
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const declarationExamples = [
  "今天，我选择以积极的心态面对一切挑战。我相信自己的能力，感恩生活中的每一个美好瞬间。我充满能量，准备迎接新的一天！",
  "我是自己命运的主宰。今天，我将专注于我的目标，克服任何障碍。我值得拥有成功和幸福！",
  "我释放所有的恐惧和怀疑，拥抱无限的可能性。今天，我将采取行动，向我的梦想迈进一步。",
  "我的思想充满力量，我的身体充满活力。今天，我将传播正能量，影响周围的人。",
  "我感恩我所拥有的一切，并对我将获得的一切保持开放。今天将是美好而富有成效的一天！"
];

const defaultQRCode = "https://youjin.ai";

export const EnergyDeclaration = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [declaration, setDeclaration] = useState(declarationExamples[0]);
  const [showQRCode, setShowQRCode] = useState(true);
  const [qrCodeData, setQRCodeData] = useState<string | null>(defaultQRCode);
  const [isQRGenerated, setIsQRGenerated] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Array<{
    id: string;
    declaration: string;
    theme: string;
    custom_background?: string | null;
    created_at: string;
  }>>([]);
  const posterRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    updateDate();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const updateDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    const dateString = now.toLocaleDateString('zh-CN', options);
    setCurrentDate(dateString);
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('declaration_favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
  };

  const setRandomDeclaration = () => {
    const randomIndex = Math.floor(Math.random() * declarationExamples.length);
    setDeclaration(declarationExamples[randomIndex]);
  };

  const handleTemplateSelect = (content: string) => {
    setDeclaration(content);
    toast({
      title: "模板已应用",
      description: "宣言内容已更新",
    });
  };

  const handleAIDeclaration = (content: string) => {
    setDeclaration(content);
    toast({
      title: "AI生成成功",
      description: "宣言已更新",
    });
  };

  const handleQRCodeChange = (qrCode: string | null, isGenerated: boolean) => {
    setQRCodeData(qrCode);
    setIsQRGenerated(isGenerated);
    if (qrCode) {
      setShowQRCode(true);
      toast({
        title: "二维码已更新",
        description: isGenerated ? "已生成新的二维码" : "已上传二维码图片",
      });
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    if (themeId !== 'custom') {
      const theme = getThemeById(themeId);
      toast({
        title: "主题已更换",
        description: `${theme.emoji} ${theme.name}`,
      });
    }
  };

  const handleCustomBackgroundChange = (imageUrl: string | null) => {
    setCustomBackground(imageUrl);
    if (imageUrl) {
      toast({
        title: "背景已更新",
        description: "已使用自定义照片",
      });
    }
  };

  const generatePosterBlob = async (): Promise<Blob | null> => {
    if (!posterRef.current) return null;

    try {
      const currentWidth = posterRef.current.offsetWidth;
      const currentHeight = posterRef.current.offsetHeight;
      
      const targetWidth = 1080;
      const targetHeight = 1920;
      
      const dpr = window.devicePixelRatio || 1;
      const scale = Math.max(2, dpr);

      const canvas = await html2canvas(posterRef.current, {
        ...SHARE_CARD_CONFIG,
        scale: scale, // Use dynamic scale for DPR
        width: currentWidth,
        height: currentHeight,
        windowWidth: currentWidth,
        windowHeight: currentHeight,
      });

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const ctx = finalCanvas.getContext('2d');
      
      if (ctx) {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        const offsetX = (targetWidth - canvas.width) / 2;
        const offsetY = (targetHeight - canvas.height) / 2;
        ctx.drawImage(canvas, offsetX, offsetY);
      }

      return new Promise((resolve) => {
        finalCanvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('生成海报失败:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    
    try {
      const blob = await generatePosterBlob();
      
      if (blob) {
        const timestamp = new Date().toISOString().split('T')[0];
        const file = new File([blob], `有劲能量宣言_${timestamp}.png`, { type: 'image/png' });

        // 尝试使用系统分享
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '有劲能量宣言',
            });
            toast({ title: "分享成功" });
            return;
          } catch {
            // 系统分享取消，降级到下载
          }
        }

        // 降级：下载（修复 appendChild）
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `有劲能量宣言_${timestamp}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "海报已下载",
          description: "可以通过相册分享到微信",
        });
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: "导出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsExporting(true);
    
    try {
      const blob = await generatePosterBlob();
      
      if (!blob) {
        throw new Error("生成海报失败");
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const file = new File([blob], `有劲能量宣言_${timestamp}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '有劲能量宣言',
          text: '我的每日能量宣言',
        });
        
        toast({
          title: "分享成功",
          description: "已打开分享菜单",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `有劲能量宣言_${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "海报已保存",
          description: "请从相册中选择图片分享到微信",
        });
      }
    } catch (error) {
      console.error('分享失败:', error);
      toast({
        title: "分享失败",
        description: "请尝试下载后手动分享",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后才能保存收藏",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('declaration_favorites')
        .insert({
          user_id: user.id,
          declaration,
          theme: selectedTheme,
          custom_background: selectedTheme === 'custom' ? customBackground : null,
        });

      if (error) throw error;

      await loadFavorites();
      
      toast({
        title: "已加入收藏",
        description: "可在收藏列表中查看",
      });
    } catch (error) {
      console.error('保存收藏失败:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('declaration_favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadFavorites();
      
      toast({
        title: "已移除",
        description: "已从收藏中移除",
      });
    } catch (error) {
      console.error('移除收藏失败:', error);
      toast({
        title: "移除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleLoadFavorite = (favorite: typeof favorites[0]) => {
    setDeclaration(favorite.declaration);
    setSelectedTheme(favorite.theme);
    if (favorite.custom_background) {
      setCustomBackground(favorite.custom_background);
    }
    setShowFavorites(false);
    
    toast({
      title: "已加载",
      description: "收藏的宣言已加载",
    });
  };

  const currentTheme = getThemeById(selectedTheme);
  const posterBackground = selectedTheme === 'custom' && customBackground 
    ? `url(${customBackground})`
    : currentTheme.gradient;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
      {showTemplateSelector && (
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      <Dialog open={showFavorites} onOpenChange={setShowFavorites}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              我的收藏 ({favorites.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>还没有收藏的宣言</p>
              </div>
            ) : (
              favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="p-4 rounded-lg border bg-card space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium line-clamp-2">
                        {favorite.declaration}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(favorite.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                    >
                      <Heart className="w-4 h-4 fill-primary text-primary" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleLoadFavorite(favorite)}
                  >
                    加载此宣言
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-md bg-card rounded-3xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-2xl font-bold text-center">有劲宣言编辑器</h1>
          <div className="flex-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFavorites(true)}
              className="relative"
            >
              <List className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div 
          ref={posterRef}
          className="relative w-full rounded-2xl overflow-hidden shadow-lg transition-all duration-500" 
          style={{ 
            aspectRatio: '9/16',
            background: posterBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute top-0 left-0 right-0 pt-12 pb-6 px-8 text-center space-y-2 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm">
            <div 
              className="text-4xl font-black tracking-wide transition-colors duration-500"
              style={{ color: currentTheme.textColor }}
            >
              有劲能量宣言
            </div>
            <div className="text-base font-medium text-foreground/80">
              让今天，从一句有劲开始
            </div>
            <div className="text-xs font-medium text-foreground/60 mt-1">
              {currentDate}
            </div>
          </div>

          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-8">
            <div className="text-center">
              <div className="text-base leading-snug text-foreground font-semibold bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md" style={{ lineHeight: '1.6' }}>
                {declaration.split('\n').map((line, index) => (
                  <div key={index} className={index > 0 ? 'mt-5' : ''}>
                    {line}
                  </div>
                ))}
              </div>
              <div className="text-xs italic text-foreground/60 mt-3 font-medium">
                大声朗读三遍，直到宣言与全身一起同频共振！
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 pb-12 px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col justify-center">
                <div 
                  className="text-3xl font-bold mb-1 transition-colors duration-500"
                  style={{ color: currentTheme.textColor }}
                >
                  有劲AI
                </div>
                <div className="text-lg text-foreground/70 font-medium">
                  每个人的生活教练
                </div>
              </div>
              
              {showQRCode && qrCodeData && (
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <QRCodeRenderer 
                    value={qrCodeData} 
                    isGenerated={isQRGenerated}
                    size={70}
                  />
                  <div 
                    className="text-sm font-bold transition-colors duration-500"
                    style={{ color: currentTheme.textColor }}
                  >
                    扫码加入
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ThemeSelector 
            selectedTheme={selectedTheme}
            onThemeChange={handleThemeChange}
            customBackground={customBackground}
            onCustomBackgroundChange={handleCustomBackgroundChange}
          />

          <AIDeclarationGenerator 
            onDeclarationGenerated={handleAIDeclaration}
          />

          <Button
            variant="outline"
            onClick={() => setShowTemplateSelector(true)}
            className="w-full rounded-xl font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            主题模版
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-semibold">编辑宣言内容</label>
            <textarea
              value={declaration}
              onChange={(e) => setDeclaration(e.target.value)}
              className="w-full h-32 p-4 text-base leading-relaxed bg-muted/50 rounded-xl border-2 border-border focus:border-primary focus:outline-none resize-none transition-colors"
              placeholder="输入你的宣言..."
            />
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-primary mb-1.5">💡 朗读建议</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                建议每天早晨大声朗读3遍，语气坚定有力。朗读时保持自信的姿态，让每个字都充满能量。
              </div>
            </div>
          </div>

          <VoiceRecorder 
            declarationText={declaration}
            onGeneratePoster={generatePosterBlob}
          />

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">显示二维码</label>
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                showQRCode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  showQRCode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <QRCodeUpload 
            onQRCodeChange={handleQRCodeChange}
            currentQRCode={qrCodeData}
          />

          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <Button
                onClick={setRandomDeclaration}
                variant="outline"
                className="flex-1 rounded-xl font-semibold"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                换一句
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isExporting}
                variant="outline"
                className="flex-1 rounded-xl font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "生成中..." : "下载海报"}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddToFavorites}
                variant="outline"
                className="flex-1 rounded-xl font-semibold"
              >
                <Heart className="w-4 h-4 mr-2" />
                加入收藏
              </Button>
              <Button
                onClick={handleShare}
                disabled={isExporting}
                className="flex-1 rounded-xl font-semibold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isExporting ? "生成中..." : "分享海报"}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">
          当你说出力量，世界就开始改变
        </div>
      </div>
    </div>
  );
};
