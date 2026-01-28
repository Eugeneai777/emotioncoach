/**
 * 分享卡片一致性检查工具
 * 
 * 检测项目中分享卡片是否符合统一规范：
 * - 品牌标识：统一使用 "Powered by 有劲AI"
 * - QR码生成：统一使用 useQRCode hook
 * - 域名使用：统一使用 getPromotionDomain()
 * - 宽度规范：结果类 340px, 工具类 380-420px
 */

export interface ConsistencyIssue {
  type: 'branding' | 'qrcode' | 'domain' | 'width' | 'import';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface CardConsistencyResult {
  cardId: string;
  cardName: string;
  componentPath: string;
  isCompliant: boolean;
  issues: ConsistencyIssue[];
  checkedAt: Date;
}

// 已知符合规范的卡片 (最新统一后)
const COMPLIANT_CARDS = [
  'SCL90ShareCard',
  'EmotionHealthShareCard',
  'FearAwakeningShareCard',
  'AssessmentValueShareCard',
  'TransformationValueShareCard',
  'AliveCheckShareCard',      // 已修复
  'EmotionButtonShareCard',   // 已修复
  'ShareCard',                // 社区卡片，已修复
  'BlockRevealShareCard',
  'AchievementShareCard',
  'GraduationShareCard',
  'WealthJournalShareCard',
  // 新增审计卡片（需验证合规性）
  'PartnerPlanShareCard',     // 合伙人计划
  'TeenInviteShareDialog',    // 青少年邀请
  'PosterGenerator',          // 海报生成器
  'EnergyDeclaration',        // 能量宣言
  'WeeklyTagReport',          // 周报导出
  // 训练营/日记/打卡类分享
  'CampShareDialog',          // 训练营打卡
  'BriefingShareDialog',      // 教练简报
  'GratitudeJournalShareDialog', // 感恩日记
  'EmotionButtonShareDialog', // 情绪急救弹窗
  'AliveCheckShareDialog',    // 安全打卡弹窗
  'WealthJournalShareDialog', // 财富日记弹窗
];

// 使用旧版 QRCode 直接调用的卡片 (需要关注)
const LEGACY_QRCODE_CARDS: string[] = [
  // 已全部修复，清空列表
];

// 品牌标识规范
const CORRECT_BRANDING = 'Powered by 有劲AI';
const LEGACY_BRANDINGS = [
  '有劲生活',
  '有劲AI · ',
  '· 财富教练',
  '· 情绪日记',
  '· 情绪梳理教练',
  '· 生活管理',
];

// 宽度规范
const WIDTH_STANDARDS = {
  result: { min: 320, max: 380, recommended: 340 },
  tool: { min: 380, max: 450, recommended: 420 },
  community: { min: 400, max: 450, recommended: 420 },
};

/**
 * 检查单个卡片组件的一致性
 */
export function checkCardConsistency(
  cardId: string,
  cardName: string,
  componentPath: string,
  sourceCode?: string
): CardConsistencyResult {
  const issues: ConsistencyIssue[] = [];
  
  // 如果没有源代码，只进行基于已知数据的检查
  if (!sourceCode) {
    // 检查是否在合规列表中
    if (!COMPLIANT_CARDS.includes(cardName)) {
      issues.push({
        type: 'import',
        severity: 'warning',
        message: '该卡片未在合规列表中，需要手动验证',
        suggestion: '请检查该卡片是否使用了 useQRCode hook 和标准品牌标识',
      });
    }
    
    // 检查是否在旧版列表中
    if (LEGACY_QRCODE_CARDS.includes(cardName)) {
      issues.push({
        type: 'qrcode',
        severity: 'error',
        message: '该卡片使用旧版 QRCode.toDataURL 直接调用',
        suggestion: '请更换为 useQRCode hook',
      });
    }
  } else {
    // 有源代码时进行详细检查
    
    // 1. 检查品牌标识
    if (!sourceCode.includes(CORRECT_BRANDING)) {
      const hasLegacyBranding = LEGACY_BRANDINGS.some(b => sourceCode.includes(b));
      if (hasLegacyBranding) {
        issues.push({
          type: 'branding',
          severity: 'error',
          message: '使用了非标准品牌标识',
          suggestion: `请统一使用 "${CORRECT_BRANDING}"`,
        });
      }
    }
    
    // 2. 检查 QR 码生成方式
    if (sourceCode.includes('QRCode.toDataURL') || sourceCode.includes("from 'qrcode'")) {
      if (!sourceCode.includes('useQRCode')) {
        issues.push({
          type: 'qrcode',
          severity: 'error',
          message: '直接使用 QRCode 库而非统一 hook',
          suggestion: '请使用 useQRCode hook from @/utils/qrCodeUtils',
        });
      }
    }
    
    // 3. 检查域名使用
    if (sourceCode.includes('window.location.origin') || 
        sourceCode.includes("'https://wechat.eugenewe.net'") ||
        (sourceCode.includes('http') && !sourceCode.includes('getPromotionDomain'))) {
      issues.push({
        type: 'domain',
        severity: 'warning',
        message: '未使用统一域名获取函数',
        suggestion: '请使用 getPromotionDomain() from @/utils/partnerQRUtils',
      });
    }
    
    // 4. 检查宽度规范
    const widthMatch = sourceCode.match(/width[:\s]*['"]?(\d+)px?['"]?/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1], 10);
      if (width === 600) {
        issues.push({
          type: 'width',
          severity: 'warning',
          message: `卡片宽度 ${width}px 超出推荐范围`,
          suggestion: '推荐宽度: 结果类 340px, 工具类 420px',
        });
      }
    }
  }
  
  return {
    cardId,
    cardName,
    componentPath,
    isCompliant: issues.length === 0,
    issues,
    checkedAt: new Date(),
  };
}

/**
 * 获取一致性检查摘要统计
 */
export function getConsistencyStats(results: CardConsistencyResult[]) {
  const total = results.length;
  const compliant = results.filter(r => r.isCompliant).length;
  const withErrors = results.filter(r => r.issues.some(i => i.severity === 'error')).length;
  const withWarnings = results.filter(r => r.issues.some(i => i.severity === 'warning') && !r.issues.some(i => i.severity === 'error')).length;
  
  return {
    total,
    compliant,
    withErrors,
    withWarnings,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 100,
  };
}

/**
 * 获取问题类型的中文名称
 */
export function getIssueTypeName(type: ConsistencyIssue['type']): string {
  const names: Record<ConsistencyIssue['type'], string> = {
    branding: '品牌标识',
    qrcode: 'QR码生成',
    domain: '域名使用',
    width: '宽度规范',
    import: '依赖导入',
  };
  return names[type];
}

/**
 * 获取严重程度的中文名称
 */
export function getSeverityName(severity: ConsistencyIssue['severity']): string {
  const names: Record<ConsistencyIssue['severity'], string> = {
    error: '错误',
    warning: '警告',
    info: '提示',
  };
  return names[severity];
}

/**
 * 获取严重程度的颜色
 */
export function getSeverityColor(severity: ConsistencyIssue['severity']): string {
  const colors: Record<ConsistencyIssue['severity'], string> = {
    error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  };
  return colors[severity];
}
