import React from "react";
import PanicIcon from "./PanicIcon";
import WorryIcon from "./WorryIcon";
import NegativeIcon from "./NegativeIcon";
import FearIcon from "./FearIcon";
import IrritableIcon from "./IrritableIcon";
import StressIcon from "./StressIcon";
import PowerlessIcon from "./PowerlessIcon";
import CollapseIcon from "./CollapseIcon";
import LostIcon from "./LostIcon";

interface EmotionIconProps {
  type: string;
  className?: string;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  panic: PanicIcon,
  worry: WorryIcon,
  negative: NegativeIcon,
  fear: FearIcon,
  irritable: IrritableIcon,
  stress: StressIcon,
  powerless: PowerlessIcon,
  collapse: CollapseIcon,
  lost: LostIcon,
};

const EmotionIcon: React.FC<EmotionIconProps> = ({ type, className = "w-12 h-12" }) => {
  const IconComponent = iconMap[type];
  
  if (!IconComponent) {
    // 降级为默认心形图标
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M24 42C24 42 8 30 8 18C8 12 12 8 18 8C21 8 24 10 24 10C24 10 27 8 30 8C36 8 40 12 40 18C40 30 24 42 24 42Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
    );
  }
  
  return <IconComponent className={className} />;
};

export default EmotionIcon;
