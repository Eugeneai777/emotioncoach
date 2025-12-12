import React from "react";

interface IconProps {
  className?: string;
}

const PowerlessIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="powerlessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      
      {/* 蜷缩的身体 - 主体 */}
      <ellipse
        cx="24"
        cy="30"
        rx="16"
        ry="12"
        fill="url(#powerlessGradient)"
        opacity="0.9"
      />
      
      {/* 头部埋在身体里 */}
      <circle
        cx="24"
        cy="24"
        r="10"
        fill="url(#powerlessGradient)"
      />
      
      {/* 闭着的眼睛 - 疲惫感 */}
      <path
        d="M19 23C19 23 21 24 23 23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25 23C25 23 27 24 29 23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 嘴巴 - 微微张开 */}
      <ellipse cx="24" cy="28" rx="2" ry="1" fill="white" opacity="0.7" />
      
      {/* 手臂环抱自己 */}
      <path
        d="M12 28C12 28 14 34 20 36"
        stroke="url(#powerlessGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M36 28C36 28 34 34 28 36"
        stroke="url(#powerlessGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* 低能量指示 */}
      <rect x="6" y="42" width="36" height="4" rx="2" fill="#e5e7eb" opacity="0.5" />
      <rect x="6" y="42" width="8" height="4" rx="2" fill="url(#powerlessGradient)" opacity="0.7" />
    </svg>
  );
};

export default PowerlessIcon;
