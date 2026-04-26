import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, Download, FileText, Loader2, Sparkles, Table2, Wand2, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { CONVERSION_PRODUCTS, STATIC_TOPIC_GROUPS, VIDEO_AUDIENCES } from '@/config/videoScriptConfig';
import {
  MINI_APP_CONVERSION_SEEDS,
  MINI_APP_SCENE_SEEDS,
  MINI_APP_SOURCE_OPTIONS,
  MINI_APP_STYLE_OPTIONS,
  MiniAppContentStyle,
  MiniAppSeedItem,
  MiniAppSourceType,
} from '@/config/miniAppContentMap';

interface ContentTopicItem {
  id: string;
  painPoint: string;
  value: string;
  giftProductName?: string;
  giftDisplayName?: string;
  reportPageName?: string;
  matchedTool: string;
  aiReportValue: string;
  actionPlanValue?: string;
  coachReportValue?: string;
  viralTitle: string;
  hook: string;
  cta: string;
  route?: string;
  topicId?: string;
  productId?: string;
}

const countOptions = [10, 20, 30];

const localSeedItems = (sourceType: MiniAppSourceType): MiniAppSeedItem[] => {
  if (sourceType === 'mini-scenes') return MINI_APP_SCENE_SEEDS;
  if (sourceType === 'conversion') return MINI_APP_CONVERSION_SEEDS;

  if (sourceType === 'daily-tools') {
    const group = STATIC_TOPIC_GROUPS.find(g => g.groupId === 'daily-tools');
    return (group?.items || []).map(item => ({
      id: item.id,
      label: item.label,
      description: item.description,
      sourceType,
      topicId: item.id,
      productId: 'cv-free-tool',
      route: '/energy-studio',
      productName: item.label,
      giftDisplayName: `限时赠送「${item.label}」`,
      reportName: `${item.label}个人模式洞察报告`,
    }));
  }

  const group = STATIC_TOPIC_GROUPS.find(g => g.groupId === 'assessments');
  return (group?.items || []).map(item => ({
    id: item.id,
    label: item.label,
    description: item.description,
    sourceType,
    topicId: item.id,
    productId: item.id.includes('wealth') ? 'cv-wealth-assess' : item.id.includes('scl90') ? 'cv-scl90' : 'cv-emotion-assess',
    route: item.id.includes('wealth') ? '/wealth-block' : item.id.includes('scl90') ? '/scl90' : '/assessment-tools',
    productName: item.label,
    giftDisplayName: `限时赠送「${item.label}」`,
    reportName: item.id.includes('wealth') ? '财富卡点深度定位报告' : item.id.includes('scl90') ? '身心压力信号筛查报告' : `${item.label.replace('测评', '')}模式洞察报告`,
  }));
};

const csvEscape = (value: string) => `"${(value || '').replace(/"/g, '""')}"`;

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const formatItem = (item: ContentTopicItem) => [
  `标题：${item.viralTitle}`,
  `痛点：${item.painPoint}`,
  `价值：${item.value}`,
  `产品/工具名：${item.giftProductName || '-'}`,
  `限时赠品：${item.giftDisplayName || item.matchedTool}`,
  `专业报告名称：${item.reportPageName || '-'}`,
  `报告价值：${item.aiReportValue}`,
  item.actionPlanValue || item.coachReportValue ? `下一步行动建议：${item.actionPlanValue || item.coachReportValue}` : '',
  `开场：${item.hook}`,
  `行动：${item.cta}`,
  item.route ? `入口：${item.route}` : '',
].filter(Boolean).join('\n');

