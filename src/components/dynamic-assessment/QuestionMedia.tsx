import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 题干配套媒体渲染（image / audio / palette）
 * - 音频：单例（同一时刻只播一段）；挂载时即创建 Audio 实例并 preload="auto"，
 *   首次点击若未就绪则等 canplay 后自动 play（保留 user gesture），并显示 spinner
 * - 图片：相对路径自动绝对化（避开微信 web-view 解析问题）；
 *   .png 自动用 .webp 兜底（picture+source）；onError 提供重试
 * - palette：内嵌 4 色低饱和色盘
 */

let __activeAudio: HTMLAudioElement | null = null;

interface MediaSpec {
  kind: "image" | "audio" | "palette";
  url?: string;
  alt?: string;
  caption?: string;
}

/** 把 /xxx 相对路径转为同源绝对 URL（修复部分 WebView 解析慢/失败） */
function absolutize(url?: string): string | undefined {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

export function QuestionMedia({ media }: { media?: MediaSpec | null }) {
  if (!media) return null;
  if (media.kind === "image" && media.url) {
    return <ImageBlock url={media.url} alt={media.alt} />;
  }
  if (media.kind === "palette") {
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

function ImageBlock({ url, alt }: { url: string; alt?: string }) {
  const abs = useMemo(() => absolutize(url), [url]);
  // 自动 webp 优先：仅当 url 以 .png/.jpg 结尾时生成 webp 候选
  const webp = useMemo(() => {
    if (!abs) return undefined;
    if (/\.(png|jpe?g)$/i.test(abs)) return abs.replace(/\.(png|jpe?g)$/i, ".webp");
    return undefined;
  }, [abs]);
  const [errored, setErrored] = useState(false);
  const [bust, setBust] = useState(0);

  if (!abs) return null;

  if (errored) {
    return (
      <div className="flex justify-center my-2">
        <button
          type="button"
          onClick={() => { setErrored(false); setBust((n) => n + 1); }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:bg-muted/40"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 图片加载失败,点击重试
        </button>
      </div>
    );
  }

  const cb = bust ? `?_=${bust}` : "";
  return (
    <div className="flex justify-center my-2">
      <picture>
        {webp && <source srcSet={`${webp}${cb}`} type="image/webp" />}
        <img
          src={`${abs}${cb}`}
          alt={alt || ""}
          width={280}
          height={280}
          loading="eager"
          decoding="async"
          // @ts-ignore
          fetchpriority="high"
          onError={() => setErrored(true)}
          className="rounded-xl max-w-[280px] w-full h-auto shadow-md border border-border/40"
        />
      </picture>
    </div>
  );
}

function AudioBlock({ url, alt }: { url: string; alt?: string }) {
  const abs = useMemo(() => absolutize(url) || url, [url]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [progress, setProgress] = useState(0);

  // 挂载时即创建 Audio + 预加载，避免首次点击时再去发起请求
  useEffect(() => {
    const a = new Audio();
    a.src = abs;
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    // iOS / 微信 WebView 内联播放
    a.setAttribute("playsinline", "true");
    a.setAttribute("webkit-playsinline", "true");
    a.addEventListener("timeupdate", () => {
      if (a.duration > 0) setProgress((a.currentTime / a.duration) * 100);
    });
    a.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      if (__activeAudio === a) __activeAudio = null;
    });
    a.addEventListener("error", () => {
      setErrored(true);
      setLoading(false);
      setPlaying(false);
    });
    audioRef.current = a;
    try { a.load(); } catch {}
    return () => {
      try { a.pause(); } catch {}
      if (__activeAudio === a) __activeAudio = null;
      audioRef.current = null;
    };
  }, [abs]);

  const reload = () => {
    setErrored(false);
    const a = audioRef.current;
    if (a) {
      try { a.load(); } catch {}
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (errored) { reload(); return; }

    if (playing) {
      a.pause();
      setPlaying(false);
      return;
    }
    if (__activeAudio && __activeAudio !== a) {
      try { __activeAudio.pause(); } catch {}
    }
    __activeAudio = a;

    const playNow = () => {
      a.play().then(() => { setPlaying(true); setLoading(false); })
        .catch(() => { setPlaying(false); setLoading(false); setErrored(true); });
    };

    if (a.readyState >= 2) {
      playNow();
    } else {
      // 未就绪：保留 user gesture,等 canplay 后自动播
      setLoading(true);
      const onReady = () => {
        a.removeEventListener("canplay", onReady);
        playNow();
      };
      a.addEventListener("canplay", onReady);
      try { a.load(); } catch {}
      // 5s 超时兜底
      setTimeout(() => {
        if (loading && !playing) {
          a.removeEventListener("canplay", onReady);
          setLoading(false);
          setErrored(true);
        }
      }, 5000);
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
        aria-label={playing ? "暂停" : (errored ? "重试" : "播放")}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" />
          : errored ? <RefreshCw className="w-4 h-4" />
          : playing ? <Pause className="w-4 h-4" />
          : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">
          {errored ? "加载失败,点击左侧重试" : (alt || "点播放,听 5 秒")}
        </p>
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
