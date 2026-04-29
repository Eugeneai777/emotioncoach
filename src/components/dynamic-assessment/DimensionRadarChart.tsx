import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface DimensionScore {
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
}

interface DimensionRadarChartProps {
  dimensionScores: DimensionScore[];
  compareScores?: DimensionScore[];
  variant?: "default" | "large";
}

interface AxisTickProps {
  x: number;
  y: number;
  cx: number;
  cy: number;
  payload?: {
    value?: string;
  };
}

const splitDimensionLabel = (value: string) => {
  const [emoji = "", ...labelParts] = value.split(" ");
  const label = labelParts.join(" ");
  if (label.length <= 5) return [`${emoji} ${label}`];
  return [`${emoji} ${label.slice(0, 4)}`, label.slice(4)];
};

const renderAxisTick = (fontSize: number) => (props: AxisTickProps) => {
  const { x, y, cx, cy, payload } = props;
  const lines = splitDimensionLabel(String(payload?.value || ""));
  const isLeft = x < cx - 12;
  const isRight = x > cx + 12;
  const isBottom = y > cy + 18;
  const isTop = y < cy - 18;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor={isLeft ? "end" : isRight ? "start" : "middle"}
        dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "middle"}
        fill="hsl(var(--muted-foreground))"
        fontSize={fontSize}
        fontWeight={600}
      >
        {lines.map((line, index) => (
          <tspan key={line} x={0} dy={index === 0 ? 0 : fontSize + 3}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export function DimensionRadarChart({ dimensionScores, compareScores, variant = "default" }: DimensionRadarChartProps) {
  if (!dimensionScores?.length) return null;

  const isLarge = variant === "large";
  const labelFontSize = isLarge ? 12 : 11;
  const radius = isLarge ? "68%" : "60%";
  const chartMargin = isLarge
    ? { top: 28, right: 42, bottom: 38, left: 42 }
    : { top: 22, right: 48, bottom: 34, left: 48 };

  const data = dimensionScores.map((d, i) => ({
    subject: `${d.emoji} ${d.label}`,
    current: d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0,
    ...(compareScores?.[i] ? {
      previous: compareScores[i].maxScore > 0
        ? Math.round((compareScores[i].score / compareScores[i].maxScore) * 100)
        : 0,
    } : {}),
  }));

  return (
    <div className="w-full h-full min-h-[320px] sm:min-h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="49%" outerRadius={radius} margin={chartMargin}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="subject"
            tick={renderAxisTick(labelFontSize)}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickCount={5}
          />
          {compareScores && (
            <Radar
              name="上次"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.15}
              strokeDasharray="4 4"
            />
          )}
          <Radar
            name="本次"
            dataKey="current"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={isLarge ? 0.3 : 0.25}
            strokeWidth={isLarge ? 3 : 2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
