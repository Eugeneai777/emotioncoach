import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { shareCardsRegistry, type ShareCardRegistryItem } from '@/config/shareCardsRegistry';
import {
  checkCardConsistency,
  getConsistencyStats,
  getIssueTypeName,
  getSeverityColor,
  type CardConsistencyResult,
} from '@/utils/shareCardConsistencyCheck';

// 卡片组件名到文件路径的映射
const COMPONENT_PATHS: Record<string, string> = {
  SCL90ShareCard: 'src/components/scl90/SCL90ShareCard.tsx',
  EmotionHealthShareCard: 'src/components/emotion-health/EmotionHealthShareCard.tsx',
  FearAwakeningShareCard: 'src/components/wealth-block/FearAwakeningShareCard.tsx',
  AssessmentValueShareCard: 'src/components/wealth-block/AssessmentValueShareCard.tsx',
  TransformationValueShareCard: 'src/components/wealth-block/TransformationValueShareCard.tsx',
  AliveCheckShareCard: 'src/components/tools/AliveCheckShareCard.tsx',
  EmotionButtonShareCard: 'src/components/tools/EmotionButtonShareCard.tsx',
  ShareCard: 'src/components/community/ShareCard.tsx',
  BlockRevealShareCard: 'src/components/wealth-block/BlockRevealShareCard.tsx',
  AchievementShareCard: 'src/components/camp/AchievementShareCard.tsx',
  GraduationShareCard: 'src/components/camp/GraduationShareCard.tsx',
  WealthJournalShareCard: 'src/components/wealth-block/WealthJournalShareCard.tsx',
  // 新增路径映射
  PartnerPlanShareCard: 'src/components/partner/PartnerPlanShareCard.tsx',
  TeenInviteShareDialog: 'src/components/teen/TeenInviteShareDialog.tsx',
  PosterGenerator: 'src/pages/PosterCenter.tsx',
  EnergyDeclaration: 'src/components/energy/EnergyDeclaration.tsx',
  WeeklyTagReport: 'src/components/journal/WeeklyTagReport.tsx',
  CampShareDialog: 'src/components/camp/CampShareDialog.tsx',
  BriefingShareDialog: 'src/components/briefing/BriefingShareDialog.tsx',
  GratitudeJournalShareDialog: 'src/components/gratitude/GratitudeJournalShareDialog.tsx',
  EmotionButtonShareDialog: 'src/components/tools/EmotionButtonShareDialog.tsx',
  AliveCheckShareDialog: 'src/components/tools/AliveCheckShareDialog.tsx',
  WealthJournalShareDialog: 'src/components/wealth-camp/WealthJournalShareDialog.tsx',
};

export function ShareCardConsistencyPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CardConsistencyResult[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // 执行一致性检查
  const runConsistencyCheck = async () => {
    setIsChecking(true);
    
    // 模拟异步检查过程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const checkResults: CardConsistencyResult[] = [];
    
    // 检查所有注册的结果类卡片
    const resultCards = shareCardsRegistry.filter(item => item.type === 'result');
    
    for (const card of resultCards) {
      const componentName = card.componentName || card.id;
      const componentPath = COMPONENT_PATHS[componentName] || `unknown/${componentName}`;
      
      const result = checkCardConsistency(
        card.id,
        componentName,
        componentPath
      );
      
      checkResults.push(result);
    }
    
    setResults(checkResults);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  // 统计数据
  const stats = useMemo(() => getConsistencyStats(results), [results]);

  // 切换展开状态
  const toggleExpanded = (cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // 获取状态图标
  const getStatusIcon = (result: CardConsistencyResult) => {
    if (result.isCompliant) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (result.issues.some(i => i.severity === 'error')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-amber-600" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">一致性检查</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={runConsistencyCheck}
            disabled={isChecking}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? '检查中...' : '运行检查'}
          </Button>
        </div>
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            上次检查: {lastChecked.toLocaleString('zh-CN')}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 统计概览 */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>合规率</span>
              <span className="font-medium">{stats.complianceRate}%</span>
            </div>
            <Progress value={stats.complianceRate} className="h-2" />
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <div className="text-green-600 font-bold text-lg">{stats.compliant}</div>
                <div className="text-green-600/70">合规</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                <div className="text-amber-600 font-bold text-lg">{stats.withWarnings}</div>
                <div className="text-amber-600/70">警告</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-red-600 font-bold text-lg">{stats.withErrors}</div>
                <div className="text-red-600/70">错误</div>
              </div>
            </div>
          </div>
        )}

        {/* 检查结果列表 */}
        {results.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.map(result => (
              <Collapsible
                key={result.cardId}
                open={expandedCards.has(result.cardId)}
                onOpenChange={() => toggleExpanded(result.cardId)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      <div>
                        <p className="text-sm font-medium">{result.cardName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {result.componentPath}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.isCompliant ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          合规
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
                          {result.issues.length} 个问题
                        </Badge>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        expandedCards.has(result.cardId) ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  {result.issues.length > 0 ? (
                    <div className="pl-9 pr-2 pb-2 space-y-2">
                      {result.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-center gap-1 font-medium mb-1">
                            <Badge variant="outline" className="text-[10px] px-1">
                              {getIssueTypeName(issue.type)}
                            </Badge>
                            {issue.message}
                          </div>
                          {issue.suggestion && (
                            <p className="text-muted-foreground mt-1">
                              💡 {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-9 pr-2 pb-2">
                      <p className="text-xs text-green-600">✓ 所有检查项通过</p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">点击"运行检查"开始一致性检测</p>
            <p className="text-xs mt-1">将检查品牌标识、QR码、域名、宽度等规范</p>
          </div>
        )}

        {/* 规范说明 */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs font-medium mb-2">📋 统一规范</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 品牌标识: <code className="bg-muted px-1 rounded">Powered by 有劲AI</code></li>
            <li>• QR码生成: 使用 <code className="bg-muted px-1 rounded">useQRCode</code> hook</li>
            <li>• 域名获取: 使用 <code className="bg-muted px-1 rounded">getPromotionDomain()</code></li>
            <li>• 推荐宽度: 结果类 340px, 工具类 420px</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
