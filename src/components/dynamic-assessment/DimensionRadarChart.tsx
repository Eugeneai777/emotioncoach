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
}

export function DimensionRadarChart({ dimensionScores, compareScores }: DimensionRadarChartProps) {
  if (!dimensionScores?.length) return null;

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
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
