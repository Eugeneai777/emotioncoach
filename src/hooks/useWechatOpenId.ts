import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser, isWeChatMiniProgram } from '@/utils/platform';
import { clearWechatOpenIdCaches, readWechatOpenIdCache, writeWechatOpenIdCache } from '@/utils/wechatOpenIdCache';

/**
 * 在微信浏览器环境下预加载用户的公众号 openId。
 * 在非微信环境或小程序中返回 undefined（不需要 openId）。
 */
export function useWechatOpenId() {
  const [openId, setOpenId] = useState<string | undefined>(() => {
    return readWechatOpenIdCache('wechat');
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
          writeWechatOpenIdCache('wechat', mapping.openid, user.id);
        }
      } catch (e) {
        console.error('[useWechatOpenId] Failed:', e);
      }
    };

    fetchOpenId();
  }, [openId]);

  // 监听用户切换：如果登录用户变了，清除旧缓存重新获取
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearWechatOpenIdCaches();
        setOpenId(undefined);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // 🔐 校验缓存的 openid 是否归属当前登录用户。
        // 换号场景下，localStorage 里可能残留上一个用户的 openid，
        // 必须立即清除，避免支付时 openId 反查到他人账户。
        const cached = readWechatOpenIdCache('wechat', session.user.id);
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
                clearWechatOpenIdCaches();
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
