import React from "react";

interface IconProps {
  className?: string;
}

const FearIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="fearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* 保护盾牌 */}
      <path
        d="M10 18C10 18 10 32 24 40C24 40 38 32 38 18L24 12L10 18Z"
        fill="url(#fearGradient)"
        opacity="0.3"
        stroke="url(#fearGradient)"
        strokeWidth="2"
      />
      
      {/* 躲在盾牌后的圆脸 */}
      <circle
        cx="24"
        cy="26"
        r="12"
        fill="url(#fearGradient)"
        opacity="0.9"
      />
      
      {/* 害怕的大眼睛 */}
      <ellipse cx="20" cy="24" rx="3" ry="4" fill="white" />
      <ellipse cx="28" cy="24" rx="3" ry="4" fill="white" />
      <circle cx="20" cy="25" r="1.5" fill="#1e1e1e" />
      <circle cx="28" cy="25" r="1.5" fill="#1e1e1e" />
      
      {/* 紧闭的嘴巴 */}
      <path
        d="M21 32H27"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 手遮挡效果 */}
      <ellipse cx="14" cy="28" rx="4" ry="6" fill="url(#fearGradient)" opacity="0.7" />
      <ellipse cx="34" cy="28" rx="4" ry="6" fill="url(#fearGradient)" opacity="0.7" />
    </svg>
  );
};

export default FearIcon;
