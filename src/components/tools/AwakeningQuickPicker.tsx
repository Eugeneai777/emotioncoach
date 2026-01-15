import { motion } from "framer-motion";
import { awakeningDimensions, AwakeningType } from "@/config/awakeningConfig";

interface AwakeningQuickPickerProps {
  selected: AwakeningType | null;
  onSelect: (type: AwakeningType | null) => void;
}

export const AwakeningQuickPicker = ({ selected, onSelect }: AwakeningQuickPickerProps) => {
  const handleClick = (type: AwakeningType) => {
    if (selected === type) {
      onSelect(null); // Deselect if clicking the same
    } else {
      onSelect(type);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex-shrink-0">───</span>
        <span>顺便觉察一下？</span>
        <span className="flex-shrink-0">───</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {awakeningDimensions.map((dimension) => {
          const isSelected = selected === dimension.id;
          
          return (
            <motion.button
              key={dimension.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(dimension.id)}
              className={`
                relative px-3 py-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center gap-1.5
                ${isSelected 
                  ? `bg-gradient-to-r ${dimension.gradient} text-white shadow-md` 
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <span className="text-base">{dimension.emoji}</span>
              <span>{dimension.title}</span>
              
              {isSelected && (
                <motion.div
                  layoutId="awakening-selected"
                  className="absolute inset-0 rounded-lg border-2 border-white/50"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {selected && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs text-center text-muted-foreground"
        >
          打卡后可直接进入{awakeningDimensions.find(d => d.id === selected)?.title}觉察
        </motion.p>
      )}
    </div>
  );
};
