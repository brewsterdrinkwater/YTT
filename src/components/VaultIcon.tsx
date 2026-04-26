import React from 'react';

interface VaultIconProps {
  size?: number;
  className?: string;
}

const VaultIcon: React.FC<VaultIconProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer frame ring */}
      <circle cx="24" cy="24" r="21" strokeWidth="2.5" />
      {/* Vault door face */}
      <circle cx="24" cy="24" r="14.5" strokeWidth="2" />
      {/* Combination lock ring */}
      <circle cx="24" cy="24" r="7" strokeWidth="1.5" />
      {/* Lock center indicator */}
      <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
      {/* Locking bolts in the gap — 12, 3, 6 o'clock */}
      <line x1="24" y1="9" x2="24" y2="4"  strokeWidth="3.5" strokeLinecap="butt" />
      <line x1="39" y1="24" x2="44" y2="24" strokeWidth="3.5" strokeLinecap="butt" />
      <line x1="24" y1="39" x2="24" y2="44" strokeWidth="3.5" strokeLinecap="butt" />
      {/* Handle — 9 o'clock (left side) */}
      <line x1="9.5" y1="24" x2="3" y2="24" strokeWidth="3" />
      <circle cx="3" cy="24" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
};

export default VaultIcon;
