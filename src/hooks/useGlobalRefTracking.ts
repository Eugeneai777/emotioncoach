import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useWealthCampAnalytics } from './useWealthCampAnalytics';
import { isWeChatBrowser, isWeChatMiniProgram } from '@/utils/platform';

/**
 * 自动为页面 URL 注入 ref=share 参数
 * 
 * 当用户使用浏览器原生分享（Safari/Chrome 分享菜单）时，
 * 分享出去的链接会自动带上 ?ref=share，
 * 接收者点击后通过 useGlobalRefTracking 记录回访。
 */
const useAutoShareRef = () => {
  const [searchParams] = useSearchParams();
  const hasInjected = useRef(false);

  useEffect(() => {
    if (hasInjected.current) return;

    // 微信 JS-SDK（尤其 iOS）签名必须使用用户首次进入页面的 URL。
    // 如果页面加载后用 history.replaceState 自动追加 ref，会导致当前 URL 和签名 URL 不一致，
    // 右上角菜单分享可能退化成普通链接；微信内分享参数由 useWechatShare 的 link 字段负责。
    if (isWeChatBrowser() || isWeChatMiniProgram()) return;
    
    // 如果已有 ref 参数（合伙人链接等），不覆盖
    if (searchParams.has('ref')) return;
    
    // 注入 ref=share 到 URL，不触发页面刷新
    const url = new URL(window.location.href);
    url.searchParams.set('ref', 'share');
    window.history.replaceState(window.history.state, '', url.toString());
    hasInjected.current = true;
  }, [searchParams]);
};

/**
 * 全局合伙人追踪 Hook
 * 
 * 任何页面带 ?ref=partnerCode 参数时自动追踪：
 * 1. 记录 share_scan_landed 事件到数据库
 * 2. 存储推荐码到 localStorage 用于后续转化归因
 * 
 * 在 App.tsx 中全局调用，无需在每个页面单独添加追踪代码
 */
export const useGlobalRefTracking = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { trackShareScanLanded } = useWealthCampAnalytics();
  const hasTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    
    if (!refCode) return;
    
    // 获取已存储的追踪信息
    const existingRef = localStorage.getItem('share_ref_code');
    const existingPage = localStorage.getItem('share_landing_page');
    
    // 创建唯一追踪键：refCode + pathname
    const trackingKey = `${refCode}:${location.pathname}`;
    
    // 避免重复追踪：
    // 1. 同一个 ref + 同一个页面只追踪一次（本次会话内）
    // 2. 如果 localStorage 已有相同的 ref + page 组合，也跳过
    if (hasTrackedRef.current === trackingKey) {
      return;
    }
    
    if (refCode === existingRef && location.pathname === existingPage) {
      // 已经追踪过这个组合，不重复记录
      hasTrackedRef.current = trackingKey;
      return;
    }
    
    // 执行追踪
    trackShareScanLanded(refCode, location.pathname, document.referrer);
    hasTrackedRef.current = trackingKey;
    
  }, [location.pathname, searchParams, trackShareScanLanded]);
};

/**
 * 全局追踪组件 - 在 App.tsx 中使用
 */
export const GlobalRefTracker = () => {
  useAutoShareRef();
  useGlobalRefTracking();
  return null;
};
