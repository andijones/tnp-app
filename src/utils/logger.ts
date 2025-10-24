/**
 * Development Logger Utility
 *
 * Provides logging functions that only execute in development mode.
 * In production, these are no-ops to improve performance and reduce bundle size.
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

// For backwards compatibility, export individual functions
export const devLog = logger.log;
export const devWarn = logger.warn;
export const devError = logger.error;
export const devInfo = logger.info;
export const devDebug = logger.debug;
