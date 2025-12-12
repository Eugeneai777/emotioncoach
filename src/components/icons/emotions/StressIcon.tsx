import React from "react";

interface IconProps {
  className?: string;
}

const StressIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="stressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      
      {/* 肩上重物 */}
      <rect
        x="8"
        y="6"
        width="32"
        height="8"
        rx="2"
        fill="url(#stressGradient)"
        opacity="0.5"
      />
      <text x="18" y="12" fontSize="6" fill="white" fontWeight="bold">重</text>
      
      {/* 弯曲的身体 */}
      <ellipse
        cx="24"
        cy="32"
        rx="14"
        ry="12"
        fill="url(#stressGradient)"
        opacity="0.9"
      />
      
      {/* 低头 */}
      <circle
        cx="24"
        cy="22"
        r="8"
        fill="url(#stressGradient)"
      />
      
      {/* 紧皱眉头 */}
      <path
        d="M20 20L22 21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 20L26 21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 闭着的眼睛 */}
      <path
        d="M20 23C20 23 21 24 22 23"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M26 23C26 23 27 24 28 23"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 嘴巴 */}
      <path
        d="M22 27H26"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* 汗滴 */}
      <path
        d="M34 18C34 18 36 22 34 24C32 22 34 18 34 18Z"
        fill="#60a5fa"
        opacity="0.7"
      />
    </svg>
  );
};

export default StressIcon;
