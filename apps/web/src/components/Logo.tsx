import React from 'react';

interface LogoProps {
  size?: number;
  'aria-label'?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  'aria-label': ariaLabel = 'FUEP Logo',
  className = '',
}) => {
  // Try to import SVG first, fallback to PNG
  let logoSrc: string;

  try {
    // Dynamic import with fallback
    logoSrc = new URL('../../assets/badges/fuep_badge.png', import.meta.url).href;
  } catch {
    // Fallback to static path
    logoSrc = '/assets/badges/fuep_badge.png';
  }

  return (
    <img
      src={logoSrc}
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        objectFit: 'contain',
        height: `${size}px`,
        width: 'auto',
      }}
    />
  );
};

export default Logo;
