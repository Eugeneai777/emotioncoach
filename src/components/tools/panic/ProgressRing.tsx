import React from "react";

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  current,
  total,
  size = 80,
  strokeWidth = 6,
  colorClass = "stroke-teal-500"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(current / total, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-teal-100"
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorClass}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.5s ease-out"
          }}
        />
      </svg>
      {/* 中心文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-teal-700">
          {current}/{total}
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
