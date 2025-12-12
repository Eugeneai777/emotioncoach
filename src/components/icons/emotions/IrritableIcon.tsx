import React from "react";

interface IconProps {
  className?: string;
}

const IrritableIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="irritableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      
      {/* 头顶冒烟 */}
      <path
        d="M18 8C18 8 16 5 18 3"
        stroke="url(#irritableGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M24 6C24 6 22 3 24 1"
        stroke="url(#irritableGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M30 8C30 8 28 5 30 3"
        stroke="url(#irritableGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* 圆脸 */}
      <circle
        cx="24"
        cy="28"
        r="16"
        fill="url(#irritableGradient)"
        opacity="0.9"
      />
      
      {/* 愤怒的眉毛 - V形 */}
      <path
        d="M15 22L21 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M33 22L27 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* 眼睛 */}
      <circle cx="18" cy="27" r="2.5" fill="white" />
      <circle cx="30" cy="27" r="2.5" fill="white" />
      
      {/* 紧绷的嘴巴 */}
      <path
        d="M18 35C20 33 28 33 30 35"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* 脸颊红晕 */}
      <circle cx="12" cy="30" r="3" fill="#fee2e2" opacity="0.5" />
      <circle cx="36" cy="30" r="3" fill="#fee2e2" opacity="0.5" />
    </svg>
  );
};

export default IrritableIcon;
