import React from "react";

interface IconProps {
  className?: string;
}

const PanicIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="panicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      
      {/* 漩涡波纹 - 外圈 */}
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="url(#panicGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <circle
        cx="24"
        cy="24"
        r="15"
        stroke="url(#panicGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <circle
        cx="24"
        cy="24"
        r="10"
        stroke="url(#panicGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      
      {/* 中心心脏 */}
      <path
        d="M24 32C24 32 18 26 18 22C18 19.5 20 18 22 18C23.5 18 24 19 24 19C24 19 24.5 18 26 18C28 18 30 19.5 30 22C30 26 24 32 24 32Z"
        fill="url(#panicGradient)"
      />
      
      {/* 小波动线 */}
      <path
        d="M8 24C10 22 12 26 14 24"
        stroke="url(#panicGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M34 24C36 22 38 26 40 24"
        stroke="url(#panicGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

export default PanicIcon;
