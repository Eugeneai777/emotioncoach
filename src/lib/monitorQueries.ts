/**
 * 共享的监控数据 DB 查询 hooks
 * 供所有系统安全监控模块使用
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MonitorPlatform } from "./platformDetector";

export interface MonitorQueryOptions {
  platform?: MonitorPlatform | 'all';
  timeRange: '1h' | '24h' | '7d' | '30d';
  enabled?: boolean;
}

function getStartTime(range: MonitorQueryOptions['timeRange']): string {
  const now = new Date();
  const ms: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() - ms[range]).toISOString();
}

/** 查询前端异常 */
export function useMonitorFrontendErrors(options: MonitorQueryOptions) {
  return useQuery({
    queryKey: ['monitor-frontend-errors', options.platform, options.timeRange],
    queryFn: async () => {
      let query = supabase
        .from('monitor_frontend_errors')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(500);

      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询接口异常 */
export function useMonitorApiErrors(options: MonitorQueryOptions) {
  return useQuery({
    queryKey: ['monitor-api-errors', options.platform, options.timeRange],
    queryFn: async () => {
      let query = supabase
        .from('monitor_api_errors')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(500);

      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询体验异常 */
export function useMonitorUxAnomalies(options: MonitorQueryOptions) {
  return useQuery({
    queryKey: ['monitor-ux-anomalies', options.platform, options.timeRange],
    queryFn: async () => {
      let query = supabase
        .from('monitor_ux_anomalies')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(500);

      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询稳定性记录 */
export function useMonitorStabilityRecords(options: MonitorQueryOptions) {
  return useQuery({
    queryKey: ['monitor-stability-records', options.platform, options.timeRange],
    queryFn: async () => {
      let query = supabase
        .from('monitor_stability_records')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(1000);

      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询用户异常 */
export function useMonitorUserAnomalies(options: MonitorQueryOptions & { anomalyType?: string }) {
  return useQuery({
    queryKey: ['monitor-user-anomalies', options.platform, options.timeRange, options.anomalyType],
    queryFn: async () => {
      let query = supabase
        .from('monitor_user_anomalies')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(500);

      if (options.platform && options.platform !== 'all') {
        query = query.eq('platform', options.platform);
      }
      if (options.anomalyType && options.anomalyType !== 'all') {
        query = query.eq('anomaly_type', options.anomalyType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询风险内容 */
export function useMonitorRiskContent(options: MonitorQueryOptions & { riskLevel?: string; contentSource?: string; status?: string }) {
  return useQuery({
    queryKey: ['monitor-risk-content', options.platform, options.timeRange, options.riskLevel, options.contentSource, options.status],
    queryFn: async () => {
      let query = (supabase as any)
        .from('monitor_risk_content')
        .select('*')
        .gte('created_at', getStartTime(options.timeRange))
        .order('created_at', { ascending: false })
        .limit(500);

      if (options.riskLevel && options.riskLevel !== 'all') {
        query = query.eq('risk_level', options.riskLevel);
      }
      if (options.contentSource && options.contentSource !== 'all') {
        query = query.eq('content_source', options.contentSource);
      }
      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000,
  });
}

/** 查询所有监控表的汇总统计 */
export function useMonitorSummary(options: MonitorQueryOptions) {
  const feQuery = useMonitorFrontendErrors(options);
  const apiQuery = useMonitorApiErrors(options);
  const uxQuery = useMonitorUxAnomalies(options);
  const stabQuery = useMonitorStabilityRecords(options);

  return {
    frontendErrors: feQuery.data || [],
    apiErrors: apiQuery.data || [],
    uxAnomalies: uxQuery.data || [],
    stabilityRecords: stabQuery.data || [],
    isLoading: feQuery.isLoading || apiQuery.isLoading || uxQuery.isLoading || stabQuery.isLoading,
    refetchAll: () => {
      feQuery.refetch();
      apiQuery.refetch();
      uxQuery.refetch();
      stabQuery.refetch();
    },
  };
}
