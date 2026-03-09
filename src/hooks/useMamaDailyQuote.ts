import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_CACHE_KEY = 'mama_daily_quote_cache';

const fallbackQuotes = [
  "孩子需要的不是完美妈妈，而是一个真实、温暖的妈妈。",
  "你已经是一个很好的妈妈了，只是你还不知道。",
  "允许自己不完美，是给孩子最好的礼物。",
  "妈妈的微笑，是孩子最安全的港湾。",
  "每一天，你都在用爱创造奇迹。",
  "累了就休息，世界不会因为你休息一天就崩塌。",
  "孩子最需要的，是一个快乐的妈妈。",
  "今天的辛苦，会变成明天最温暖的回忆。",
  "爱孩子之前，先学会爱自己。",
  "你不是一个人在战斗，有很多妈妈跟你一样。",
  "给自己倒一杯水，深呼吸，你值得被温柔对待。",
  "今天只做好一件小事，就已经很棒了。",
  "妈妈的力量，比你想象的要大得多。",
  "你的温柔，正在塑造一个温暖的灵魂。",
  "在孩子眼里，你就是整个世界。",
];

interface DailyQuote {
  message: string;
  style?: 'encourage' | 'affirm' | 'empathy' | 'warmth';
  icon?: string;
}

const styleLabels: Record<string, { emoji: string; label: string }> = {
  encourage: { emoji: '💪', label: '鼓励' },
  affirm: { emoji: '💛', label: '肯定' },
  empathy: { emoji: '🤗', label: '同理' },
  warmth: { emoji: '🌸', label: '温馨' },
};

export const useMamaDailyQuote = () => {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        setQuote(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch {}

    const fetchQuote = async () => {
      try {
        const hour = new Date().getHours();
        const time_of_day = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

        const { data, error } = await supabase.functions.invoke('generate-smart-notification', {
          body: {
            scenario: 'mama_daily_encouragement',
            context: { time_of_day, return_only: true },
          },
        });

        if (error || !data?.success) throw new Error('AI generation failed');

        const result: DailyQuote = {
          message: data.notification.message,
          style: data.notification.style,
          icon: data.notification.icon,
        };

        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(result));
        setQuote(result);
      } catch (err) {
        console.warn('AI daily quote failed, using fallback:', err);
        const idx = Math.floor(Date.now() / 86400000) % fallbackQuotes.length;
        setQuote({ message: fallbackQuotes[idx] });
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  return { quote, loading, styleLabels };
};
