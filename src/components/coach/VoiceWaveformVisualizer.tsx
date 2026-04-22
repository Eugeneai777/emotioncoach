import { useEffect, useRef } from 'react';

interface VoiceWaveformVisualizerProps {
  state: 'idle' | 'user' | 'assistant';
  /** 用于驱动 assistant 状态的色调（'rose' | 'emerald' | ...） */
  colorTheme?: string;
  width?: number;
  height?: number;
}

/**
 * 抽象声音可视化 — 3 条横向流动波纹，颜色随状态变化
 * 与底部 PTT 红按钮在视觉上完全脱钩（动作=红，声音=冷调/玫瑰）
 */
export const VoiceWaveformVisualizer = ({
  state,
  colorTheme = 'rose',
  width = 260,
  height = 80,
}: VoiceWaveformVisualizerProps) => {
  const rafRef = useRef<number>();
  const tRef = useRef(0);
  const pathRefs = useRef<(SVGPathElement | null)[]>([null, null, null]);

  // 状态决定振幅与流动速度
  const config = (() => {
    switch (state) {
      case 'user':
        return { amp: 14, speed: 0.085, opacityBase: 0.95 };
      case 'assistant':
        return { amp: 18, speed: 0.075, opacityBase: 0.95 };
      default:
        return { amp: 3.5, speed: 0.018, opacityBase: 0.42 };
    }
  })();

  // 颜色：assistant 跟随主题，user 用青蓝，idle 灰白
  const strokeColors = (() => {
    if (state === 'user') {
      return ['url(#wave-user-1)', 'url(#wave-user-2)', 'url(#wave-user-3)'];
    }
    if (state === 'assistant') {
      return ['url(#wave-asst-1)', 'url(#wave-asst-2)', 'url(#wave-asst-3)'];
    }
    return ['url(#wave-idle-1)', 'url(#wave-idle-2)', 'url(#wave-idle-3)'];
  })();

  // 主题色（assistant 状态使用）
  const themeStops = (() => {
    switch (colorTheme) {
      case 'emerald':
      case 'green':
        return ['hsl(160 75% 65%)', 'hsl(155 80% 55%)'];
      case 'blue':
        return ['hsl(210 90% 70%)', 'hsl(220 85% 60%)'];
      case 'purple':
      case 'violet':
        return ['hsl(270 75% 72%)', 'hsl(265 70% 60%)'];
      case 'amber':
      case 'orange':
        return ['hsl(35 95% 65%)', 'hsl(25 90% 55%)'];
      case 'rose':
      default:
        return ['hsl(350 90% 75%)', 'hsl(345 80% 58%)'];
    }
  })();

  useEffect(() => {
    const buildPath = (
      time: number,
      amplitude: number,
      phase: number,
      freq: number,
    ) => {
      const segments = 48;
      const step = width / segments;
      let d = '';
      for (let i = 0; i <= segments; i++) {
        const x = i * step;
        const y =
          height / 2 +
          Math.sin((i / segments) * freq * Math.PI * 2 + time + phase) *
            amplitude *
            // 边缘衰减，让波纹两端收敛
            Math.sin((i / segments) * Math.PI);
        d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      return d;
    };

    const tick = () => {
      tRef.current += config.speed;
      const t = tRef.current;
      // 3 条线：振幅与频率略有差异，制造层次
      const paths = [
        buildPath(t, config.amp, 0, 2.2),
        buildPath(t * 1.15, config.amp * 0.7, Math.PI / 3, 2.8),
        buildPath(t * 0.85, config.amp * 0.45, Math.PI / 1.5, 3.4),
      ];
      paths.forEach((d, i) => {
        const el = pathRefs.current[i];
        if (el) el.setAttribute('d', d);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config.amp, config.speed, width, height]);

  const lineOpacities = [config.opacityBase, config.opacityBase * 0.7, config.opacityBase * 0.45];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* idle 灰白渐变 */}
        {[1, 2, 3].map((n) => (
          <linearGradient key={`i${n}`} id={`wave-idle-${n}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(0 0% 100%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
          </linearGradient>
        ))}
        {/* user 青蓝渐变 */}
        {[1, 2, 3].map((n) => (
          <linearGradient key={`u${n}`} id={`wave-user-${n}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(170 80% 70%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(165 75% 60%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(170 80% 70%)" stopOpacity="0" />
          </linearGradient>
        ))}
        {/* assistant 主题色渐变 */}
        {[1, 2, 3].map((n) => (
          <linearGradient key={`a${n}`} id={`wave-asst-${n}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={themeStops[0]} stopOpacity="0" />
            <stop offset="50%" stopColor={themeStops[1]} stopOpacity="1" />
            <stop offset="100%" stopColor={themeStops[0]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          ref={(el) => (pathRefs.current[i] = el)}
          fill="none"
          stroke={strokeColors[i]}
          strokeWidth={i === 0 ? 2.4 : i === 1 ? 1.8 : 1.2}
          strokeLinecap="round"
          opacity={lineOpacities[i]}
          style={{ transition: 'opacity 400ms ease' }}
        />
      ))}
    </svg>
  );
};
