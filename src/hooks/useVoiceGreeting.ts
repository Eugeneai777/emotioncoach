import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceGreetingResult {
  greeting: string;
  recentThemes: string[];
  nickname: string;
  loaded: boolean;
}

/**
 * 拉取用户昵称 + 最近 7 天 briefings 主题，拼接接通后 AI 主动开场白
 */
export const useVoiceGreeting = (
  userId: string | undefined,
  enabled: boolean,
): VoiceGreetingResult => {
  const [state, setState] = useState<VoiceGreetingResult>({
    greeting: '',
    recentThemes: [],
    nickname: '',
    loaded: false,
  });

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;

    (async () => {
      try {
        // 1) 昵称
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();

        const nickname = (profile?.display_name || '').trim() || '朋友';

        // 2) 最近 7 天的 briefings 主题
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: briefings } = await supabase
          .from('briefings')
          .select('emotion_theme, conversation_id, created_at, conversations!inner(user_id)')
          .eq('conversations.user_id', userId)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(5);

        const themes = (briefings || [])
          .map((b: any) => (b.emotion_theme || '').trim())
          .filter(Boolean);

        // 拼接问候语
        let greeting: string;
        if (themes.length > 0) {
          const lastTheme = themes[0];
          greeting = `${nickname}，又见面啦。上次我们聊到「${lastTheme}」，今天感觉怎么样？`;
        } else {
          greeting = `${nickname}，我在呢，今天想聊点什么？`;
        }

        if (!cancelled) {
          setState({ greeting, recentThemes: themes, nickname, loaded: true });
        }
      } catch (e) {
        console.warn('[useVoiceGreeting] failed:', e);
        if (!cancelled) {
          setState({
            greeting: '朋友，我在呢，今天想聊点什么？',
            recentThemes: [],
            nickname: '朋友',
            loaded: true,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return state;
};
