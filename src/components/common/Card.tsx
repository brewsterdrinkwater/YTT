import React, { ReactNode } from 'react';

/**
 * Walt-tab Card Component
 * Brutalist style: white background, subtle border, minimal shadow
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  hover = false,
  variant = 'default',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    // Default: white with subtle border
    default: 'bg-white border border-steel',
    // Outlined: stronger border, no fill
    outlined: 'bg-transparent border-2 border-black',
    // Elevated: subtle shadow
    elevated: 'bg-white border border-steel shadow-subtle',
  };

  const baseClasses = 'rounded transition-all duration-200';
  const hoverClasses = hover
    ? 'hover:border-black hover:shadow-sm cursor-pointer'
    : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default Card;
