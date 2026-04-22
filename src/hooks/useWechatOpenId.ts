import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser, isWeChatMiniProgram } from '@/utils/platform';

/**
 * 在微信浏览器环境下预加载用户的公众号 openId。
 * 在非微信环境或小程序中返回 undefined（不需要 openId）。
 */
export function useWechatOpenId() {
  const [openId, setOpenId] = useState<string | undefined>(() => {
    // 优先从 localStorage 持久缓存恢复，其次 sessionStorage（兼容旧逻辑）
    return localStorage.getItem('cached_wechat_openid') 
      || sessionStorage.getItem('cached_wechat_openid') 
      || undefined;
  });

  useEffect(() => {
    if (openId) return; // 已有缓存
    if (!isWeChatBrowser() || isWeChatMiniProgram()) return;

    const fetchOpenId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: mapping } = await supabase
          .from('wechat_user_mappings')
          .select('openid')
          .eq('system_user_id', user.id)
          .maybeSingle();

        if (mapping?.openid) {
          setOpenId(mapping.openid);
          // 持久缓存到 localStorage，同一设备不再需要重复获取
          localStorage.setItem('cached_wechat_openid', mapping.openid);
          sessionStorage.setItem('cached_wechat_openid', mapping.openid);
        }
      } catch (e) {
        console.error('[useWechatOpenId] Failed:', e);
      }
    };

    fetchOpenId();
  }, [openId]);

  // 监听用户切换：如果登录用户变了，清除旧缓存重新获取
  useEffect(() => {
    const clearAllOpenIdCaches = () => {
      localStorage.removeItem('cached_wechat_openid');
      sessionStorage.removeItem('cached_wechat_openid');
      localStorage.removeItem('cached_payment_openid');
      sessionStorage.removeItem('cached_payment_openid');
      localStorage.removeItem('cached_payment_openid_gzh');
      sessionStorage.removeItem('cached_payment_openid_gzh');
      localStorage.removeItem('cached_payment_openid_mp');
      sessionStorage.removeItem('cached_payment_openid_mp');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAllOpenIdCaches();
        setOpenId(undefined);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // 🔐 校验缓存的 openid 是否归属当前登录用户。
        // 换号场景下，localStorage 里可能残留上一个用户的 openid，
        // 必须立即清除，避免支付时 openId 反查到他人账户。
        const cached = localStorage.getItem('cached_wechat_openid');
        if (cached) {
          // 异步校验，不阻塞登录流程
          supabase
            .from('wechat_user_mappings')
            .select('system_user_id')
            .eq('openid', cached)
            .maybeSingle()
            .then(({ data: mapping }) => {
              if (mapping?.system_user_id && mapping.system_user_id !== session.user.id) {
                console.warn('[useWechatOpenId] Cached openId belongs to another user, clearing.', {
                  cachedOpenIdUser: mapping.system_user_id,
                  currentUser: session.user.id,
                });
                clearAllOpenIdCaches();
                setOpenId(undefined);
              }
            });
        } else {
          setOpenId(undefined); // 触发 useEffect 重新 fetch
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return openId;
}
