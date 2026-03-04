import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { introShareConfigs, SHARE_DOMAIN } from '@/config/introShareConfig';

const categoryLabels: Record<string, string> = {
  coach: '🎯 AI教练',
  tool: '🛠 工具与测评',
  partner: '🤝 合伙人计划',
};

const grouped = Object.values(introShareConfigs).reduce((acc, c) => {
  (acc[c.category] ??= []).push(c);
  return acc;
}, {} as Record<string, typeof introShareConfigs[string][]>);

const categoryOrder = ['coach', 'tool', 'partner'] as const;

const ProductBrochure = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/有劲AI产品手册.md';
    link.download = '有劲AI产品手册.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">产品手册</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Download Card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">有劲AI · 产品手册</h2>
            <p className="text-sm text-muted-foreground mt-1">
              包含全部 {Object.keys(introShareConfigs).length} 个产品模块，Markdown 格式
            </p>
          </div>
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="w-4 h-4" />
            下载产品手册
          </Button>
        </div>

        {/* Product Preview */}
        {categoryOrder.map(cat => {
          const items = grouped[cat];
          if (!items?.length) return null;
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">{categoryLabels[cat]}</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.pageKey}
                    className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                  >
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.highlights.map((h, i) => (
                          <span key={i} className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductBrochure;
