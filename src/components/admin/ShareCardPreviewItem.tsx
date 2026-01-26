import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Loader2, Check, X, Clock } from 'lucide-react';
import { IntroShareCard, CardTemplate } from '@/components/common/IntroShareCard';
import { type ShareCardRegistryItem, CATEGORY_LABELS } from '@/config/shareCardsRegistry';
import { generateCanvas, canvasToBlob, getPerformanceConfig } from '@/utils/shareCardConfig';

interface ShareCardPreviewItemProps {
  item: ShareCardRegistryItem;
  onPreview: () => void;
}

export function ShareCardPreviewItem({ item, onPreview }: ShareCardPreviewItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generateTime, setGenerateTime] = useState<number | null>(null);
  const [cardReady, setCardReady] = useState(false);

  const handleTestGenerate = async () => {
    if (!cardRef.current || item.type !== 'intro') return;
    
    setGenerating(true);
    setGenerateStatus('idle');
    const startTime = Date.now();
    
    try {
      // 使用优化后的 generateCanvas
      const canvas = await generateCanvas(cardRef, {
        debug: true,
        skipImageWait: cardReady,
      });
      
      if (!canvas) throw new Error('Canvas generation failed');
      
      const blob = await canvasToBlob(canvas);
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `share-card-${item.id}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        setGenerateStatus('success');
        setGenerateTime(Date.now() - startTime);
        
        // 日志性能配置
        console.log('[ShareCardPreviewItem] Performance:', getPerformanceConfig());
      } else {
        throw new Error('Failed to generate blob');
      }
    } catch (error) {
      console.error('Generate error:', error);
      setGenerateStatus('error');
      setGenerateTime(Date.now() - startTime);
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coach': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tool': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'partner': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'result': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* 缩略图预览区 */}
      <div className="h-[160px] bg-muted/30 overflow-hidden relative">
        {item.type === 'intro' && item.introConfig ? (
          <div className="absolute top-2 left-2 transform scale-[0.28] origin-top-left">
            <IntroShareCard 
              ref={cardRef}
              config={item.introConfig} 
              template="concise"
              displayName="测试用户"
              onReady={() => setCardReady(true)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <span className="text-4xl block mb-2">{item.emoji}</span>
              <span className="text-xs">结果类卡片</span>
            </div>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-1" />
            查看
          </Button>
        </div>
      </div>
      
      {/* 卡片信息 */}
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl flex-shrink-0">{item.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getCategoryColor(item.category)}`}>
                {CATEGORY_LABELS[item.category]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.type === 'intro' ? '介绍页' : '结果'}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* 生成状态 */}
        {generateStatus !== 'idle' && (
          <div className={`mt-2 text-xs flex items-center gap-1 ${
            generateStatus === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {generateStatus === 'success' ? (
              <><Check className="w-3 h-3" /> 生成成功</>
            ) : (
              <><X className="w-3 h-3" /> 生成失败</>
            )}
            {generateTime && <span>({generateTime}ms)</span>}
          </div>
        )}
      </CardContent>
      
      {/* 操作按钮 */}
      <CardFooter className="p-3 pt-0 gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onPreview}>
          <Eye className="w-3 h-3 mr-1" /> 预览
        </Button>
        {item.type === 'intro' && (
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={handleTestGenerate}
            disabled={generating}
          >
            {generating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 生成中</>
            ) : (
              <><Download className="w-3 h-3 mr-1" /> 测试</>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
