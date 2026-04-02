const isDev = import.meta.env.DEV

export const logger = {
  info: (...args: unknown[]) => isDev && console.info('[INFO]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => isDev && console.error('[ERROR]', ...args),
  debug: (...args: unknown[]) => isDev && console.debug('[DEBUG]', ...args),
}
