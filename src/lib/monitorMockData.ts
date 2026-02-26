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

  const results = await Promise.allSettled([
    supabase.from('monitor_frontend_errors').insert(frontendErrors),
    supabase.from('monitor_api_errors').insert(apiErrors),
    supabase.from('monitor_ux_anomalies').insert(uxAnomalies),
  ]);

  const summary = {
    frontendErrors: results[0].status === 'fulfilled' ? frontendErrors.length : 0,
    apiErrors: results[1].status === 'fulfilled' ? apiErrors.length : 0,
    uxAnomalies: results[2].status === 'fulfilled' ? uxAnomalies.length : 0,
    errors: results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason),
  };

  console.log('[MonitorMock] 模拟预警数据已注入:', summary);
  return summary;
}
