import React from 'react';

interface ICTBadgeProps {
  size?: number;
  className?: string;
}

export const ICTBadge: React.FC<ICTBadgeProps> = ({ size = 24, className = '' }) => {
  // Try to import PNG asset
  let badgeSrc: string;

  try {
    // Dynamic import with fallback
    badgeSrc = new URL('../../assets/badges/ict_badge.png', import.meta.url).href;
  } catch {
    // Fallback to static path
    badgeSrc = '/assets/badges/ict_badge.png';
  }

  return (
    <img
      src={badgeSrc}
      alt="Powered by ICT"
      width={size}
      height={size}
      className={className}
      role="img"
      style={{
        display: 'inline-block',
        objectFit: 'contain',
        height: `${size}px`,
        width: 'auto',
        verticalAlign: 'middle',
      }}
    />
  );
};

export default ICTBadge;
