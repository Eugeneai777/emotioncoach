interface VoiceSuggestionChipsProps {
  recentThemes?: string[];
  onPick: (text: string) => void;
}

const FALLBACK_POOL: { emoji: string; label: string; prompt: string }[] = [
  { emoji: '💭', label: '最近睡不好', prompt: '我最近睡不好，脑子停不下来' },
  { emoji: '🌊', label: '工作压力大', prompt: '工作压力很大，我有点撑不住了' },
  { emoji: '💛', label: '想聊聊关系', prompt: '我想聊聊一段让我难受的关系' },
  { emoji: '🪞', label: '自我怀疑', prompt: '我最近一直在自我怀疑' },
  { emoji: '🫥', label: '没动力', prompt: '我最近什么都不想做，没什么动力' },
  { emoji: '🤍', label: '想被看见', prompt: '我只是想被认真听一听' },
];

const pickRandom = <T,>(arr: T[], n: number): T[] => {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
};

export const VoiceSuggestionChips = ({ recentThemes = [], onPick }: VoiceSuggestionChipsProps) => {
  const chips = (() => {
    if (recentThemes.length > 0) {
      const top = recentThemes.slice(0, 3);
      const prefixEmojis = ['🔁', '📌', '🌱'];
      const prefixes = ['继续聊', '回顾', '跟进'];
      return top.map((theme, i) => ({
        emoji: prefixEmojis[i] || '💬',
        label: `${prefixes[i] || '聊聊'}：${theme.length > 8 ? theme.slice(0, 8) + '…' : theme}`,
        prompt: `我想接着上次聊「${theme}」，最近还在想这件事`,
      }));
    }
    return pickRandom(FALLBACK_POOL, 3);
  })();

  return (
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
      </div>
    </div>
  );
};
