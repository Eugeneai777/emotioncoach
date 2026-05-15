import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 题干配套媒体渲染（image / audio / palette）
 * - 音频：单例（同一时刻只播一段），首次点击才加载，绕开 iOS 自动播放限制
 * - 图片：懒加载，最大宽度 320，圆角
 * - palette：内嵌 6 色低饱和色盘 SVG（无外部资源）
 */

let __activeAudio: HTMLAudioElement | null = null;

interface MediaSpec {
  kind: "image" | "audio" | "palette";
  url?: string;
  alt?: string;
  caption?: string;
}

export function QuestionMedia({ media }: { media?: MediaSpec | null }) {
  if (!media) return null;
  if (media.kind === "image" && media.url) {
    return (
      <div className="flex justify-center my-2">
        <img
          src={media.url}
          alt={media.alt || ""}
          loading="lazy"
          className="rounded-xl max-w-[280px] w-full h-auto shadow-md border border-border/40"
        />
      </div>
    );
  }
  if (media.kind === "palette") {
    // 4 色低饱和色盘（与选项 4 选 1 对齐）
    const swatches = [
      { c: "#E8A87C", label: "暖橙" },
      { c: "#EDE6D6", label: "米白" },
      { c: "#7DA3B5", label: "雾蓝" },
      { c: "#7B6E63", label: "灰褐" },
    ];
    return (
      <div className="flex justify-center gap-2 my-2">
        {swatches.map((s) => (
          <div
            key={s.c}
            className="w-14 h-14 rounded-xl shadow-sm border border-border/40"
            style={{ background: s.c }}
            aria-label={s.label}
            title={s.label}
          />
        ))}
      </div>
    );
  }
  if (media.kind === "audio" && media.url) {
    return <AudioBlock url={media.url} alt={media.alt} />;
  }
  return null;
}

function AudioBlock({ url, alt }: { url: string; alt?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (__activeAudio === audioRef.current) __activeAudio = null;
      }
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      const a = new Audio(url);
      a.preload = "auto";
      a.addEventListener("timeupdate", () => {
        if (a.duration > 0) setProgress((a.currentTime / a.duration) * 100);
      });
      a.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
        if (__activeAudio === a) __activeAudio = null;
      });
      audioRef.current = a;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (__activeAudio && __activeAudio !== audioRef.current) {
        try { __activeAudio.pause(); } catch {}
      }
      __activeAudio = audioRef.current;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <div className="my-2 flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          playing ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/15"
        )}
        aria-label={playing ? "暂停" : "播放"}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{alt || "点播放，听 5 秒"}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
