import { Badge } from "@/components/ui/badge";

export interface ThemeDefinition {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  { id: "CREATION", name: "创造幸福", emoji: "🧠", color: "hsl(210, 75%, 55%)", description: "工作进展、产品、创意、学习、技能提升" },
  { id: "RELATIONSHIPS", name: "关系幸福", emoji: "❤️", color: "hsl(350, 75%, 55%)", description: "伴侣、孩子、父母、朋友、同事、团队" },
  { id: "MONEY", name: "财富幸福", emoji: "💰", color: "hsl(45, 85%, 50%)", description: "收入、投资、折扣、奖金、资源、人脉" },
  { id: "HEALTH", name: "健康幸福", emoji: "🩺", color: "hsl(150, 65%, 45%)", description: "睡眠、运动、医疗、疗愈、养生" },
  { id: "INNER", name: "内在幸福", emoji: "🌱", color: "hsl(120, 50%, 45%)", description: "觉察、突破、疗愈、自我接纳、信仰" },
  { id: "JOY", name: "体验幸福", emoji: "🎉", color: "hsl(280, 65%, 55%)", description: "美食、旅行、音乐、电影、庆祝" },
  { id: "IMPACT", name: "贡献幸福", emoji: "🤝", color: "hsl(200, 70%, 50%)", description: "帮助别人、教练、分享、服务、给予" },
];

export const getThemeById = (id: string): ThemeDefinition | undefined => {
  return THEME_DEFINITIONS.find(t => t.id === id);
};

interface GratitudeThemeBadgeProps {
  themeId: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export const GratitudeThemeBadge = ({
  themeId,
  size = "md",
  showLabel = true,
  onClick,
  selected = false,
}: GratitudeThemeBadgeProps) => {
  const theme = getThemeById(themeId);
  if (!theme) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`
        ${sizeClasses[size]}
        cursor-pointer transition-all duration-200
        ${selected 
          ? "ring-2 ring-offset-1 ring-primary shadow-md" 
          : "hover:shadow-sm"
        }
      `}
      style={{
        backgroundColor: selected ? theme.color : `${theme.color}20`,
        borderColor: theme.color,
        color: selected ? "white" : theme.color,
      }}
      onClick={onClick}
    >
      <span className="mr-1">{theme.emoji}</span>
      {showLabel && <span>{theme.name}</span>}
    </Badge>
  );
};

interface GratitudeThemeSelectorProps {
  selectedThemes: string[];
  onToggle: (themeId: string) => void;
  maxSelection?: number;
}

export const GratitudeThemeSelector = ({
  selectedThemes,
  onToggle,
  maxSelection = 3,
}: GratitudeThemeSelectorProps) => {
  const handleToggle = (themeId: string) => {
    if (selectedThemes.includes(themeId)) {
      onToggle(themeId);
    } else if (selectedThemes.length < maxSelection) {
      onToggle(themeId);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        选择1-{maxSelection}个主题标签（已选 {selectedThemes.length}/{maxSelection}）
      </p>
      <div className="flex flex-wrap gap-2">
        {THEME_DEFINITIONS.map(theme => (
          <GratitudeThemeBadge
            key={theme.id}
            themeId={theme.id}
            selected={selectedThemes.includes(theme.id)}
            onClick={() => handleToggle(theme.id)}
          />
        ))}
      </div>
    </div>
  );
};
