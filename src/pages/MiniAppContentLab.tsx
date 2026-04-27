import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clipboard, Download, FileText, Loader2, ShieldCheck, Sparkles, Table2, Wand2, Video } from 'lucide-react';
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
import { CONVERSION_PRODUCTS, VIDEO_AUDIENCES } from '@/config/videoScriptConfig';
import {
  MINI_APP_CANONICAL_GIFTS,
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
  route?: string;
  topicId?: string;
  productId?: string;
}

const countOptions = [10, 20, 30];

const localSeedItems = (sourceType: MiniAppSourceType): MiniAppSeedItem[] => {
  if (sourceType === 'mini-scenes') return MINI_APP_SCENE_SEEDS;
  if (sourceType === 'conversion') return MINI_APP_CONVERSION_SEEDS;
  if (sourceType === 'daily-tools') return MINI_APP_CANONICAL_GIFTS.filter(item => item.sourceType === 'daily-tools');
  return MINI_APP_CANONICAL_GIFTS.filter(item => item.sourceType === 'assessments');
};

const canonicalGiftNames = MINI_APP_CANONICAL_GIFTS.map(item => item.productName || item.label);
const canonicalGiftNameSet = new Set(canonicalGiftNames);

const findCanonicalGift = (item: ContentTopicItem, seed?: MiniAppSeedItem) => {
  const candidates = [item.giftProductName, seed?.productName, seed?.label, item.matchedTool].filter(Boolean) as string[];
  return MINI_APP_CANONICAL_GIFTS.find(gift => candidates.some(candidate => candidate.includes(gift.productName || gift.label)))
    || MINI_APP_CANONICAL_GIFTS.find(gift => gift.topicId === item.topicId || gift.productId === item.productId)
    || seed;
};

const getGiftProductName = (item: ContentTopicItem) => {
  const canonicalGift = findCanonicalGift(item);
  return canonicalGift?.productName || canonicalGift?.label || item.giftProductName || '';
};

