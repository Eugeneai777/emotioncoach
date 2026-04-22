import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceGreetingResult {
  greeting: string;
  recentThemes: string[];
  nickname: string;
  loaded: boolean;
}

const CACHE_PREFIX = 'voice_greeting_ctx_v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedCtx {
  nickname: string;
  recentThemes: string[];
  greeting: string;
  ts: number;
}

const readCache = (userId: string): CachedCtx | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCtx;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (userId: string, ctx: Omit<CachedCtx, 'ts'>) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + userId,
      JSON.stringify({ ...ctx, ts: Date.now() }),
    );
  } catch {
    /* ignore quota */
  }
};

/**
 * 拉取用户昵称 + 最近 7 天 briefings 主题，拼接接通后 AI 主动开场白。
 * 带 localStorage 缓存（24h），刷新/重连即时回填，再后台静默刷新。
 */
export const useVoiceGreeting = (
  userId: string | undefined,
  enabled: boolean,
): VoiceGreetingResult => {
  const [state, setState] = useState<VoiceGreetingResult>(() => {
    if (!userId) {
      return { greeting: '', recentThemes: [], nickname: '', loaded: false };
    }
    const cached = readCache(userId);
    if (cached) {
      return {
        greeting: cached.greeting,
        recentThemes: cached.recentThemes,
        nickname: cached.nickname,
        loaded: true,
      };
    }
    return { greeting: '', recentThemes: [], nickname: '', loaded: false };
  });

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;

    // 命中缓存先即时回填（处理 userId 异步到达的场景）
    const cached = readCache(userId);
    if (cached && !state.loaded) {
      setState({
        greeting: cached.greeting,
        recentThemes: cached.recentThemes,
        nickname: cached.nickname,
        loaded: true,
      });
    }

    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();

        const nickname = (profile?.display_name || '').trim() || '朋友';

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

        let greeting: string;
        if (themes.length > 0) {
          greeting = `${nickname}，又见面啦。上次我们聊到「${themes[0]}」，今天感觉怎么样？`;
        } else {
          greeting = `${nickname}，我在呢，今天想聊点什么？`;
        }

        writeCache(userId, { nickname, recentThemes: themes, greeting });

        if (!cancelled) {
          setState({ greeting, recentThemes: themes, nickname, loaded: true });
        }
      } catch (e) {
        console.warn('[useVoiceGreeting] failed:', e);
        if (!cancelled && !readCache(userId)) {
          setState({
            greeting: '朋友,我在呢，今天想聊点什么？',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled]);

  return state;
};
