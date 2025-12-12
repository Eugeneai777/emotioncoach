import React from "react";

interface IconProps {
  className?: string;
}

const CollapseIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="collapseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      
      {/* 雨滴背景 */}
      <path d="M10 4L10 8" stroke="url(#collapseGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M18 2L18 6" stroke="url(#collapseGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M30 3L30 7" stroke="url(#collapseGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M38 5L38 9" stroke="url(#collapseGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      
      {/* 拥抱自己的身体 */}
      <ellipse
        cx="24"
        cy="30"
        rx="14"
        ry="12"
        fill="url(#collapseGradient)"
        opacity="0.9"
      />
      
      {/* 头部 */}
      <circle
        cx="24"
        cy="20"
        r="10"
        fill="url(#collapseGradient)"
      />
      
      {/* 哭泣的眼睛 */}
      <ellipse cx="20" cy="19" rx="2" ry="2.5" fill="white" />
      <ellipse cx="28" cy="19" rx="2" ry="2.5" fill="white" />
      <circle cx="20" cy="20" r="1" fill="#1e1e1e" />
      <circle cx="28" cy="20" r="1" fill="#1e1e1e" />
      
      {/* 眼泪 */}
      <path
        d="M20 22C20 22 19 26 20 28C21 26 20 22 20 22Z"
        fill="#60a5fa"
        opacity="0.8"
      />
      <path
        d="M28 22C28 22 27 26 28 28C29 26 28 22 28 22Z"
        fill="#60a5fa"
        opacity="0.8"
      />
      
      {/* 悲伤的嘴巴 */}
      <path
        d="M21 25C22 24 26 24 27 25"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 自我拥抱的手臂 */}
      <path
        d="M10 26C12 30 16 34 20 34"
        stroke="url(#collapseGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M38 26C36 30 32 34 28 34"
        stroke="url(#collapseGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
};

export default CollapseIcon;
