import React from "react";

interface IconProps {
  className?: string;
}

const WorryIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="worryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      
      {/* 头顶思考云朵 */}
      <ellipse cx="18" cy="10" rx="5" ry="4" fill="url(#worryGradient)" opacity="0.4" />
      <ellipse cx="26" cy="8" rx="6" ry="5" fill="url(#worryGradient)" opacity="0.5" />
      <ellipse cx="32" cy="12" rx="4" ry="3" fill="url(#worryGradient)" opacity="0.4" />
      
      {/* 圆脸 */}
      <circle
        cx="24"
        cy="28"
        r="14"
        fill="url(#worryGradient)"
        opacity="0.9"
      />
      
      {/* 担忧的眉毛 */}
      <path
        d="M17 24C18 23 20 23 21 24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M27 24C28 23 30 23 31 24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 眼睛 */}
      <circle cx="19" cy="27" r="2" fill="white" />
      <circle cx="29" cy="27" r="2" fill="white" />
      
      {/* 嘴巴 - 微微张开 */}
      <ellipse cx="24" cy="34" rx="3" ry="2" fill="white" opacity="0.8" />
      
      {/* 问号 */}
      <text x="34" y="18" fontSize="10" fill="url(#worryGradient)" fontWeight="bold">?</text>
    </svg>
  );
};

export default WorryIcon;
