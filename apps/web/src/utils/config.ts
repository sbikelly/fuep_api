// Declare global types for runtime configuration
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL?: string;
      BRAND_PRIMARY_COLOR?: string;
    };
  }
}

/**
 * Get the API base URL with fallback logic
 * Priority: Runtime Config > Environment Variable > Default
 */
export const getApiBaseUrl = (): string => {
  console.log('getApiBaseUrl called');
  console.log('window.APP_CONFIG:', window.APP_CONFIG);
  console.log('window.location.hostname:', window.location.hostname);
  console.log('window.location.port:', window.location.port);

  // Try to get from runtime configuration first
  if (window.APP_CONFIG?.API_BASE_URL) {
    console.log('Using runtime config:', window.APP_CONFIG.API_BASE_URL);
    return window.APP_CONFIG.API_BASE_URL;
  }

  // Try to get from environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  console.log('Environment variable VITE_API_BASE_URL:', envUrl);
  if (envUrl) {
    console.log('Using environment variable:', envUrl);
    return envUrl;
  }

  // Smart fallback based on environment detection
  if (window.location.port === '8080') {
    // Running behind reverse proxy (Docker Compose)
    console.log('Using reverse proxy fallback: /api');
    return '/api';
  } else if (window.location.port === '5173') {
    // Check if we're in Docker or local development
    if (window.location.hostname === 'localhost') {
      // Running on Vite dev server (local development)
      console.log('Using Vite dev server fallback: http://localhost:4000');
      return 'http://localhost:4000';
    } else {
      // Running in Docker container on port 5173
      console.log('Using Docker container fallback: /api');
      return '/api';
    }
  } else if (window.location.hostname === 'localhost') {
    // Running locally on default port
    console.log('Using localhost fallback: http://localhost:4000');
    return 'http://localhost:4000';
  } else {
    // Fallback for other environments
    console.log('Using generic fallback: /api');
    return '/api';
  }
};

/**
 * Get the brand primary color
 */
export const getBrandPrimaryColor = (): string => {
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
export const waitForConfig = (): Promise<void> => {
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
