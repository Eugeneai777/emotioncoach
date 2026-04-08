/**
 * 用户异常监控 - 模拟预警数据注入
 * 向监控表插入模拟数据，用于测试监控面板
 */

import { supabase } from "@/integrations/supabase/client";
import { detectPlatform, type MonitorPlatform } from "./platformDetector";

type DbPlatform = 'web' | 'mobile_browser' | 'wechat' | 'mini_program' | 'unknown';
const platforms: DbPlatform[] = ['web', 'mobile_browser', 'wechat', 'mini_program'];
const randomPlatform = (): DbPlatform => platforms[Math.floor(Math.random() * platforms.length)];

export async function injectMonitorMockData() {
  const now = new Date().toISOString();
  const currentPlatform: DbPlatform = detectPlatform() as DbPlatform;

  const frontendErrors = [
    { error_type: 'js_error', message: '[Mock] Cannot read properties of undefined (reading "map")', stack: 'TypeError: Cannot read properties of undefined\n    at UserList.tsx:42', page: '/dashboard', platform: currentPlatform, user_agent: navigator.userAgent },
    { error_type: 'promise_rejection', message: '[Mock] Network request failed: ERR_CONNECTION_REFUSED', page: '/chat', platform: randomPlatform(), user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
    { error_type: 'resource_error', message: '[Mock] Failed to load resource', resource_url: 'https://cdn.example.com/avatar.png', page: '/profile', platform: 'mobile_browser' as DbPlatform, user_agent: 'Mozilla/5.0 (Linux; Android 14)' },
    { error_type: 'white_screen', message: '[Mock] 白屏检测：#root 为空超过 5 秒', page: '/awakening', platform: 'wechat' as DbPlatform, user_agent: 'Mozilla/5.0 MicroMessenger/8.0' },
    { error_type: 'network_error', message: '[Mock] fetch failed: 502 Bad Gateway', page: '/wealth-block', platform: 'mini_program' as DbPlatform, user_agent: 'Mozilla/5.0 MiniProgramEnv' },
  ];

  const apiErrors = [
    { error_type: 'server_error', status_code: 500, url: '/functions/v1/chat-with-deepseek', method: 'POST', response_time: 2300, message: '[Mock] Internal Server Error', platform: currentPlatform, page: '/chat' },
    { error_type: 'timeout', status_code: 0, url: '/functions/v1/generate-briefing', method: 'POST', response_time: 30000, message: '[Mock] Request timeout after 30s', platform: 'mobile_browser' as DbPlatform, page: '/briefing' },
    { error_type: 'rate_limit', status_code: 429, url: '/functions/v1/ai-coach', method: 'POST', response_time: 150, message: '[Mock] Too Many Requests', platform: 'wechat' as DbPlatform, page: '/coach' },
    { error_type: 'auth_error', status_code: 401, url: '/rest/v1/profiles', method: 'GET', response_time: 80, message: '[Mock] JWT expired', platform: 'mini_program' as DbPlatform, page: '/settings' },
    { error_type: 'server_error', status_code: 503, url: '/functions/v1/wechat-pay', method: 'POST', response_time: 5000, message: '[Mock] Service Unavailable - 支付网关异常', platform: currentPlatform, page: '/payment' },
  ];

  const uxAnomalies = [
    { anomaly_type: 'slow_interaction', scene: 'chat_send', scene_label: '发送消息', message: '[Mock] 用户发送消息响应超过 3 秒', duration: 3500, platform: currentPlatform, page: '/chat' },
    { anomaly_type: 'repeated_failure', scene: 'login', scene_label: '登录', message: '[Mock] 用户连续登录失败 5 次', fail_count: 5, platform: 'mobile_browser' as DbPlatform, page: '/auth' },
    { anomaly_type: 'rage_click', scene: 'submit_btn', scene_label: '提交按钮', message: '[Mock] 用户在 2 秒内点击提交按钮 8 次', fail_count: 8, platform: 'wechat' as DbPlatform, page: '/assessment' },
    { anomaly_type: 'abandon', scene: 'payment', scene_label: '支付流程', message: '[Mock] 用户在支付页停留 120 秒后离开', duration: 120000, platform: 'mini_program' as DbPlatform, page: '/payment' },
    { anomaly_type: 'slow_interaction', scene: 'page_load', scene_label: '页面加载', message: '[Mock] 页面首屏加载超过 8 秒', duration: 8200, platform: currentPlatform, page: '/awakening' },
  ];

  const userAnomalies = [
    { anomaly_type: 'abnormal_login', severity: 'warning', title: '异地登录检测', message: '[Mock] 用户从新 IP 118.25.xx.xx (北京) 登录，与常用地 (广州) 不一致', platform: currentPlatform, user_agent: navigator.userAgent, ip_address: '118.25.12.34', user_id: 'mock-user-001' },
    { anomaly_type: 'abnormal_login', severity: 'warning', title: '深夜登录', message: '[Mock] 用户在凌晨 3:15 登录，偏离正常使用时段', platform: 'mobile_browser' as DbPlatform, user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', user_id: 'mock-user-002' },
    { anomaly_type: 'high_frequency', severity: 'critical', title: '高频 API 调用', message: '[Mock] 用户在 1 分钟内调用 /api/chat 接口 85 次，超过阈值 (30次/分钟)', platform: currentPlatform, user_agent: navigator.userAgent, user_id: 'mock-user-003', extra: { endpoint: '/api/chat', count: 85, threshold: 30, window: '1min' } },
    { anomaly_type: 'high_frequency', severity: 'warning', title: '频繁刷新页面', message: '[Mock] 用户在 5 分钟内刷新页面 42 次', platform: 'wechat' as DbPlatform, user_agent: 'Mozilla/5.0 MicroMessenger/8.0', user_id: 'mock-user-004' },
    { anomaly_type: 'suspicious_operation', severity: 'critical', title: '批量数据导出', message: '[Mock] 用户短时间内请求导出全部用户数据，疑似数据爬取', platform: currentPlatform, user_agent: navigator.userAgent, user_id: 'mock-user-005', page: '/admin/users' },
    { anomaly_type: 'suspicious_operation', severity: 'warning', title: '越权访问尝试', message: '[Mock] 普通用户尝试访问管理后台 API /admin/settings，已被 RLS 拒绝', platform: 'mini_program' as DbPlatform, user_agent: 'Mozilla/5.0 MiniProgramEnv', user_id: 'mock-user-006', page: '/admin/settings' },
    { anomaly_type: 'abnormal_login', severity: 'warning', title: '多设备同时登录', message: '[Mock] 同一账号在 3 台不同设备上同时活跃', platform: currentPlatform, user_agent: navigator.userAgent, user_id: 'mock-user-007' },
  ];

  // 支付流程模拟数据 - 模拟多种中断场景
  const now_ts = Date.now();
  const paymentFlowEvents = [];

  // 场景1: 完整成功流程
  const flow1 = `pf_mock_${now_ts}_success`;
  paymentFlowEvents.push(
    { flow_id: flow1, event_type: 'payment_intent', page_url: 'https://app.example.com/promo/synergy', metadata: { productName: '协同套餐', amount: 1999, packageKey: 'synergy_bundle' }, created_at: new Date(now_ts - 600000).toISOString() },
    { flow_id: flow1, event_type: 'checkout_opened', page_url: 'https://app.example.com/promo/synergy', metadata: { productName: '协同套餐', amount: 1999 }, created_at: new Date(now_ts - 590000).toISOString() },
    { flow_id: flow1, event_type: 'checkout_submitted', page_url: 'https://app.example.com/promo/synergy', metadata: { productName: '协同套餐', amount: 1999 }, created_at: new Date(now_ts - 540000).toISOString() },
    { flow_id: flow1, event_type: 'payment_dialog_opened', page_url: 'https://app.example.com/promo/synergy', metadata: { payMethod: 'wechat' }, created_at: new Date(now_ts - 530000).toISOString() },
    { flow_id: flow1, event_type: 'payment_submitted', page_url: 'https://app.example.com/promo/synergy', metadata: {}, created_at: new Date(now_ts - 520000).toISOString() },
    { flow_id: flow1, event_type: 'payment_success', page_url: 'https://app.example.com/promo/synergy', metadata: { payMethod: 'wechat' }, created_at: new Date(now_ts - 500000).toISOString() },
  );

  // 场景2: 登录后重定向丢失（最常见的中断）
  const flow2 = `pf_mock_${now_ts}_redirect_lost`;
  paymentFlowEvents.push(
    { flow_id: flow2, event_type: 'payment_intent', page_url: 'https://app.example.com/camp-intro/emotion', metadata: { productName: '情绪训练营', amount: 399, packageKey: 'camp-emotion' }, created_at: new Date(now_ts - 3600000).toISOString() },
    { flow_id: flow2, event_type: 'redirect_to_login', page_url: 'https://app.example.com/camp-intro/emotion', target_url: 'https://app.example.com/auth', metadata: { reason: '未登录' }, created_at: new Date(now_ts - 3595000).toISOString() },
    { flow_id: flow2, event_type: 'login_completed', page_url: 'https://app.example.com/auth', metadata: {}, created_at: new Date(now_ts - 3550000).toISOString() },
    { flow_id: flow2, event_type: 'redirect_lost', page_url: 'https://app.example.com/mini-app', error_message: '登录后跳转至默认首页 /mini-app，未返回 /camp-intro/emotion 支付页', metadata: { expectedUrl: '/camp-intro/emotion', actualUrl: '/mini-app' }, created_at: new Date(now_ts - 3545000).toISOString() },
  );

  // 场景3: 微信OAuth后支付弹窗未打开
  const flow3 = `pf_mock_${now_ts}_dialog_fail`;
  paymentFlowEvents.push(
    { flow_id: flow3, event_type: 'payment_intent', page_url: 'https://app.example.com/promo/identity-bloom', metadata: { productName: '绽放联盟套餐', amount: 2999, packageKey: 'identity_bloom' }, created_at: new Date(now_ts - 7200000).toISOString() },
    { flow_id: flow3, event_type: 'checkout_opened', page_url: 'https://app.example.com/promo/identity-bloom', metadata: {}, created_at: new Date(now_ts - 7190000).toISOString() },
    { flow_id: flow3, event_type: 'checkout_submitted', page_url: 'https://app.example.com/promo/identity-bloom', metadata: {}, created_at: new Date(now_ts - 7150000).toISOString() },
    { flow_id: flow3, event_type: 'redirect_to_login', page_url: 'https://app.example.com/promo/identity-bloom', target_url: 'https://open.weixin.qq.com/connect/oauth2/authorize', metadata: { reason: '微信JSAPI需要OpenID' }, created_at: new Date(now_ts - 7145000).toISOString() },
    { flow_id: flow3, event_type: 'login_completed', page_url: 'https://app.example.com/promo/identity-bloom?code=xxx&state=xxx', metadata: {}, created_at: new Date(now_ts - 7100000).toISOString() },
  );

  // 场景4: 收货表单放弃
  const flow4 = `pf_mock_${now_ts}_checkout_abandon`;
  paymentFlowEvents.push(
    { flow_id: flow4, event_type: 'payment_intent', page_url: 'https://app.example.com/health-store', metadata: { productName: '知乐胶囊 4瓶装', amount: 1159, packageKey: 'store_product_zhile_4' }, created_at: new Date(now_ts - 1800000).toISOString() },
    { flow_id: flow4, event_type: 'checkout_opened', page_url: 'https://app.example.com/health-store', metadata: { productName: '知乐胶囊 4瓶装', amount: 1159 }, created_at: new Date(now_ts - 1795000).toISOString() },
  );

  // 场景5: 支付请求失败
  const flow5 = `pf_mock_${now_ts}_pay_failed`;
  paymentFlowEvents.push(
    { flow_id: flow5, event_type: 'payment_intent', page_url: 'https://app.example.com/promo/synergy', metadata: { productName: '协同套餐', amount: 1999 }, created_at: new Date(now_ts - 5400000).toISOString() },
    { flow_id: flow5, event_type: 'checkout_submitted', page_url: 'https://app.example.com/promo/synergy', metadata: {}, created_at: new Date(now_ts - 5350000).toISOString() },
    { flow_id: flow5, event_type: 'payment_dialog_opened', page_url: 'https://app.example.com/promo/synergy', metadata: { payMethod: 'alipay' }, created_at: new Date(now_ts - 5340000).toISOString() },
    { flow_id: flow5, event_type: 'payment_submitted', page_url: 'https://app.example.com/promo/synergy', metadata: {}, created_at: new Date(now_ts - 5335000).toISOString() },
    { flow_id: flow5, event_type: 'payment_failed', page_url: 'https://app.example.com/promo/synergy', error_message: '支付宝H5下单接口返回 SYSTEM_ERROR: 系统繁忙请稍后再试', metadata: { payMethod: 'alipay', errorCode: 'SYSTEM_ERROR' }, created_at: new Date(now_ts - 5330000).toISOString() },
  );

  // 场景6: 用户取消支付弹窗
  const flow6 = `pf_mock_${now_ts}_cancelled`;
  paymentFlowEvents.push(
    { flow_id: flow6, event_type: 'payment_intent', page_url: 'https://app.example.com/wealth-assessment-free', metadata: { productName: '财富测评（付费版）', amount: 19.9 }, created_at: new Date(now_ts - 900000).toISOString() },
    { flow_id: flow6, event_type: 'payment_dialog_opened', page_url: 'https://app.example.com/wealth-assessment-free', metadata: { payMethod: 'wechat' }, created_at: new Date(now_ts - 895000).toISOString() },
    { flow_id: flow6, event_type: 'payment_cancelled', page_url: 'https://app.example.com/wealth-assessment-free', metadata: {}, created_at: new Date(now_ts - 860000).toISOString() },
  );

  // 场景7: 流程超时
  const flow7 = `pf_mock_${now_ts}_timeout`;
  paymentFlowEvents.push(
    { flow_id: flow7, event_type: 'payment_intent', page_url: 'https://app.example.com/partner-intro', metadata: { productName: '绽放合伙人', amount: 4999, packageKey: 'bloom_partner' }, created_at: new Date(now_ts - 7200000).toISOString() },
    { flow_id: flow7, event_type: 'redirect_to_login', page_url: 'https://app.example.com/partner-intro', target_url: 'https://app.example.com/auth?redirect=/partner-intro', metadata: {}, created_at: new Date(now_ts - 7195000).toISOString() },
    { flow_id: flow7, event_type: 'flow_timeout', page_url: 'https://app.example.com/auth', error_message: '支付流程超过30分钟未完成', metadata: { elapsedMs: 1800000 }, created_at: new Date(now_ts - 5400000).toISOString() },
  );

  const results = await Promise.allSettled([
    supabase.from('monitor_frontend_errors').insert(frontendErrors),
    supabase.from('monitor_api_errors').insert(apiErrors),
    supabase.from('monitor_ux_anomalies').insert(uxAnomalies),
    supabase.from('monitor_user_anomalies').insert(userAnomalies),
    supabase.from('payment_flow_events' as any).insert(paymentFlowEvents as any),
  ]);

  const summary = {
    frontendErrors: results[0].status === 'fulfilled' ? frontendErrors.length : 0,
    apiErrors: results[1].status === 'fulfilled' ? apiErrors.length : 0,
    uxAnomalies: results[2].status === 'fulfilled' ? uxAnomalies.length : 0,
    userAnomalies: results[3].status === 'fulfilled' ? userAnomalies.length : 0,
    paymentFlowEvents: results[4].status === 'fulfilled' ? paymentFlowEvents.length : 0,
    errors: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason),
  };

  console.log('[MonitorMock] 模拟预警数据已注入:', summary);
  return summary;
}
