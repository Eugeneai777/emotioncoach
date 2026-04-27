import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clipboard, Download, FileText, Hash, Images, Loader2, MessageCircle, ShieldCheck, Sparkles, Table2, Wand2, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_AUDIENCES } from '@/config/videoScriptConfig';
import {
  MINI_APP_CONTENT_FORMAT_OPTIONS,
  MINI_APP_CONVERSION_SEEDS,
  MINI_APP_SCENE_SEEDS,
  MINI_APP_SOURCE_OPTIONS,
  MINI_APP_STYLE_OPTIONS,
  MiniAppContentFormat,
  MiniAppContentStyle,
  MiniAppSeedItem,
  MiniAppSourceType,
} from '@/config/miniAppContentMap';
import { MarketingPoolEditor } from '@/components/marketing/MarketingPoolEditor';
import { MarketingGift, useMarketingGifts, useMarketingPoolAdminStatus, useMarketingProducts } from '@/hooks/useMarketingPools';

interface ContentTopicItem {
  id: string;
  painPoint: string;
  value: string;
  giftProductName?: string;
  giftDisplayName?: string;
  rawGiftProductName?: string;
  rawGiftDisplayName?: string;
  reportPageName?: string;
  matchedTool: string;
  aiReportValue: string;
  actionPlanValue?: string;
  coachReportValue?: string;
  viralTitle: string;
  hook: string;
  cta: string;
  xhsCoverTitle?: string;
  xhsBody?: string;
  xhsSections?: string[];
  xhsCarouselPages?: string[];
  xhsTags?: string[];
  xhsCommentGuide?: string;
  route?: string;
  topicId?: string;
  productId?: string;
}

const countOptions = [10, 20, 30];

const localSeedItems = (sourceType: MiniAppSourceType, canonicalGifts: MiniAppSeedItem[]): MiniAppSeedItem[] => {
  if (sourceType === 'mini-scenes') return MINI_APP_SCENE_SEEDS;
  if (sourceType === 'conversion') return MINI_APP_CONVERSION_SEEDS;
  if (sourceType === 'daily-tools') return canonicalGifts.filter(item => item.sourceType === 'daily-tools');
  return canonicalGifts.filter(item => item.sourceType === 'assessments');
};

const findCanonicalGift = (item: ContentTopicItem, canonicalGifts: MiniAppSeedItem[], seed?: MiniAppSeedItem) => {
  const candidates = [item.giftProductName, seed?.productName, seed?.label, item.matchedTool].filter(Boolean) as string[];
  return canonicalGifts.find(gift => candidates.some(candidate => candidate.includes(gift.productName || gift.label)))
    || canonicalGifts.find(gift => gift.topicId === item.topicId || gift.productId === item.productId)
    || seed;
};

const getGiftProductName = (item: ContentTopicItem, canonicalGifts: MiniAppSeedItem[]) => {
  const canonicalGift = findCanonicalGift(item, canonicalGifts);
  return canonicalGift?.productName || canonicalGift?.label || item.giftProductName || '';
};

const getGiftDisplayName = (item: ContentTopicItem, canonicalGifts: MiniAppSeedItem[]) => {
  const productName = getGiftProductName(item, canonicalGifts);
  return productName ? `限时赠送「${productName}」` : (item.giftDisplayName || item.matchedTool || '-');
};

interface GiftValidationIssue {
  index: number;
  productName: string;
  giftDisplayName: string;
  reason: string;
  suggestedProductName?: string;
  suggestedGiftDisplayName?: string;
}

interface GiftValidationResult {
  total: number;
  passed: number;
  issues: GiftValidationIssue[];
  checkedAt: number;
}

