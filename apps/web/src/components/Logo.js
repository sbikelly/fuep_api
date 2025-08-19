import { jsx as _jsx } from 'react/jsx-runtime';
export const Logo = ({ size = 36, 'aria-label': ariaLabel = 'FUEP Logo', className = '' }) => {
  // Try to import SVG first, fallback to PNG
  let logoSrc;
  try {
    // Dynamic import with fallback
    logoSrc = new URL('../../assets/badges/fuep_badge.png', import.meta.url).href;
  } catch {
    // Fallback to static path
    logoSrc = '/assets/badges/fuep_badge.png';
  }
  return _jsx('img', {
    src: logoSrc,
    alt: ariaLabel,
    width: size,
    height: size,
    className: className,
    style: {
      display: 'block',
      objectFit: 'contain',
      height: `${size}px`,
      width: 'auto',
    },
  });
};
export default Logo;
