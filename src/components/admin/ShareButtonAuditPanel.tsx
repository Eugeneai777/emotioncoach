/**
 * 分享按钮审计面板
 * 
 * 显示项目中所有分享功能的合规状态：
 * - 已注册并合规的卡片
 * - 已注册但未使用统一模块的卡片
 * - 未注册的分享功能（需手动审计）
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  FileSearch,
  Code,
  ExternalLink,
} from 'lucide-react';
import { shareCardsRegistry } from '@/config/shareCardsRegistry';

// 分享功能审计项
interface AuditItem {
  id: string;
  name: string;
  filePath: string;
  status: 'compliant' | 'partial' | 'legacy';
  registeredInRegistry: boolean;
  usesUnifiedModule: boolean;
  usesUnifiedQR: boolean;
  usesUnifiedDomain: boolean;
  notes?: string;
}

// 已知的分享功能列表（基于代码审计）
const KNOWN_SHARE_FEATURES: AuditItem[] = [
  // 完全合规
  {
    id: 'scl90',
    name: 'SCL90ShareDialog',
    filePath: 'src/components/scl90/SCL90ShareDialog.tsx',
    status: 'compliant',
    registeredInRegistry: true,
    usesUnifiedModule: true,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
  },
  {
    id: 'emotion-health',
    name: 'EmotionHealthShareDialog',
    filePath: 'src/components/emotion-health/EmotionHealthShareDialog.tsx',
    status: 'compliant',
    registeredInRegistry: true,
    usesUnifiedModule: true,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
  },
  {
    id: 'intro-share',
    name: 'IntroShareDialog (17个介绍页)',
    filePath: 'src/components/sharing/IntroShareDialog.tsx',
    status: 'compliant',
    registeredInRegistry: true,
    usesUnifiedModule: true,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
    notes: '覆盖所有 /intro/* 页面',
  },
  {
    id: 'wealth-camp-invite',
    name: 'WealthCampInviteCard',
    filePath: 'src/components/wealth-block/WealthCampInviteCard.tsx',
    status: 'compliant',
    registeredInRegistry: true,
    usesUnifiedModule: true,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
  },
  // 部分合规
  {
    id: 'partner-plan',
    name: 'PartnerPlanShareCard',
    filePath: 'src/components/partner/PartnerPlanShareCard.tsx',
    status: 'partial',
    registeredInRegistry: true,
    usesUnifiedModule: true,
    usesUnifiedQR: false,
    usesUnifiedDomain: false,
    notes: '刚注册，需验证 QR 和域名使用',
  },
  {
    id: 'community-post',
    name: 'PostDetailSheet (社区分享)',
    filePath: 'src/components/community/PostDetailSheet.tsx',
    status: 'partial',
    registeredInRegistry: true,
    usesUnifiedModule: false,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
    notes: '使用直接 html2canvas',
  },
  // 旧版实现
  {
    id: 'poster-center',
    name: 'PosterCenter / PosterGenerator',
    filePath: 'src/pages/PosterCenter.tsx',
    status: 'legacy',
    registeredInRegistry: true,
    usesUnifiedModule: false,
    usesUnifiedQR: false,
    usesUnifiedDomain: false,
    notes: '直接使用 html2canvas + 自定义逻辑',
  },
  {
    id: 'energy-declaration',
    name: 'EnergyDeclaration',
    filePath: 'src/components/energy/EnergyDeclaration.tsx',
    status: 'legacy',
    registeredInRegistry: true,
    usesUnifiedModule: false,
    usesUnifiedQR: false,
    usesUnifiedDomain: false,
    notes: '直接使用 html2canvas',
  },
  {
    id: 'weekly-tag-report',
    name: 'WeeklyTagReport',
    filePath: 'src/components/journal/WeeklyTagReport.tsx',
    status: 'legacy',
    registeredInRegistry: true,
    usesUnifiedModule: false,
    usesUnifiedQR: false,
    usesUnifiedDomain: false,
    notes: 'PDF导出，使用 html2canvas + jspdf',
  },
  {
    id: 'teen-invite',
    name: 'TeenInviteShareDialog',
    filePath: 'src/components/teen/TeenInviteShareDialog.tsx',
    status: 'partial',
    registeredInRegistry: true,
    usesUnifiedModule: false,
    usesUnifiedQR: true,
    usesUnifiedDomain: true,
    notes: '需验证是否使用统一分享模块',
  },
];

export function ShareButtonAuditPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  // 统计
  const stats = {
    total: KNOWN_SHARE_FEATURES.length,
    compliant: KNOWN_SHARE_FEATURES.filter(f => f.status === 'compliant').length,
    partial: KNOWN_SHARE_FEATURES.filter(f => f.status === 'partial').length,
    legacy: KNOWN_SHARE_FEATURES.filter(f => f.status === 'legacy').length,
    registeredCount: shareCardsRegistry.length,
  };

  const getStatusIcon = (status: AuditItem['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'legacy':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: AuditItem['status']) => {
    const config = {
      compliant: { label: '完全合规', className: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
      partial: { label: '部分合规', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' },
      legacy: { label: '旧版实现', className: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
    };
    return <Badge variant="outline" className={config[status].className}>{config[status].label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">分享功能审计</CardTitle>
          </div>
          <Badge variant="outline">
            {stats.registeredCount} 张已注册卡片
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <div className="text-green-600 font-bold text-lg">{stats.compliant}</div>
            <div className="text-green-600/70">完全合规</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            <div className="text-amber-600 font-bold text-lg">{stats.partial}</div>
            <div className="text-amber-600/70">部分合规</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <div className="text-red-600 font-bold text-lg">{stats.legacy}</div>
            <div className="text-red-600/70">旧版实现</div>
          </div>
        </div>

        {/* 审计列表 */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Code className="w-4 h-4 mr-2" />
              {isExpanded ? '收起详情' : '查看全部分享功能'}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <ScrollArea className="h-[300px] mt-3">
              <div className="space-y-2 pr-3">
                {KNOWN_SHARE_FEATURES.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.filePath}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    {/* 合规性指标 */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${item.registeredInRegistry ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                      >
                        {item.registeredInRegistry ? '✓' : '✗'} 已注册
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${item.usesUnifiedModule ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                      >
                        {item.usesUnifiedModule ? '✓' : '✗'} 统一模块
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${item.usesUnifiedQR ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                      >
                        {item.usesUnifiedQR ? '✓' : '✗'} useQRCode
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${item.usesUnifiedDomain ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                      >
                        {item.usesUnifiedDomain ? '✓' : '✗'} getPromotionDomain
                      </Badge>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* 合规标准说明 */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs font-medium mb-2">📋 合规检查项</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>已注册</strong>: 在 shareCardsRegistry.ts 中有记录</li>
            <li>• <strong>统一模块</strong>: 使用 executeOneClickShare 或 useOneClickShare</li>
            <li>• <strong>useQRCode</strong>: 使用统一 QR 码生成 hook</li>
            <li>• <strong>getPromotionDomain</strong>: 使用统一域名获取函数</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
