import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionOption {
  value: string;
  label: string;
  emoji: string;
}

interface Question {
  id: string;
  question: string;
  subtitle: string;
  type: "single" | "multi";
  maxSelect?: number;
  options: QuestionOption[];
}

interface IntakeQuestionCardProps {
  question: Question;
  selectedValues: string[];
  onAnswer: (values: string[]) => void;
}

export const IntakeQuestionCard: React.FC<IntakeQuestionCardProps> = ({
  question,
  selectedValues,
  onAnswer,
}) => {
  const handleOptionClick = (value: string) => {
    if (question.type === "single") {
      onAnswer([value]);
    } else {
      const isSelected = selectedValues.includes(value);
      if (isSelected) {
        onAnswer(selectedValues.filter((v) => v !== value));
      } else {
        const maxSelect = question.maxSelect || question.options.length;
        if (selectedValues.length < maxSelect) {
          onAnswer([...selectedValues, value]);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Question header */}
      <div className="text-center space-y-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
          {question.question}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{question.subtitle}</p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                "flex items-center gap-3",
                isSelected
                  ? "border-orange-400 bg-orange-50 shadow-md"
                  : "border-border bg-white/80 hover:border-orange-200 hover:bg-orange-50/50"
              )}
            >
              {/* Emoji */}
              <span className="text-2xl shrink-0">{option.emoji}</span>
              
              {/* Label */}
              <span
                className={cn(
                  "flex-1 font-medium",
                  isSelected ? "text-orange-700" : "text-foreground"
                )}
              >
                {option.label}
              </span>
              
              {/* Check indicator */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  isSelected
                    ? "border-orange-500 bg-orange-500"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Multi-select hint */}
      {question.type === "multi" && (
        <p className="text-center text-xs text-muted-foreground">
          已选择 {selectedValues.length} 项
          {question.maxSelect && ` (最多 ${question.maxSelect} 项)`}
        </p>
      )}
    </motion.div>
  );
};
