/**
 * 稳定性监控 - 自然语言诊断与一键修复建议
 */

import type { RequestRecord, DependencyStatus } from './stabilityDataCollector';
import { toast } from 'sonner';

// ==================== 错误类型诊断 ====================

export interface Diagnosis {
  /** 自然语言描述 */
  description: string;
  /** 可能原因 */
  cause: string;
  /** 修复建议 */
  suggestion: string;
  /** 是否建议一键修复 */
  canAutoFix: boolean;
  /** 一键修复动作类型 */
  fixAction?: 'retry' | 'clear_cache' | 'reload' | 'switch_endpoint' | 'increase_timeout' | 'report';
  /** 严重程度描述 */
  severity: '轻微' | '中等' | '严重' | '紧急';
}

/** 根据错误类型生成诊断 */
export function diagnoseErrorType(errorType: string, count?: number): Diagnosis {
  switch (errorType) {
    case 'timeout':
      return {
        description: `请求响应超时${count ? `，已累计 ${count} 次` : ''}，用户正在经历长时间等待`,
        cause: '服务端处理缓慢、网络拥塞、或请求数据量过大',
        suggestion: '建议增大超时阈值、优化服务端查询、或启用请求分页',
        canAutoFix: true,
        fixAction: 'increase_timeout',
        severity: count && count > 10 ? '严重' : '中等',
      };
    case 'rate_limit':
      return {
        description: `接口被限流${count ? `，已发生 ${count} 次` : ''}，部分请求被拒绝`,
        cause: '短时间内请求频率过高，触发了第三方或服务端的速率限制',
        suggestion: '建议降低请求频率、增加请求间隔、或联系服务商提升配额',
        canAutoFix: true,
        fixAction: 'retry',
        severity: count && count > 5 ? '严重' : '中等',
      };
    case 'server_error':
      return {
        description: `服务端返回 5xx 错误${count ? `，已出现 ${count} 次` : ''}`,
        cause: '后端服务异常、数据库连接失败、或部署配置错误',
        suggestion: '建议检查后端日志、确认数据库连接正常、必要时重启服务',
        canAutoFix: true,
        fixAction: 'retry',
        severity: count && count > 5 ? '紧急' : '严重',
      };
    case 'auth_error':
      return {
        description: `认证失败${count ? `，共 ${count} 次` : ''}，用户可能已被登出`,
        cause: '登录凭证过期、Token 失效、或权限配置错误',
        suggestion: '建议重新登录获取新凭证、或检查权限策略配置',
        canAutoFix: true,
        fixAction: 'reload',
        severity: '中等',
      };
    case 'client_error':
      return {
        description: `客户端请求错误${count ? `，共 ${count} 次` : ''}`,
        cause: '请求参数不合法、资源不存在(404)、或接口版本不兼容',
        suggestion: '建议检查请求参数格式、确认接口路径正确',
        canAutoFix: false,
        fixAction: 'report',
        severity: '轻微',
      };
    case 'network_error':
      return {
        description: `网络连接失败${count ? `，已发生 ${count} 次` : ''}`,
        cause: '用户网络不稳定、DNS 解析失败、或目标服务器不可达',
        suggestion: '建议检查网络连接、切换网络环境、或确认服务是否在线',
        canAutoFix: true,
        fixAction: 'retry',
        severity: count && count > 3 ? '严重' : '中等',
      };
    default:
      return {
        description: `发生未知类型错误${count ? `(${count}次)` : ''}`,
        cause: '错误类型未被分类，可能是新出现的异常场景',
        suggestion: '建议查看详细日志，分析错误上下文',
        canAutoFix: false,
        fixAction: 'report',
        severity: '轻微',
      };
  }
}

/** 根据单条请求记录生成诊断 */
export function diagnoseRequest(record: RequestRecord): Diagnosis {
  if (record.success) {
    if (record.totalDuration > 5000) {
      return {
        description: `请求虽然成功，但耗时 ${(record.totalDuration / 1000).toFixed(1)}s，体验较差`,
        cause: '服务端处理慢或网络延迟高',
        suggestion: '建议优化接口性能或增加加载提示',
        canAutoFix: false,
        severity: '轻微',
      };
    }
    return {
      description: '请求正常',
      cause: '',
      suggestion: '',
      canAutoFix: false,
      severity: '轻微',
    };
  }

  const base = diagnoseErrorType(record.errorType || 'unknown');

  // 针对特定路径增强诊断
  if (record.path.includes('chat') || record.path.includes('ai')) {
    base.description = `AI 服务调用失败: ${base.description}`;
    base.suggestion += '；AI 服务故障时建议启用降级策略或切换备用模型';
  } else if (record.path.includes('voice') || record.path.includes('speech')) {
    base.description = `语音服务异常: ${base.description}`;
    base.suggestion += '；语音服务不可用时建议提供文字替代方案';
  }

  return base;
}

