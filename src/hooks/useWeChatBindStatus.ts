import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WeChatUserInfo {
  nickname?: string;
  avatar_url?: string;
  openid?: string;
}

interface WeChatBindStatus {
  isBound: boolean;
  isSubscribed: boolean;
  wechatInfo: WeChatUserInfo | null;
  isLoading: boolean;
  isEmailUser: boolean; // 是否为邮箱注册用户
  needsBindPrompt: boolean; // 是否需要提示绑定
  refetch: () => Promise<void>;
  markPrompted: () => Promise<void>;
}

export function useWeChatBindStatus(): WeChatBindStatus {
  const { user } = useAuth();
  const [isBound, setIsBound] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [wechatInfo, setWechatInfo] = useState<WeChatUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [needsBindPrompt, setNeedsBindPrompt] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 检查用户是否为邮箱注册用户（email 不以 wechat_ 开头）
      const email = user.email || '';
      const isEmailRegistered = !email.startsWith('wechat_') && email.includes('@') && !email.includes('@temp.youjin365.com');
      setIsEmailUser(isEmailRegistered);

      // 检查微信映射
      const { data: mapping } = await supabase
        .from('wechat_user_mappings')
        .select('openid, nickname, avatar_url, subscribe_status')
        .eq('system_user_id', user.id)
        .maybeSingle();

      if (mapping) {
        setIsBound(true);
        setIsSubscribed(mapping.subscribe_status || false);
        setWechatInfo({
          openid: mapping.openid,
          nickname: mapping.nickname,
          avatar_url: mapping.avatar_url,
        });
      } else {
        setIsBound(false);
        setIsSubscribed(false);
        setWechatInfo(null);
      }

      // 检查是否需要提示绑定（仅邮箱用户 + 未绑定 + 未提示过或提示超过7天）
      if (isEmailRegistered && !mapping) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wechat_bind_prompted, wechat_bind_prompted_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const hasBeenPrompted = profile.wechat_bind_prompted;
          const lastPromptedAt = profile.wechat_bind_prompted_at;
          
          if (!hasBeenPrompted) {
            setNeedsBindPrompt(true);
          } else if (lastPromptedAt) {
            // 如果超过7天，可以再次提示
            const daysSincePrompt = (Date.now() - new Date(lastPromptedAt).getTime()) / (1000 * 60 * 60 * 24);
            setNeedsBindPrompt(daysSincePrompt >= 7);
          }
        }
      } else {
        setNeedsBindPrompt(false);
      }
    } catch (error) {
      console.error('Error fetching WeChat bind status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markPrompted = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          wechat_bind_prompted: true,
          wechat_bind_prompted_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      setNeedsBindPrompt(false);
    } catch (error) {
      console.error('Error marking bind prompted:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isBound,
    isSubscribed,
    wechatInfo,
    isLoading,
    isEmailUser,
    needsBindPrompt,
    refetch: fetchStatus,
    markPrompted,
  };
}
