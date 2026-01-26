import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Loader2, Check, X, Copy } from 'lucide-react';
import { IntroShareCard, CardTemplate, TEMPLATE_LABELS } from '@/components/common/IntroShareCard';
import { type ShareCardRegistryItem, CATEGORY_LABELS } from '@/config/shareCardsRegistry';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ShareCardPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShareCardRegistryItem | null;
}

export function ShareCardPreviewDialog({ open, onOpenChange, item }: ShareCardPreviewDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<CardTemplate>('concise');
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generateTime, setGenerateTime] = useState<number | null>(null);

  if (!item) return null;

  const handleGenerate = async () => {
    if (!cardRef.current || item.type !== 'intro') return;
    
    setGenerating(true);
    setGenerateStatus('idle');
    const startTime = Date.now();
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      });
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `share-card-${item.id}-${template}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        setGenerateStatus('success');
        setGenerateTime(Date.now() - startTime);
        toast.success(`图片已下载 (${Date.now() - startTime}ms)`);
      } else {
        throw new Error('Failed to generate blob');
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenerateStatus('error');
      setGenerateTime(Date.now() - startTime);
      toast.error('生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(item.id);
    toast.success('ID 已复制');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            <span>{item.title}</span>
            <Badge variant="outline" className="ml-2">
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：卡片预览 */}
          <div className="space-y-4">
            {item.type === 'intro' && item.introConfig ? (
              <>
                {/* 模板切换 */}
                <Tabs value={template} onValueChange={(v) => setTemplate(v as CardTemplate)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                      <TabsTrigger key={key} value={key}>
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* 卡片预览 */}
                <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                  <IntroShareCard
                    ref={cardRef}
                    config={item.introConfig}
                    template={template}
                    displayName="测试用户"
                  />
                </div>

                {/* 生成按钮 */}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={generating}
                    className="flex-1"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 生成中...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" /> 下载 {TEMPLATE_LABELS[template]}</>
                    )}
                  </Button>
                  
                  {generateStatus !== 'idle' && (
                    <div className={`text-sm flex items-center gap-1 ${
                      generateStatus === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {generateStatus === 'success' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {generateTime}ms
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] bg-muted/30 rounded-lg">
                <span className="text-6xl mb-4">{item.emoji}</span>
                <p className="text-muted-foreground">结果类卡片需要真实数据</p>
                <p className="text-sm text-muted-foreground mt-2">
                  请在对应功能页面生成
                </p>
              </div>
            )}
          </div>

          {/* 右侧：卡片信息 */}
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">卡片信息</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">ID</div>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{item.id}</code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyId}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="text-muted-foreground">类型</div>
                <div>{item.type === 'intro' ? '介绍页' : '结果类'}</div>
                
                <div className="text-muted-foreground">分类</div>
                <div>{CATEGORY_LABELS[item.category]}</div>
                
                {item.introConfig && (
                  <>
                    <div className="text-muted-foreground">目标路径</div>
                    <div className="truncate">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">
                        {item.introConfig.targetUrl}
                      </code>
                    </div>
                    
                    <div className="text-muted-foreground">副标题</div>
                    <div className="text-xs">{item.introConfig.subtitle}</div>
                  </>
                )}
                
                {item.componentName && (
                  <>
                    <div className="text-muted-foreground">组件名</div>
                    <div>
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">
                        {item.componentName}
                      </code>
                    </div>
                  </>
                )}
              </div>
            </div>

            {item.introConfig && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h3 className="font-medium">核心卖点</h3>
                <ul className="space-y-2">
                  {item.introConfig.highlights.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span>✨</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.description && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">描述</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