const validateGiftItem = (item: ContentTopicItem, index: number, canonicalGifts: MiniAppSeedItem[], canonicalGiftNameSet: Set<string>): GiftValidationIssue | null => {
  const productName = getGiftProductName(item, canonicalGifts).trim();
  const giftDisplayName = getGiftDisplayName(item, canonicalGifts).trim();
  const expectedGiftDisplayName = productName ? `限时赠送「${productName}」` : '';
  const suggestedGift = findCanonicalGift(item, canonicalGifts);
  const suggestedProductName = suggestedGift?.productName || suggestedGift?.label;
  const suggestedGiftDisplayName = suggestedGift?.giftDisplayName || (suggestedProductName ? `限时赠送「${suggestedProductName}」` : undefined);

  if (!canonicalGiftNameSet.has(productName)) {
    return {
      index,
      productName: productName || '未填写',
      giftDisplayName: giftDisplayName || '未填写',
      reason: '产品/工具名未严格命中标准赠品池',
      suggestedProductName,
      suggestedGiftDisplayName,
    };
  }

  if (giftDisplayName !== expectedGiftDisplayName) {
    return {
      index,
      productName,
      giftDisplayName: giftDisplayName || '未填写',
      reason: `限时赠品必须严格写成 ${expectedGiftDisplayName}`,
      suggestedProductName: productName,
      suggestedGiftDisplayName: expectedGiftDisplayName,
    };
  }

  return null;
};

const validateGiftItems = (items: ContentTopicItem[], canonicalGifts: MiniAppSeedItem[], canonicalGiftNameSet: Set<string>): GiftValidationResult => {
  const issues = items.map((item, index) => validateGiftItem(item, index, canonicalGifts, canonicalGiftNameSet)).filter(Boolean) as GiftValidationIssue[];
  return { total: items.length, passed: items.length - issues.length, issues, checkedAt: Date.now() };
};

const repairGiftItems = (items: ContentTopicItem[], canonicalGifts: MiniAppSeedItem[]): ContentTopicItem[] => items.map((item) => {
  const canonicalGift = findCanonicalGift(item, canonicalGifts);
  const productName = canonicalGift?.productName || canonicalGift?.label || item.giftProductName || '';
  const giftDisplayName = canonicalGift?.giftDisplayName || (productName ? `限时赠送「${productName}」` : item.giftDisplayName);
  return {
    ...item,
    giftProductName: productName,
    giftDisplayName,
    rawGiftProductName: productName,
    rawGiftDisplayName: giftDisplayName,
  };
});

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

const formatItem = (item: ContentTopicItem, canonicalGifts: MiniAppSeedItem[]) => [
  `痛点：${item.painPoint}`,
  `爆款标题：${item.viralTitle}`,
  `价值：${item.value}`,
  `产品/工具名：${getGiftProductName(item, canonicalGifts) || '-'}`,
  `限时赠品：${getGiftDisplayName(item, canonicalGifts)}`,
  `专业报告名称：${item.reportPageName || '-'}`,
  `报告价值：${item.aiReportValue}`,
  item.actionPlanValue || item.coachReportValue ? `下一步行动建议：${item.actionPlanValue || item.coachReportValue}` : '',
  `开场：${item.hook}`,
  `行动：${item.cta}`,
  item.route ? `入口：${item.route}` : '',
].filter(Boolean).join('\n');

const formatXhsArticle = (item: ContentTopicItem, canonicalGifts: MiniAppSeedItem[]) => [
  `封面标题：${item.xhsCoverTitle || item.viralTitle}`,
  `爆款标题：${item.viralTitle}`,
  '',
  item.xhsBody || [item.hook, item.value, getGiftDisplayName(item, canonicalGifts), item.cta].filter(Boolean).join('\n\n'),
  '',
  item.xhsCarouselPages?.length ? `卡片页建议：\n${item.xhsCarouselPages.map((page, index) => `${index + 1}. ${page}`).join('\n')}` : '',
  item.xhsTags?.length ? `标签：${item.xhsTags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')}` : '',
  item.xhsCommentGuide ? `评论/私信引导：${item.xhsCommentGuide}` : '',
  `限时赠品：${getGiftDisplayName(item, canonicalGifts)}`,
].filter(Boolean).join('\n');

