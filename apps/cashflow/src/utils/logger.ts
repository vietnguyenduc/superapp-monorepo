const isDev =
  typeof import.meta !== "undefined" &&
  import.meta.env != null &&
  import.meta.env.DEV === true;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    // Errors are always surfaced. In production this centralises the hook
    // for Sentry or another reporter rather than scattering console.error.
    console.error(...args);
  },
};
