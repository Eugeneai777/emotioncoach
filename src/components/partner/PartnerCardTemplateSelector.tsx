/**
 * Partner Card Template Selector
 * 
 * A grid of 4 template options for the partner plan share card.
 * Follows the same pattern as ShareCardStyleSelector.
 */

import { cn } from '@/lib/utils';
import { PARTNER_CARD_STYLES, PartnerCardTemplate, PARTNER_CARD_TEMPLATE_LIST } from '@/config/partnerShareCardStyles';

interface PartnerCardTemplateSelectorProps {
  selectedTemplate: PartnerCardTemplate;
  onTemplateChange: (template: PartnerCardTemplate) => void;
  className?: string;
}

export function PartnerCardTemplateSelector({
  selectedTemplate,
  onTemplateChange,
  className,
}: PartnerCardTemplateSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">选择风格</p>
      <div className="grid grid-cols-4 gap-2">
        {PARTNER_CARD_TEMPLATE_LIST.map((style) => {
          const isSelected = selectedTemplate === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onTemplateChange(style.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <div
                className="w-full h-6 rounded-md border border-black/5"
                style={{ background: style.previewGradient }}
              />
              <span className="text-[10px] text-muted-foreground">
                {style.label}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-primary-foreground">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
