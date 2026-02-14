interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({ data, color = "hsl(var(--primary))", height = 28 }: MiniSparklineProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data, 1);
  const width = 100;
  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * usableWidth;
    const y = height - padding - (v / max) * usableHeight;
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full mt-1.5"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sparkfill-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints.join(" ")}
        fill={`url(#sparkfill-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
