import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { THEME_DEFINITIONS } from "./GratitudeThemeBadge";

interface ThemeRadarChartProps {
  themeStats: Record<string, number>;
}

export const ThemeRadarChart = ({ themeStats }: ThemeRadarChartProps) => {
  const data = THEME_DEFINITIONS.map(theme => ({
    theme: `${theme.emoji} ${theme.name}`,
    value: themeStats[theme.id] || 0,
    fullMark: Math.max(...Object.values(themeStats), 1),
  }));

  const total = Object.values(themeStats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="w-full">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="theme"
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "dataMax"]}
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="主题出现次数"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value} 次`, "出现次数"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend with percentages */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {THEME_DEFINITIONS.map(theme => {
          const count = themeStats[theme.id] || 0;
          const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div
              key={theme.id}
              className="flex items-center justify-between p-2 rounded-lg"
              style={{ backgroundColor: `${theme.color}15` }}
            >
              <span className="flex items-center gap-1">
                <span>{theme.emoji}</span>
                <span className="text-xs">{theme.name}</span>
              </span>
              <span className="text-xs font-medium" style={{ color: theme.color }}>
                {count}次 ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
