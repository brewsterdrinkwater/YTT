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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Shackle — U-shaped arch */}
      <path d="M16 24 L16 16 Q16 7 24 7 Q32 7 32 16 L32 24" />
      {/* Lock body */}
      <rect x="9" y="22" width="30" height="22" rx="4" />
      {/* Keyhole circle */}
      <circle cx="24" cy="31" r="3.5" fill="currentColor" stroke="none" />
      {/* Keyhole slot */}
      <rect x="22.5" y="34" width="3" height="5" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
};

export default VaultIcon;
