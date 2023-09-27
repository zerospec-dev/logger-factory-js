export interface LogFunction {
  <T extends object>(obj: T, message: string, ...args: any[]): void;
}

export interface Logger {
  trace: LogFunction;
  debug: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;

  isTraceEnabled(): boolean;
  isDebugEnabled(): boolean;
  isInfoEnabled(): boolean;
  isWarnEnabled(): boolean;
  isErrorEnabled(): boolean;

  setMdc(key: string, value: unknown): void;
  removeMdc(key: string): void;
}

export interface LoggerConfig {
  [key: string]: unknown;
}

export interface LoggerFactoryConfig {
  root: LoggerConfig;
  [key: string]: LoggerConfig;
}

export interface ILoggerFactory {
  getLogger(category: string): Logger;

  finish(): Promise<void>;
}
