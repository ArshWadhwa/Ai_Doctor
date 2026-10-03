import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Signature Asklepios curved medical cross icon
 * Accurately styled after the geometric cross emblem in the design reference
 */
export const AsklepiosCross: React.FC<{ className?: string; size?: number; color?: string }> = ({ 
  className = "w-6 h-6", 
  size = 28,
  color = "currentColor" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Asklepios Cross"
    >
      {/* Curved modern medical cross with tapered organic geometry */}
      <path 
        d="M14 2C14 7.2 10.2 11.2 5 11.2C3.3 11.2 2 12.5 2 14C2 15.5 3.3 16.8 5 16.8C10.2 16.8 14 20.8 14 26C14 27.7 15.3 29 17 29C18.7 29 20 27.7 20 26C20 20.8 23.8 16.8 29 16.8C30.7 16.8 32 15.5 32 14C32 12.5 30.7 11.2 29 11.2C23.8 11.2 20 7.2 20 2C20 0.3 18.7 -1 17 -1C15.3 -1 14 0.3 14 2Z" 
        transform="scale(0.85) translate(2, 2)"
        fill={color}
      />
    </svg>
  );
};

/**
 * Full Asklepios brand mark with logo and typography
 */
export const AsklepiosBrand: React.FC<{ 
  showSubtitle?: boolean; 
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}> = ({ 
  showSubtitle = false, 
  size = 'md',
  theme = 'light' 
}) => {
  const isDark = theme === 'dark';
  
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`flex items-center justify-center transition-transform duration-300 hover:rotate-90 ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}>
        <AsklepiosCross 
          size={size === 'sm' ? 22 : size === 'lg' ? 34 : 28} 
          className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7'} 
        />
      </div>
      <div>
        <span className={`font-semibold tracking-tight leading-none ${
          size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
        } ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Medly
        </span>
        {showSubtitle && (
          <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-600">
            Health AI
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Signature Royal Blue Action Button with White '+' Icon from the design
 * Supports both direct router navigation via `to` prop and click handler via `onClick`
 */
export const ActionPlusButton: React.FC<{
  to?: string;
  onClick?: () => void;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}> = ({ to, onClick, title = "Open Action", className = "", size = "md", ariaLabel }) => {
  const sizeClasses = {
    sm: "w-9 h-9 text-lg rounded-xl",
    md: "w-11 h-11 text-xl rounded-2xl",
    lg: "w-13 h-13 text-2xl rounded-2xl",
  }[size];

  const commonClasses = `${sizeClasses} bg-[#0062ff] hover:bg-blue-600 active:scale-95 text-white font-medium flex items-center justify-center shadow-md shadow-blue-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${className}`;

  const icon = (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );

  if (to) {
    return (
      <Link
        to={to}
        title={title}
        aria-label={ariaLabel || title}
        className={commonClasses}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      className={commonClasses}
    >
      {icon}
    </button>
  );
};

