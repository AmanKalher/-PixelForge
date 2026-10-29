import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'transparent' | 'image';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const BrandLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 3 Top-right Sun Rays in Butter Yellow */}
      <line x1="86" y1="23" x2="82" y2="34" stroke="#F7D774" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="97" y1="33" x2="87" y2="42" stroke="#F7D774" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="100" y1="48" x2="89" y2="49" stroke="#F7D774" strokeWidth="5.5" strokeLinecap="round" />

      {/* Coral Petal (Top-Right) */}
      <rect x="53" y="27" width="31" height="30" rx="9" transform="rotate(22 68.5 42)" fill="#F26B5B" />

      {/* Plum Petal (Top-Left) */}
      <rect x="26" y="42" width="28" height="28" rx="8" transform="rotate(-18 40 56)" fill="#6D3B67" />

      {/* Butter Yellow Petal (Bottom-Right) */}
      <rect x="66" y="55" width="26" height="26" rx="8" transform="rotate(15 79 68)" fill="#F7D774" />

      {/* Sage Petal (Bottom-Left) */}
      <rect x="42" y="66" width="32" height="30" rx="9" transform="rotate(20 58 81)" fill="#A8B9A0" />

      {/* Mini Pixels (Bottom-Left) */}
      <rect x="20" y="78" width="9" height="9" rx="2.5" fill="#F26B5B" />
      <rect x="29" y="86" width="7" height="7" rx="2" fill="#F7D774" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'transparent',
  className = '',
}) => {
  const containerClasses = {
    light: 'bg-white rounded-xl shadow-xs border border-[#F0EAE1]',
    dark: 'bg-[#6D3B67] rounded-xl shadow-xs border border-[#5A3055]',
    transparent: '',
    image: 'rounded-xl overflow-hidden shadow-xs border border-[#F0EAE1]',
  }[variant];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${containerClasses} ${className}`}
    >
      <img
        src="/brand-mark.png"
        alt="PixelForge Logo"
        className="w-full h-full object-cover rounded-inherit"
        onError={(e) => {
          // Fallback to inline SVG if image doesn't load
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent && !parent.querySelector('svg')) {
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'w-full h-full p-1';
            parent.appendChild(svgWrapper);
          }
        }}
      />
    </div>
  );
};
