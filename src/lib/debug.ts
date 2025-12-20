/**
 * Debug utility to gate console logging in production
 * Only logs in development mode to prevent information leakage
 */

const isDev = import.meta.env.MODE === 'development';

export const debugLog = (...args: unknown[]): void => {
  if (isDev) {
    console.log(...args);
  }
};

export const debugError = (message: string, error?: Error): void => {
  if (isDev) {
    console.error(message, error);
  }
  // In production, you could send sanitized errors to a monitoring service
};

export const debugWarn = (...args: unknown[]): void => {
  if (isDev) {
    console.warn(...args);
  }
};

export const debugInfo = (...args: unknown[]): void => {
  if (isDev) {
    console.info(...args);
  }
};
