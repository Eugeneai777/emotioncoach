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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{emoji}</span>
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {subtitle && (
              <p
                className={
                  textColor === "light"
                    ? "text-sm text-primary-foreground/80"
                    : "text-sm text-muted-foreground"
                }
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
              className="w-20 h-20 object-cover rounded-lg ml-4 shadow-md"
            />
          )}
        </div>

        {/* Image - Top Position */}
        {imageUrl && imagePosition === "top" && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-32 object-cover rounded-lg mb-4 shadow-md"
          />
        )}

        {/* Content */}
        <div className="flex-1">
          {description && (
            <p
              className={
                textColor === "light"
                  ? "text-sm leading-relaxed text-primary-foreground/90"
                  : "text-sm leading-relaxed text-foreground/90"
              }
            >
              {description}
            </p>
          )}
        </div>

        {/* Action Button */}
        {actionText && onAction && (
          <div className="mt-4">
            <Button
              onClick={onAction}
              variant={textColor === "light" ? "secondary" : "default"}
              className="w-full group"
            >
              {actionText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>

      {/* Background Image */}
      {imageUrl && imagePosition === "background" && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
    </CarouselCardWrapper>
  );
}
