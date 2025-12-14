import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingStepResult } from "./OnboardingStepResult";
import { OnboardingStepCoachValue } from "./OnboardingStepCoachValue";
import { OnboardingStepHowToUse } from "./OnboardingStepHowToUse";
import { OnboardingStepCampValue } from "./OnboardingStepCampValue";
import { OnboardingStepChooseNext } from "./OnboardingStepChooseNext";

interface IntakeOnboardingFlowProps {
  primaryType: string;
  secondaryType: string | null;
  onStartCamp: () => void;
  onStartChat: () => void;
}

const TOTAL_STEPS = 5;

export const IntakeOnboardingFlow = ({
  primaryType,
  secondaryType,
  onStartCamp,
  onStartChat,
}: IntakeOnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingStepResult
            primaryType={primaryType}
            secondaryType={secondaryType}
          />
        );
      case 2:
        return <OnboardingStepCoachValue />;
      case 3:
        return <OnboardingStepHowToUse />;
      case 4:
        return <OnboardingStepCampValue />;
      case 5:
        return (
          <OnboardingStepChooseNext
            onStartCamp={onStartCamp}
            onStartChat={onStartChat}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index + 1 === currentStep
                ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                : index + 1 < currentStep
                ? "w-2 bg-purple-400"
                : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep < TOTAL_STEPS && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一步
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            下一步
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