const MiniAppContentLab: React.FC = () => {
  const navigate = useNavigate();
  const [audienceId, setAudienceId] = useState('general');
  const [sourceType, setSourceType] = useState<MiniAppSourceType>('mini-scenes');
  const [style, setStyle] = useState<MiniAppContentStyle>('xiaohongshu');
  const [count, setCount] = useState('20');
  const [items, setItems] = useState<ContentTopicItem[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedAudience = useMemo(() => VIDEO_AUDIENCES.find(a => a.id === audienceId) || VIDEO_AUDIENCES[0], [audienceId]);
  const seedItems = useMemo(() => localSeedItems(sourceType), [sourceType]);
  const selectedSource = MINI_APP_SOURCE_OPTIONS.find(s => s.id === sourceType);
  const selectedStyle = MINI_APP_STYLE_OPTIONS.find(s => s.id === style);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mini-app-content-ai', {
        body: {
          audience: selectedAudience.label,
          sourceType,
          style,
          count: Number(count),
          seedItems,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.items)) throw new Error('AI返回数据格式异常');
      setItems(data.items);
      toast.success(`已生成 ${data.items.length} 条短视频选题`);
    } catch (err: any) {
      toast.error(`生成失败：${err.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, message = '已复制') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const exportCsv = () => {
    if (!items.length) return;
    const header = ['痛点', '核心价值', '赠送测评/工具', 'AI分析报告附加价值', 'AI教练报告分析', '小红书爆款标题', '开场Hook', '私域CTA', '入口'];
    const rows = items.map(item => [item.painPoint, item.value, item.matchedTool, item.aiReportValue, item.coachReportValue || '', item.viralTitle, item.hook, item.cta, item.route || ''].map(csvEscape).join(','));
    downloadBlob(`\ufeff${header.map(csvEscape).join(',')}\n${rows.join('\n')}`, `mini-app短视频选题库_${Date.now()}.csv`, 'text/csv;charset=utf-8');
    toast.success('CSV 已下载');
  };

  const exportMarkdown = () => {
    if (!items.length) return;
    const md = [
      `# /mini-app 短视频选题库`,
      '',
      `- 目标人群：${selectedAudience.label}`,
      `- 内容来源：${selectedSource?.label}`,
      `- 内容风格：${selectedStyle?.label}`,
      '',
      ...items.map((item, index) => `## ${index + 1}. ${item.viralTitle}\n\n- 痛点：${item.painPoint}\n- 核心价值：${item.value}\n- 搭配测评/工具：${item.matchedTool}\n- AI分析报告附加价值：${item.aiReportValue}\n- 开场 Hook：${item.hook}\n- CTA：${item.cta}\n- 入口：${item.route || '-'}\n`),
    ].join('\n');
    downloadBlob(md, `mini-app短视频选题库_${Date.now()}.md`, 'text/markdown;charset=utf-8');
    toast.success('Markdown 已下载');
  };

  const goVideoGenerator = (item: ContentTopicItem) => {
    const params = new URLSearchParams();
    if (item.topicId) params.set('topicId', item.topicId);
    if (item.productId) params.set('conversionId', item.productId);
    params.set('audienceId', audienceId);
    params.set('idea', item.viralTitle);
    navigate(`/video-generator?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">短视频选题工作台</h1>
            <p className="text-xs text-muted-foreground">用限时赠送引导加企微/进私域</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> 生成配置
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>目标人群</Label>
              <Select value={audienceId} onValueChange={setAudienceId} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_AUDIENCES.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>内容来源</Label>
              <Select value={sourceType} onValueChange={v => setSourceType(v as MiniAppSourceType)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MINI_APP_SOURCE_OPTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>内容风格</Label>
              <Select value={style} onValueChange={v => setStyle(v as MiniAppContentStyle)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MINI_APP_STYLE_OPTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>生成数量</Label>
              <Select value={count} onValueChange={setCount} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countOptions.map(n => <SelectItem key={n} value={String(n)}>{n} 条</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                当前将基于 <Badge variant="secondary">{selectedSource?.label}</Badge> 生成“用户能领到什么”的私域引流选题，风格为 <Badge variant="secondary">{selectedStyle?.label}</Badge>
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="sm:min-w-40">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                生成选题库
              </Button>
            </div>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">已生成 {items.length} 条，可直接复制或导出排期。</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}><Table2 className="mr-2 h-4 w-4" />导出 CSV</Button>
              <Button variant="outline" size="sm" onClick={exportMarkdown}><FileText className="mr-2 h-4 w-4" />导出 MD</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold">选择配置后生成第一批选题</p>
                <p className="mt-1 text-sm text-muted-foreground">每条都会写清楚用户能免费领到什么、AI报告能看见什么、为什么值得加企微领取。</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="cards" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cards">卡片视图</TabsTrigger>
              <TabsTrigger value="table">表格视图</TabsTrigger>
            </TabsList>
            <TabsContent value="cards" className="grid gap-3 md:grid-cols-2">
              {items.map((item, index) => (
                <Card key={item.id || index} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug">{item.viralTitle}</CardTitle>
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-2">
                      <p><span className="font-semibold text-foreground">痛点：</span><span className="text-muted-foreground">{item.painPoint}</span></p>
                      <p><span className="font-semibold text-foreground">价值：</span><span className="text-muted-foreground">{item.value}</span></p>
                      <p><span className="font-semibold text-foreground">赠送：</span><span className="text-muted-foreground">{item.matchedTool}</span></p>
                      <p><span className="font-semibold text-foreground">AI分析报告：</span><span className="text-muted-foreground">{item.aiReportValue}</span></p>
                      {item.coachReportValue && <p><span className="font-semibold text-foreground">AI教练报告分析：</span><span className="text-muted-foreground">{item.coachReportValue}</span></p>}
                      <p><span className="font-semibold text-foreground">Hook：</span><span className="text-muted-foreground">{item.hook}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      <Button variant="secondary" size="sm" onClick={() => copyText(formatItem(item), '整条选题已复制')}><Clipboard className="mr-2 h-4 w-4" />复制整条</Button>
                      <Button variant="outline" size="sm" onClick={() => copyText(item.viralTitle, '标题已复制')}><Download className="mr-2 h-4 w-4" />复制标题</Button>
                      <Button variant="outline" size="sm" onClick={() => goVideoGenerator(item)}><Video className="mr-2 h-4 w-4" />生成口播稿</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="table">
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-44">痛点</TableHead>
                        <TableHead className="min-w-48">核心价值</TableHead>
                        <TableHead className="min-w-56">赠送测评/工具</TableHead>
                        <TableHead className="min-w-56">AI分析报告附加价值</TableHead>
                        <TableHead className="min-w-56">AI教练报告分析</TableHead>
                        <TableHead className="min-w-56">小红书爆款标题</TableHead>
                        <TableHead className="min-w-28">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.painPoint}</TableCell>
                          <TableCell>{item.value}</TableCell>
                          <TableCell>{item.matchedTool}</TableCell>
                          <TableCell>{item.aiReportValue}</TableCell>
                          <TableCell>{item.coachReportValue || '-'}</TableCell>
                          <TableCell className="font-medium">{item.viralTitle}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => copyText(formatItem(item))}>复制</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">可用转化产品池</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {CONVERSION_PRODUCTS.slice(0, 12).map(product => (
              <Badge key={product.id} variant="secondary">{product.label}</Badge>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MiniAppContentLab;
