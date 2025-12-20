import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export interface TourStep {
  icon: string;
  title: string;
  description: string;
  details?: string[];
}

interface PageTourProps {
  open: boolean;
  onComplete: () => void;
  steps: TourStep[];
  pageTitle?: string;
}

export const PageTour: React.FC<PageTourProps> = ({
  open,
  onComplete,
  steps,
  pageTitle
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent hideCloseButton className="sm:max-w-md p-0 gap-0 overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 border-0">
        <VisuallyHidden>
          <DialogTitle>{pageTitle || '页面引导'}</DialogTitle>
        </VisuallyHidden>
        {/* Header with skip button */}
        <div className="flex justify-between items-center p-4 pb-0">
          {pageTitle && (
            <span className="text-sm font-medium text-muted-foreground">
              {pageTitle}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-8 w-8 ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center space-y-4">
          {/* Icon */}
          <div className="text-5xl animate-bounce-gentle">
            {step.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>

          {/* Details */}
          {step.details && step.details.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 space-y-2">
              {step.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-2 text-left">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-sm text-muted-foreground">{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 space-y-3">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "bg-primary w-6"
                    : "bg-primary/30 hover:bg-primary/50"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一步
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white",
                isFirstStep && "w-full"
              )}
            >
              {isLastStep ? "开始使用" : "下一步"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add gentle bounce animation
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce-gentle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .animate-bounce-gentle {
    animation: bounce-gentle 2s ease-in-out infinite;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-page-tour-style]')) {
  style.setAttribute('data-page-tour-style', 'true');
  document.head.appendChild(style);
}
