import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CallButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function CallButton({ 
  onClick, 
  disabled = false, 
  variant = 'default',
  className 
}: CallButtonProps) {
  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "gap-1.5 text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300",
          className
        )}
      >
        <Phone className="w-4 h-4" />
        语音通话
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg",
        className
      )}
    >
      <Phone className="w-5 h-5" />
      发起语音通话
    </Button>
  );
}
