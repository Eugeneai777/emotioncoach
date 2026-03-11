import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isWeChatBrowser, isWeChatMiniProgram } from '@/utils/platform';

/**
 * 在微信浏览器环境下预加载用户的公众号 openId。
 * 在非微信环境或小程序中返回 undefined（不需要 openId）。
 */
export function useWechatOpenId() {
  const [openId, setOpenId] = useState<string | undefined>(() => {
    // 尝试从 sessionStorage 恢复（支付重定向后）
    return sessionStorage.getItem('cached_wechat_openid') || undefined;
  });

  useEffect(() => {
    if (openId) return; // 已有缓存
    if (!isWeChatBrowser() || isWeChatMiniProgram()) return; // 非微信浏览器环境不需要

    const fetch = async () => {
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
          sessionStorage.setItem('cached_wechat_openid', mapping.openid);
        }
      } catch (e) {
        console.error('[useWechatOpenId] Failed:', e);
      }
    };

    fetch();
  }, [openId]);

  return openId;
}
