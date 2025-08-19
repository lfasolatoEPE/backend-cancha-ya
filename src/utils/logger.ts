type LogFn = (...args: unknown[]) => void;

let baseLogger: Record<'info' | 'error' | 'warn' | 'debug', LogFn>;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const pino = require('pino');
  baseLogger = pino();
} catch {
  baseLogger = {
    info: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    debug: console.debug.bind(console),
  };
}

export const info: LogFn = (...args) => baseLogger.info(...args);
export const error: LogFn = (...args) => baseLogger.error(...args);
export const warn: LogFn = (...args) => baseLogger.warn(...args);
export const debug: LogFn = (...args) => baseLogger.debug(...args);

export default { info, error, warn, debug };
