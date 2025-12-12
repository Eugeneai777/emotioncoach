import React from "react";

interface IconProps {
  className?: string;
}

const NegativeIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>
      
      {/* 低头的圆脸 */}
      <circle
        cx="24"
        cy="26"
        r="16"
        fill="url(#negativeGradient)"
        opacity="0.9"
      />
      
      {/* 低垂的眉毛 */}
      <path
        d="M16 22C17 24 20 24 21 23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M27 23C28 24 31 24 32 22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 半闭的眼睛 */}
      <path
        d="M17 26C17 26 18 27 19.5 27C21 27 22 26 22 26"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 26C26 26 27 27 28.5 27C30 27 31 26 31 26"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 向下弯的嘴巴 */}
      <path
        d="M20 33C22 31 26 31 28 33"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 阴影效果 - 头顶乌云 */}
      <ellipse cx="24" cy="8" rx="10" ry="4" fill="url(#negativeGradient)" opacity="0.3" />
    </svg>
  );
};

export default NegativeIcon;
