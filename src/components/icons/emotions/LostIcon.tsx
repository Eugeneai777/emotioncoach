import React from "react";

interface IconProps {
  className?: string;
}

const LostIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="lostGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      
      {/* 心形主体 */}
      <path
        d="M24 42C24 42 8 30 8 18C8 12 12 8 18 8C21 8 24 10 24 10C24 10 27 8 30 8C36 8 40 12 40 18C40 30 24 42 24 42Z"
        fill="url(#lostGradient)"
        opacity="0.9"
      />
      
      {/* 裂纹线条 */}
      <path
        d="M24 14L22 20L26 24L22 30L24 38"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      
      {/* 小裂纹分支 */}
      <path
        d="M22 20L18 22"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M26 24L30 23"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M22 30L18 32"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* 散落的小心形碎片 */}
      <path
        d="M6 12C6 12 4 10 4 8C4 7 5 6 6 6C6.5 6 7 6.5 7 6.5C7 6.5 7.5 6 8 6C9 6 10 7 10 8C10 10 7 12 7 12Z"
        fill="url(#lostGradient)"
        opacity="0.4"
      />
      <path
        d="M40 10C40 10 38 8 38 6C38 5 39 4 40 4C40.5 4 41 4.5 41 4.5C41 4.5 41.5 4 42 4C43 4 44 5 44 6C44 8 41 10 41 10Z"
        fill="url(#lostGradient)"
        opacity="0.4"
      />
    </svg>
  );
};

export default LostIcon;