const getGiftDisplayName = (item: ContentTopicItem) => {
  const productName = getGiftProductName(item);
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

const validateGiftItem = (item: ContentTopicItem, index: number): GiftValidationIssue | null => {
  const productName = getGiftProductName(item).trim();
  const giftDisplayName = getGiftDisplayName(item).trim();
  const expectedGiftDisplayName = productName ? `限时赠送「${productName}」` : '';
  const suggestedGift = findCanonicalGift(item);
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

const validateGiftItems = (items: ContentTopicItem[]): GiftValidationResult => {
  const issues = items.map(validateGiftItem).filter(Boolean) as GiftValidationIssue[];
  return { total: items.length, passed: items.length - issues.length, issues, checkedAt: Date.now() };
};

const repairGiftItems = (items: ContentTopicItem[]): ContentTopicItem[] => items.map((item) => {
  const canonicalGift = findCanonicalGift(item);
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

const formatItem = (item: ContentTopicItem) => [
  `痛点：${item.painPoint}`,
  `爆款标题：${item.viralTitle}`,
  `价值：${item.value}`,
  `产品/工具名：${getGiftProductName(item) || '-'}`,
  `限时赠品：${getGiftDisplayName(item)}`,
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
  const [giftValidation, setGiftValidation] = useState<GiftValidationResult | null>(null);

  const selectedAudience = useMemo(() => VIDEO_AUDIENCES.find(a => a.id === audienceId) || VIDEO_AUDIENCES[0], [audienceId]);
  const seedItems = useMemo(() => localSeedItems(sourceType), [sourceType]);
  const selectedSource = MINI_APP_SOURCE_OPTIONS.find(s => s.id === sourceType);
  const selectedStyle = MINI_APP_STYLE_OPTIONS.find(s => s.id === style);

  const normalizeItems = (rawItems: ContentTopicItem[]): ContentTopicItem[] => rawItems.map((item, index) => {
    const seed = seedItems.find(seedItem => seedItem.topicId === item.topicId || seedItem.productId === item.productId || seedItem.route === item.route) || seedItems[index % Math.max(seedItems.length, 1)];
    const canonicalGift = findCanonicalGift(item, seed);
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
          count: Number(count),
          seedItems,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.items)) throw new Error('AI返回数据格式异常');
      setItems(normalizeItems(data.items));
      setGiftValidation(null);
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

  const handleValidateGifts = () => {
    const result = validateGiftItems(items);
    setGiftValidation(result);
    if (result.issues.length === 0) {
      toast.success('全部通过：所有限时赠品均命中标准赠品池');
    } else {
      toast.error(`发现 ${result.issues.length} 条赠品异常，请检查标准名称`);
    }
  };

  const handleRepairGifts = () => {
    const repairedItems = repairGiftItems(items);
    setItems(repairedItems);
    const result = validateGiftItems(repairedItems);
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
    const header = ['痛点', '小红书爆款标题', '核心价值', '产品/工具名', '限时赠品', '专业报告名称', '报告价值', '下一步行动建议', '开场Hook', '私域CTA', '入口'];
    const rows = items.map(item => [item.painPoint, item.viralTitle, item.value, getGiftProductName(item), getGiftDisplayName(item), item.reportPageName || '', item.aiReportValue, item.actionPlanValue || item.coachReportValue || '', item.hook, item.cta, item.route || ''].map(csvEscape).join(','));
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
      ...items.map((item, index) => `## ${index + 1}. ${item.painPoint}\n\n- 痛点：${item.painPoint}\n- 小红书爆款标题：${item.viralTitle}\n- 核心价值：${item.value}\n- 产品/工具名：${getGiftProductName(item) || '-'}\n- 限时赠品：${getGiftDisplayName(item)}\n- 专业报告名称：${item.reportPageName || '-'}\n- 报告价值：${item.aiReportValue}\n- 下一步行动建议：${item.actionPlanValue || item.coachReportValue || '-'}\n- 开场 Hook：${item.hook}\n- CTA：${item.cta}\n- 入口：${item.route || '-'}\n`),
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
                当前将基于 <Badge variant="secondary">{selectedSource?.label}</Badge> 生成私域引流选题；赠品仅限现有 9.9/免费测评与工具：{canonicalGiftNames.slice(0, 4).join('、')}等，风格为 <Badge variant="secondary">{selectedStyle?.label}</Badge>
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
              <p>共 {giftValidation.total} 条，命中 {giftValidation.passed} 条，标准赠品池 {MINI_APP_CANONICAL_GIFTS.length} 个。</p>
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
                <Card key={item.id || index} className={`overflow-hidden ${issueMap.has(index) ? 'border-destructive/60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug">{item.viralTitle}</CardTitle>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline">{index + 1}</Badge>
                        {giftValidation && <Badge variant={issueMap.has(index) ? 'destructive' : 'secondary'}>{issueMap.has(index) ? '赠品异常' : '赠品已校验'}</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-2">
                      <p><span className="font-semibold text-foreground">痛点：</span><span className="text-muted-foreground">{item.painPoint}</span></p>
                      <p><span className="font-semibold text-foreground">价值：</span><span className="text-muted-foreground">{item.value}</span></p>
                      <p><span className="font-semibold text-foreground">产品/工具名：</span><span className="text-muted-foreground">{getGiftProductName(item) || '-'}</span></p>
                      <p><span className="font-semibold text-foreground">限时赠品：</span><span className="text-muted-foreground">{getGiftDisplayName(item)}</span></p>
                      <p><span className="font-semibold text-foreground">专业报告名称：</span><span className="text-muted-foreground">{item.reportPageName || '-'}</span></p>
                      <p><span className="font-semibold text-foreground">报告价值：</span><span className="text-muted-foreground">{item.aiReportValue}</span></p>
                      {(item.actionPlanValue || item.coachReportValue) && <p><span className="font-semibold text-foreground">下一步行动建议：</span><span className="text-muted-foreground">{item.actionPlanValue || item.coachReportValue}</span></p>}
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
                        <TableHead className="min-w-40">产品/工具名</TableHead>
                        <TableHead className="min-w-56">限时赠品</TableHead>
                        <TableHead className="min-w-28">赠品校验</TableHead>
                        <TableHead className="min-w-56">专业报告名称</TableHead>
                        <TableHead className="min-w-56">报告价值</TableHead>
                        <TableHead className="min-w-56">下一步行动建议</TableHead>
                        <TableHead className="min-w-56">小红书爆款标题</TableHead>
                        <TableHead className="min-w-28">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id || index} className={issueMap.has(index) ? 'bg-destructive/5' : undefined}>
                          <TableCell>{item.painPoint}</TableCell>
                          <TableCell>{item.value}</TableCell>
                          <TableCell>{getGiftProductName(item) || '-'}</TableCell>
                          <TableCell>{getGiftDisplayName(item)}</TableCell>
                          <TableCell>{giftValidation ? <Badge variant={issueMap.has(index) ? 'destructive' : 'secondary'}>{issueMap.has(index) ? '异常' : '通过'}</Badge> : '-'}</TableCell>
                          <TableCell>{item.reportPageName || '-'}</TableCell>
                          <TableCell>{item.aiReportValue}</TableCell>
                          <TableCell>{item.actionPlanValue || item.coachReportValue || '-'}</TableCell>
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
