import { Button } from "@/components/ui/button";
import CarouselCardWrapper from "./CarouselCardWrapper";
import { ArrowRight } from "lucide-react";

interface CustomCarouselCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  backgroundType: "gradient" | "image" | "solid";
  backgroundValue?: string;
  textColor: "dark" | "light";
  imageUrl?: string;
  imagePosition?: "right" | "left" | "top" | "background";
  actionText?: string;
  onAction?: () => void;
}

export default function CustomCarouselCard({
  title,
  subtitle,
  description,
  emoji = "✨",
  backgroundType,
  backgroundValue,
  textColor,
  imageUrl,
  imagePosition = "right",
  actionText,
  onAction,
}: CustomCarouselCardProps) {
  const background =
    backgroundType === "gradient" && backgroundValue
      ? backgroundValue
      : backgroundType === "solid" && backgroundValue
      ? `bg-[${backgroundValue}]`
      : "bg-gradient-to-br from-background via-background/95 to-background/90";

  return (
    <CarouselCardWrapper background={background} textMode={textColor}>
      {/* Background Image */}
      {imageUrl && imagePosition === "background" && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 rounded-2xl"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      <div className="flex flex-col h-full relative z-10">
        {/* Header Section - Improved spacing and alignment */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Image - Left Position */}
          {imageUrl && imagePosition === "left" && (
            <img
              src={imageUrl}
              alt={title}
              className="w-24 h-24 object-cover rounded-xl shadow-lg flex-shrink-0 ring-2 ring-white/20"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-3xl leading-none flex-shrink-0">{emoji}</span>
              <h3
                className={`text-xl font-bold tracking-tight leading-tight ${
                  textColor === "light" ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {title}
              </h3>
            </div>
            {subtitle && (
              <p
                className={`text-sm font-medium ${
                  textColor === "light"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Image - Right Position */}
          {imageUrl && imagePosition === "right" && (
            <img
              src={imageUrl}
              alt={title}
              className="w-24 h-24 object-cover rounded-xl shadow-lg flex-shrink-0 ring-2 ring-white/20"
            />
          )}
        </div>

        {/* Image - Top Position */}
        {imageUrl && imagePosition === "top" && (
          <div className="mb-4 -mx-6 -mt-6">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-32 object-cover shadow-md"
            />
          </div>
        )}

        {/* Content Section - Better typography */}
        <div className="flex-1 mb-4">
          {description && (
            <p
              className={`text-sm leading-relaxed ${
                textColor === "light"
                  ? "text-primary-foreground/85"
                  : "text-foreground/80"
              }`}
            >
              {description}
            </p>
          )}
        </div>

        {/* Action Button - Enhanced design */}
        {actionText && onAction && (
          <div className="mt-auto pt-4">
            <Button
              onClick={onAction}
              variant={textColor === "light" ? "secondary" : "default"}
              className="w-full group shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              {actionText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </CarouselCardWrapper>
  );
}
