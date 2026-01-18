import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AwakeningQuickSelectProps {
  words: string[];
  selectedWords: string[];
  onSelect: (word: string) => void;
  primaryColor: string;
}

const AwakeningQuickSelect: React.FC<AwakeningQuickSelectProps> = ({
  words,
  selectedWords,
  onSelect,
  primaryColor
}) => {
  const getColorClasses = (isSelected: boolean) => {
    const colorMap: Record<string, { selected: string; unselected: string }> = {
      red: {
        selected: 'bg-red-500 text-white border-red-500',
        unselected: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
      },
      amber: {
        selected: 'bg-amber-500 text-white border-amber-500',
        unselected: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      },
      blue: {
        selected: 'bg-blue-500 text-white border-blue-500',
        unselected: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      },
      purple: {
        selected: 'bg-purple-500 text-white border-purple-500',
        unselected: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      },
      pink: {
        selected: 'bg-pink-500 text-white border-pink-500',
        unselected: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
      },
      teal: {
        selected: 'bg-teal-500 text-white border-teal-500',
        unselected: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
      }
    };
    
    const colors = colorMap[primaryColor] || colorMap.blue;
    return isSelected ? colors.selected : colors.unselected;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {words.map((word, index) => {
        const isSelected = selectedWords.includes(word);
        return (
          <motion.button
            key={word}
            initial={{ opacity: 0.01, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileTap={{ scale: 0.95 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            onClick={() => onSelect(word)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
              getColorClasses(isSelected)
            )}
          >
            {word}
          </motion.button>
        );
      })}
    </div>
  );
};

export default AwakeningQuickSelect;
