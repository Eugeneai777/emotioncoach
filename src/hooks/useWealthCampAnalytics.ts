import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

// 财富训练营3大生死指标追踪
// 1. 测评→训练营转化率 (assessment_to_camp)
// 2. 第7天留存率 (day7_retention)
// 3. 自发分享率 (organic_share)

export type WealthCampEventType = 
  // 测评流程
  | 'assessment_started'        // 开始测评
  | 'assessment_completed'      // 完成测评
  | 'assessment_result_viewed'  // 查看结果
  | 'camp_intro_viewed'         // 查看训练营介绍
  | 'camp_join_clicked'         // 点击加入训练营
  | 'camp_joined'               // 成功加入训练营
  // 留存追踪
  | 'camp_day_checkin'          // 每日打卡（附带 day_number）
  | 'camp_day7_active'          // 第7天活跃
  | 'camp_day14_active'         // 第14天活跃
  | 'camp_day21_completed'      // 21天毕业
  | 'camp_dropped'              // 放弃（连续3天未打卡）
  // 分享追踪
  | 'share_journal_clicked'     // 点击分享日记
  | 'share_journal_completed'   // 完成分享日记
  | 'share_invite_clicked'      // 点击邀请好友
  | 'share_invite_completed'    // 完成邀请（生成链接/海报）
  | 'share_organic'             // 自发分享（非任务驱动）
  | 'referral_registration';    // 被邀请用户注册

interface TrackEventOptions {
  userId?: string;
  visitorId?: string;
  metadata?: Record<string, any>;
}

export function useWealthCampAnalytics() {
  const trackEvent = useCallback(async (
    eventType: WealthCampEventType,
    options: TrackEventOptions = {}
  ) => {
    try {
      // 如果没有 userId，尝试获取当前用户
      let userId = options.userId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      // 生成或获取访客ID（用于未登录用户追踪）
      let visitorId = options.visitorId;
      if (!visitorId && !userId) {
        visitorId = getOrCreateVisitorId();
      }

      const { error } = await supabase
        .from('conversion_events')
        .insert({
          event_type: eventType,
          feature_key: 'wealth_camp',
          user_id: userId || null,
          visitor_id: visitorId || null,
          metadata: {
            ...options.metadata,
            timestamp: new Date().toISOString(),
            source: 'wealth_camp_analytics',
          },
        });

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, []);

  // 追踪测评完成→训练营转化
  const trackAssessmentTocamp = useCallback(async (step: 'assessment_completed' | 'camp_intro_viewed' | 'camp_join_clicked' | 'camp_joined', metadata?: Record<string, any>) => {
    await trackEvent(step, { metadata });
  }, [trackEvent]);

  // 追踪每日打卡留存
  const trackDayCheckin = useCallback(async (dayNumber: number, campId: string) => {
    await trackEvent('camp_day_checkin', {
      metadata: { day_number: dayNumber, camp_id: campId }
    });

    // 里程碑日自动追踪
    if (dayNumber === 7) {
      await trackEvent('camp_day7_active', { metadata: { camp_id: campId } });
    } else if (dayNumber === 14) {
      await trackEvent('camp_day14_active', { metadata: { camp_id: campId } });
    } else if (dayNumber === 21) {
      await trackEvent('camp_day21_completed', { metadata: { camp_id: campId } });
    }
  }, [trackEvent]);

  // 追踪分享行为
  const trackShare = useCallback(async (
    type: 'journal' | 'invite',
    step: 'clicked' | 'completed',
    isOrganic: boolean = false,
    metadata?: Record<string, any>
  ) => {
    if (isOrganic) {
      await trackEvent('share_organic', { metadata: { share_type: type, ...metadata } });
    } else if (type === 'journal') {
      await trackEvent(step === 'clicked' ? 'share_journal_clicked' : 'share_journal_completed', { metadata });
    } else {
      await trackEvent(step === 'clicked' ? 'share_invite_clicked' : 'share_invite_completed', { metadata });
    }
  }, [trackEvent]);

  return {
    trackEvent,
    trackAssessmentTocamp,
    trackDayCheckin,
    trackShare,
  };
}

// 访客ID管理（用于未登录用户追踪转化漏斗）
function getOrCreateVisitorId(): string {
  const key = 'wealth_camp_visitor_id';
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
}

// 计算指标的工具函数（供管理后台使用）
export async function getWealthCampMetrics(dateRange?: { start: Date; end: Date }) {
  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end || new Date();

  // 1. 测评→训练营转化率
  const { count: assessmentCompleted } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'assessment_completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { count: campJoined } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'camp_joined')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const assessmentToCampRate = assessmentCompleted && assessmentCompleted > 0
    ? ((campJoined || 0) / assessmentCompleted * 100).toFixed(1)
    : '0';

  // 2. 第7天留存率
  const { count: campStarts } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'camp_joined')
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // 至少7天前加入
    .lte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: day7Active } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'camp_day7_active')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const day7RetentionRate = campStarts && campStarts > 0
    ? ((day7Active || 0) / campStarts * 100).toFixed(1)
    : '0';

  // 3. 自发分享率
  const { count: totalCheckins } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'camp_day_checkin')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { count: organicShares } = await supabase
    .from('conversion_events')
    .select('*', { count: 'exact', head: true })
    .eq('feature_key', 'wealth_camp')
    .eq('event_type', 'share_organic')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const organicShareRate = totalCheckins && totalCheckins > 0
    ? ((organicShares || 0) / totalCheckins * 100).toFixed(1)
    : '0';

  return {
    assessmentCompleted: assessmentCompleted || 0,
    campJoined: campJoined || 0,
    assessmentToCampRate: `${assessmentToCampRate}%`,
    campStarts: campStarts || 0,
    day7Active: day7Active || 0,
    day7RetentionRate: `${day7RetentionRate}%`,
    totalCheckins: totalCheckins || 0,
    organicShares: organicShares || 0,
    organicShareRate: `${organicShareRate}%`,
  };
}
