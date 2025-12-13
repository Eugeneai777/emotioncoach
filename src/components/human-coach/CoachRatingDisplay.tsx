import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachRatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function CoachRatingDisplay({
  rating,
  totalReviews = 0,
  size = "md",
  showCount = true,
}: CoachRatingDisplayProps) {
  const sizeClasses = {
    sm: { star: "w-3 h-3", text: "text-xs" },
    md: { star: "w-4 h-4", text: "text-sm" },
    lg: { star: "w-5 h-5", text: "text-base" },
  };
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size].star, "fill-amber-400 text-amber-400")}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size].star, "text-gray-200")} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizeClasses[size].star, "fill-amber-400 text-amber-400")} />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size].star, "text-gray-200")}
          />
        ))}
      </div>
      <span className={cn(sizeClasses[size].text, "text-muted-foreground")}>
        {rating.toFixed(1)}
      </span>
      {showCount && totalReviews > 0 && (
        <span className={cn(sizeClasses[size].text, "text-muted-foreground")}>
          ({totalReviews}条评价)
        </span>
      )}
    </div>
  );
}

interface MultiDimensionRatingProps {
  professionalism: number;
  communication: number;
  helpfulness: number;
}

export function MultiDimensionRating({
  professionalism,
  communication,
  helpfulness,
}: MultiDimensionRatingProps) {
  const dimensions = [
    { label: "专业度", value: professionalism },
    { label: "沟通力", value: communication },
    { label: "帮助度", value: helpfulness },
  ];
  
  return (
    <div className="space-y-2">
      {dimensions.map((dim) => (
        <div key={dim.label} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-14">{dim.label}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${(dim.value / 5) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium w-8">{dim.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