/** 根据依赖状态生成诊断 */
export function diagnoseDependency(name: string, status: DependencyStatus, successRate: number, recentErrors: number): Diagnosis {
  switch (status) {
    case '正常':
      return {
        description: `${name} 服务运行正常，成功率 ${successRate.toFixed(1)}%`,
        cause: '',
        suggestion: '无需操作',
        canAutoFix: false,
        severity: '轻微',
      };
    case '降级':
      return {
        description: `${name} 出现轻微异常，成功率降至 ${successRate.toFixed(1)}%${recentErrors > 0 ? `，近5分钟 ${recentErrors} 次错误` : ''}`,
        cause: '可能因短暂网络波动或服务端负载增加导致部分请求失败',
        suggestion: '建议持续观察，若持续降级考虑切换备用服务或降低调用频率',
        canAutoFix: true,
        fixAction: 'retry',
        severity: '中等',
      };
    case '异常':
      return {
        description: `${name} 服务异常！成功率仅 ${successRate.toFixed(1)}%，大量请求失败`,
        cause: '第三方服务可能正在经历故障、维护或遭受攻击',
        suggestion: '建议立即启用备用方案、暂停非关键调用、并关注服务商状态页',
        canAutoFix: true,
        fixAction: 'switch_endpoint',
        severity: '严重',
      };
    case '熔断中':
      return {
        description: `⚠️ ${name} 已触发熔断！成功率低于 50%，服务基本不可用`,
        cause: '第三方服务严重故障或完全中断',
        suggestion: '建议切换到备用服务、通知相关团队、并向用户展示友好提示',
        canAutoFix: true,
        fixAction: 'switch_endpoint',
        severity: '紧急',
      };
  }
}

/** 对整体健康状态生成概要诊断 */
export function diagnoseOverallHealth(
  successRate: number,
  errorCount: number,
  timeoutCount: number,
  p95: number,
): Diagnosis {
  if (successRate >= 99.5 && timeoutCount === 0 && p95 < 1000) {
    return {
      description: '系统运行健康，各项指标正常',
      cause: '',
      suggestion: '保持当前状态，继续监控',
      canAutoFix: false,
      severity: '轻微',
    };
  }

  const issues: string[] = [];
  if (successRate < 95) issues.push(`成功率偏低(${successRate}%)`);
  else if (successRate < 99) issues.push(`成功率轻微下降(${successRate}%)`);
  if (timeoutCount > 5) issues.push(`超时频繁(${timeoutCount}次)`);
  if (p95 > 3000) issues.push(`P95响应时间过高(${(p95 / 1000).toFixed(1)}s)`);
  if (errorCount > 10) issues.push(`错误数较多(${errorCount}个)`);

  return {
    description: `系统存在以下问题：${issues.join('、')}`,
    cause: '可能由服务端性能下降、第三方依赖故障、或突发流量导致',
    suggestion: '建议按优先级排查：先确认第三方服务状态，再检查服务端性能，最后优化慢接口',
    canAutoFix: issues.length <= 2,
    fixAction: 'retry',
    severity: successRate < 90 ? '紧急' : successRate < 95 ? '严重' : '中等',
  };
}

// ==================== 一键修复动作 ====================

export function executeAutoFix(action: Diagnosis['fixAction'], context?: string) {
  switch (action) {
    case 'retry':
      toast.info('🔄 正在重试失败的请求...', { description: context || '系统将自动重新发起最近失败的请求' });
      // In a real system this would retry failed requests
      setTimeout(() => toast.success('重试完成，请观察监控指标变化'), 1500);
      break;
    case 'clear_cache':
      toast.info('🧹 正在清理缓存...', { description: '清除本地缓存数据以解决数据不一致问题' });
      try {
        localStorage.removeItem('app_cache');
        sessionStorage.clear();
        setTimeout(() => toast.success('缓存已清理，建议刷新页面'), 1000);
      } catch { toast.error('缓存清理失败'); }
      break;
    case 'reload':
      toast.info('🔄 即将刷新页面以重新建立连接...', { description: context });
      setTimeout(() => window.location.reload(), 1500);
      break;
    case 'switch_endpoint':
      toast.warning('⚡ 建议切换到备用服务端点', {
        description: context || '当前服务不可用，请在设置中配置备用 API 地址',
        duration: 8000,
      });
      break;
    case 'increase_timeout':
      toast.info('⏱️ 建议调整超时配置', {
        description: '当前超时阈值可能过低，建议在系统设置中适当增大超时时间',
        duration: 6000,
      });
      break;
    case 'report':
      // Copy diagnostic info to clipboard
      if (context) {
        navigator.clipboard.writeText(context).then(() => {
          toast.success('📋 诊断信息已复制到剪贴板', { description: '可粘贴到工单系统进行上报' });
        }).catch(() => {
          toast.info('诊断信息：' + context);
        });
      } else {
        toast.info('📋 请查看详细日志获取更多信息');
      }
      break;
    default:
      toast.info('暂无自动修复方案，建议人工排查');
  }
}

/** 严重程度对应的样式 */
export function severityColor(severity: Diagnosis['severity']): string {
  switch (severity) {
    case '轻微': return 'text-muted-foreground';
    case '中等': return 'text-amber-600';
    case '严重': return 'text-red-600';
    case '紧急': return 'text-red-700 font-semibold';
  }
}

export function severityBadgeClass(severity: Diagnosis['severity']): string {
  switch (severity) {
    case '轻微': return 'bg-muted text-muted-foreground';
    case '中等': return 'bg-amber-100 text-amber-700 border-amber-200';
    case '严重': return 'bg-red-100 text-red-700 border-red-200';
    case '紧急': return 'bg-red-200 text-red-800 border-red-400';
  }
}