const MiniAppContentLab: React.FC = () => {
  const navigate = useNavigate();
  const [audienceId, setAudienceId] = useState('general');
  const [sourceType, setSourceType] = useState<MiniAppSourceType>('mini-scenes');
  const [style, setStyle] = useState<MiniAppContentStyle>('xiaohongshu');
  const [contentFormat, setContentFormat] = useState<MiniAppContentFormat>('video');
  const [count, setCount] = useState('20');
  const [items, setItems] = useState<ContentTopicItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [giftValidation, setGiftValidation] = useState<GiftValidationResult | null>(null);
  const { products, refetch: refetchProducts } = useMarketingProducts();
  const { gifts, refetch: refetchGifts } = useMarketingGifts();
  const { isAdmin } = useMarketingPoolAdminStatus();

  const selectedAudience = useMemo(() => VIDEO_AUDIENCES.find(a => a.id === audienceId) || VIDEO_AUDIENCES[0], [audienceId]);
  const canonicalGifts = useMemo<MiniAppSeedItem[]>(() => gifts, [gifts]);
  const canonicalGiftNames = useMemo(() => canonicalGifts.map(item => item.productName || item.label), [canonicalGifts]);
  const canonicalGiftNameSet = useMemo(() => new Set(canonicalGiftNames), [canonicalGiftNames]);
  const seedItems = useMemo(() => localSeedItems(sourceType, canonicalGifts), [sourceType, canonicalGifts]);
  const selectedSource = MINI_APP_SOURCE_OPTIONS.find(s => s.id === sourceType);
  const selectedStyle = MINI_APP_STYLE_OPTIONS.find(s => s.id === style);
  const selectedContentFormat = MINI_APP_CONTENT_FORMAT_OPTIONS.find(s => s.id === contentFormat);
  const previewItem = items[Math.min(previewIndex, Math.max(items.length - 1, 0))];

  const normalizeItems = (rawItems: ContentTopicItem[]): ContentTopicItem[] => rawItems.map((item, index) => {
    const seed = seedItems.find(seedItem => seedItem.topicId === item.topicId || seedItem.productId === item.productId || seedItem.route === item.route) || seedItems[index % Math.max(seedItems.length, 1)];
    const canonicalGift = findCanonicalGift(item, canonicalGifts, seed);
    const productName = canonicalGift?.productName || canonicalGift?.label || '';
    return {
      ...item,
      rawGiftProductName: item.giftProductName || item.rawGiftProductName,
      rawGiftDisplayName: item.giftDisplayName || item.rawGiftDisplayName,
      giftProductName: productName,
      giftDisplayName: canonicalGift?.giftDisplayName || (productName ? `限时赠送「${productName}」` : item.matchedTool),
      reportPageName: item.reportPageName || canonicalGift?.reportName || (productName ? `${productName.replace(/测评|工具|按钮|练习/g, '')}主题洞察报告` : ''),
      actionPlanValue: item.actionPlanValue || item.coachReportValue,
    };
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mini-app-content-ai', {
        body: {
          audience: selectedAudience.label,
          sourceType,
          style,
          contentFormat,
          count: Number(count),
          seedItems,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.items)) throw new Error('AI返回数据格式异常');
      setItems(normalizeItems(data.items));
      setPreviewIndex(0);
      setGiftValidation(null);
      toast.success(`已生成 ${data.items.length} 条${contentFormat === 'xhs-article' ? '小红书图文稿' : '短视频选题'}`);
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

  const handleValidateGifts = () => {
    const result = validateGiftItems(items, canonicalGifts, canonicalGiftNameSet);
    setGiftValidation(result);
    if (result.issues.length === 0) {
      toast.success('全部通过：所有限时赠品均命中标准赠品池');
    } else {
      toast.error(`发现 ${result.issues.length} 条赠品异常，请检查标准名称`);
    }
  };

  const handleRepairGifts = () => {
    const repairedItems = repairGiftItems(items, canonicalGifts);
    setItems(repairedItems);
    const result = validateGiftItems(repairedItems, canonicalGifts, canonicalGiftNameSet);
    setGiftValidation(result);
    toast.success('已按标准赠品池修正赠品名称');
  };

  const issueMap = useMemo(() => {
    const map = new Map<number, GiftValidationIssue>();
    giftValidation?.issues.forEach(issue => map.set(issue.index, issue));
    return map;
  }, [giftValidation]);

  const exportCsv = () => {
    if (!items.length) return;
    const isXhs = contentFormat === 'xhs-article';
    const header = isXhs
      ? ['痛点', '封面标题', '小红书爆款标题', '图文正文', '卡片页建议', '标签', '评论/私信引导', '产品/工具名', '限时赠品', '入口']
      : ['痛点', '小红书爆款标题', '核心价值', '产品/工具名', '限时赠品', '专业报告名称', '报告价值', '下一步行动建议', '开场Hook', '私域CTA', '入口'];
    const rows = items.map(item => (isXhs
      ? [item.painPoint, item.xhsCoverTitle || item.viralTitle, item.viralTitle, item.xhsBody || '', item.xhsCarouselPages?.join('\n') || '', item.xhsTags?.map(tag => `#${tag.replace(/^#/, '')}`).join(' ') || '', item.xhsCommentGuide || '', getGiftProductName(item, canonicalGifts), getGiftDisplayName(item, canonicalGifts), item.route || '']
      : [item.painPoint, item.viralTitle, item.value, getGiftProductName(item, canonicalGifts), getGiftDisplayName(item, canonicalGifts), item.reportPageName || '', item.aiReportValue, item.actionPlanValue || item.coachReportValue || '', item.hook, item.cta, item.route || '']
    ).map(csvEscape).join(','));
    downloadBlob(`\ufeff${header.map(csvEscape).join(',')}\n${rows.join('\n')}`, `mini-app${isXhs ? '小红书图文稿' : '短视频选题库'}_${Date.now()}.csv`, 'text/csv;charset=utf-8');
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
      `- 产出类型：${selectedContentFormat?.label}`,
      '',
      ...items.map((item, index) => contentFormat === 'xhs-article'
        ? `## ${index + 1}. ${item.xhsCoverTitle || item.viralTitle}\n\n${formatXhsArticle(item, canonicalGifts)}\n`
        : `## ${index + 1}. ${item.painPoint}\n\n- 痛点：${item.painPoint}\n- 小红书爆款标题：${item.viralTitle}\n- 核心价值：${item.value}\n- 产品/工具名：${getGiftProductName(item, canonicalGifts) || '-'}\n- 限时赠品：${getGiftDisplayName(item, canonicalGifts)}\n- 专业报告名称：${item.reportPageName || '-'}\n- 报告价值：${item.aiReportValue}\n- 下一步行动建议：${item.actionPlanValue || item.coachReportValue || '-'}\n- 开场 Hook：${item.hook}\n- CTA：${item.cta}\n- 入口：${item.route || '-'}\n`),
    ].join('\n');
    downloadBlob(md, `mini-app${contentFormat === 'xhs-article' ? '小红书图文稿' : '短视频选题库'}_${Date.now()}.md`, 'text/markdown;charset=utf-8');
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
    <div className="relative min-h-screen overflow-hidden bg-background pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_85%_16%,hsl(var(--accent)/0.22),transparent_28%),linear-gradient(180deg,hsl(var(--secondary)/0.48),hsl(var(--background))_42%)]" />
      <div className="sticky top-0 z-20 border-b border-primary/10 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 via-accent/20 to-secondary text-primary shadow-sm ring-1 ring-primary/15">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold leading-tight">短视频选题工作台</h1>
              <Badge className="bg-primary/12 text-primary hover:bg-primary/12">彩色营销版</Badge>
            </div>
            <p className="text-xs text-muted-foreground">用限时赠送引导加企微/进私域 · 产品池与赠品池全站同步</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <Card className="overflow-hidden border-primary/15 bg-card/90 shadow-lg shadow-primary/5 backdrop-blur">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span>
                生成配置
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">私域引流</Badge>
                <Badge variant="outline" className="border-accent/30 bg-accent/10">9.9 / 免费赠品</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
              <Label>目标人群</Label>
              <Select value={audienceId} onValueChange={setAudienceId} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIDEO_AUDIENCES.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-accent/20 bg-accent/10 p-3">
              <Label>内容来源</Label>
              <Select value={sourceType} onValueChange={v => setSourceType(v as MiniAppSourceType)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MINI_APP_SOURCE_OPTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-secondary bg-secondary/45 p-3">
              <Label>内容风格</Label>
              <Select value={style} onValueChange={v => setStyle(v as MiniAppContentStyle)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MINI_APP_STYLE_OPTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/10 p-3">
              <Label>产出类型</Label>
              <Select value={contentFormat} onValueChange={v => setContentFormat(v as MiniAppContentFormat)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MINI_APP_CONTENT_FORMAT_OPTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-primary/10 bg-card p-3 shadow-sm">
              <Label>生成数量</Label>
              <Select value={count} onValueChange={setCount} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countOptions.map(n => <SelectItem key={n} value={String(n)}>{n} 条</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                当前将基于 <Badge variant="secondary">{selectedSource?.label}</Badge> 生成 <Badge variant="secondary">{selectedContentFormat?.label}</Badge>；赠品仅限现有 9.9/免费测评与工具：{canonicalGiftNames.slice(0, 4).join('、')}等，风格为 <Badge variant="secondary">{selectedStyle?.label}</Badge>
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20 sm:min-w-40">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {contentFormat === 'xhs-article' ? '生成图文稿' : '生成选题库'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">已生成 {items.length} 条{contentFormat === 'xhs-article' ? '小红书图文稿' : '选题'}，可直接复制或导出排期。</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleValidateGifts}><ShieldCheck className="mr-2 h-4 w-4" />一键校验赠品</Button>
              <Button variant="outline" size="sm" onClick={exportCsv}><Table2 className="mr-2 h-4 w-4" />导出 CSV</Button>
              <Button variant="outline" size="sm" onClick={exportMarkdown}><FileText className="mr-2 h-4 w-4" />导出 MD</Button>
            </div>
          </div>
        )}

        {giftValidation && (
          <Alert variant={giftValidation.issues.length ? 'destructive' : 'default'} className={giftValidation.issues.length ? '' : 'border-primary/30 bg-primary/5'}>
            {giftValidation.issues.length ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>{giftValidation.issues.length ? `发现 ${giftValidation.issues.length} 条赠品异常` : '赠品校验全部通过'}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>共 {giftValidation.total} 条，命中 {giftValidation.passed} 条，标准赠品池 {canonicalGifts.length} 个。</p>
              {giftValidation.issues.length > 0 && (
                <>
                  <div className="grid gap-2">
                    {giftValidation.issues.map(issue => (
                      <div key={issue.index} className="rounded-md border bg-background/60 p-3 text-xs">
                        <div className="font-semibold">第 {issue.index + 1} 条：{issue.reason}</div>
                        <div className="mt-1 text-muted-foreground">当前产品/工具名：{issue.productName}</div>
                        <div className="text-muted-foreground">当前限时赠品：{issue.giftDisplayName}</div>
                        {issue.suggestedGiftDisplayName && <div className="mt-1 text-foreground">建议：{issue.suggestedGiftDisplayName}</div>}
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleRepairGifts}>一键按标准池修正</Button>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {items.length === 0 ? (
          <Card className="border-dashed border-primary/25 bg-card/75 backdrop-blur">
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary shadow-sm">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold">选择配置后生成第一批选题</p>
                <p className="mt-1 text-sm text-muted-foreground">每条都会写清楚用户能免费领到什么、AI报告能看见什么、为什么值得加企微领取。</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={contentFormat === 'xhs-article' ? 'preview' : 'cards'} className="space-y-4">
            <TabsList>
              {contentFormat === 'xhs-article' && <TabsTrigger value="preview">成稿预览</TabsTrigger>}
              <TabsTrigger value="cards">卡片视图</TabsTrigger>
              <TabsTrigger value="table">表格视图</TabsTrigger>
            </TabsList>
            {contentFormat === 'xhs-article' && previewItem && (
              <TabsContent value="preview">
                <Card className="overflow-hidden border-primary/15 bg-card/90 shadow-lg shadow-primary/5 backdrop-blur">
                  <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <CardTitle className="text-base">小红书实时排版预览</CardTitle>
                        <p className="text-sm text-muted-foreground">切换任意一条结果，查看发布前的完整成稿版式。</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {items.map((item, index) => (
                          <Button
                            key={item.id || index}
                            variant={previewIndex === index ? 'default' : 'outline'}
                            size="sm"
                            className={previewIndex === index ? 'bg-primary text-primary-foreground' : 'bg-background/70'}
                            onClick={() => setPreviewIndex(index)}
                          >
                            #{index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                    <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/60 shadow-sm">
                      <div className="flex min-h-[360px] flex-col justify-between p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-2 text-xs text-primary">
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">封面标题</Badge>
                          <span>#{previewIndex + 1}</span>
                        </div>
                        <h2 className="py-8 text-3xl font-black leading-tight text-foreground sm:text-4xl">
                          {previewItem.xhsCoverTitle || previewItem.viralTitle}
                        </h2>
                        <div className="rounded-xl border border-background/70 bg-background/75 p-3 text-sm text-foreground shadow-sm">
                          <span className="font-semibold text-primary">限时赠品：</span>{getGiftDisplayName(previewItem, canonicalGifts)}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm">
                      <div className="rounded-xl bg-secondary/45 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><FileText className="h-4 w-4 text-primary" />正文</div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{previewItem.xhsBody || [previewItem.hook, previewItem.value, previewItem.cta].filter(Boolean).join('\n\n')}</p>
                      </div>
                      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Images className="h-4 w-4 text-primary" />卡片页</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(previewItem.xhsCarouselPages?.length ? previewItem.xhsCarouselPages : ['封面：强化痛点与结果感', `共鸣：${previewItem.painPoint}`, `方法：${previewItem.value}`, `领取：${getGiftDisplayName(previewItem, canonicalGifts)}`]).map((page, pageIndex) => (
                            <div key={pageIndex} className="rounded-lg border border-background/80 bg-card/80 p-3 text-sm shadow-sm">
                              <Badge variant="secondary" className="mb-2">第{pageIndex + 1}页</Badge>
                              <p className="leading-relaxed text-foreground">{page}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-accent/25 bg-accent/10 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Hash className="h-4 w-4 text-primary" />标签</div>
                        <div className="flex flex-wrap gap-2">
                          {(previewItem.xhsTags?.length ? previewItem.xhsTags : ['自我成长', '情绪管理', '有劲AI']).map(tag => <Badge key={tag} variant="secondary">#{tag.replace(/^#/, '')}</Badge>)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><MessageCircle className="h-4 w-4 text-primary" />私信引导</div>
                        <p className="text-sm leading-relaxed text-foreground">{previewItem.xhsCommentGuide || previewItem.cta}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <Button size="sm" onClick={() => copyText(formatXhsArticle(previewItem, canonicalGifts), '预览成稿已复制')}><Clipboard className="mr-2 h-4 w-4" />复制成稿</Button>
                        <Button variant="outline" size="sm" onClick={() => copyText(previewItem.xhsCoverTitle || previewItem.viralTitle, '封面标题已复制')}>复制封面标题</Button>
                        {!!previewItem.xhsTags?.length && <Button variant="outline" size="sm" onClick={() => copyText(previewItem.xhsTags!.map(tag => `#${tag.replace(/^#/, '')}`).join(' '), '标签已复制')}>复制标签</Button>}
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            <TabsContent value="cards" className="grid gap-3 md:grid-cols-2">
              {items.map((item, index) => (
                <Card key={item.id || index} className={`overflow-hidden bg-card/90 shadow-sm transition-shadow hover:shadow-md ${issueMap.has(index) ? 'border-destructive/60' : 'border-primary/10'}`}>
                  <div className={`h-1 ${issueMap.has(index) ? 'bg-destructive' : 'bg-gradient-to-r from-primary via-accent to-secondary'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug text-foreground">{item.painPoint}</CardTitle>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">#{index + 1}</Badge>
                        {giftValidation && <Badge variant={issueMap.has(index) ? 'destructive' : 'secondary'}>{issueMap.has(index) ? '赠品异常' : '赠品已校验'}</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-2.5">
                      <div className="rounded-lg bg-secondary/45 p-3"><span className="font-semibold text-foreground">爆款标题：</span><span className="text-foreground">{item.viralTitle}</span></div>
                      {contentFormat === 'xhs-article' && (
                        <div className="space-y-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/50 p-3">
                          <div><span className="font-semibold text-primary">封面标题：</span><span className="text-foreground">{item.xhsCoverTitle || item.viralTitle}</span></div>
                          {item.xhsBody && <p className="whitespace-pre-wrap leading-relaxed text-foreground">{item.xhsBody}</p>}
                          {!!item.xhsCarouselPages?.length && <div className="grid gap-1.5 text-xs text-muted-foreground">{item.xhsCarouselPages.map((page, pageIndex) => <div key={pageIndex} className="rounded-md bg-background/65 px-2 py-1.5">第{pageIndex + 1}页：{page}</div>)}</div>}
                          {!!item.xhsTags?.length && <div className="flex flex-wrap gap-1.5">{item.xhsTags.map(tag => <Badge key={tag} variant="secondary">#{tag.replace(/^#/, '')}</Badge>)}</div>}
                          {item.xhsCommentGuide && <div className="rounded-lg border border-accent/25 bg-accent/10 p-2 text-xs text-foreground">评论/私信引导：{item.xhsCommentGuide}</div>}
                        </div>
                      )}
                      <p><span className="font-semibold text-primary">痛点：</span><span className="text-muted-foreground">{item.painPoint}</span></p>
                      <p><span className="font-semibold text-primary">价值：</span><span className="text-muted-foreground">{item.value}</span></p>
                      <p><span className="font-semibold text-foreground">产品/工具名：</span><span className="text-muted-foreground">{getGiftProductName(item, canonicalGifts) || '-'}</span></p>
                      <div className="rounded-lg border border-accent/25 bg-accent/10 p-3"><span className="font-semibold text-foreground">限时赠品：</span><span className="text-foreground">{getGiftDisplayName(item, canonicalGifts)}</span></div>
                      <p><span className="font-semibold text-foreground">专业报告名称：</span><span className="text-muted-foreground">{item.reportPageName || '-'}</span></p>
                      <p><span className="font-semibold text-foreground">报告价值：</span><span className="text-muted-foreground">{item.aiReportValue}</span></p>
                      {(item.actionPlanValue || item.coachReportValue) && <p><span className="font-semibold text-foreground">下一步行动建议：</span><span className="text-muted-foreground">{item.actionPlanValue || item.coachReportValue}</span></p>}
                      <p><span className="font-semibold text-foreground">Hook：</span><span className="text-muted-foreground">{item.hook}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      <Button variant="secondary" size="sm" onClick={() => copyText(formatItem(item, canonicalGifts), '整条选题已复制')}><Clipboard className="mr-2 h-4 w-4" />复制整条</Button>
                      {contentFormat === 'xhs-article' && <Button variant="secondary" size="sm" onClick={() => copyText(formatXhsArticle(item, canonicalGifts), '整篇图文稿已复制')}><FileText className="mr-2 h-4 w-4" />复制图文稿</Button>}
                      <Button variant="outline" size="sm" onClick={() => copyText(item.viralTitle, '标题已复制')}><Download className="mr-2 h-4 w-4" />复制标题</Button>
                      {contentFormat === 'xhs-article' && !!item.xhsTags?.length && <Button variant="outline" size="sm" onClick={() => copyText(item.xhsTags!.map(tag => `#${tag.replace(/^#/, '')}`).join(' '), '标签已复制')}>复制标签</Button>}
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
                        <TableHead className="min-w-56">小红书爆款标题</TableHead>
                        {contentFormat === 'xhs-article' && <TableHead className="min-w-56">图文稿</TableHead>}
                        {contentFormat === 'xhs-article' && <TableHead className="min-w-48">标签</TableHead>}
                        <TableHead className="min-w-48">核心价值</TableHead>
                        <TableHead className="min-w-40">产品/工具名</TableHead>
                        <TableHead className="min-w-56">限时赠品</TableHead>
                        <TableHead className="min-w-28">赠品校验</TableHead>
                        <TableHead className="min-w-56">专业报告名称</TableHead>
                        <TableHead className="min-w-56">报告价值</TableHead>
                        <TableHead className="min-w-56">下一步行动建议</TableHead>
                        <TableHead className="min-w-28">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id || index} className={issueMap.has(index) ? 'bg-destructive/5' : undefined}>
                          <TableCell>{item.painPoint}</TableCell>
                          <TableCell className="font-medium">{item.viralTitle}</TableCell>
                          {contentFormat === 'xhs-article' && <TableCell className="max-w-md whitespace-pre-wrap">{item.xhsBody || '-'}</TableCell>}
                          {contentFormat === 'xhs-article' && <TableCell>{item.xhsTags?.map(tag => `#${tag.replace(/^#/, '')}`).join(' ') || '-'}</TableCell>}
                          <TableCell>{item.value}</TableCell>
                          <TableCell>{getGiftProductName(item, canonicalGifts) || '-'}</TableCell>
                          <TableCell>{getGiftDisplayName(item, canonicalGifts)}</TableCell>
                          <TableCell>{giftValidation ? <Badge variant={issueMap.has(index) ? 'destructive' : 'secondary'}>{issueMap.has(index) ? '异常' : '通过'}</Badge> : '-'}</TableCell>
                          <TableCell>{item.reportPageName || '-'}</TableCell>
                          <TableCell>{item.aiReportValue}</TableCell>
                          <TableCell>{item.actionPlanValue || item.coachReportValue || '-'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => copyText(contentFormat === 'xhs-article' ? formatXhsArticle(item, canonicalGifts) : formatItem(item, canonicalGifts))}>复制</Button>
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

        <Card className="overflow-hidden border-primary/15 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-primary to-accent" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">可用转化产品池</CardTitle>
              {isAdmin && <MarketingPoolEditor type="product" products={products} onSaved={() => refetchProducts()} />}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {products.slice(0, 12).map(product => (
              <Badge key={product.id} className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">{product.label}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-accent/20 bg-card/85 shadow-sm backdrop-blur">
          <div className="h-1 bg-gradient-to-r from-accent to-secondary" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">标准赠品池</CardTitle>
              {isAdmin && <MarketingPoolEditor type="gift" gifts={gifts as MarketingGift[]} onSaved={() => refetchGifts()} />}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canonicalGifts.map(gift => (
              <Badge key={gift.id} className="border border-accent/25 bg-accent/10 text-foreground hover:bg-accent/15">{gift.productName || gift.label}</Badge>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MiniAppContentLab;
