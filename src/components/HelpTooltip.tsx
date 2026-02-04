import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  title: string;
  description: string;
  tips?: string[];
  variant?: 'icon' | 'button';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  description,
  tips = [],
  variant = 'icon',
  className
}) => {
  const [open, setOpen] = useState(false);

  const trigger = variant === 'button' ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setOpen(true)}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <HelpCircle className="w-4 h-4 mr-1" />
      帮助
    </Button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className={cn(
        "p-1 rounded-full text-muted-foreground hover:text-foreground",
        "hover:bg-muted transition-colors",
        className
      )}
      aria-label="帮助"
    >
      <Info className="w-4 h-4" />
    </button>
  );

  return (
    <>
      {trigger}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          {tips.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-foreground">使用技巧：</p>
              <ul className="space-y-1.5">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Button onClick={() => setOpen(false)} className="w-full mt-4">
            知道了
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
