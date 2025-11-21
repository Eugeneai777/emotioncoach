import { Badge } from "@/components/ui/badge";

interface TagSentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  size?: 'sm' | 'md';
}

const TagSentimentBadge = ({ sentiment, size = 'md' }: TagSentimentBadgeProps): JSX.Element | null => {
  if (!sentiment) return null;

  const config = {
    positive: {
      icon: '🟢',
      label: '正面',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    negative: {
      icon: '🔴',
      label: '负面',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    neutral: {
      icon: '⚪',
      label: '中性',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const { icon, label, className } = config[sentiment];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <Badge variant="outline" className={`${className} ${sizeClass}`}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
};

export default TagSentimentBadge;
