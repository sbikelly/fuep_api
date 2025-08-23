/**
 * Get the API base URL with deterministic resolution.
 * Priority: 1) window.APP_CONFIG.API_BASE_URL 2) import.meta.env.VITE_API_BASE_URL 3) '/api'
 * This lets dev (Vite) and Docker use the same '/api' base with their respective proxies.
 */
export const getApiBaseUrl = () => {
  if (window.APP_CONFIG?.API_BASE_URL) return window.APP_CONFIG.API_BASE_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  return '/api';
};
/**
 * Get the brand primary color
 */
export const getBrandPrimaryColor = () => {
  return (
    window.APP_CONFIG?.BRAND_PRIMARY_COLOR || import.meta.env.VITE_BRAND_PRIMARY_COLOR || '#134F47'
  );
};
/**
 * Get the full configuration object
 */
export const getAppConfig = () => ({
  API_BASE_URL: getApiBaseUrl(),
  BRAND_PRIMARY_COLOR: getBrandPrimaryColor(),
});
/**
 * Log current configuration for debugging
 */
export const logAppConfig = () => {
  console.log('Current app configuration:', getAppConfig());
};
/**
 * Wait for APP_CONFIG to be available
 */
export const waitForConfig = () => {
  return new Promise((resolve) => {
    if (window.APP_CONFIG) {
      resolve();
    } else {
      // Wait for the script to execute
      const checkConfig = () => {
        if (window.APP_CONFIG) {
          resolve();
        } else {
          setTimeout(checkConfig, 10);
        }
      };
      checkConfig();
    }
  });
};
