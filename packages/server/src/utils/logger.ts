import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Root application logger.
 *
 * Log level is controlled by the LOG_LEVEL environment variable (default:
 * "info").  In non-production environments the output is pretty-printed via
 * pino-pretty; in production it emits newline-delimited JSON.
 */
export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    base: { pid: process.pid },
  },
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

/**
 * Create a child logger with a fixed `module` field so log lines are easy
 * to filter by source.
 *
 * @param module - Short name identifying the calling module, e.g. `"browser"`.
 */
export function createLogger(module: string) {
  return logger.child({ module });
}
