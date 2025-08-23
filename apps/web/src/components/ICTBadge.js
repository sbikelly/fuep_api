import { jsx as _jsx } from 'react/jsx-runtime';
export const ICTBadge = ({ size = 24, className = '' }) => {
  // Try to import PNG asset
  let badgeSrc;
  try {
    // Dynamic import with fallback
    badgeSrc = new URL('../../assets/badges/ict_badge.png', import.meta.url).href;
  } catch {
    // Fallback to static path
    badgeSrc = '/assets/badges/ict_badge.png';
  }
  return _jsx('img', {
    src: badgeSrc,
    alt: 'Powered by ICT',
    width: size,
    height: size,
    className: className,
    role: 'img',
    style: {
      display: 'inline-block',
      objectFit: 'contain',
      height: `${size}px`,
      width: 'auto',
      verticalAlign: 'middle',
    },
  });
};
export default ICTBadge;
