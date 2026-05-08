/**
 * 7 天伴随手册 · 极简 SVG 装饰元素
 * 全部内联 SVG，零跨域、零体积、html2canvas 100% 可截
 */

const tint = "hsl(var(--primary) / 0.18)";
const tintSoft = "hsl(var(--primary) / 0.12)";

export function SealStamp({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
      <circle cx="48" cy="48" r="44" stroke={tint} strokeWidth="1.2" />
      <circle cx="48" cy="48" r="36" stroke={tintSoft} strokeWidth="0.8" strokeDasharray="2 3" />
      <text
        x="48"
        y="44"
        textAnchor="middle"
        fontSize="11"
        fill="hsl(var(--primary) / 0.55)"
        letterSpacing="2"
      >
        有劲 AI
      </text>
      <text
        x="48"
        y="60"
        textAnchor="middle"
        fontSize="9"
        fill="hsl(var(--primary) / 0.45)"
        letterSpacing="3"
      >
        PERSONAL
      </text>
    </svg>
  );
}

export function SunRise({ size = 110 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 110 60" fill="none" aria-hidden>
      <line x1="4" y1="50" x2="106" y2="50" stroke={tint} strokeWidth="1" />
      <circle cx="55" cy="50" r="20" stroke={tint} strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (Math.PI / 6) * (i + 0); // upper half rays
        const x1 = 55 + Math.cos(Math.PI - a) * 26;
        const y1 = 50 - Math.sin(Math.PI - a) * 26;
        const x2 = 55 + Math.cos(Math.PI - a) * 32;
        const y2 = 50 - Math.sin(Math.PI - a) * 32;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tintSoft} strokeWidth="1" />;
      })}
    </svg>
  );
}

export function WaningMoon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="28" stroke={tint} strokeWidth="1.2" />
      <path
        d="M52 16 A28 28 0 1 0 52 64 A22 28 0 1 1 52 16 Z"
        fill={tintSoft}
      />
    </svg>
  );
}

export function Drop({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 3 C 14 3 5 14 5 19 a 9 9 0 0 0 18 0 C 23 14 14 3 14 3 Z"
        stroke={tint}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function ArcDivider({ width = 240 }: { width?: number }) {
  return (
    <svg width={width} height="14" viewBox="0 0 240 14" fill="none" aria-hidden>
      <path d="M2 12 Q 120 -4 238 12" stroke={tint} strokeWidth="1" fill="none" />
    </svg>
  );
}
