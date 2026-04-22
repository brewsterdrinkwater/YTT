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
      className={className}
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="20" />
      {/* Inner ring */}
      <circle cx="24" cy="24" r="12" />
      {/* Center hub */}
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      {/* Radial spokes — vault wheel handle */}
      <line x1="24" y1="12" x2="24" y2="4" />
      <line x1="24" y1="36" x2="24" y2="44" />
      <line x1="12" y1="24" x2="4"  y2="24" />
      <line x1="36" y1="24" x2="44" y2="24" />
      <line x1="15.5" y1="15.5" x2="9"  y2="9"  />
      <line x1="32.5" y1="32.5" x2="39" y2="39" />
      <line x1="32.5" y1="15.5" x2="39" y2="9"  />
      <line x1="15.5" y1="32.5" x2="9"  y2="39" />
      {/* Lock shackle at top */}
      <path d="M20 4 Q20 1 24 1 Q28 1 28 4" strokeWidth="1.5" />
    </svg>
  );
};

export default VaultIcon;
