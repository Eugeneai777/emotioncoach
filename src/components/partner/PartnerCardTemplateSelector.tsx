/**
 * Partner Card Template Selector
 * 
 * A grid of 4 content-based template options for the partner plan share card.
 * Templates: income (收益版), products (产品版), easystart (入门版), testimonial (证言版)
 */

import { cn } from '@/lib/utils';
import { 
  PARTNER_CARD_CONTENT_TEMPLATES, 
  PartnerCardContentTemplate, 
  PARTNER_CARD_CONTENT_TEMPLATE_LIST 
} from '@/config/partnerShareCardStyles';

interface PartnerCardTemplateSelectorProps {
  selectedTemplate: PartnerCardContentTemplate;
  onTemplateChange: (template: PartnerCardContentTemplate) => void;
  className?: string;
}

export function PartnerCardTemplateSelector({
  selectedTemplate,
  onTemplateChange,
  className,
}: PartnerCardTemplateSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">选择分享模板</p>
      <div className="grid grid-cols-2 gap-2">
        {PARTNER_CARD_CONTENT_TEMPLATE_LIST.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              className={cn(
                "relative flex items-start gap-2 p-3 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
              )}
            >
              <span className="text-lg flex-shrink-0">{template.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{template.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {template.description}
                </div>
              </div>
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
