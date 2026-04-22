import { useMemo, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

interface Chip {
  emoji: string;
  label: string;
  prompt: string;
}

interface VoiceSuggestionChipsProps {
  recentThemes?: string[];
  onPick: (text: string) => void;
  userId?: string;
}

const FALLBACK_POOL: Chip[] = [
  { emoji: '💭', label: '最近睡不好', prompt: '我最近睡不好，脑子停不下来' },
  { emoji: '🌊', label: '工作压力大', prompt: '工作压力很大，我有点撑不住了' },
  { emoji: '💛', label: '想聊聊关系', prompt: '我想聊聊一段让我难受的关系' },
  { emoji: '🪞', label: '自我怀疑', prompt: '我最近一直在自我怀疑' },
  { emoji: '🫥', label: '没动力', prompt: '我最近什么都不想做，没什么动力' },
  { emoji: '🤍', label: '想被看见', prompt: '我只是想被认真听一听' },
];

const CHIPS_CACHE_PREFIX = 'voice_chips_v1:';
const CHIPS_TTL_MS = 24 * 60 * 60 * 1000;

const pickRandom = <T,>(arr: T[], n: number): T[] => {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
};

const readChipsCache = (key: string): Chip[] | null => {
  try {
    const raw = localStorage.getItem(CHIPS_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.chips) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CHIPS_TTL_MS) return null;
    return parsed.chips as Chip[];
  } catch {
    return null;
  }
};

const writeChipsCache = (key: string, chips: Chip[]) => {
  try {
    localStorage.setItem(
      CHIPS_CACHE_PREFIX + key,
      JSON.stringify({ chips, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
};

const themeToPrompt = (theme: string) =>
  `我想接着上次聊「${theme}」，最近还在想这件事`;

export const VoiceSuggestionChips = ({
  recentThemes = [],
  onPick,
  userId,
}: VoiceSuggestionChipsProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const chips = useMemo<Chip[]>(() => {
    const cacheKey = userId || 'anon';
    const themesKey = recentThemes.slice(0, 3).join('|');
    const fullKey = `${cacheKey}::${themesKey}`;

    const cached = readChipsCache(fullKey);
    if (cached && cached.length === 3) return cached;

    let next: Chip[];
    if (recentThemes.length > 0) {
      const top = recentThemes.slice(0, 3);
      const prefixEmojis = ['🔁', '📌', '🌱'];
      const prefixes = ['继续聊', '回顾', '跟进'];
      next = top.map((theme, i) => ({
        emoji: prefixEmojis[i] || '💬',
        label: `${prefixes[i] || '聊聊'}：${theme.length > 8 ? theme.slice(0, 8) + '…' : theme}`,
        prompt: themeToPrompt(theme),
      }));
      if (next.length < 3) {
        next = [...next, ...pickRandom(FALLBACK_POOL, 3 - next.length)];
      }
    } else {
      next = pickRandom(FALLBACK_POOL, 3);
    }

    writeChipsCache(fullKey, next);
    return next;
  }, [recentThemes, userId]);

  // 抽屉中候选：所有 recentThemes（去重）+ 兜底池补充
  const allOptions = useMemo<Chip[]>(() => {
    const seen = new Set<string>();
    const themeChips: Chip[] = [];
    for (const t of recentThemes) {
      const k = t.trim();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      themeChips.push({
        emoji: '💬',
        label: k.length > 14 ? k.slice(0, 14) + '…' : k,
        prompt: themeToPrompt(k),
      });
    }
    return [...themeChips, ...FALLBACK_POOL];
  }, [recentThemes]);

  const hasHistory = recentThemes.length > 0;

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-none px-2">
        <div className="flex gap-2 justify-center min-w-min">
          {chips.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c.prompt)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] active:bg-white/20 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium transition-all whitespace-nowrap"
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.12] active:bg-white/20 backdrop-blur-md border border-dashed border-white/15 text-white/65 text-xs font-medium transition-all whitespace-nowrap inline-flex items-center gap-1"
            aria-label="换个话题"
          >
            <Shuffle className="w-3 h-3" />
            换个话题
          </button>
        </div>
      </div>

      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent className="bg-stone-950/95 border-white/10 text-white">
          <DrawerHeader>
            <DrawerTitle className="text-white">换个话题</DrawerTitle>
            <DrawerDescription className="text-white/60">
              {hasHistory
                ? '从你最近聊过的内容里挑一个，或选一个新方向'
                : '先选一个想聊的方向'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-2 max-h-[55vh] overflow-y-auto">
            {hasHistory && (
              <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
                最近聊过
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {allOptions.slice(0, recentThemes.length).map((c, i) => (
                <button
                  key={`r-${i}`}
                  type="button"
                  onClick={() => {
                    onPick(c.prompt);
                    setPickerOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/20 border border-white/10 text-white/85 text-sm transition-all"
                >
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mb-3 text-[11px] uppercase tracking-wider text-white/40">
              换个新方向
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {FALLBACK_POOL.map((c, i) => (
                <button
                  key={`f-${i}`}
                  type="button"
                  onClick={() => {
                    onPick(c.prompt);
                    setPickerOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/20 border border-white/10 text-white/85 text-sm transition-all"
                >
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                取消
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
